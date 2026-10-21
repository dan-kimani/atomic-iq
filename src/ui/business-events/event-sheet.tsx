import { BottomSheet, Column, Row, ScrollView, Spacer, Switch } from "@expo/ui";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { useRef } from "react";

import { type BusinessEventData, computeNextReminder } from "../../store/useBusinessEventStore";
import { useEventFormStore } from "../../store/useEventFormStore";
import { AppButton } from "../app-button";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { AppTextInput } from "../app-text-input";
import { IconButton } from "../icon-button";
import { radius, useMetrics, useTheme } from "../theme";

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

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  return `${dh}:${m.toString().padStart(2, "0")} ${period}`;
}

function fmtNext(interval: string, h: number, m: number, day?: number | null): string {
  const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const next = computeNextReminder(interval, new Date(), timeStr, day);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const date = next.getDate();
  const suffix = ["th", "st", "nd", "rd"][
    date % 10 < 4 && Math.floor(date / 10) !== 1 ? date % 10 : 0
  ];
  const hour = next.getHours();
  const minute = next.getMinutes().toString().padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  const diffDays = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `Today at ${h12}:${minute} ${ampm}`;
  if (diffDays === 1) return `Tomorrow at ${h12}:${minute} ${ampm}`;
  return `${days[next.getDay()]}, ${months[next.getMonth()]} ${date}${suffix} at ${h12}:${minute} ${ampm}`;
}

interface OptionChipProps {
  label: string;
  active: boolean;
  width: number;
  onPress: () => void;
}

function OptionChip({ label, active, width, onPress }: OptionChipProps) {
  const { colors } = useTheme();
  return (
    <Row
      alignment="center"
      onPress={onPress}
      style={{
        width,
        height: 38,
        backgroundColor: active ? colors.accent : colors.surfaceMuted,
        borderRadius: radius.small,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.border,
      }}
    >
      <Spacer flexible />
      <AppText variant="label" color={active ? colors.accentForeground : colors.text}>
        {label}
      </AppText>
      <Spacer flexible />
    </Row>
  );
}

export interface EventSavePayload {
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
  onSave: (data: EventSavePayload) => void;
}

