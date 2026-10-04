import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with full remaining time and zero progress", () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10, running: false }));

    expect(result.current.remaining).toBe(10);
    expect(result.current.progress).toBe(0);
    expect(result.current.isDone).toBe(false);
  });

  it("counts down when running is true", () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10, running: true }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remaining).toBe(9);
    expect(result.current.progress).toBeCloseTo(0.1, 2);
    expect(result.current.isDone).toBe(false);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.remaining).toBe(5);
    expect(result.current.progress).toBeCloseTo(0.5, 2);
  });

  it("calls onDone and completes when time reaches 0", () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useCountdown({ seconds: 5, running: true, onDone }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.progress).toBe(1);
    expect(result.current.isDone).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);

    // Further timer advances should not call onDone again
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("pauses and resumes with pause and start", () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10, running: true }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(8);

    act(() => {
      result.current.pause();
    });

    // Time does not advance while paused
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remaining).toBe(8);
    expect(result.current.progress).toBeCloseTo(0.2, 2);

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(6);
    expect(result.current.progress).toBeCloseTo(0.4, 2);
  });

  it("resets countdown with reset", () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10, running: false }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.remaining).toBe(6);

    act(() => {
      result.current.reset();
    });
    expect(result.current.remaining).toBe(10);
    expect(result.current.progress).toBe(0);
    expect(result.current.isDone).toBe(false);
  });

  it("updates correctly if tab sleeps (time jumps forward)", () => {
    const { result } = renderHook(() => useCountdown({ seconds: 20, running: true }));

    // Simulate tab sleeping: 15 seconds pass in a single timer step
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(result.current.remaining).toBe(5);
    expect(result.current.progress).toBeCloseTo(0.75, 2);
    expect(result.current.isDone).toBe(false);
  });

  it("supports an injected now function", () => {
    let mockTime = 100000;
    const { result } = renderHook(() =>
      useCountdown({
        seconds: 10,
        running: true,
        now: () => mockTime,
      }),
    );

    mockTime += 3000;
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.remaining).toBe(7);
    expect(result.current.progress).toBeCloseTo(0.3, 2);
  });

  it("responds when the running prop changes", () => {
    let running = false;
    const { result, rerender } = renderHook(() => useCountdown({ seconds: 10, running }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(10);

    running = true;
    rerender();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(8);

    running = false;
    rerender();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(8);
  });

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() => useCountdown({ seconds: 10, running: true }));

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("handles 0 seconds gracefully", () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useCountdown({ seconds: 0, running: true, onDone }));

    expect(result.current.remaining).toBe(0);
    expect(result.current.progress).toBe(1);
    expect(result.current.isDone).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("keeps the time already counted when start() is called while running", () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10, running: true }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.remaining).toBe(5);
  });
});
