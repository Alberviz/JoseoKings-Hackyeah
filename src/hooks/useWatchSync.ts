"use client";

import { useCallback, useRef, useState } from "react";
import {
  clearWatchState,
  createEmptyWatchState,
  loadWatchState,
  mergeWatchDays,
  saveWatchState,
} from "@/lib/storage/watchStore";
import { addDays } from "@/lib/wearables/stats";
import { buildDemoWatchDays } from "@/lib/wearables/demoWatchDays";
import { buildWatchDays } from "@/lib/wearables/buildWatchDays";
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
import type { WatchSample } from "@/lib/wearables/types";
import type { DeviceMetric, WatchState } from "@/types/watch";

export const WATCH_SYNC_DAYS = 28;

export type WatchSyncStatus = "idle" | "working" | "error";

export type WatchMetricStatus = Partial<Record<FetchedMetricKey, MetricFetchStatus>>;

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
export function useWatchSync() {
  const [watch, setWatch] = useState<WatchState>(loadWatchState);
  const [status, setStatus] = useState<WatchSyncStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [metricStatus, setMetricStatus] = useState<WatchMetricStatus | null>(null);
  const tokenRef = useRef<AccessToken | null>(null);
  const watchRef = useRef<WatchState>(watch);
  const rawSamplesRef = useRef<WatchSample[]>(watch.rawSamples ?? []);

  // The one place that saves and shows a new state; never called from inside a state updater.
  const commit = useCallback((next: WatchState) => {
    watchRef.current = next;
    saveWatchState(next);
    setWatch(next);
  }, []);

  const sync = useCallback(async () => {
    if (!CLIENT_ID) {
      setStatus("error");
      setMessage("Watch connection is not set up in this build.");
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
      const fromDate = addDays(today, -(WATCH_SYNC_DAYS - 1));
      // One extra day before the window so the first night has its heart-rate samples.
      const result = await fetchBrowserGoogleHealth({
        accessToken: access.token,
        startTimeMillis: now - (WATCH_SYNC_DAYS + 1) * 86_400_000,
        endTimeMillis: now,
        timeZone,
      });
      const failed = Object.values(result.metricStatus).some((m) => m?.status !== "ok");
      rawSamplesRef.current = result.samples;
      const current = loadWatchState();
      const base = current.isDemo ? createEmptyWatchState() : current;
      const deviceSelection = sanitizeDeviceSelection(result.devices, base.deviceSelection);
      const days = buildWatchDays(result.samples, {
        timeZone,
        fromDate,
        deviceIds: resolveDeviceSelection(result.devices, deviceSelection),
      });
      commit(
        mergeWatchDays(base, days, {
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
          ? "Some watch data could not be read. What was read is saved."
          : days.length === 0
            ? "Connected, but the watch has not shared any days yet."
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
      const prev = watchRef.current;
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
      const fromDate = addDays(today, -(WATCH_SYNC_DAYS - 1));
      const days = buildWatchDays(samples, {
        timeZone,
        fromDate,
        deviceIds: resolveDeviceSelection(prev.devices ?? [], deviceSelection),
      });
      // Days inside the window are replaced by the rebuilt ones; older days are kept.
      const withoutWindow: WatchState = {
        ...prev,
        days: prev.days.filter((d) => d.date < fromDate),
      };
      const merged = mergeWatchDays(withoutWindow, days, {
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
      mergeWatchDays(createEmptyWatchState(), buildDemoWatchDays(), {
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
    clearWatchState();
    tokenRef.current = null;
    rawSamplesRef.current = [];
    const empty = createEmptyWatchState();
    watchRef.current = empty;
    setWatch(empty);
    setMetricStatus(null);
    setStatus("idle");
    setMessage(null);
  }, []);

  return {
    watch,
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
