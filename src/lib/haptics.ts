import * as Haptics from "expo-haptics";

import * as db from "../db";

function enabled() {
  try {
    const raw = db.getSetting("hapticFeedback");
    if (raw !== undefined) return raw === "1";
  } catch {
    /* DB not ready yet */
  }
  return true;
}

export const haptics = {
  impactAsync: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (!enabled()) return;
    return Haptics.impactAsync(style);
  },
  notificationAsync: (
    type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success,
  ) => {
    if (!enabled()) return;
    return Haptics.notificationAsync(type);
  },
};

// Re-export enums so callers don't need a separate expo-haptics import
export { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
