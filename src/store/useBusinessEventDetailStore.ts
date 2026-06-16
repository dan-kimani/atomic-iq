import { create } from "zustand";

import * as db from "../db";
import {
  type BusinessEventData,
} from "./useBusinessEventStore";

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

interface ContactEntry {
  phoneNumber: string;
  countryCode: string;
}

function findMatchingContacts(tags: string | null): ContactEntry[] {
  const tagList = parseTags(tags);
  if (tagList.length === 0) return [];
  const contacts = db.getContactsByTags(tagList);
  const seen = new Set<string>();
  const unique: ContactEntry[] = [];
  for (const c of contacts) {
    const key = `${c.countryCode}${c.phoneNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }
  return unique;
}

// ── Store ───────────────────────────────────────────────────────────────────

type DetailStore = {
  event: BusinessEventData | null;
  contacts: ContactEntry[];
  message: string;
  loaded: boolean;

  loadDetail: (eventId: number) => boolean;
  setMessage: (text: string) => void;
  addContact: (
    phoneNumber: string,
    countryCode: string,
    country: string,
    flag: string,
  ) => void;
  toggleEventStatus: (eventId: number) => void;
};

export const useBusinessEventDetailStore = create<DetailStore>((set, get) => ({
  event: null,
  contacts: [],
  message: "",
  loaded: false,

  loadDetail: (eventId) => {
    set({ message: "" }); // reset message when navigating to a new event
    const row = db.getBusinessEvent(eventId);
    if (!row) {
      set({ event: null, contacts: [], loaded: false });
      return false;
    }
    const contacts = findMatchingContacts(row.tags);
    set({
      event: {
        ...row,
        status: row.status as "active" | "done",
        contactCount: contacts.length,
      },
      contacts,
      loaded: true,
    });
    return true;
  },

  setMessage: (text) => set({ message: text }),

  addContact: (phoneNumber, countryCode, country, flag) => {
    const { event } = get();
    if (!event) return;

    db.saveContact(phoneNumber, countryCode, country, flag);

    const eventTags = parseTags(event.tags);
    if (eventTags.length > 0) {
      const existing = db
        .getRecentContacts()
        .find((c) => c.phoneNumber === phoneNumber);
      const existingTags = existing?.tags
        ? existing.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const merged = [...new Set([...existingTags, ...eventTags])];
      db.updateContactTags(phoneNumber, merged.join(","));
    }

    // Reload contacts
    const contacts = findMatchingContacts(event.tags);
    set({ contacts });
  },

  toggleEventStatus: (eventId) => {
    db.toggleBusinessEventStatus(eventId);
    const row = db.getBusinessEvent(eventId);
    if (!row) return;
    const contacts = findMatchingContacts(row.tags);
    set({
      event: {
        ...row,
        status: row.status as "active" | "done",
        contactCount: contacts.length,
      },
      contacts,
    });
  },
}));
