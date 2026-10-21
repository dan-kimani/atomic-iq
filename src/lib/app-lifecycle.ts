import { AppState } from "react-native";

import { dbReady } from "../db/client";
import { useBusinessEventStore } from "../store/useBusinessEventStore";

type GlobalScope = typeof globalThis & {
  atomicAppLifecycleStarted?: boolean;
};

/**
 * App-lifetime subscription. Keeping it outside React avoids a root-only effect
 * and makes it clear that this work is not tied to a component render.
 */
export function startAppLifecycle() {
  const globalScope = globalThis as GlobalScope;
  if (globalScope.atomicAppLifecycleStarted) return;
  globalScope.atomicAppLifecycleStarted = true;

  let previous = AppState.currentState;

  // Migrations run asynchronously at import time, so the first query here can
  // otherwise hit a table the migration has not created yet.
  const checkDueReminders = async () => {
    try {
      await dbReady;
      await useBusinessEventStore.getState().checkDueReminders();
    } catch (error) {
      console.error("[lifecycle] due reminder check failed", error);
    }
  };

  AppState.addEventListener("change", (next) => {
    if (previous?.match(/inactive|background/) && next === "active") {
      void checkDueReminders();
    }
    previous = next;
  });

  void checkDueReminders();
}
