import * as Contacts from "expo-contacts/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import { Appearance, Platform } from "react-native";
import {
  FlagType,
  getAllCountries,
  type Country as PickerCountry,
} from "react-native-country-picker-modal";
import { create } from "zustand";

import * as db from "../db";
import { dbReady } from "../db/client";
import { countryFlagEmoji } from "../lib/country-flag";
import { haptics, ImpactFeedbackStyle, NotificationFeedbackType } from "../lib/haptics";

// Cache for countries data — preloaded on import, sorted once by calling code length
let countriesCache: PickerCountry[] | null = null;
let countriesPromise: Promise<PickerCountry[]> | null = null;
let countriesSnapshot: PickerCountry[] = [];
const countryListeners = new Set<() => void>();

function publishCountries(countries: PickerCountry[]) {
  countriesSnapshot = countries;
  for (const listener of countryListeners) listener();
}

/** External-store adapter so UI can read the preloaded country list without an effect. */
export function subscribeCountries(listener: () => void) {
  countryListeners.add(listener);
  return () => {
    countryListeners.delete(listener);
  };
}

export function getCountriesSnapshot(): PickerCountry[] {
  return countriesSnapshot;
}

const loadCountries = async (): Promise<PickerCountry[]> => {
  if (countriesCache) return countriesCache;
  if (countriesPromise) return countriesPromise;

  countriesPromise = getAllCountries(FlagType.EMOJI)
    .then((raw) => {
      const countries = raw.map((country) => ({
        ...country,
        flag: countryFlagEmoji(country.cca2, country.flag),
      }));
      const sorted = [...countries].sort((a, b) => {
        const aCode = a.callingCode?.[0] || "";
        const bCode = b.callingCode?.[0] || "";
        return bCode.length - aCode.length;
      });
      countriesCache = sorted;
      publishCountries(sorted);
      return sorted;
    })
    .catch((error: unknown) => {
      countriesPromise = null;
      throw error;
    });

  return countriesPromise;
};

// Warm the cache early so country detection in setPhoneNumber is synchronous
loadCountries().catch(() => {});

function detectCountry(cleaned: string): PickerCountry | null {
  if (!countriesCache) return null;
  for (const country of countriesCache) {
    const code = country.callingCode?.[0];
    if (code && cleaned.startsWith(code)) return country;
  }
  return null;
}

function findCountryByCallingCode(callingCode: string): PickerCountry | undefined {
  if (!countriesCache) return undefined;
  const digits = callingCode.replace(/\D/g, "");
  return countriesCache.find((c) => c.callingCode?.[0] === digits);
}

export function getCountryName(cca2: string): string {
  if (!countriesCache) return cca2;
  const country = countriesCache.find((c) => c.cca2 === cca2);
  if (!country) return cca2;
  if (typeof country.name === "string") return country.name;
  return country.name.common || Object.values(country.name)[0] || cca2;
}

interface Country {
  code: string;
  country: string;
  flag: string;
}

interface RecentContactData {
  phoneNumber: string;
  countryCode: string;
  country: string;
  flag: string;
  usedAt: Date;
  notes?: string | null;
  tags?: string | null;
}

// Format phone number with spaces for better readability
export const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";

  // Format in groups of 3-4 digits
  const parts: string[] = [];
  let remaining = cleaned;

  while (remaining.length > 0) {
    if (remaining.length <= 4) {
      parts.push(remaining);
      break;
    } else {
      parts.push(remaining.slice(0, 3));
      remaining = remaining.slice(3);
    }
  }

  return parts.join(" ");
};

const DEFAULT_SELECTED_COUNTRY: Country = { code: "+254", country: "KE", flag: "🇰🇪" };
const CONTACT_NAMES_CACHE_KEY = "contactNamesCache";

const RECENT_CONTACTS_PAGE_SIZE = 20;

type RecentContactRow = ReturnType<typeof db.getRecentContacts>[number];

