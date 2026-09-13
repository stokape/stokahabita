"use client";

import { useCallback, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";

const PREFIX = "stoka-habita-demo:v1:";
export const DEMO_RESET_EVENT = "stoka-habita-demo-reset";
const DEMO_CHANGE_EVENT = "stoka-habita-demo-change";
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readValue<T>(storageKey: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;
  try {
    const raw = window.localStorage.getItem(storageKey);
    const cached = cache.get(storageKey);
    if (cached?.raw === raw) return cached.value as T;
    const value = raw === null ? initialValue : JSON.parse(raw) as T;
    cache.set(storageKey, { raw, value });
    return value;
  } catch {
    return initialValue;
  }
}

export function useDemoState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = `${PREFIX}${key}`;
  const subscribe = useCallback((listener: () => void) => {
    const notify = (event: Event) => {
      if (event.type === DEMO_RESET_EVENT || (event as CustomEvent<string>).detail === storageKey) listener();
    };
    window.addEventListener(DEMO_CHANGE_EVENT, notify);
    window.addEventListener(DEMO_RESET_EVENT, notify);
    return () => {
      window.removeEventListener(DEMO_CHANGE_EVENT, notify);
      window.removeEventListener(DEMO_RESET_EVENT, notify);
    };
  }, [storageKey]);
  const getSnapshot = useCallback(() => readValue(storageKey, initialValue), [initialValue, storageKey]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => initialValue);
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    const current = readValue(storageKey, initialValue);
    const next = typeof action === "function" ? (action as (value: T) => T)(current) : action;
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(storageKey, raw);
      cache.set(storageKey, { raw, value: next });
    } catch {
      cache.set(storageKey, { raw: null, value: next });
    }
    window.dispatchEvent(new CustomEvent(DEMO_CHANGE_EVENT, { detail: storageKey }));
  }, [initialValue, storageKey]);
  return [value, setValue];
}

export function resetDemoStorage() {
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(PREFIX)) window.localStorage.removeItem(key);
  }
  cache.clear();
  window.dispatchEvent(new Event(DEMO_RESET_EVENT));
}
