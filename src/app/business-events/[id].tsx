import * as Linking from "expo-linking";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Bell, Megaphone, Pencil, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CountryPickerSheet from "../../components/Country/CountryPickerSheet";
import EventSheet from "../../components/BusinessEvents/EventSheet";
import MessageEditor from "../../components/Message/MessageEditor";
import TemplateChips from "../../components/Templates/TemplateChips";
import ConfirmSheet, { type ConfirmAction } from "../../components/ConfirmSheet";
import PageHeader from "../../components/ui/PageHeader";
import * as db from "../../db";
import { useIsDark } from "../../hooks/useIsDark";
import { useAppStore } from "../../store/useAppStore";
import { type BusinessEventData } from "../../store/useBusinessEventStore";
import { useBusinessEventDetailStore } from "../../store/useBusinessEventDetailStore";
import { useBusinessEventStore } from "../../store/useBusinessEventStore";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

function fmtReminderSchedule(event: BusinessEventData): string | null {
  if (!event.reminderEnabled || !event.reminderInterval) return null;
  const interval = event.reminderInterval;
  const label = interval.charAt(0).toUpperCase() + interval.slice(1);
  const timeParts = (event.reminderTime ?? "09:00").split(":");
  const h = parseInt(timeParts[0] ?? "9", 10);
  const m = parseInt(timeParts[1] ?? "0", 10);
  const period = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  const timeStr = `${dh}:${m.toString().padStart(2, "0")} ${period}`;
  if (interval === "daily") return `${label} at ${timeStr}`;
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (interval === "weekly" || interval === "biweekly") {
    const day = event.reminderDay != null ? DAY_LABELS[event.reminderDay] : null;
    return day ? `${label} on ${day} at ${timeStr}` : `${label} at ${timeStr}`;
  }
  if (interval === "monthly") {
    const day = event.reminderDay != null ? `${event.reminderDay}th` : null;
    return day ? `${label} on ${day} at ${timeStr}` : `${label} at ${timeStr}`;
  }
  return `${label} at ${timeStr}`;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  const last = cleaned.slice(-9);
  const groups = last.match(/^(\d{1,3})(\d{1,3})?(\d{1,4})?$/);
  if (!groups) return phone;
  return [groups[1], groups[2], groups[3]].filter(Boolean).join(" ");
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessEventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = parseInt(id, 10);
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const contactNames = useAppStore((s) => s.contactNames);
  const selectedCountry = useAppStore((s) => s.selectedCountry);
  const setCountryPickerOpen = useAppStore((s) => s.setCountryPickerOpen);
  const loadEvents = useBusinessEventStore((s) => s.loadEvents);

  const event = useBusinessEventDetailStore((s) => s.event);
  const contacts = useBusinessEventDetailStore((s) => s.contacts);
  const message = useBusinessEventDetailStore((s) => s.message);
  const loaded = useBusinessEventDetailStore((s) => s.loaded);
  const loadDetail = useBusinessEventDetailStore((s) => s.loadDetail);
  const setMessage = useBusinessEventDetailStore((s) => s.setMessage);
  const addContact = useBusinessEventDetailStore((s) => s.addContact);
  const toggleEventStatus = useBusinessEventDetailStore((s) => s.toggleEventStatus);

  const [newNumber, setNewNumber] = useState("");
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDetail(eventId);
    }, [eventId, loadDetail]),
  );

  if (!loaded || !event) return null;

  const isActive = event.status === "active";

  const handleBroadcast = () => {
    if (contacts.length === 0) return;
    const broadcastId = db.createBroadcast(message);
    for (const c of contacts) {
      db.addBroadcastContact(broadcastId, c.phoneNumber, c.countryCode);
    }
    router.push(`/broadcast/${broadcastId}`);
  };

  const handleToggleStatus = () => {
    setConfirmAction({
      title: isActive ? "Mark event as done?" : "Reopen event?",
      description: isActive
        ? "Its contacts will still be available."
        : "This event will appear in active again.",
      icon: <Bell size={28} color={isDark ? "#6ee7b7" : "#059669"} />,
      confirmLabel: isActive ? "Mark Done" : "Reopen",
      destructive: false,
      onConfirm: () => {
        toggleEventStatus(eventId);
        loadEvents();
      },
    });
  };

  const handleEditSaved = () => {
    setEditSheetVisible(false);
    loadDetail(eventId);
    loadEvents();
  };

  const handleAddContact = () => {
    const digits = newNumber.replace(/\D/g, "");
    if (digits.length < 9) return;
    addContact(digits, selectedCountry.code, selectedCountry.country, selectedCountry.flag);
    setNewNumber("");
  };

  const getContactName = (phoneNumber: string): string | undefined => {
    const digits = phoneNumber.replace(/\D/g, "");
    return contactNames[digits];
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-950" style={{ paddingTop: insets.top }}>
      <PageHeader
        title={event.name}
        right={
          <Pressable
            onPress={() => setEditSheetVisible(true)}
            className="rounded-xl bg-gray-100 p-2 active:bg-gray-200 dark:bg-gray-700 dark:active:bg-gray-600"
          >
            <Pencil size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
          </Pressable>
        }
      />

      {/* Event info card */}
      <View className="mx-5 mb-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
        {event.period && (
          <Text className="text-sm text-gray-500 dark:text-gray-400">{event.period}</Text>
        )}
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          <View
            className={`rounded-full px-2 py-0.5 ${
              isActive ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {isActive ? "Active" : "Done"}
            </Text>
          </View>
          {fmtReminderSchedule(event) && (
            <View className="flex-row items-center gap-1">
              <Bell size={11} color={isDark ? "#fbbf24" : "#d97706"} />
              <Text className="text-xs text-amber-600 dark:text-amber-400">
                {fmtReminderSchedule(event)}
              </Text>
            </View>
          )}
        </View>
        {parseTags(event.tags).length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-1">
            {parseTags(event.tags).map((t) => (
              <View key={t} className="rounded-md bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">
                <Text className="text-[11px] text-gray-600 dark:text-gray-400">{t}</Text>
              </View>
            ))}
          </View>
        )}
        <Text className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          {contacts.length} contact{contacts.length === 1 ? "" : "s"}
        </Text>
        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={handleToggleStatus}
            className="flex-1 items-center rounded-xl bg-gray-200 py-3 active:bg-gray-300 dark:bg-gray-700 dark:active:bg-gray-600"
          >
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isActive ? "Mark Done" : "Reopen"}
            </Text>
          </Pressable>
          {contacts.length > 0 && (
            <Pressable
              onPress={handleBroadcast}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-3 active:bg-emerald-600"
            >
              <Megaphone size={16} color="#fff" />
              <Text className="text-sm font-semibold text-white">Broadcast</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Message */}
      <View className="mx-5 mb-4">
        <TemplateChips onSelect={(text) => setMessage(text)} />
        <MessageEditor
          value={message}
          onChangeText={setMessage}
          placeholder="Broadcast message..."
        />
      </View>

      {/* Add contact */}
      <View className="mx-5 mb-4 flex-row items-center gap-2">
        <Pressable
          onPress={() => setCountryPickerOpen(true)}
          className="rounded-xl bg-gray-100 px-3 py-3 active:bg-gray-200 dark:bg-gray-700 dark:active:bg-gray-600"
        >
          <Text className="text-base font-semibold text-gray-700 dark:text-gray-200">
            {selectedCountry.code}
          </Text>
        </Pressable>
        <TextInput
          value={newNumber}
          onChangeText={setNewNumber}
          placeholder="712 345 678"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          className="flex-1 rounded-xl bg-gray-50 px-4 py-3 text-base text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          maxLength={20}
          onSubmitEditing={handleAddContact}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAddContact}
          className="rounded-xl bg-emerald-500 p-3 active:bg-emerald-600"
          disabled={newNumber.replace(/\D/g, "").length < 9}
        >
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Contacts list */}
      <FlatList
        data={contacts}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyExtractor={(c) => `${c.countryCode}${c.phoneNumber}`}
        ListHeaderComponent={
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Contacts
          </Text>
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-base text-gray-400 dark:text-gray-500">
              No contacts match this event's tags
            </Text>
            <Text className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Add a contact above to tag them automatically
            </Text>
          </View>
        }
        renderItem={({ item: c }) => {
          const name = getContactName(c.phoneNumber);
          return (
            <Pressable
              onPress={() => {
                const digits = `${c.countryCode}${c.phoneNumber}`.replace(/\D/g, "");
                Linking.openURL(`whatsapp://send?phone=+${digits}`);
              }}
              className="mb-2 rounded-xl bg-gray-50 p-4 active:opacity-80 dark:bg-gray-800"
            >
              {name ? (
                <>
                  <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {name}
                  </Text>
                  <Text className="text-sm text-gray-400 dark:text-gray-500">
                    {c.countryCode} {formatPhone(c.phoneNumber)}
                  </Text>
                </>
              ) : (
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {c.countryCode} {formatPhone(c.phoneNumber)}
                </Text>
              )}
            </Pressable>
          );
        }}
      />

      <EventSheet
        visible={editSheetVisible}
        editEvent={event}
        onClose={() => setEditSheetVisible(false)}
        onSave={handleEditSaved}
      />

      <ConfirmSheet action={confirmAction} onClose={() => setConfirmAction(null)} />

      <CountryPickerSheet />
    </View>
  );
}
