"use client";

import { useCallback, useEffect, useRef } from "react";
import { createVarianceAccumulator } from "@/lib/missions/motionVariance";

type DeviceMotionPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

export type UseMotionSampleResult = {
  /** Call from a user gesture (a tap): iOS asks permission only there. Never throws. */
  start: () => void;
  /** Stops listening and returns the aggregate variance, or null when there is no usable signal. */
  stop: () => number | null;
};

/**
 * Measures how much the device moved. Keeps only a running variance: no raw readings are stored
 * or sent anywhere. Returns null when the sensor is missing, denied or gave too little data.
 */
export function useMotionSample(): UseMotionSampleResult {
  const accRef = useRef(createVarianceAccumulator());
  const listenerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  /** Bumped by every start() and stop(); a permission answer for an older run is ignored. */
  const runRef = useRef(0);

  const detach = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  const attach = useCallback(() => {
    detach();
    const listener = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity ?? event.acceleration;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      accRef.current.add(Math.hypot(a.x, a.y, a.z));
    };
    listenerRef.current = listener;
    window.addEventListener("devicemotion", listener);
  }, [detach]);

  const start = useCallback(() => {
    const run = ++runRef.current;
    accRef.current = createVarianceAccumulator();
    if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") return;
    const request = (DeviceMotionEvent as unknown as DeviceMotionPermission).requestPermission;
    if (typeof request === "function") {
      request
        .call(DeviceMotionEvent)
        .then((result) => {
          if (result === "granted" && runRef.current === run) attach();
        })
        .catch(() => undefined);
      return;
    }
    attach();
  }, [attach]);

  const stop = useCallback(() => {
    runRef.current += 1;
    detach();
    return accRef.current.result();
  }, [detach]);

  useEffect(
    () => () => {
      runRef.current += 1;
      detach();
    },
    [detach],
  );

  return { start, stop };
}
