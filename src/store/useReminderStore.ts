import * as Notifications from "expo-notifications";
import { create } from "zustand";

import * as db from "../db";
import { haptics, NotificationFeedbackType } from "../lib/haptics";
import { showToast } from "../ui/toast";

// ── Types ───────────────────────────────────────────────────────────────────

type Preset =
  | { label: string; kind: "relative"; ms: number }
  | { label: string; kind: "tomorrow"; hour: number };

export const PRESETS: Preset[] = [
  { label: "In 1 hour", kind: "relative", ms: 60 * 60 * 1000 },
  { label: "In 3 hours", kind: "relative", ms: 3 * 60 * 60 * 1000 },
  { label: "Tomorrow 8 AM", kind: "tomorrow", hour: 8 },
  { label: "Tomorrow 11 AM", kind: "tomorrow", hour: 11 },
];

export interface ReminderEditData {
  id: number;
  phoneNumber: string;
  countryCode: string;
  message: string;
  scheduledAt: number;
  notificationId: string | null;
  priority: number;
  myDay: number;
  tags: string | null;
}

interface SaveParams {
  target: Date;
  phoneNumber: string;
  countryCode: string;
  contactName?: string;
  editReminder?: ReminderEditData | null;
  onSaved?: () => void;
  onClose: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function formatDateForToast(d: Date): string {
  const month = d.toLocaleDateString("en", { month: "long" });
  const day = ordinal(d.getDate());
  const year = d.getFullYear();
  const hour = d.getHours();
  const min = d.getMinutes().toString().padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${month} ${day}, ${year} at ${h12}:${min} ${ampm}`;
}

// ── Store ───────────────────────────────────────────────────────────────────

type ReminderStore = {
  message: string;
  preset: number | null;
  customDate: Date | null;
  customTime: { h: number; m: number } | null;
  priority: number;
  myDay: number;
  tags: string[];
  existingTags: string[];
  tagSearch: string;
  datePickerOpen: boolean;
  timePickerOpen: boolean;
  selectPreset: (index: number) => void;
  setMessage: (text: string) => void;
  setCustomDate: (date: Date) => void;
  setCustomTime: (h: number, m: number) => void;
  togglePriority: () => void;
  toggleMyDay: () => void;
  toggleTag: (tag: string) => void;
  setTagSearch: (text: string) => void;
  loadTags: (customTags: string[]) => void;
  init: (r: ReminderEditData) => void;
  save: (params: SaveParams) => Promise<void>;
  openDatePicker: () => void;
  openTimePicker: () => void;
  closeDatePicker: () => void;
  closeTimePicker: () => void;
  reset: () => void;
};

/**
 * Seed the form when the user opens the reminder sheet. This is event-time work,
 * not a render-time synchronisation, so it lives outside an effect.
 */
export function prepareReminderForm(editReminder: ReminderEditData | null, customTags: string[]) {
  const form = useReminderStore.getState();
  form.loadTags(customTags);
  if (editReminder) form.init(editReminder);
  else form.reset();
}

export const useReminderStore = create<ReminderStore>((set) => ({
  message: "",
  preset: null,
  customDate: null,
  customTime: null,
  priority: 0,
  myDay: 0,
  tags: [],
  existingTags: [],
  tagSearch: "",
  datePickerOpen: false,
  timePickerOpen: false,

  selectPreset: (index) => set({ preset: index, customDate: null, customTime: null }),
  setMessage: (text) => set({ message: text }),
  setCustomDate: (date) => set({ customDate: date, datePickerOpen: false }),
  setCustomTime: (h, m) => set({ customTime: { h, m }, timePickerOpen: false }),
  togglePriority: () => set((s) => ({ priority: s.priority ? 0 : 1 })),
  toggleMyDay: () => set((s) => ({ myDay: s.myDay ? 0 : 1 })),
  toggleTag: (tag) =>
    set((s) => ({
      tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag],
    })),
  setTagSearch: (text) => set({ tagSearch: text }),

  loadTags: (customTags) => {
    const dbTags = db.getAllTags();
    const merged = [...new Set([...dbTags, ...customTags])].sort();
    set({ existingTags: merged });
  },

  init: (r) => {
    const d = new Date(r.scheduledAt);
    set({
      message: r.message,
      preset: PRESETS.length,
      customDate: d,
      customTime: { h: d.getHours(), m: d.getMinutes() },
      priority: r.priority,
      myDay: r.myDay,
      tags: r.tags
        ? r.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  },

  save: async ({
    target,
    phoneNumber,
    countryCode,
    contactName,
    editReminder,
    onSaved,
    onClose,
  }) => {
    const s = useReminderStore.getState();
    const msg = s.message.trim();
    if (!msg) return;

    const tagsValue = s.tags.length > 0 ? s.tags.join(",") : null;
    const targetMs = target.getTime();
    const isEditing = !!editReminder;

    if (isEditing && editReminder) {
      if (editReminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(editReminder.notificationId);
      }
      db.updateReminder(editReminder.id, {
        message: msg,
        scheduledAt: targetMs,
        priority: s.priority,
        myDay: s.myDay,
        tags: tagsValue,
      });
      const seconds = Math.max(60, Math.floor((targetMs - Date.now()) / 1000));
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: contactName || "Follow-up reminder",
          body: msg,
          data: { phoneNumber, countryCode, reminderId: editReminder.id, message: msg },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
      });
      db.updateReminderNotification(editReminder.id, notifId);
      haptics.notificationAsync(NotificationFeedbackType.Success);
      showToast({
        kind: "success",
        title: "Reminder updated",
        message: formatDateForToast(target),
      });
    } else {
      const reminderId = db.createReminder(
        phoneNumber,
        countryCode,
        msg,
        targetMs,
        s.priority,
        s.myDay,
        tagsValue,
      );
      const seconds = Math.max(60, Math.floor((targetMs - Date.now()) / 1000));
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: contactName || "Follow-up reminder",
          body: msg,
          data: { phoneNumber, countryCode, reminderId, message: msg },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
      });
      db.updateReminderNotification(reminderId, notifId);
      haptics.notificationAsync(NotificationFeedbackType.Success);
      showToast({
        kind: "success",
        title: "Reminder set",
        message: formatDateForToast(target),
      });
    }

    useReminderStore.getState().reset();
    onClose();
    onSaved?.();
  },

  openDatePicker: () => set({ datePickerOpen: true }),
  openTimePicker: () => set({ timePickerOpen: true }),
  closeDatePicker: () => set({ datePickerOpen: false }),
  closeTimePicker: () => set({ timePickerOpen: false }),
  reset: () =>
    set({
      message: "",
      preset: null,
      customDate: null,
      customTime: null,
      priority: 0,
      myDay: 0,
      tags: [],
      tagSearch: "",
      datePickerOpen: false,
      timePickerOpen: false,
    }),
}));
