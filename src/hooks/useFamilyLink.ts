"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  clearFamilyLink,
  loadFamilyLink,
  saveFamilyLink,
  type FamilyLink,
} from "@/lib/link/familyLink";

type FamilyLinkSnapshot = {
  link: FamilyLink | null;
  isReady: boolean;
};

const SERVER_SNAPSHOT: FamilyLinkSnapshot = { link: null, isReady: false };

let snapshot: FamilyLinkSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function load() {
  if (snapshot.isReady) {
    return;
  }
  snapshot = { link: loadFamilyLink(), isReady: true };
  notify();
}

function set(link: FamilyLink | null) {
  if (link) {
    saveFamilyLink(link);
  } else {
    clearFamilyLink();
  }
  snapshot = { link, isReady: true };
  notify();
}

/** The family link saved on this phone. Read once from localStorage, then kept in memory. */
export function useFamilyLink() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    load();
  }, []);

  const setLink = useCallback((link: FamilyLink) => set(link), []);
  const updateLink = useCallback((updater: (prev: FamilyLink) => FamilyLink) => {
    if (snapshot.link) {
      set(updater(snapshot.link));
    }
  }, []);
  const forgetLink = useCallback(() => set(null), []);

  return { link: current.link, isReady: current.isReady, setLink, updateLink, forgetLink };
}

export function resetFamilyLinkForTesting() {
  set(null);
}