function mapRecentContact(contact: RecentContactRow): RecentContactData {
  let country = contact.country;
  let flag = contact.flag;
  if (!country || !flag) {
    const found = findCountryByCallingCode(contact.countryCode);
    if (found) {
      country = country || found.cca2;
      flag = flag || found.flag || "";
    }
  }
  return {
    phoneNumber: contact.phoneNumber,
    countryCode: contact.countryCode,
    country,
    flag,
    usedAt: new Date(contact.usedAt),
    notes: contact.notes,
    tags: contact.tags,
  };
}

function readBooleanSetting(key: string, fallback: boolean): boolean {
  try {
    const raw = db.getSetting(key);
    if (raw !== undefined) return raw === "1";
  } catch {
    /* The database may not be ready yet. */
  }
  return fallback;
}

function readEnumSetting<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = db.getSetting(key);
    if (raw !== undefined && (allowed as readonly string[]).includes(raw)) return raw as T;
  } catch {
    /* The database may not be ready yet. */
  }
  return fallback;
}

function readPersistedSettings() {
  let selectedCountry = DEFAULT_SELECTED_COUNTRY;
  try {
    const raw = db.getSetting("selectedCountry");
    if (raw) {
      const stored = JSON.parse(raw) as Partial<Country>;
      if (typeof stored.code === "string" && typeof stored.country === "string") {
        selectedCountry = {
          code: stored.code,
          country: stored.country,
          flag: countryFlagEmoji(stored.country, stored.flag ?? ""),
        };
      }
    }
  } catch {
    /* The database may not be ready yet. */
  }

  return {
    selectedCountry,
    selectedCountryCode: selectedCountry.code,
    theme: readEnumSetting("theme", ["light", "dark", "system"] as const, "system"),
    clipboardDetection: readBooleanSetting("clipboardDetection", true),
    notificationSound: readBooleanSetting("notificationSound", true),
    hapticFeedback: readBooleanSetting("hapticFeedback", true),
    backupFrequency: readEnumSetting(
      "backupFrequency",
      ["hourly", "daily", "weekly"] as const,
      "daily",
    ),
  };
}

function readRecentContacts(limit = 20, offset = 0): RecentContactData[] {
  try {
    return db.getRecentContacts(limit, offset).map(mapRecentContact);
  } catch {
    return [];
  }
}

function readContactNamesCache(): Record<string, string> | null {
  try {
    const raw = db.getSetting(CONTACT_NAMES_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const names: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") names[key] = value;
    }
    return names;
  } catch {
    return null;
  }
}

function writeContactNamesCache(
  names: Record<string, string>,
  contacts: RecentContactData[],
): void {
  const relevant: Record<string, string> = {};
  for (const contact of contacts) {
    const fullNumber = `${contact.countryCode}${contact.phoneNumber}`.replace(/\D/g, "");
    const localNumber = contact.phoneNumber.replace(/\D/g, "");
    if (names[fullNumber]) relevant[fullNumber] = names[fullNumber];
    if (localNumber !== fullNumber && names[localNumber]) {
      relevant[localNumber] = names[localNumber];
    }
  }
  try {
    db.setSetting(CONTACT_NAMES_CACHE_KEY, JSON.stringify(relevant));
  } catch {
    /* Best effort — names are an enhancement, not startup data. */
  }
}

function areNameMapsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

async function ensureContactsPermission(): Promise<boolean> {
  try {
    const current = await Contacts.getPermissionsAsync();
    if (current.status === "granted") return true;
    if (!current.canAskAgain) return false;
    const next = await Contacts.requestPermissionsAsync();
    return next.status === "granted";
  } catch {
    return false;
  }
}

async function fetchDeviceContactNames(): Promise<Record<string, string> | null> {
  try {
    const permission = await Contacts.getPermissionsAsync();
    if (permission.status !== "granted") return null;

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });
    const names: Record<string, string> = {};
    for (const contact of data) {
      const name = contact.name;
      if (!name || !contact.phoneNumbers) continue;
      for (const phoneNumber of contact.phoneNumbers) {
        if (!phoneNumber.number) continue;
        const digits = phoneNumber.number.replace(/\D/g, "");
        if (digits.length >= 7) names[digits] = name;
      }
    }
    return names;
  } catch (error) {
    console.error("Failed to load contacts from device:", error);
    return null;
  }
}

