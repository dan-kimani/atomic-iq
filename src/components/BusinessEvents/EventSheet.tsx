import {
  type BottomSheetMethods,
  BottomSheetModal,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Bell, BellRing, Check, Clock, Plus, Search, Tag, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppStore } from "../../store/useAppStore";
import { useIsDark } from "../../hooks/useIsDark";
import { type BusinessEventData } from "../../store/useBusinessEventStore";
import { useEventFormStore } from "../../store/useEventFormStore";
import { computeNextReminder } from "../../store/useBusinessEventStore";

// ── Constants ────────────────────────────────────────────────────────────────

const INTERVALS: { key: string; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "biweekly", label: "Biweekly" },
  { key: "monthly", label: "Monthly" },
];

const WEEKDAYS: { key: number; label: string }[] = [
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
  { key: 0, label: "Sun" },
];

const MONTH_DAYS = [1, 5, 10, 15, 20, 25];

// ── Helpers ──────────────────────────────────────────────────────────────────

function chipClasses(active: boolean) {
  return active
    ? "bg-emerald-600 border-emerald-600"
    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
}

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  return `${dh}:${m.toString().padStart(2, "0")} ${period}`;
}

function fmtNext(interval: string, h: number, m: number, day?: number | null): string {
  const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const d = computeNextReminder(interval, new Date(), timeStr, day);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = d.getDate();
  const suffix = ["th", "st", "nd", "rd"][date % 10 < 4 && Math.floor(date / 10) !== 1 ? date % 10 : 0];
  const hour = d.getHours();
  const min = d.getMinutes().toString().padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `Today at ${h12}:${min} ${ampm}`;
  if (diffDays === 1) return `Tomorrow at ${h12}:${min} ${ampm}`;
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${date}${suffix} at ${h12}:${min} ${ampm}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TagCreateRow({ isDark }: { isDark: boolean }) {
  const newTagName = useEventFormStore((s) => s.newTagName);
  const setNewTagName = useEventFormStore((s) => s.setNewTagName);
  const commitNewTag = useEventFormStore((s) => s.commitNewTag);
  const setIsAddingTag = useEventFormStore((s) => s.setIsAddingTag);

  return (
    <View className="flex-row items-center gap-1.5">
      <TextInput
        value={newTagName}
        onChangeText={setNewTagName}
        onSubmitEditing={commitNewTag}
        placeholder="New tag name"
        placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
        autoFocus
        className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-[13px] font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
      />
      <Pressable
        onPressIn={commitNewTag}
        className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 active:bg-indigo-600"
      >
        <Check size={14} color="#fff" strokeWidth={3} />
      </Pressable>
      <Pressable
        onPressIn={() => {
          setNewTagName("");
          setIsAddingTag(false);
        }}
        className="h-8 w-8 items-center justify-center rounded-lg bg-gray-300 active:bg-gray-400 dark:bg-gray-600"
      >
        <X size={14} color="#fff" strokeWidth={3} />
      </Pressable>
    </View>
  );
}

function TagPlusButton({ isDark }: { isDark: boolean }) {
  const setIsAddingTag = useEventFormStore((s) => s.setIsAddingTag);
  return (
    <Pressable
      onPressIn={() => setIsAddingTag(true)}
      className="h-9 w-9 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:active:bg-gray-700"
    >
      <Plus size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
    </Pressable>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

interface SavePayload {
  name: string;
  period: string | null;
  tags: string[];
  reminderEnabled: boolean;
  reminderInterval: string | null;
  reminderTime: string;
  reminderDay: number | null;
}

interface Props {
  visible: boolean;
  editEvent?: BusinessEventData | null;
  onClose: () => void;
  onSave: (data: SavePayload) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function EventSheet({ visible, editEvent, onClose, onSave }: Props) {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetMethods>(null);
  const nameRef = useRef<TextInput>(null);
  const timePickerValue = useRef(new Date());
  const customTags = useAppStore((s) => s.customTags);

  const store = useEventFormStore;

  useEffect(() => {
    if (visible) {
      if (editEvent) {
        store.getState().init(editEvent, customTags);
      } else {
        store.getState().reset(customTags);
      }
      sheetRef.current?.present();
      setTimeout(() => nameRef.current?.focus(), 350);
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, editEvent, customTags]);

  const name = store((s) => s.name);
  const period = store((s) => s.period);
  const tags = store((s) => s.tags);
  const allTags = store((s) => s.allTags);
  const tagSearch = store((s) => s.tagSearch);
  const isAddingTag = store((s) => s.isAddingTag);
  const reminderEnabled = store((s) => s.reminderEnabled);
  const reminderInterval = store((s) => s.reminderInterval);
  const reminderHour = store((s) => s.reminderHour);
  const reminderMinute = store((s) => s.reminderMinute);
  const reminderDay = store((s) => s.reminderDay);
  const timePickerOpen = store((s) => s.timePickerOpen);

  const isEditing = !!editEvent;
  const filteredTags = tagSearch.trim()
    ? allTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase().trim()))
    : allTags;
  const canSave = name.trim().length > 0;

  const dayOptions =
    reminderInterval === "monthly"
      ? MONTH_DAYS.map((d) => ({ key: d, label: String(d) }))
      : WEEKDAYS;

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        onDismiss={onClose}
        backgroundStyle={{ backgroundColor: isDark ? "#111827" : "#ffffff" }}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            gap: 18,
          }}
        >
          {/* Title */}
          <View className="gap-1">
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {isEditing ? "Edit Event" : "Create Event"}
            </Text>
            <Text className="text-sm leading-5 text-gray-500 dark:text-gray-400">
              Group contacts by business interest
            </Text>
          </View>

          {/* Name */}
          <TextInput
            ref={nameRef}
            value={name}
            onChangeText={store.getState().setName}
            placeholder="Event name…"
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            className="rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-3 text-[15px] leading-5.25 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
          />

          {/* Period */}
          <TextInput
            value={period}
            onChangeText={store.getState().setPeriod}
            placeholder="Period (optional)… e.g. July 2026"
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            className="rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-3 text-[15px] leading-5.25 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
          />

          {/* Tags */}
          {allTags.length > 0 ? (
            <>
              <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-100 px-3 dark:border-gray-700 dark:bg-gray-800">
                <Search size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  value={tagSearch}
                  onChangeText={store.getState().setTagSearch}
                  placeholder="Filter tags..."
                  placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  className="flex-1 px-2 py-2 text-[14px] text-gray-900 dark:text-gray-50"
                />
                {tagSearch.length > 0 && (
                  <Pressable onPressIn={() => store.getState().setTagSearch("")} hitSlop={8}>
                    <X size={14} color={isDark ? "#9ca3af" : "#6b7280"} strokeWidth={2.5} />
                  </Pressable>
                )}
              </View>
              <ScrollView
                style={{ maxHeight: 110 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="flex-row flex-wrap gap-2">
                  {filteredTags.map((tag) => {
                    const selected = tags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        onPressIn={() => store.getState().toggleTag(tag)}
                        className={`flex-row items-center gap-1 rounded-xl border px-3 py-2 ${
                          selected
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        }`}
                      >
                        <Tag size={12} color={selected ? "#fff" : "#9ca3af"} />
                        <Text className={`text-[13px] font-semibold ${selected ? "text-white" : "text-gray-900 dark:text-gray-50"}`}>{tag}</Text>
                      </Pressable>
                    );
                  })}
                  {filteredTags.length === 0 && (
                    <Text className="py-2 text-xs text-gray-400 dark:text-gray-500">No matching tags</Text>
                  )}
                </View>
              </ScrollView>
              {isAddingTag ? <TagCreateRow isDark={isDark} /> : <TagPlusButton isDark={isDark} />}
            </>
          ) : isAddingTag ? (
            <TagCreateRow isDark={isDark} />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-gray-400 dark:text-gray-500">No tags yet</Text>
              <TagPlusButton isDark={isDark} />
            </View>
          )}

          {/* Reminder */}
          <View className="gap-3">
            <Pressable
              onPressIn={() => store.getState().setReminderEnabled(!reminderEnabled)}
              className={`min-h-9.5 flex-row items-center justify-center gap-1.5 self-start rounded-xl border px-3 py-2.25 ${
                reminderEnabled
                  ? "border-amber-500 bg-amber-500"
                  : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              {reminderEnabled ? <BellRing size={14} color="#fff" /> : <Bell size={14} color={isDark ? "#9ca3af" : "#9ca3af"} />}
              <Text numberOfLines={1} className={`text-[13px] font-semibold ${reminderEnabled ? "text-white" : "text-gray-900 dark:text-gray-50"}`}>Remind me</Text>
            </Pressable>

            {reminderEnabled && (
              <>
                {/* Interval */}
                <View className="flex-row flex-wrap gap-2">
                  {INTERVALS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPressIn={() => store.getState().setReminderInterval(opt.key)}
                      className={`min-h-9.5 justify-center rounded-xl border px-3 py-2.25 ${chipClasses(reminderInterval === opt.key)}`}
                    >
                      <Text numberOfLines={1} className={`text-[13px] font-semibold ${reminderInterval === opt.key ? "text-white" : "text-gray-900 dark:text-gray-50"}`}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Day picker */}
                {reminderInterval && reminderInterval !== "daily" && (
                  <View className="flex-row flex-wrap gap-2">
                    {dayOptions.map((opt) => (
                      <Pressable
                        key={opt.key}
                        onPressIn={() => store.getState().setReminderDay(opt.key)}
                        className={`min-h-9.5 justify-center rounded-xl border px-3 py-2.25 ${chipClasses(reminderDay === opt.key)}`}
                      >
                        <Text numberOfLines={1} className={`text-[13px] font-semibold ${reminderDay === opt.key ? "text-white" : "text-gray-900 dark:text-gray-50"}`}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Time + preview */}
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPressIn={() => {
                      const d = new Date();
                      d.setHours(reminderHour, reminderMinute, 0, 0);
                      timePickerValue.current = d;
                      store.getState().setTimePickerOpen(true);
                    }}
                    className="flex-row items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Clock size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
                    <Text className="text-[13px] font-semibold text-gray-900 dark:text-gray-50">{fmtTime(reminderHour, reminderMinute)}</Text>
                  </Pressable>
                  {reminderInterval && (
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                      Next: {fmtNext(reminderInterval, reminderHour, reminderMinute, reminderDay)}
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <Pressable onPressIn={onClose} className="flex-1 items-center rounded-xl bg-gray-200 py-3 dark:bg-gray-700">
              <Text className="text-base font-semibold text-gray-600 dark:text-gray-300">Cancel</Text>
            </Pressable>
            <Pressable
              onPressIn={() => onSave(store.getState().buildSavePayload())}
              disabled={!canSave}
              className={`flex-1 items-center rounded-xl py-3 ${canSave ? "bg-emerald-600 active:bg-emerald-700" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              <Text className={`text-base font-semibold ${canSave ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                {isEditing ? "Update" : "Create"}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {timePickerOpen && (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          value={timePickerValue.current}
          accentColor="#059669"
          themeVariant={isDark ? "dark" : "light"}
          onValueChange={(_ev, date) => {
            store.getState().setReminderHour(date.getHours());
            store.getState().setReminderMinute(date.getMinutes());
            store.getState().setTimePickerOpen(false);
          }}
          onDismiss={() => store.getState().setTimePickerOpen(false)}
        />
      )}
    </>
  );
}

export type { Props as EventSheetProps };
