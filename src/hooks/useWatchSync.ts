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
import { fetchBrowserGoogleHealth, GoogleHealthError } from "@/lib/wearables/browserGoogleHealth";
import { requestGoogleAccessToken, type AccessToken } from "@/lib/wearables/googleIdentity";
import { localDateTime } from "@/lib/wearables/validity";
import type { WatchSample } from "@/lib/wearables/types";
import type { WatchState } from "@/types/watch";

export const WATCH_SYNC_DAYS = 28;

export type WatchSyncStatus = "idle" | "working" | "error";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

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
  const tokenRef = useRef<AccessToken | null>(null);
  const rawSamplesRef = useRef<WatchSample[]>(watch.rawSamples ?? []);

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
      const discoveredDevices = Array.from(
        new Set(result.samples.map((s) => s.source).filter(Boolean)),
      ).sort();
      const selectedDevice =
        base.selectedDevice && discoveredDevices.includes(base.selectedDevice)
          ? base.selectedDevice
          : null;
      const days = buildWatchDays(result.samples, { timeZone, fromDate, selectedDevice });
      const next = mergeWatchDays(base, days, {
        isDemo: false,
        devices: discoveredDevices,
        selectedDevice,
        rawSamples: result.samples,
      });
      saveWatchState(next);
      setWatch(next);
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
  }, []);

  const selectDevice = useCallback((device: string | null) => {
    setWatch((prev) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = Date.now();
      const today = localDateTime(now, timeZone).date;
      const fromDate = addDays(today, -(WATCH_SYNC_DAYS - 1));
      const samples =
        rawSamplesRef.current.length > 0 ? rawSamplesRef.current : (prev.rawSamples ?? []);
      const days =
        samples.length > 0
          ? buildWatchDays(samples, { timeZone, fromDate, selectedDevice: device })
          : prev.days;
      const next: WatchState = {
        ...prev,
        selectedDevice: device,
        days,
      };
      saveWatchState(next);
      return next;
    });
  }, []);

  const useDemo = useCallback(() => {
    rawSamplesRef.current = [];
    const next = mergeWatchDays(createEmptyWatchState(), buildDemoWatchDays(), {
      isDemo: true,
      devices: [],
      selectedDevice: null,
      rawSamples: [],
    });
    saveWatchState(next);
    setWatch(next);
    setStatus("idle");
    setMessage(null);
  }, []);

  const clear = useCallback(() => {
    clearWatchState();
    tokenRef.current = null;
    rawSamplesRef.current = [];
    setWatch(createEmptyWatchState());
    setStatus("idle");
    setMessage(null);
  }, []);

  return {
    watch,
    status,
    message,
    isConfigured: CLIENT_ID !== "",
    sync,
    useDemo,
    clear,
    selectDevice,
  };
}