interface AppStore {
  phoneNumber: string;
  rawPhoneNumber: string;
  selectedCountry: Country;
  selectedCountryCode: string;
  recentContacts: RecentContactData[];
  recentContactsHasMore: boolean;
  isCountryPickerOpen: boolean;
  messageText: string;
  contactNames: Record<string, string>;
  templates: { id: number; text: string }[];
  hydrated: boolean;
  setPhoneNumber: (phone: string) => void;
  setSelectedCountry: (country: Country) => void;
  setCountryPickerOpen: (open: boolean) => void;
  setMessageText: (text: string) => void;
  loadTemplates: () => void;
  addTemplate: (text: string) => void;
  deleteTemplate: (id: number) => void;
  isValidNumber: () => boolean;
  startChat: () => Promise<void>;
  startCall: () => Promise<void>;
  openWhatsApp: (countryCode: string, phoneNumber: string) => void;
  openDialer: (countryCode: string, phoneNumber: string) => void;
  saveContact: (countryCode: string, phoneNumber: string) => Promise<void>;
  loadRecentContacts: () => Promise<void>;
  refreshContactNames: () => Promise<void>;
  selectRecentContact: (contact: RecentContactData) => void;
  deleteRecentContact: (phoneNumber: string) => Promise<void>;
  clearAllRecentContacts: () => Promise<void>;
  loadMoreRecentContacts: () => void;
  customTags: string[];
  addCustomTag: (tag: string) => void;
  removeCustomTag: (tag: string) => void;
  clipboardDetection: boolean;
  toggleClipboardDetection: () => void;
  notificationSound: boolean;
  toggleNotificationSound: () => void;
  hapticFeedback: boolean;
  toggleHapticFeedback: () => void;
  theme: "system" | "light" | "dark";
  setTheme: (theme: "system" | "light" | "dark") => void;
  backupFrequency: "hourly" | "daily" | "weekly";
  setBackupFrequency: (freq: "hourly" | "daily" | "weekly") => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  phoneNumber: "",
  rawPhoneNumber: "",
  selectedCountry: { ...DEFAULT_SELECTED_COUNTRY },
  selectedCountryCode: DEFAULT_SELECTED_COUNTRY.code,
  isCountryPickerOpen: false,
  messageText: "",
  contactNames: {},
  templates: [],
  recentContacts: [],
  recentContactsHasMore: false,
  hydrated: false,

  customTags: [],
  addCustomTag: (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    set((s) => {
      if (s.customTags.includes(trimmed)) return s;
      db.addCustomTagToDb(trimmed);
      return { customTags: [...s.customTags, trimmed].sort() };
    });
  },
  removeCustomTag: (tag) => {
    db.removeCustomTagFromDb(tag);
    set((s) => ({ customTags: s.customTags.filter((t) => t !== tag) }));
  },

  clipboardDetection: true,
  toggleClipboardDetection: () =>
    set((s) => {
      const next = !s.clipboardDetection;
      db.setSetting("clipboardDetection", next ? "1" : "0");
      return { clipboardDetection: next };
    }),

  notificationSound: true,
  toggleNotificationSound: () =>
    set((s) => {
      const next = !s.notificationSound;
      db.setSetting("notificationSound", next ? "1" : "0");
      return { notificationSound: next };
    }),

  // The theme colours the pre-hydration frame, so read it eagerly when the
  // settings table already exists. Hydration re-reads it after migrations.
  theme: readEnumSetting("theme", ["light", "dark", "system"] as const, "system"),
  setTheme: (theme) => {
    set({ theme });
    Appearance.setColorScheme(theme === "system" ? "unspecified" : theme);
    db.setSetting("theme", theme);
  },

