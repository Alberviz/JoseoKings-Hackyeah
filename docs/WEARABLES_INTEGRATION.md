# Wearables integration (task W1, Google Health API v4)

How the wearable data gets into the app, in English. Rules and privacy guardrails are in `AGENTS.md` and `docs/DECISIONS.md`.

## 1. How it works

- 100% in the parent's browser (Google Identity Services token flow, popup). Only the public `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is needed. No client secret, no server.
- The parent connects their Google account and consents. Read-only scopes only:
  - `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly` (steps)
  - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly` (heart rate, daily resting heart rate)
  - `https://www.googleapis.com/auth/googlehealth.sleep.readonly` (sleep)
  - The old `health.fitness.*` scopes are wrong; do not use them.
- Everything stays on the device (`localStorage`, key `crohncare_wearable_daily`): the days, the device list, the per-metric choice and the raw samples (dropped when storage is full). Data saved before the rename is moved once from the old key `crohncare_watch_daily` (and old backups with a `watch` field are still read).
- Wearable numbers are descriptive only: no scores, alerts, thresholds or rewards. The child never sees them. They are labelled "From the wearable (Google Health)".
- Caveat: the API is officially documented for Fitbit devices and the Pixel Watch. In practice, data from apps that write to Health Connect also appears, and `platform` is then `"HEALTH_CONNECT"` (for example a Zepp/Amazfit wearable through its app on an Android phone). Wearables that never reach Google Health or Health Connect do not appear. "No wearable data yet" is shown for a gap and is never filled.

Code: `src/lib/wearables/googleHealthV4.ts` (shapes, converters), `browserGoogleHealth.ts` (requests), `devices.ts` (device list and choice), `daily.ts` and `buildWearableDays.ts` (per-day figures), `src/hooks/useWearableSync.ts`, `src/components/features/parent-mode/WearableConnectCard/`.

## 2. API reference (verified)

`GET https://health.googleapis.com/v4/users/me/dataTypes/{type}/dataPoints?filter=...&pageSize=...&pageToken=...` with `Authorization: Bearer <token>`.

- Path ids are kebab-case (`heart-rate`, `daily-resting-heart-rate`). Inside `filter` the type is snake_case (`heart_rate`).
- Filters use only `>=` and `<` joined by `AND`. Physical time is RFC3339 ending in `Z`. Civil time is `YYYY-MM-DD[THH:mm:ss]`. Never mix both in one filter.
- Never send `dataSourceFamily`: the default is all sources and it is invalid for sleep.
- `pageSize` max is 10000 (25 for sleep). Heart rate: at most 14 days per request, so we chunk.
- int64 numbers come back as **strings** (`steps.count`, `heartRate.beatsPerMinute`, `dailyRestingHeartRate.beatsPerMinute`): always `Number()` and check it is finite.

| Metric                           | `{type}`                   | Filter field                                                        | Value                                                                                       |
| :------------------------------- | :------------------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| Steps (interval)                 | `steps`                    | `steps.interval.start_time`                                         | `steps.count`                                                                               |
| Heart rate (sample)              | `heart-rate`               | `heart_rate.sample_time.physical_time`                              | `heartRate.beatsPerMinute`, time in `heartRate.sampleTime.physicalTime`                     |
| Daily resting heart rate (daily) | `daily-resting-heart-rate` | `daily_resting_heart_rate.date` with civil dates in the user's zone | `dailyRestingHeartRate.beatsPerMinute`; `date` is a string or `{year, month, day}`          |
| Sleep (session)                  | `sleep`                    | `sleep.interval.civil_end_time >= "YYYY-MM-DD"`                     | `sleep.summary.minutesAsleep`, else the interval length; skip `sleep.metadata.nap === true` |

An interval field on a sample type (for example `heart_rate.interval.start_time`) is a 400.

`dataSource` is `{ recordingMethod, device: { formFactor, manufacturer, model, uid }, application: { packageName, name }, platform }`. There is no `device.displayName` and no `device.type`. `formFactor` is an open string (PHONE, WATCH, TABLET, WRISTBAND, WEARABLE_WRIST, SMART_RING, ...).

Errors: `{ error: { code, message, status, details: [{ reason }] } }`. 401 and 403 stop the sync ("Connect again and tick every box"). Any other failure is kept per metric as `{ status: "http-error", httpStatus, reason?, message? }` and shown on the card.

## 3. Devices and the per-metric selector

- Real data comes through Health Connect, and the `device` fields are often empty (`{}`), with no `uid` and no `model`; only the source app is reliable. So a device is identified by its **source app**: the id is `application.packageName`, plus `|uid` only when `device.uid` exists. Without a package name the id is `uid`, else the non-empty parts of `manufacturer|model|formFactor`, else the application name, else `unknown`. Ids never have empty segments.
- All points with the same id are one device, even when they carry different form factors. One Zepp wearable can send points with `device: {}` and points with `formFactor: "FITNESS_BAND"`; both are the same device, so its heart rate readings stay together.
- Kind of a merged device: `wearable` if any point has a wrist, band, ring or `WATCH` form factor; else `phone` if any point is PHONE/TABLET or the package starts with `com.android.healthconnect.phone`; else it comes from a small known-apps map (Zepp, Fitbit, Garmin Connect, Mi Fitness, Huawei Health, Samsung Health, Pixel Watch, Oura, Withings, Google Fit); else `other`.
- Label: "Wearable · Zepp (Amazfit)", "Phone · Xiaomi" (manufacturer or model when known, else the app name, else "This phone"). A raw package name is shown only as its last segment, capitalised, when nothing nicer is known.
- Steps, heart rate and sleep each have their own choice: `deviceSelection = { steps, heartRate, sleep }`, where `null` is automatic. Resting heart rate follows the heart-rate choice.
- Automatic: among the devices that have that metric, a wearable first, then a phone, then others; the device with the most records wins a tie. Devices are never combined, so steps from a phone and a wearable are never added together.
- A saved choice for a device that is gone, including an id saved with the older id format, falls back to automatic.
- The parent settings card shows "Data from": one device gives a plain line, several give "Automatic (...)" plus one chip per device. After a sync it lists what each metric returned (for example "Heart rate: 812 readings" or "Heart rate: could not be read (Google said: ...)").
- Changing a choice rebuilds the days from the saved raw samples. If they were not kept, the card says "Sync again to apply the new device."

## 4. Resting heart rate

Our own night figure (needs at least 20 night readings) is the first choice and is recorded as `restingHrSource: "night-samples"`. When it is not available, the wearable's own daily value is used and recorded as `"wearable-daily"`. The doctor report says which one was used ("resting heart rate as reported by the wearable").

## 5. Try it locally

1. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` (OAuth client of type Web, with `http://localhost:3000` as an authorised origin).
2. `pnpm dev`, open `/parent/settings`, press "Connect wearable" and tick every box.
3. In the console: `console.table(JSON.parse(localStorage.getItem("crohncare_wearable_daily")).days)`.
4. The service worker only runs in production builds; after `pnpm build && pnpm start`, hard-reload to get the new bundle.

Unit tests (fetch mocked, realistic string-number payloads): `src/lib/wearables/__tests__/`, `src/lib/storage/wearableStore.test.ts`, `src/hooks/useWearableSync.test.ts`.
