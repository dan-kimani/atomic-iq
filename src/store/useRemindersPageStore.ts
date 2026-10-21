import * as Linking from "expo-linking";
import { create } from "zustand";

import * as db from "../db";
import { haptics, NotificationFeedbackType } from "../lib/haptics";
import type { ReminderData } from "../ui/reminders/reminder-row";
import { useAppStore } from "./useAppStore";
import type { ReminderEditData } from "./useReminderStore";

type MenuMode = "active" | "completed";

type RemindersPageStore = {
  reminders: ReminderData[];
  filter: string;
  editReminder: ReminderEditData | null;
  editVisible: boolean;
  menuReminderId: number | null;
  menuMode: MenuMode;
  tagPickerOpen: boolean;
  viewMode: "list" | "calendar";
  selectedDate: string | null;

  load: () => void;
  setFilter: (filter: string) => void;
  setViewMode: (mode: "list" | "calendar") => void;
  setSelectedDate: (date: string | null) => void;
  openEdit: (r: ReminderEditData) => void;
  closeEdit: () => void;
  openMenu: (id: number, mode: MenuMode) => void;
  closeMenu: () => void;
  openTagPicker: () => void;
  closeTagPicker: () => void;
  completeReminder: (id: number) => void;
  reopenReminder: (id: number) => void;
  deleteReminder: (id: number) => void;
  deleteTag: (tag: string) => void;
  openWhatsApp: (r: ReminderData) => void;
};

export const useRemindersPageStore = create<RemindersPageStore>((set) => ({
  reminders: [],
  filter: "all",
  editReminder: null,
  editVisible: false,
  menuReminderId: null,
  menuMode: "active",
  tagPickerOpen: false,
  viewMode: "list",
  selectedDate: null,

  load: () => set({ reminders: db.getAllReminders() }),

  setFilter: (filter) => set({ filter }),
  setViewMode: (mode) => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    set({ viewMode: mode, selectedDate: mode === "calendar" ? todayIso : null });
  },
  setSelectedDate: (date) => set({ selectedDate: date }),

  openEdit: (r) => set({ editReminder: r, editVisible: true }),
  closeEdit: () => set({ editVisible: false, editReminder: null }),

  openMenu: (id, mode) => set({ menuReminderId: id, menuMode: mode }),
  closeMenu: () => set({ menuReminderId: null }),

  openTagPicker: () => set({ tagPickerOpen: true }),
  closeTagPicker: () => set({ tagPickerOpen: false }),

  completeReminder: (id) => {
    db.completeReminder(id);
    haptics.notificationAsync(NotificationFeedbackType.Success);
    set({ reminders: db.getAllReminders() });
  },

  reopenReminder: (id) => {
    db.reopenReminder(id);
    haptics.notificationAsync(NotificationFeedbackType.Success);
    set({ reminders: db.getAllReminders() });
  },

  deleteReminder: (id) => {
    db.deleteReminderById(id);
    set({ reminders: db.getAllReminders() });
  },

  deleteTag: (tag) => {
    db.deleteTagFromAllReminders(tag);
    useAppStore.getState().removeCustomTag(tag);
    set({ reminders: db.getAllReminders() });
  },

  openWhatsApp: (r) => {
    const digits = `${r.countryCode}${r.phoneNumber}`.replace(/\D/g, "");
    const msgParam = r.message ? `&text=${encodeURIComponent(r.message)}` : "";
    Linking.openURL(`whatsapp://send?phone=+${digits}${msgParam}`);
    haptics.notificationAsync(NotificationFeedbackType.Success);
  },
}));