  backupFrequency: "daily",
  setBackupFrequency: (freq) => {
    db.setSetting("backupFrequency", freq);
    set({ backupFrequency: freq });
  },

  hapticFeedback: true,
  toggleHapticFeedback: () =>
    set((s) => {
      const next = !s.hapticFeedback;
      db.setSetting("hapticFeedback", next ? "1" : "0");
      return { hapticFeedback: next };
    }),

  setPhoneNumber: (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    const looksInternational = phone.startsWith("+");

    if (cleaned.length > 0 && looksInternational) {
      // Try synchronous detection first (cache is preloaded on import)
      const matched = detectCountry(cleaned);
      if (matched) {
        const code = matched.callingCode?.[0] ?? "";
        const phoneWithoutCode = cleaned.substring(code.length);
        const formatted = formatPhoneNumber(phoneWithoutCode);
        haptics.impactAsync(ImpactFeedbackStyle.Light);
        set({
          selectedCountry: { code: `+${code}`, country: matched.cca2, flag: matched.flag || "" },
          selectedCountryCode: `+${code}`,
          phoneNumber: formatted,
          rawPhoneNumber: phoneWithoutCode,
        });
        return;
      }

      // Cache miss — fall back to async, but still show the number immediately
      const formatted = formatPhoneNumber(cleaned);
      set({ phoneNumber: formatted, rawPhoneNumber: cleaned });

      loadCountries()
        .then(() => {
          const currentRaw = get().rawPhoneNumber;
          if (currentRaw !== cleaned) return;
          const retry = detectCountry(cleaned);
          if (retry) {
            const code = retry.callingCode?.[0] ?? "";
            const phoneWithoutCode = cleaned.substring(code.length);
            haptics.impactAsync(ImpactFeedbackStyle.Light);
            set({
              selectedCountry: { code: `+${code}`, country: retry.cca2, flag: retry.flag || "" },
              selectedCountryCode: `+${code}`,
              phoneNumber: formatPhoneNumber(phoneWithoutCode),
              rawPhoneNumber: phoneWithoutCode,
            });
          }
        })
        .catch(() => {});
      return;
    }

    // Plain local number — no country code detection needed
    const formatted = formatPhoneNumber(cleaned);
    set({ phoneNumber: formatted, rawPhoneNumber: cleaned });
  },

  setCountryPickerOpen: (open) => set({ isCountryPickerOpen: open }),
  setMessageText: (text) => set({ messageText: text }),
  loadTemplates: () => {
    const templates = db.getTemplates();
    set({ templates });
  },
  addTemplate: (text) => {
    db.addTemplate(text);
    const templates = db.getTemplates();
    set({ templates });
  },
  deleteTemplate: (id) => {
    db.deleteTemplate(id);
    const templates = db.getTemplates();
    set({ templates });
  },

  setSelectedCountry: (country) => {
    const next = { ...country, flag: countryFlagEmoji(country.country, country.flag) };
    haptics.impactAsync(ImpactFeedbackStyle.Light);
    db.setSetting("selectedCountry", JSON.stringify(next));
    set({ selectedCountry: next, selectedCountryCode: next.code });
  },

  isValidNumber: () => get().rawPhoneNumber.trim().length >= 9,

  startChat: async () => {
    const { rawPhoneNumber, selectedCountry } = get();
    if (!rawPhoneNumber.trim()) return;

    // Haptic feedback on button press
    await haptics.impactAsync(ImpactFeedbackStyle.Medium);

    const digits = `${selectedCountry.code}${rawPhoneNumber}`.replace(/\D/g, "");
    const fullNumber = `+${digits}`;
    const message = (get().messageText ?? "").trim();
    const whatsappUrl = `whatsapp://send?phone=${fullNumber}${message ? `&text=${encodeURIComponent(message)}` : ""}`;

    // Save to recent contacts (fire-and-forget — don't block WhatsApp)
    db.saveContact(
      rawPhoneNumber,
      selectedCountry.code,
      selectedCountry.country,
      selectedCountry.flag,
    )
      .then(() => get().loadRecentContacts())
      .catch(() => {});

    // Open WhatsApp - Android will show chooser if both apps are installed
    Linking.openURL(whatsappUrl);
    haptics.notificationAsync(NotificationFeedbackType.Success);
  },

