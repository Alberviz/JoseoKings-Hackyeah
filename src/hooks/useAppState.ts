"use client";

import { useAppStateContext } from "@/components/providers/AppStateProvider";

export function useAppState() {
  return useAppStateContext();
}
