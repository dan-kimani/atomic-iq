import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import { create } from "zustand";

import * as db from "../db";
import { haptics, ImpactFeedbackStyle } from "../lib/haptics";

// ── Types ───────────────────────────────────────────────────────────────────

export interface BusinessEventData {
  id: number;
  name: string;
  tags: string | null;
  period: string | null;
  status: "active" | "done";
  reminderEnabled: number;
  reminderInterval: string | null;
  reminderTime: string;
  reminderDay: number | null;
  reminderNotificationId: string | null;
  lastRemindedAt: number | null;
  nextReminderAt: number | null;
  createdAt: number;
  // Transient (computed at load time):
  contactCount: number;
}

// ── Reminder helpers ────────────────────────────────────────────────────────

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

function parseReminderTime(time: string): { h: number; m: number } {
  const parts = time.split(":");
  return {
    h: parseInt(parts[0] ?? String(DEFAULT_HOUR), 10),
    m: parseInt(parts[1] ?? String(DEFAULT_MINUTE), 10),
  };
}

export function computeNextReminder(
  interval: string,
  from: Date = new Date(),
  reminderTime: string = "09:00",
  reminderDay?: number | null,
): Date {
  const { h, m } = parseReminderTime(reminderTime);
  const d = new Date(from);
  d.setHours(h, m, 0, 0);

  switch (interval) {
    case "daily":
      if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      if (reminderDay != null) {
        // Anchor to a specific day of week (0=Sun … 6=Sat)
        const currentDay = d.getDay();
        let daysUntil = reminderDay - currentDay;
        if (daysUntil < 0 || (daysUntil === 0 && d.getTime() <= from.getTime())) {
          daysUntil += 7;
        }
        d.setDate(d.getDate() + daysUntil);
      } else {
        d.setDate(d.getDate() + 7);
      }
      break;
    case "biweekly":
      if (reminderDay != null) {
        // Find next occurrence of the chosen day of week
        const currentDay = d.getDay();
        let daysUntil = reminderDay - currentDay;
        if (daysUntil < 0 || (daysUntil === 0 && d.getTime() <= from.getTime())) {
          daysUntil += 7;
        }
        d.setDate(d.getDate() + daysUntil);
        // Then push one more week so it's "every other" week
        // Use an epoch-based anchor to determine which week we're on
        const epoch = new Date(2024, 0, 1); // Monday
        const weekNum = Math.floor((d.getTime() - epoch.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekNum % 2 === 0) {
          d.setDate(d.getDate() + 7);
        }
      } else {
        d.setDate(d.getDate() + 14);
      }
      break;
    case "monthly":
      if (reminderDay != null && reminderDay >= 1 && reminderDay <= 28) {
        // Anchor to a specific day of month
        d.setDate(1); // first of current month
        d.setMonth(d.getMonth() + 1); // next month
        d.setDate(Math.min(reminderDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
        // If that date is already past, push to the month after
        if (d.getTime() <= from.getTime()) {
          d.setMonth(d.getMonth() + 1);
          d.setDate(Math.min(reminderDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
        }
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      break;
  }
  return d;
}

async function scheduleEventReminder(
  eventId: number,
  name: string,
  contactCount: number,
  nextReminderAt: number,
): Promise<string> {
  const seconds = Math.max(60, Math.floor((nextReminderAt - Date.now()) / 1000));
  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: name,
      body: `You have ${contactCount} lead${contactCount === 1 ? "" : "s"} — how is that going?`,
      data: { eventId: String(eventId), type: "business_event_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
  return notifId;
}

// ── Store ───────────────────────────────────────────────────────────────────

type BusinessEventStore = {
  events: BusinessEventData[];
  selectedIds: number[];
  selectionMode: boolean;

  // Actions
  loadEvents: () => void;
  createEvent: (name: string, tags: string[], period: string | null) => number;
  updateEvent: (
    id: number,
    updates: { name?: string; tags?: string | null; period?: string | null },
  ) => void;
  toggleStatus: (id: number) => void;
  deleteEvent: (id: number) => void;
  updateEventReminder: (
    id: number,
    enabled: boolean,
    interval: string | null,
    reminderTime?: string,
    reminderDay?: number | null,
  ) => Promise<void>;
  checkDueReminders: () => Promise<void>;

  // Selection
  toggleSelection: (id: number) => void;
  clearSelection: () => void;
  setSelectionMode: (on: boolean) => void;

  // Cross-feature
  createBroadcastFromSelection: () => number | null;
  getMergedContactCount: () => number;
};

export const useBusinessEventStore = create<BusinessEventStore>((set, get) => ({
  events: [],
  selectedIds: [],
  selectionMode: false,

  // ── Actions ──────────────────────────────────────────────────────────────

  loadEvents: () => {
    const rows = db.getBusinessEvents();
    const events: BusinessEventData[] = rows.map((e) => {
      const tagList = e.tags
        ? e.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      return {
        ...e,
        status: e.status as "active" | "done",
        contactCount: db.countContactsByTags(tagList),
      };
    });
    set({ events });
  },

  createEvent: (name, tags, period) => {
    const tagsValue = tags.length > 0 ? tags.join(",") : null;
    const id = db.createBusinessEvent(name, tagsValue, period);
    haptics.impactAsync(ImpactFeedbackStyle.Light);
    return id;
  },

  updateEvent: (id, updates) => {
    db.updateBusinessEvent(id, updates);
    haptics.impactAsync(ImpactFeedbackStyle.Light);
  },

  toggleStatus: (id) => {
    db.toggleBusinessEventStatus(id);
    haptics.impactAsync(ImpactFeedbackStyle.Light);
  },

  deleteEvent: (id) => {
    db.deleteBusinessEvent(id);
    haptics.impactAsync(ImpactFeedbackStyle.Light);
  },

  updateEventReminder: async (id, enabled, interval, reminderTime, reminderDay) => {
    const event = get().events.find((e) => e.id === id);

    // Cancel any existing scheduled notification
    if (event?.reminderNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(event.reminderNotificationId);
    }

    if (enabled && interval) {
      const contactCount = event?.contactCount ?? 0;
      const timeStr = reminderTime ?? event?.reminderTime ?? "09:00";
      const day = reminderDay !== undefined ? reminderDay : event?.reminderDay;
      const nextAt = computeNextReminder(interval, new Date(), timeStr, day);
      const nextMs = nextAt.getTime();

      const notifId = await scheduleEventReminder(id, event?.name ?? "", contactCount, nextMs);

      db.updateBusinessEvent(id, {
        reminderEnabled: 1,
        reminderInterval: interval,
        reminderTime: timeStr,
        reminderDay: day ?? null,
        reminderNotificationId: notifId,
        nextReminderAt: nextMs,
      });
    } else {
      // Disable reminder
      db.updateBusinessEvent(id, {
        reminderEnabled: 0,
        reminderInterval: null,
        reminderNotificationId: null,
        nextReminderAt: null,
      });
    }
    haptics.impactAsync(ImpactFeedbackStyle.Light);
    get().loadEvents();
  },

  checkDueReminders: async () => {
    const due = db.getDueEventReminders();
    for (const event of due) {
      const interval = event.reminderInterval;
      if (!interval) continue;

      // Cancel old notification if one exists
      if (event.reminderNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(event.reminderNotificationId);
      }

      const tagList = event.tags
        ? event.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const contactCount = db.countContactsByTags(tagList);
      const timeStr = event.reminderTime ?? "09:00";
      const nextAt = computeNextReminder(interval, new Date(), timeStr, event.reminderDay);

      const notifId = await scheduleEventReminder(event.id, event.name, contactCount, nextAt.getTime());

      db.updateBusinessEvent(event.id, {
        lastRemindedAt: Date.now(),
        reminderNotificationId: notifId,
        nextReminderAt: nextAt.getTime(),
      });
    }
    if (due.length > 0) get().loadEvents();
  },

  // ── Selection ────────────────────────────────────────────────────────────

  toggleSelection: (id) => {
    set((s) => {
      const exists = s.selectedIds.includes(id);
      return {
        selectedIds: exists
          ? s.selectedIds.filter((i) => i !== id)
          : [...s.selectedIds, id],
      };
    });
  },

  clearSelection: () => set({ selectedIds: [], selectionMode: false }),
  setSelectionMode: (on) => set({ selectionMode: on, selectedIds: on ? get().selectedIds : [] }),

  // ── Cross-feature ────────────────────────────────────────────────────────

  createBroadcastFromSelection: () => {
    const { selectedIds, events } = get();
    if (selectedIds.length === 0) return null;

    // Merge all tags from selected events
    const tagSet = new Set<string>();
    for (const id of selectedIds) {
      const event = events.find((e) => e.id === id);
      if (!event || !event.tags) continue;
      event.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => tagSet.add(t));
    }

    const mergedTags = [...tagSet];
    if (mergedTags.length === 0) return null;

    const contacts = db.getContactsByTags(mergedTags);
    if (contacts.length === 0) return null;

    // Deduplicate by phone number
    const seen = new Set<string>();
    const unique: { phoneNumber: string; countryCode: string }[] = [];
    for (const c of contacts) {
      const key = `${c.countryCode}${c.phoneNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(c);
    }

    // Create broadcast
    const broadcastId = db.createBroadcast("");
    for (const c of unique) {
      db.addBroadcastContact(broadcastId, c.phoneNumber, c.countryCode);
    }

    haptics.impactAsync(ImpactFeedbackStyle.Medium);
    Toast.show({
      type: "success",
      text1: "Broadcast created",
      text2: `${unique.length} contact${unique.length === 1 ? "" : "s"} added`,
      visibilityTime: 3000,
    });

    get().clearSelection();
    return broadcastId;
  },

  getMergedContactCount: () => {
    const { selectedIds, events } = get();
    const tagSet = new Set<string>();
    for (const id of selectedIds) {
      const event = events.find((e) => e.id === id);
      if (!event || !event.tags) continue;
      event.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => tagSet.add(t));
    }
    if (tagSet.size === 0) return 0;
    const contacts = db.getContactsByTags([...tagSet]);
    const seen = new Set<string>();
    for (const c of contacts) {
      seen.add(`${c.countryCode}${c.phoneNumber}`);
    }
    return seen.size;
  },
}));