  startCall: async () => {
    const { rawPhoneNumber, selectedCountry } = get();
    if (!rawPhoneNumber.trim()) return;

    await haptics.impactAsync(ImpactFeedbackStyle.Medium);

    const digits = `${selectedCountry.code}${rawPhoneNumber}`.replace(/\D/g, "");
    const fullNumber = `+${digits}`;

    // Save to recent contacts (fire-and-forget — don't block dialer)
    db.saveContact(
      rawPhoneNumber,
      selectedCountry.code,
      selectedCountry.country,
      selectedCountry.flag,
    )
      .then(() => get().loadRecentContacts())
      .catch(() => {});

    Linking.openURL(`tel:${fullNumber}`);
    haptics.notificationAsync(NotificationFeedbackType.Success);
  },

  openDialer: (countryCode, phoneNumber) => {
    const digits = `${countryCode}${phoneNumber}`.replace(/\D/g, "");
    const country = findCountryByCallingCode(countryCode);
    db.saveContact(phoneNumber, countryCode, country?.cca2 ?? "", country?.flag ?? "").catch(
      () => {},
    );
    Linking.openURL(`tel:+${digits}`);
    haptics.notificationAsync(NotificationFeedbackType.Success);
  },

  openWhatsApp: (countryCode, phoneNumber) => {
    const digits = `${countryCode}${phoneNumber}`.replace(/\D/g, "");
    const country = findCountryByCallingCode(countryCode);
    db.saveContact(phoneNumber, countryCode, country?.cca2 ?? "", country?.flag ?? "").catch(
      () => {},
    );
    Linking.openURL(`whatsapp://send?phone=+${digits}`);
    haptics.notificationAsync(NotificationFeedbackType.Success);
  },

  saveContact: async (countryCode, phoneNumber) => {
    const digits = `${countryCode}${phoneNumber}`.replace(/\D/g, "");
    const fullNumber = `+${digits}`;

    if (Platform.OS === "android") {
      try {
        await IntentLauncher.startActivityAsync("android.intent.action.INSERT", {
          type: "vnd.android.cursor.dir/raw_contact",
          extra: { phone: fullNumber },
        });
        haptics.notificationAsync(NotificationFeedbackType.Success);
      } catch {
        // User cancelled
      }
    } else {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") return;
        await Contacts.presentFormAsync(null, {
          contactType: "person",
          name: "",
          phoneNumbers: [{ number: fullNumber, label: "mobile", id: "" }],
        } as any);
        haptics.notificationAsync(NotificationFeedbackType.Success);
      } catch {
        // User cancelled
      }
    }
  },

  loadRecentContacts: async () => {
    try {
      await dbReady;
    } catch {
      /* Hydration already reported the migration failure. */
    }

    try {
      const firstPage = readRecentContacts(RECENT_CONTACTS_PAGE_SIZE, 0);
      set({
        recentContacts: firstPage,
        recentContactsHasMore: firstPage.length === RECENT_CONTACTS_PAGE_SIZE,
      });
      // Names come from the device and can take a while; render the rows first
      // and fill in names when the query resolves.
      void get().refreshContactNames();
    } catch (error) {
      console.error("Failed to load recent contacts:", error);
      set({ recentContacts: [], recentContactsHasMore: false });
    }
  },

  refreshContactNames: async () => {
    const names = await fetchDeviceContactNames();
    if (!names) return;
    if (!areNameMapsEqual(get().contactNames, names)) {
      set({ contactNames: names });
    }
    writeContactNamesCache(names, get().recentContacts);
  },

  loadMoreRecentContacts: () => {
    if (!get().recentContactsHasMore) return;
    const current = get().recentContacts;
    const newContacts = readRecentContacts(RECENT_CONTACTS_PAGE_SIZE, current.length);
    if (newContacts.length === 0) {
      set({ recentContactsHasMore: false });
      return;
    }

    set({
      recentContacts: [...current, ...newContacts],
      recentContactsHasMore: newContacts.length === RECENT_CONTACTS_PAGE_SIZE,
    });
    writeContactNamesCache(get().contactNames, get().recentContacts);
  },

  selectRecentContact: (contact) => {
    haptics.impactAsync(ImpactFeedbackStyle.Light);
    const country = {
      code: contact.countryCode,
      country: contact.country,
      flag: contact.flag,
    };
    set({
      selectedCountry: country,
      selectedCountryCode: contact.countryCode,
      rawPhoneNumber: contact.phoneNumber,
      phoneNumber: formatPhoneNumber(contact.phoneNumber),
    });
  },

  deleteRecentContact: async (phoneNumber) => {
    try {
      await haptics.impactAsync(ImpactFeedbackStyle.Medium);
      await db.deleteContact(phoneNumber);
      get().loadRecentContacts();
    } catch (error) {
      console.error("Failed to delete recent contact:", error);
    }
  },

  clearAllRecentContacts: async () => {
    try {
      db.clearAllRecent();
      set({ recentContacts: [], recentContactsHasMore: false });
      writeContactNamesCache(get().contactNames, []);
      haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to clear recent contacts:", error);
    }
  },
}));

