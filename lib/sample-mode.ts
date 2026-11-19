"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether the visitor is exploring the sample family instead of the real
 * archive. Kept in sessionStorage so it survives reloads within a visit;
 * the server always renders the real archive.
 */
const KEY = "imvelaphi-sample-mode";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function write(on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(KEY, "1");
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode): the toggle still works for this page.
  }
  memory = on;
  listeners.forEach((l) => l());
}

let memory: boolean | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (memory === null) memory = read();
  return memory;
}

export function useSampleMode() {
  const sample = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const enterSample = useCallback(() => write(true), []);
  const exitSample = useCallback(() => write(false), []);
  return { sample, enterSample, exitSample };
}
