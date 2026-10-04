"use client";

import { useCallback, useRef, useState } from "react";
import {
  clearWearableState,
  createEmptyWearableState,
  loadWearableState,
  mergeWearableDays,
  saveWearableState,
} from "@/lib/storage/wearableStore";
import { addDays } from "@/lib/wearables/stats";
import { buildDemoWearableDays } from "@/lib/wearables/demoWearableDays";
import { buildWearableDays } from "@/lib/wearables/buildWearableDays";
import {
  AUTOMATIC_SELECTION,
  resolveDeviceSelection,
  sanitizeDeviceSelection,
} from "@/lib/wearables/devices";
import {
  fetchBrowserGoogleHealth,
  GoogleHealthError,
  type FetchedMetricKey,
  type MetricFetchStatus,
} from "@/lib/wearables/browserGoogleHealth";
import { requestGoogleAccessToken, type AccessToken } from "@/lib/wearables/googleIdentity";
import { localDateTime } from "@/lib/wearables/validity";
import type { WearableSample } from "@/lib/wearables/types";
import type { DeviceMetric, WearableState } from "@/types/wearable";

export const WEARABLE_SYNC_DAYS = 28;

export type WearableSyncStatus = "idle" | "working" | "error";

export type WearableMetricStatus = Partial<Record<FetchedMetricKey, MetricFetchStatus>>;

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const SYNC_AGAIN_MESSAGE = "Sync again to apply the new device.";

function errorMessage(err: unknown): string {
  if (err instanceof GoogleHealthError) {
    return err.status === 401 || err.status === 403
      ? "Access was not allowed. Connect again and tick every box."
      : err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong. Try again.";
}

// Reads storage on first render: mount this only on the client, after the parent screen is ready.
export function useWearableSync() {
  const [wearable, setWearable] = useState<WearableState>(loadWearableState);
  const [status, setStatus] = useState<WearableSyncStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [metricStatus, setMetricStatus] = useState<WearableMetricStatus | null>(null);
  const tokenRef = useRef<AccessToken | null>(null);
  const wearableRef = useRef<WearableState>(wearable);
  const rawSamplesRef = useRef<WearableSample[]>(wearable.rawSamples ?? []);

  // The one place that saves and shows a new state; never called from inside a state updater.
  const commit = useCallback((next: WearableState) => {
    wearableRef.current = next;
    saveWearableState(next);
    setWearable(next);
  }, []);

  const sync = useCallback(async () => {
    if (!CLIENT_ID) {
      setStatus("error");
      setMessage("Wearable connection is not set up in this build.");
      return;
    }
    setStatus("working");
    setMessage(null);
    try {
      let access = tokenRef.current;
      if (!access || access.expiresAt <= Date.now()) {
        access = await requestGoogleAccessToken(CLIENT_ID);
        tokenRef.current = access;
      }
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = Date.now();
      const today = localDateTime(now, timeZone).date;
      const fromDate = addDays(today, -(WEARABLE_SYNC_DAYS - 1));
      // One extra day before the window so the first night has its heart-rate samples.
      const result = await fetchBrowserGoogleHealth({
        accessToken: access.token,
        startTimeMillis: now - (WEARABLE_SYNC_DAYS + 1) * 86_400_000,
        endTimeMillis: now,
        timeZone,
      });
      const failed = Object.values(result.metricStatus).some((m) => m?.status !== "ok");
      rawSamplesRef.current = result.samples;
      const current = loadWearableState();
      const base = current.isDemo ? createEmptyWearableState() : current;
      const deviceSelection = sanitizeDeviceSelection(result.devices, base.deviceSelection);
      const days = buildWearableDays(result.samples, {
        timeZone,
        fromDate,
        deviceIds: resolveDeviceSelection(result.devices, deviceSelection),
      });
      commit(
        mergeWearableDays(base, days, {
          isDemo: false,
          devices: result.devices,
          deviceSelection,
          rawSamples: result.samples,
        }),
      );
      setMetricStatus(result.metricStatus);
      setStatus("idle");
      setMessage(
        failed
          ? "Some wearable data could not be read. What was read is saved."
          : days.length === 0
            ? "Connected, but the wearable has not shared any days yet."
            : null,
      );
    } catch (err) {
      tokenRef.current = null;
      setStatus("error");
      setMessage(errorMessage(err));
    }
  }, [commit]);

  // Picks the device for one metric (null = automatic) and rebuilds the days from the saved readings.
  const selectDevice = useCallback(
    (metric: DeviceMetric, deviceId: string | null) => {
      const prev = wearableRef.current;
      const deviceSelection = {
        ...(prev.deviceSelection ?? AUTOMATIC_SELECTION),
        [metric]: deviceId,
      };
      const samples = rawSamplesRef.current;
      if (samples.length === 0) {
        // The readings were not kept (storage full or old data): remember the choice, apply it on the next sync.
        commit({ ...prev, deviceSelection });
        setMessage(SYNC_AGAIN_MESSAGE);
        return;
      }
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const today = localDateTime(Date.now(), timeZone).date;
      const fromDate = addDays(today, -(WEARABLE_SYNC_DAYS - 1));
      const days = buildWearableDays(samples, {
        timeZone,
        fromDate,
        deviceIds: resolveDeviceSelection(prev.devices ?? [], deviceSelection),
      });
      // Days inside the window are replaced by the rebuilt ones; older days are kept.
      const withoutWindow: WearableState = {
        ...prev,
        days: prev.days.filter((d) => d.date < fromDate),
      };
      const merged = mergeWearableDays(withoutWindow, days, {
        isDemo: prev.isDemo,
        deviceSelection,
        rawSamples: samples,
      });
      commit({ ...merged, lastSyncAt: prev.lastSyncAt });
      setMessage(null);
    },
    [commit],
  );

  const useDemo = useCallback(() => {
    rawSamplesRef.current = [];
    commit(
      mergeWearableDays(createEmptyWearableState(), buildDemoWearableDays(), {
        isDemo: true,
        devices: [],
        deviceSelection: { ...AUTOMATIC_SELECTION },
        rawSamples: [],
      }),
    );
    setMetricStatus(null);
    setStatus("idle");
    setMessage(null);
  }, [commit]);

  const clear = useCallback(() => {
    clearWearableState();
    tokenRef.current = null;
    rawSamplesRef.current = [];
    const empty = createEmptyWearableState();
    wearableRef.current = empty;
    setWearable(empty);
    setMetricStatus(null);
    setStatus("idle");
    setMessage(null);
  }, []);

  return {
    wearable,
    status,
    message,
    metricStatus,
    isConfigured: CLIENT_ID !== "",
    sync,
    useDemo,
    clear,
    selectDevice,
  };
}