let hydrationPromise: Promise<void> | null = null;

/**
 * Loads everything the first frame needs before the navigator mounts. The
 * migration promise is async, so querying the database eagerly either ran
 * before the tables existed or left screens to render empty and then
 * repopulate. Both looked like a flicker at launch.
 */
export function hydrateAppStore(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      await dbReady;
    } catch (error) {
      console.error("[startup] database is not ready", error);
    }

    try {
      await loadCountries();
    } catch (error) {
      console.error("[startup] failed to load countries", error);
    }

    const persisted = readPersistedSettings();
    const recentContacts = readRecentContacts(RECENT_CONTACTS_PAGE_SIZE, 0);
    const cachedNames = readContactNamesCache();

    let templates: { id: number; text: string }[] = [];
    try {
      templates = db.getTemplates();
    } catch {
      /* Migration failed — keep the empty default. */
    }

    let customTags: string[] = [];
    try {
      customTags = db.getCustomTags();
    } catch {
      /* Migration failed — keep the empty default. */
    }

    const needsNamesBeforeRender = cachedNames === null && recentContacts.length > 0;

    useAppStore.setState({
      ...persisted,
      recentContacts,
      recentContactsHasMore: recentContacts.length === RECENT_CONTACTS_PAGE_SIZE,
      contactNames: cachedNames ?? {},
      templates,
      customTags,
      hydrated: !needsNamesBeforeRender,
    });

    // On a cold first launch there is no name cache yet. Resolve the permission
    // and names before the first frame so rows do not switch from a number to a
    // name a moment after the screen appears.
    if (needsNamesBeforeRender) {
      const granted = await ensureContactsPermission();
      const names = granted ? await fetchDeviceContactNames() : null;
      if (names) {
        writeContactNamesCache(names, recentContacts);
        useAppStore.setState({ contactNames: names, hydrated: true });
      } else {
        useAppStore.setState({ hydrated: true });
      }
      return;
    }

    // Refresh names (and ask for the permission on the first run) after the
    // first frame: a large contact list must not delay or reflow startup.
    void (async () => {
      const granted = await ensureContactsPermission();
      if (!granted) return;
      await useAppStore.getState().refreshContactNames();
    })();
  })().catch((error: unknown) => {
    console.error("[startup] hydration failed", error);
    useAppStore.setState({ hydrated: true });
  });

  return hydrationPromise;
}

export type { Country };
