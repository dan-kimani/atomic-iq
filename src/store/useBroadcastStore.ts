import * as Linking from "expo-linking";
import { create } from "zustand";

import * as db from "../db";
import { haptics, NotificationFeedbackType } from "../lib/haptics";

// ── Types ───────────────────────────────────────────────────────────────────

interface BroadcastDraft {
  id: number;
  message: string;
  createdAt: number;
  total: number;
  sent: number;
}

interface BroadcastContact {
  id: number;
  broadcastId: number;
  phoneNumber: string;
  countryCode: string;
  sent: number;
}

// ── Store ───────────────────────────────────────────────────────────────────

type BroadcastStore = {
  // List
  drafts: BroadcastDraft[];
  // Detail
  broadcastId: number | null;
  message: string;
  contacts: BroadcastContact[];
  loaded: boolean;

  // Actions — list
  loadList: () => void;
  // Actions — detail
  loadDetail: (id: number) => boolean;
  setMessage: (id: number, text: string) => void;
  addContact: (broadcastId: number, phoneNumber: string, countryCode: string) => void;
  removeContact: (contactId: number) => void;
  deleteBroadcast: (id: number) => void;
  sendToContact: (contact: BroadcastContact, message: string) => void;
};

export const useBroadcastStore = create<BroadcastStore>((set, get) => ({
  drafts: [],
  broadcastId: null,
  message: "",
  contacts: [],
  loaded: false,

  loadList: () => {
    const broadcasts = db.getBroadcasts();
    const drafts: BroadcastDraft[] = broadcasts.map((b) => {
      const progress = db.getBroadcastProgress(b.id);
      return { ...b, ...progress };
    });
    set({ drafts });
  },

  loadDetail: (id) => {
    const b = db.getBroadcast(id);
    if (!b) {
      set({ broadcastId: null, message: "", contacts: [], loaded: false });
      return false;
    }
    const cs = db.getBroadcastContacts(id);
    set({ broadcastId: id, message: b.message, contacts: cs, loaded: true });
    return true;
  },

  setMessage: (id, text) => {
    db.updateBroadcastMessage(id, text);
    set({ message: text });
  },

  addContact: (broadcastId, phoneNumber, countryCode) => {
    db.addBroadcastContact(broadcastId, phoneNumber.replace(/\D/g, ""), countryCode);
    // Reload contacts
    const cs = db.getBroadcastContacts(broadcastId);
    set({ contacts: cs });
  },

  removeContact: (contactId) => {
    db.removeBroadcastContact(contactId);
    const { broadcastId } = get();
    if (broadcastId !== null) {
      const cs = db.getBroadcastContacts(broadcastId);
      set({ contacts: cs });
    }
  },

  deleteBroadcast: (id) => {
    db.deleteBroadcast(id);
    set({ broadcastId: null, message: "", contacts: [], loaded: false });
  },

  sendToContact: (contact, message) => {
    const digits = `${contact.countryCode}${contact.phoneNumber}`.replace(/\D/g, "");
    const msgParam = message.trim() ? `&text=${encodeURIComponent(message.trim())}` : "";
    Linking.openURL(`whatsapp://send?phone=+${digits}${msgParam}`);
    db.markBroadcastContactSent(contact.id);
    haptics.notificationAsync(NotificationFeedbackType.Success);
    // Reload to reflect sent status
    const { broadcastId } = get();
    if (broadcastId !== null) {
      const cs = db.getBroadcastContacts(broadcastId);
      set({ contacts: cs });
    }
  },
}));
