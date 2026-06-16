import { create } from "zustand";

import * as db from "../db";
import { type BusinessEventData } from "./useBusinessEventStore";

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseTime(time: string): { h: number; m: number } {
  const parts = time.split(":");
  return {
    h: parseInt(parts[0] ?? "9", 10),
    m: parseInt(parts[1] ?? "0", 10),
  };
}

// ── Store ───────────────────────────────────────────────────────────────────

type EventFormStore = {
  // Form fields
  name: string;
  period: string;
  tags: string[];
  allTags: string[];
  tagSearch: string;
  isAddingTag: boolean;
  newTagName: string;
  reminderEnabled: boolean;
  reminderInterval: string | null;
  reminderHour: number;
  reminderMinute: number;
  reminderDay: number | null;
  timePickerOpen: boolean;
  datePickerOpen: boolean;

  // Actions
  setName: (v: string) => void;
  setPeriod: (v: string) => void;
  toggleTag: (tag: string) => void;
  commitNewTag: () => void;
  setTagSearch: (v: string) => void;
  setIsAddingTag: (v: boolean) => void;
  setNewTagName: (v: string) => void;
  setReminderEnabled: (v: boolean) => void;
  setReminderInterval: (v: string | null) => void;
  setReminderHour: (v: number) => void;
  setReminderMinute: (v: number) => void;
  setReminderDay: (v: number | null) => void;
  setTimePickerOpen: (v: boolean) => void;

  // Lifecycle
  init: (event: BusinessEventData, customTags: string[]) => void;
  reset: (customTags: string[]) => void;
  buildSavePayload: () => {
    name: string;
    period: string | null;
    tags: string[];
    reminderEnabled: boolean;
    reminderInterval: string | null;
    reminderTime: string;
    reminderDay: number | null;
  };
};

export const useEventFormStore = create<EventFormStore>((set, get) => ({
  name: "",
  period: "",
  tags: [],
  allTags: [],
  tagSearch: "",
  isAddingTag: false,
  newTagName: "",
  reminderEnabled: false,
  reminderInterval: null,
  reminderHour: 9,
  reminderMinute: 0,
  reminderDay: null,
  timePickerOpen: false,
  datePickerOpen: false,

  setName: (v) => set({ name: v }),
  setPeriod: (v) => set({ period: v }),
  toggleTag: (tag) =>
    set((s) => ({
      tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag],
    })),
  commitNewTag: () => {
    const { newTagName, tags, allTags } = get();
    const trimmed = newTagName.trim();
    if (!trimmed) {
      set({ newTagName: "", isAddingTag: false });
      return;
    }
    // Add to DB pool and auto-select for this event
    db.addCustomTagToDb(trimmed);
    set({
      tags: [...tags, trimmed],
      allTags: allTags.includes(trimmed) ? allTags : [...allTags, trimmed].sort(),
      newTagName: "",
      isAddingTag: false,
    });
  },
  setTagSearch: (v) => set({ tagSearch: v }),
  setIsAddingTag: (v) => set({ isAddingTag: v }),
  setNewTagName: (v) => set({ newTagName: v }),
  setReminderEnabled: (v) => set({ reminderEnabled: v }),
  setReminderInterval: (v) => {
    set({ reminderInterval: v });
    if (v === "daily") set({ reminderDay: null });
  },
  setReminderHour: (v) => set({ reminderHour: v }),
  setReminderMinute: (v) => set({ reminderMinute: v }),
  setReminderDay: (v) => set({ reminderDay: v }),
  setTimePickerOpen: (v) => set({ timePickerOpen: v }),

  init: (event, customTags) => {
    const contactTags = (() => {
      try { return db.getAllContactTags(); } catch { return []; }
    })();
    const reminderTags = (() => {
      try { return db.getAllTags(); } catch { return []; }
    })();
    const eventTags = parseTags(event.tags);
    const merged = [...new Set([...customTags, ...reminderTags, ...contactTags, ...eventTags])].sort();
    const time = parseTime(event.reminderTime ?? "09:00");

    set({
      name: event.name,
      period: event.period ?? "",
      tags: eventTags,
      allTags: merged,
      tagSearch: "",
      isAddingTag: false,
      newTagName: "",
      reminderEnabled: event.reminderEnabled === 1,
      reminderInterval: event.reminderInterval,
      reminderHour: time.h,
      reminderMinute: time.m,
      reminderDay: event.reminderDay ?? null,
      timePickerOpen: false,
    });
  },

  reset: (customTags) => {
    const contactTags = (() => {
      try { return db.getAllContactTags(); } catch { return []; }
    })();
    const reminderTags = (() => {
      try { return db.getAllTags(); } catch { return []; }
    })();
    const merged = [...new Set([...customTags, ...reminderTags, ...contactTags])].sort();

    set({
      name: "",
      period: "",
      tags: [],
      allTags: merged,
      tagSearch: "",
      isAddingTag: false,
      newTagName: "",
      reminderEnabled: false,
      reminderInterval: null,
      reminderHour: 9,
      reminderMinute: 0,
      reminderDay: null,
      timePickerOpen: false,
    });
  },

  buildSavePayload: () => {
    const s = get();
    return {
      name: s.name.trim(),
      period: s.period.trim() || null,
      tags: s.tags,
      reminderEnabled: s.reminderEnabled,
      reminderInterval: s.reminderInterval,
      reminderTime: `${String(s.reminderHour).padStart(2, "0")}:${String(s.reminderMinute).padStart(2, "0")}`,
      reminderDay: s.reminderDay,
    };
  },
}));
