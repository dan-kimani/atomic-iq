import { router, useFocusEffect } from "expo-router";
import {
  Bell,
  CheckCheck,
  CheckSquare,
  ClipboardList,
  Plus,
  SendHorizontal,
  Tag,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ConfirmSheet, { type ConfirmAction } from "../components/ConfirmSheet";
import EventSheet from "../components/BusinessEvents/EventSheet";
import PageHeader from "../components/ui/PageHeader";
import { useIsDark } from "../hooks/useIsDark";
import {
  type BusinessEventData,
  useBusinessEventStore,
} from "../store/useBusinessEventStore";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
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

  const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (interval === "weekly" || interval === "biweekly") {
    const day = event.reminderDay != null ? WEEKDAY_LABELS[event.reminderDay] : null;
    return day ? `${label} on ${day} at ${timeStr}` : `${label} at ${timeStr}`;
  }
  if (interval === "monthly") {
    const day = event.reminderDay != null ? `${event.reminderDay}th` : null;
    return day ? `${label} on ${day} at ${timeStr}` : `${label} at ${timeStr}`;
  }
  return `${label} at ${timeStr}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessEventsPage() {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const events = useBusinessEventStore((s) => s.events);
  const selectedIds = useBusinessEventStore((s) => s.selectedIds);
  const selectionMode = useBusinessEventStore((s) => s.selectionMode);
  const loadEvents = useBusinessEventStore((s) => s.loadEvents);
  const toggleStatus = useBusinessEventStore((s) => s.toggleStatus);
  const createEvent = useBusinessEventStore((s) => s.createEvent);
  const updateEvent = useBusinessEventStore((s) => s.updateEvent);
  const updateEventReminder = useBusinessEventStore((s) => s.updateEventReminder);
  const toggleSelection = useBusinessEventStore((s) => s.toggleSelection);
  const clearSelection = useBusinessEventStore((s) => s.clearSelection);
  const setSelectionMode = useBusinessEventStore((s) => s.setSelectionMode);
  const createBroadcastFromSelection = useBusinessEventStore(
    (s) => s.createBroadcastFromSelection,
  );
  const getMergedContactCount = useBusinessEventStore((s) => s.getMergedContactCount);
  const checkDueReminders = useBusinessEventStore((s) => s.checkDueReminders);

  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<BusinessEventData | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
      checkDueReminders();
    }, [loadEvents, checkDueReminders]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  const activeEvents = events.filter((e) => e.status === "active");
  const doneEvents = events.filter((e) => e.status === "done");

  const mergedCount = selectionMode ? getMergedContactCount() : 0;

  const handleCreate = () => {
    setEditEvent(null);
    setSheetVisible(true);
  };

  const handleSheetClose = () => {
    setSheetVisible(false);
    setEditEvent(null);
  };

  const handleSheetSave = (data: {
    name: string;
    period: string | null;
    tags: string[];
    reminderEnabled: boolean;
    reminderInterval: string | null;
    reminderTime: string;
    reminderDay: number | null;
  }) => {
    setSheetVisible(false);

    if (editEvent) {
      // Update existing
      const tagsValue = data.tags.length > 0 ? data.tags.join(",") : null;
      updateEvent(editEvent.id, {
        name: data.name,
        period: data.period,
        tags: tagsValue,
      });
      // Handle reminder changes asynchronously
      updateEventReminder(editEvent.id, data.reminderEnabled, data.reminderInterval, data.reminderTime, data.reminderDay);
    } else {
      // Create new
      const id = createEvent(data.name, data.tags, data.period);
      // Enable reminder if configured
      if (data.reminderEnabled && data.reminderInterval) {
        updateEventReminder(id, data.reminderEnabled, data.reminderInterval, data.reminderTime, data.reminderDay);
      }
    }

    setEditEvent(null);
    loadEvents();
  };

  const handleToggleStatus = (event: BusinessEventData) => {
    const isActive = event.status === "active";
    setConfirmAction({
      title: isActive ? "Mark event as done?" : "Reopen event?",
      description: isActive
        ? "This event won't appear in the active section."
        : "This event will appear in active again.",
      icon: <CheckCheck size={28} color={isDark ? "#6ee7b7" : "#059669"} />,
      confirmLabel: isActive ? "Mark Done" : "Reopen",
      destructive: false,
      onConfirm: () => {
        toggleStatus(event.id);
        loadEvents();
      },
    });
  };

  const handleSendBroadcast = () => {
    const broadcastId = createBroadcastFromSelection();
    if (broadcastId !== null) {
      setSelectionMode(false);
      router.push(`/broadcast/${broadcastId}`);
    }
  };

  const renderEventRow = (event: BusinessEventData) => {
    const tagList = parseTags(event.tags);
    const visibleTags = tagList.slice(0, 3);
    const moreCount = tagList.length - 3;
    const selected = selectedIds.includes(event.id);

    return (
      <Pressable
        key={event.id}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(event.id);
          } else {
            router.push(`/business-events/${event.id}`);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(event.id);
          }
        }}
        className="mb-3 rounded-xl bg-gray-50 p-4 active:opacity-80 dark:bg-gray-800"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            {/* Top row: Name + status + icons */}
            <View className="flex-row items-center gap-2">
              {selectionMode && (
                <View
                  className={`h-5 w-5 items-center justify-center rounded-md border-2 ${
                    selected
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {selected && <CheckCheck size={12} color="#fff" />}
                </View>
              )}
              <Text
                className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100"
                numberOfLines={1}
              >
                {event.name}
              </Text>
              {/* Status badge */}
              <Pressable
                onPress={() => handleToggleStatus(event)}
                className={`rounded-full px-2 py-1 ${
                  event.status === "active"
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    event.status === "active"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {event.status === "active" ? "Active" : "Done"}
                </Text>
              </Pressable>
            </View>

            {/* Period */}
            {event.period && (
              <Text className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {event.period}
              </Text>
            )}

            {/* Reminder schedule */}
            {fmtReminderSchedule(event) && (
              <View className="mt-0.5 flex-row items-center gap-1">
                <Bell size={11} color={isDark ? "#fbbf24" : "#d97706"} />
                <Text className="text-xs text-amber-600 dark:text-amber-400">
                  {fmtReminderSchedule(event)}
                </Text>
              </View>
            )}

            {/* Tags */}
            {tagList.length > 0 && (
              <View className="mt-2 flex-row flex-wrap gap-1">
                {visibleTags.map((t) => (
                  <View
                    key={t}
                    className="flex-row items-center gap-0.5 rounded-md bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700"
                  >
                    <Tag size={10} color={isDark ? "#9ca3af" : "#6b7280"} />
                    <Text className="text-[11px] text-gray-600 dark:text-gray-400">{t}</Text>
                  </View>
                ))}
                {moreCount > 0 && (
                  <Text className="text-[11px] text-gray-400 dark:text-gray-500">
                    +{moreCount} more
                  </Text>
                )}
              </View>
            )}

            {/* Contact count */}
            <Text className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              {event.contactCount} contact{event.contactCount === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-950" style={{ paddingTop: insets.top }}>
      <PageHeader
        title="Business Events"
        subtitle="Group contacts by interest — broadcast when you're ready."
        right={
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                if (selectionMode) {
                  clearSelection();
                } else {
                  setSelectionMode(true);
                }
              }}
              className="rounded-xl bg-gray-100 p-2 active:bg-gray-200 dark:bg-gray-700 dark:active:bg-gray-600"
            >
              <CheckSquare size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </Pressable>
            <Pressable
              onPress={handleCreate}
              className="rounded-xl bg-emerald-500 p-2 active:bg-emerald-600"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>
        }
      />

      <FlatList
        data={[]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyExtractor={() => "dummy"}
        ListHeaderComponent={
          <View>
            {/* Active section */}
            {activeEvents.length > 0 && (
              <View className="mb-4">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Active
                </Text>
                {activeEvents.map(renderEventRow)}
              </View>
            )}

            {/* Done section */}
            {doneEvents.length > 0 && (
              <View>
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Done
                </Text>
                {doneEvents.map(renderEventRow)}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <ClipboardList size={48} color="#9ca3af" />
            <Text className="mt-4 text-center text-base text-gray-400 dark:text-gray-500">
              No events yet{"\n"}Tap + to create one
            </Text>
          </View>
        }
        renderItem={() => null}
      />

      {/* Selection footer */}
      {selectionMode && selectedIds.length > 0 && (
        <View
          className="absolute right-0 bottom-0 left-0 bg-white px-5 py-4 dark:bg-gray-950"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <Pressable
            onPress={handleSendBroadcast}
            disabled={mergedCount === 0}
            className={`flex-row items-center justify-center rounded-xl py-4 ${
              mergedCount > 0
                ? "bg-emerald-500 active:bg-emerald-600"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <SendHorizontal size={18} color={mergedCount > 0 ? "#fff" : "#9ca3af"} />
            <Text
              className={`ml-2 text-base font-semibold ${
                mergedCount > 0 ? "text-white" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              Send Broadcast ({mergedCount} contact{mergedCount === 1 ? "" : "s"})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Create/Edit sheet */}
      <EventSheet
        visible={sheetVisible}
        editEvent={editEvent}
        onClose={handleSheetClose}
        onSave={handleSheetSave}
      />

      {/* Confirm sheet */}
      <ConfirmSheet action={confirmAction} onClose={() => setConfirmAction(null)} />
    </View>
  );
}