export function EventSheet({ visible, editEvent, onClose, onSave }: Props) {
  const { colors, isDark } = useTheme();
  const { sheetWidth, height } = useMetrics();
  const timePickerValue = useRef(new Date());
  const store = useEventFormStore;
  const name = store((state) => state.name);
  const period = store((state) => state.period);
  const tags = store((state) => state.tags);
  const allTags = store((state) => state.allTags);
  const tagSearch = store((state) => state.tagSearch);
  const isAddingTag = store((state) => state.isAddingTag);
  const newTagName = store((state) => state.newTagName);
  const reminderEnabled = store((state) => state.reminderEnabled);
  const reminderInterval = store((state) => state.reminderInterval);
  const reminderHour = store((state) => state.reminderHour);
  const reminderMinute = store((state) => state.reminderMinute);
  const reminderDay = store((state) => state.reminderDay);
  const timePickerOpen = store((state) => state.timePickerOpen);

  const isEditing = !!editEvent;
  const filteredTags = tagSearch.trim()
    ? allTags.filter((tag) => tag.toLowerCase().includes(tagSearch.toLowerCase().trim()))
    : allTags;
  const canSave = name.trim().length > 0;
  const half = Math.floor((sheetWidth - 8) / 2);
  const dayOptions =
    reminderInterval === "monthly"
      ? MONTH_DAYS.map((day) => ({ key: day, label: String(day) }))
      : WEEKDAYS;

  return (
    <>
      <BottomSheet isPresented={visible} onDismiss={onClose} snapPoints={["half", "full"]}>
        <Column spacing={14} style={{ width: sheetWidth }}>
          <Row alignment="center" style={{ width: sheetWidth }}>
            <Column spacing={2} style={{ width: sheetWidth - 40 }}>
              <AppText variant="title">{isEditing ? "Edit event" : "Create event"}</AppText>
              <AppText variant="subheadline" color={colors.textSecondary}>
                Group contacts by business interest
              </AppText>
            </Column>
            <Spacer flexible />
            <IconButton name="close" size={16} background={colors.surfaceMuted} onPress={onClose} />
          </Row>

          <ScrollView
            direction="vertical"
            showsIndicators={false}
            style={{ width: sheetWidth, height: Math.max(360, height - 230) }}
          >
            <Column spacing={14} style={{ width: sheetWidth }}>
              <AppTextInput
                value={name}
                onChangeText={store.getState().setName}
                placeholder="Event name…"
                style={{ width: sheetWidth, height: 48 }}
                textStyle={{ fontSize: 16 }}
              />
              <AppTextInput
                value={period}
                onChangeText={store.getState().setPeriod}
                placeholder="Period (optional) — e.g. July 2026"
                style={{ width: sheetWidth, height: 48 }}
                textStyle={{ fontSize: 16 }}
              />

              <Column spacing={8} style={{ width: sheetWidth }}>
                <AppText variant="caption" color={colors.textTertiary}>
                  TAGS
                </AppText>
                {allTags.length > 0 ? (
                  <>
                    <AppTextInput
                      value={tagSearch}
                      onChangeText={store.getState().setTagSearch}
                      placeholder="Filter tags…"
                      autoCapitalize="none"
                      style={{ width: sheetWidth, height: 42 }}
                      textStyle={{ fontSize: 14 }}
                    />
                    <Column spacing={2} style={{ width: sheetWidth }}>
                      {filteredTags.map((tag) => {
                        const selected = tags.includes(tag);
                        return (
                          <Row
                            key={tag}
                            alignment="center"
                            spacing={8}
                            onPress={() => store.getState().toggleTag(tag)}
                            style={{
                              width: sheetWidth,
                              height: 38,
                              paddingHorizontal: 10,
                              borderRadius: 8,
                              backgroundColor: selected ? colors.tagSoft : colors.surfaceMuted,
                            }}
                          >
                            <AppText variant="callout" numberOfLines={1}>
                              {tag}
                            </AppText>
                            <Spacer flexible />
                            <AppIcon
                              name={selected ? "check-circle" : "circle"}
                              size={17}
                              color={selected ? colors.tag : colors.textTertiary}
                            />
                          </Row>
                        );
                      })}
                    </Column>
                  </>
                ) : null}

                {isAddingTag ? (
                  <Row spacing={8} alignment="center" style={{ width: sheetWidth }}>
                    <AppTextInput
                      value={newTagName}
                      onChangeText={store.getState().setNewTagName}
                      placeholder="New tag name"
                      autoFocus
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={store.getState().commitNewTag}
                      style={{ width: sheetWidth - 100, height: 42 }}
                      textStyle={{ fontSize: 14 }}
                    />
                    <IconButton
                      name="check"
                      size={16}
                      width={42}
                      height={42}
                      background={colors.accentSoft}
                      color={colors.accent}
                      onPress={store.getState().commitNewTag}
                    />
                    <IconButton
                      name="close"
                      size={16}
                      width={42}
                      height={42}
                      background={colors.surfaceMuted}
                      onPress={() => {
                        store.getState().setNewTagName("");
                        store.getState().setIsAddingTag(false);
                      }}
                    />
                  </Row>
                ) : (
                  <Row
                    alignment="center"
                    spacing={6}
                    onPress={() => store.getState().setIsAddingTag(true)}
                    style={{
                      width: 130,
                      height: 36,
                      paddingHorizontal: 10,
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: radius.small,
                    }}
                  >
                    <AppIcon name="plus" size={14} color={colors.textSecondary} />
                    <AppText variant="label" color={colors.textSecondary}>
                      New tag
                    </AppText>
                  </Row>
                )}
              </Column>

              <Column spacing={8} style={{ width: sheetWidth }}>
                <AppText variant="caption" color={colors.textTertiary}>
                  REMINDER
                </AppText>
                <Row
                  alignment="center"
                  spacing={10}
                  style={{
                    width: sheetWidth,
                    padding: 12,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: radius.small,
                  }}
                >
                  <AppIcon
                    name="bell"
                    size={17}
                    color={reminderEnabled ? colors.warning : colors.textTertiary}
                  />
                  <AppText variant="callout">Remind me on a schedule</AppText>
                  <Spacer flexible />
                  <Switch
                    value={reminderEnabled}
                    onValueChange={store.getState().setReminderEnabled}
                  />
                </Row>

                {reminderEnabled ? (
                  <>
                    <Row spacing={8} style={{ width: sheetWidth }}>
                      {INTERVALS.slice(0, 2).map((option) => (
                        <OptionChip
                          key={option.key}
                          label={option.label}
                          active={reminderInterval === option.key}
                          width={half}
                          onPress={() => store.getState().setReminderInterval(option.key)}
                        />
                      ))}
                    </Row>
                    <Row spacing={8} style={{ width: sheetWidth }}>
                      {INTERVALS.slice(2).map((option) => (
                        <OptionChip
                          key={option.key}
                          label={option.label}
                          active={reminderInterval === option.key}
                          width={half}
                          onPress={() => store.getState().setReminderInterval(option.key)}
                        />
                      ))}
                    </Row>

                    {reminderInterval && reminderInterval !== "daily" ? (
                      <Column spacing={8} style={{ width: sheetWidth }}>
                        {Array.from({ length: Math.ceil(dayOptions.length / 2) }).map(
                          (_value, rowIndex) => (
                            <Row
                              key={`day-row-${rowIndex}`}
                              spacing={8}
                              style={{ width: sheetWidth }}
                            >
                              {dayOptions.slice(rowIndex * 2, rowIndex * 2 + 2).map((option) => (
                                <OptionChip
                                  key={option.key}
                                  label={option.label}
                                  active={reminderDay === option.key}
                                  width={half}
                                  onPress={() => store.getState().setReminderDay(option.key)}
                                />
                              ))}
                            </Row>
                          ),
                        )}
                      </Column>
                    ) : null}

                    <Row alignment="center" spacing={10} style={{ width: sheetWidth }}>
                      <AppButton
                        label={fmtTime(reminderHour, reminderMinute)}
                        icon="clock"
                        variant="secondary"
                        height={42}
                        onPress={() => {
                          const date = new Date();
                          date.setHours(reminderHour, reminderMinute, 0, 0);
                          timePickerValue.current = date;
                          store.getState().setTimePickerOpen(true);
                        }}
                      />
                      {reminderInterval ? (
                        <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
                          {`Next: ${fmtNext(reminderInterval, reminderHour, reminderMinute, reminderDay)}`}
                        </AppText>
                      ) : null}
                    </Row>
                  </>
                ) : null}
              </Column>

              <Row spacing={10} style={{ width: sheetWidth, paddingTop: 4 }}>
                <AppButton
                  label="Cancel"
                  variant="secondary"
                  width={(sheetWidth - 10) / 2}
                  onPress={onClose}
                />
                <AppButton
                  label={isEditing ? "Update" : "Create"}
                  width={(sheetWidth - 10) / 2}
                  disabled={!canSave}
                  onPress={() => onSave(store.getState().buildSavePayload())}
                />
              </Row>
            </Column>
          </ScrollView>
        </Column>
      </BottomSheet>

      {timePickerOpen ? (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          value={timePickerValue.current}
          accentColor={colors.accent}
          themeVariant={isDark ? "dark" : "light"}
          onValueChange={(_event, date) => {
            store.getState().setReminderHour(date.getHours());
            store.getState().setReminderMinute(date.getMinutes());
            store.getState().setTimePickerOpen(false);
          }}
          onDismiss={() => store.getState().setTimePickerOpen(false)}
        />
      ) : null}
    </>
  );
}
