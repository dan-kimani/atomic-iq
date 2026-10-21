import * as Clipboard from "expo-clipboard";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { useAppStore } from "../store/useAppStore";

let clipboardSnapshot: string | null = null;
const listeners = new Set<() => void>();

let appStateSubscription: { remove: () => void } | null = null;
let storeSubscription: (() => void) | null = null;
let requestGeneration = 0;

function emit() {
  for (const listener of listeners) listener();
}

function setSnapshot(value: string | null) {
  if (value === clipboardSnapshot) return;
  clipboardSnapshot = value;
  emit();
}

async function refreshClipboard() {
  const request = ++requestGeneration;

  if (!useAppStore.getState().clipboardDetection) {
    setSnapshot(null);
    return;
  }

  try {
    const hasString = await Clipboard.hasStringAsync();
    if (request !== requestGeneration) return;
    if (!hasString) {
      setSnapshot(null);
      return;
    }

    const content = await Clipboard.getStringAsync();
    if (request !== requestGeneration) return;

    const digitCount = (content.match(/\d/g) || []).length;
    const validChars = /^[+\d\s\-().]*$/;
    if (digitCount >= 6 && digitCount <= 15 && validChars.test(content)) {
      setSnapshot(content.trim());
    } else {
      setSnapshot(null);
    }
  } catch {
    if (request === requestGeneration) setSnapshot(null);
  }
}

/**
 * `useSyncExternalStore` owns the AppState/store subscriptions for this
 * external resource, so the consuming hook does not need an effect.
 */
function subscribe(onChange: () => void) {
  listeners.add(onChange);

  if (listeners.size === 1) {
    appStateSubscription = AppState.addEventListener("change", (next) => {
      if (next === "active") refreshClipboard();
    });
    storeSubscription = useAppStore.subscribe((state, previous) => {
      if (state.clipboardDetection !== previous.clipboardDetection) refreshClipboard();
    });
    refreshClipboard();
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) return;
    requestGeneration++;
    appStateSubscription?.remove();
    appStateSubscription = null;
    storeSubscription?.();
    storeSubscription = null;
  };
}

function getSnapshot() {
  return clipboardSnapshot;
}

export function useSmartClipboard(currentRawValue: string) {
  const clipboardDetection = useAppStore((state) => state.clipboardDetection);
  const content = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!clipboardDetection || !content) return null;
  return content.replace(/\D/g, "") !== currentRawValue ? content : null;
}
