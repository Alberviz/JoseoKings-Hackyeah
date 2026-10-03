"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseCountdownOptions = {
  seconds: number;
  running: boolean;
  onDone?: () => void;
  now?: () => number;
};

export type UseCountdownResult = {
  remaining: number;
  progress: number;
  isDone: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

export function useCountdown({
  seconds,
  running,
  onDone,
  now,
}: UseCountdownOptions): UseCountdownResult {
  const totalMs = Math.max(0, seconds * 1000);

  const [prevRunning, setPrevRunning] = useState(running);
  const [prevSeconds, setPrevSeconds] = useState(seconds);
  const [isRunningState, setIsRunningState] = useState(running);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Sync state during render when props change (no ref access during render)
  if (running !== prevRunning) {
    setPrevRunning(running);
    setIsRunningState(running);
  }

  if (seconds !== prevSeconds) {
    setPrevSeconds(seconds);
    setElapsedMs(0);
    setIsRunningState(running);
  }

  const accumulatedMsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const hasCalledOnDoneRef = useRef(false);

  const nowRef = useRef(now);
  useEffect(() => {
    nowRef.current = now;
  });

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const getNow = useCallback(() => (nowRef.current ? nowRef.current() : Date.now()), []);

  // When seconds changes, reset accumulated ref state
  useEffect(() => {
    accumulatedMsRef.current = 0;
    startTimeRef.current = null;
    hasCalledOnDoneRef.current = false;
  }, [seconds]);

  // Handle immediate completion if seconds <= 0
  useEffect(() => {
    if (totalMs === 0 && running && !hasCalledOnDoneRef.current) {
      hasCalledOnDoneRef.current = true;
      onDoneRef.current?.();
    }
  }, [totalMs, running]);

  // Active timer interval
  useEffect(() => {
    if (!isRunningState || totalMs === 0) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = getNow();
    }

    const intervalId = setInterval(() => {
      const currentNow = getNow();
      const currentElapsed =
        accumulatedMsRef.current + (currentNow - (startTimeRef.current ?? currentNow));

      if (currentElapsed >= totalMs) {
        setElapsedMs(totalMs);
        accumulatedMsRef.current = totalMs;
        startTimeRef.current = null;
        setIsRunningState(false);
        if (!hasCalledOnDoneRef.current) {
          hasCalledOnDoneRef.current = true;
          onDoneRef.current?.();
        }
      } else {
        setElapsedMs(currentElapsed);
      }
    }, 250);

    return () => {
      clearInterval(intervalId);
      if (startTimeRef.current !== null) {
        accumulatedMsRef.current += getNow() - startTimeRef.current;
        startTimeRef.current = null;
      }
    };
  }, [isRunningState, totalMs, getNow]);

  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const remaining = totalMs === 0 ? 0 : Math.ceil(remainingMs / 1000);
  const progress = totalMs === 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / totalMs));
  const isDone = totalMs === 0 || remainingMs === 0;

  const start = useCallback(() => {
    if (accumulatedMsRef.current < totalMs) {
      startTimeRef.current = getNow();
      setIsRunningState(true);
    }
  }, [totalMs, getNow]);

  const pause = useCallback(() => {
    setIsRunningState(false);
    if (startTimeRef.current !== null) {
      accumulatedMsRef.current += getNow() - startTimeRef.current;
      startTimeRef.current = null;
      setElapsedMs(accumulatedMsRef.current);
    }
  }, [getNow]);

  const reset = useCallback(() => {
    accumulatedMsRef.current = 0;
    startTimeRef.current = running && totalMs > 0 ? getNow() : null;
    hasCalledOnDoneRef.current = false;
    setElapsedMs(0);
    setIsRunningState(running && totalMs > 0);
  }, [running, totalMs, getNow]);

  return {
    remaining,
    progress,
    isDone,
    start,
    pause,
    reset,
  };
}
