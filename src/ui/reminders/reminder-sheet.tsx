import { BottomSheet, Column, Row, ScrollView, Spacer, Switch } from "@expo/ui";
import DateTimePicker from "@expo/ui/community/datetime-picker";

import { PRESETS, type ReminderEditData, useReminderStore } from "../../store/useReminderStore";
import { AppButton } from "../app-button";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { AppTextInput } from "../app-text-input";
import { IconButton } from "../icon-button";
import { radius, useMetrics, useTheme } from "../theme";

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  return `${dh}:${m.toString().padStart(2, "0")} ${period}`;
}

interface PresetChipProps {
  label: string;
  active: boolean;
  width: number;
  onPress: () => void;
}

function PresetChip({ label, active, width, onPress }: PresetChipProps) {
  const { colors } = useTheme();
  return (
    <Row
      alignment="center"
      onPress={onPress}
      style={{
        width,
        height: 42,
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

interface Props {
  visible: boolean;
  phoneNumber: string;
  countryCode: string;
  contactName?: string;
  editReminder?: ReminderEditData | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function ReminderSheet({
  visible,
  phoneNumber,
  countryCode,
  contactName,
  editReminder,
  onClose,
  onSaved,
}: Props) {
  const { colors, isDark } = useTheme();
  const { sheetWidth, height } = useMetrics();
  const store = useReminderStore();
  const isEditing = !!editReminder;

  const isCustom = store.preset === PRESETS.length;
  const filteredTags = store.tagSearch.trim()
    ? store.existingTags.filter((tag) =>
        tag.toLowerCase().includes(store.tagSearch.toLowerCase().trim()),
      )
    : store.existingTags;

  const getTargetDate = (): Date | null => {
    if (store.preset === null) return null;
    if (isCustom) {
      if (!store.customDate || !store.customTime) return null;
      const date = new Date(store.customDate);
      date.setHours(store.customTime.h, store.customTime.m, 0, 0);
      return date;
    }
    const preset = PRESETS[store.preset];
    if (preset.kind === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(preset.hour, 0, 0, 0);
      return tomorrow;
    }
    return new Date(Date.now() + preset.ms);
  };

  const target = getTargetDate();
  const hasMessage = store.message.trim().length > 0;
  const canSave = target !== null && (isEditing || target.getTime() > Date.now()) && hasMessage;
  const half = Math.floor((sheetWidth - 8) / 2);

  let hint = "";
  if (!target) hint = "Choose when you want to be reminded.";
  else if (!hasMessage) hint = "Add the message you want to send.";
  else if (!isEditing && target.getTime() <= Date.now()) hint = "Pick a time in the future.";
  else if (target)
    hint = `${fmtDate(target)} at ${fmtTime(target.getHours(), target.getMinutes())}`;

  return (
    <>
      <BottomSheet
        isPresented={visible}
        onDismiss={() => {
          store.reset();
          onClose();
        }}
        snapPoints={["half", "full"]}
      >
        <Column spacing={14} style={{ width: sheetWidth }}>
          <Row alignment="center" style={{ width: sheetWidth }}>
            <Column spacing={2} style={{ width: sheetWidth - 40 }}>
              <AppText variant="title">{isEditing ? "Edit reminder" : "Set reminder"}</AppText>
              {contactName || phoneNumber ? (
                <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
                  {`Follow up with ${contactName || phoneNumber}`}
                </AppText>
              ) : null}
            </Column>
            <Spacer flexible />
            <IconButton
              name="close"
              size={16}
              background={colors.surfaceMuted}
              onPress={() => {
                store.reset();
                onClose();
              }}
            />
          </Row>

          <ScrollView
            direction="vertical"
            showsIndicators={false}
            style={{ width: sheetWidth, height: Math.max(360, height - 230) }}
          >
            <Column spacing={14} style={{ width: sheetWidth }}>
              <Column spacing={8} style={{ width: sheetWidth }}>
                <AppText variant="caption" color={colors.textTertiary}>
                  WHEN
                </AppText>
                <Row spacing={8} style={{ width: sheetWidth }}>
                  <PresetChip
                    label={PRESETS[0].label}
                    active={store.preset === 0}
                    width={half}
                    onPress={() => store.selectPreset(0)}
                  />
                  <PresetChip
                    label={PRESETS[1].label}
                    active={store.preset === 1}
                    width={half}
                    onPress={() => store.selectPreset(1)}
                  />
                </Row>
                <Row spacing={8} style={{ width: sheetWidth }}>
                  <PresetChip
                    label={PRESETS[2].label}
                    active={store.preset === 2}
                    width={half}
                    onPress={() => store.selectPreset(2)}
                  />
                  <PresetChip
                    label={PRESETS[3].label}
                    active={store.preset === 3}
                    width={half}
                    onPress={() => store.selectPreset(3)}
                  />
                </Row>
                <Row spacing={8} style={{ width: sheetWidth }}>
                  <PresetChip
                    label="Custom"
                    active={isCustom}
                    width={half}
                    onPress={() => store.selectPreset(PRESETS.length)}
                  />
                </Row>

                {isCustom ? (
                  <Row spacing={8} style={{ width: sheetWidth }}>
                    <AppButton
                      label={store.customDate ? fmtDate(store.customDate) : "Pick date"}
                      icon="calendar"
                      variant="secondary"
                      width={half}
                      height={42}
                      onPress={store.openDatePicker}
                    />
                    <AppButton
                      label={
                        store.customTime
                          ? fmtTime(store.customTime.h, store.customTime.m)
                          : "Pick time"
                      }
                      icon="clock"
                      variant="secondary"
                      width={half}
                      height={42}
                      disabled={!store.customDate}
                      onPress={store.openTimePicker}
                    />
                  </Row>
                ) : null}
              </Column>

              <Column spacing={8} style={{ width: sheetWidth }}>
                <AppText variant="caption" color={colors.textTertiary}>
                  OPTIONS
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
                    name="star"
                    size={17}
                    color={store.priority ? colors.warning : colors.textTertiary}
                  />
                  <AppText variant="callout">High priority</AppText>
                  <Spacer flexible />
                  <Switch
                    value={store.priority === 1}
                    onValueChange={() => store.togglePriority()}
                  />
                </Row>
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
                    name="sun"
                    size={17}
                    color={store.myDay ? colors.info : colors.textTertiary}
                  />
                  <AppText variant="callout">Show in My Day</AppText>
                  <Spacer flexible />
                  <Switch value={store.myDay === 1} onValueChange={() => store.toggleMyDay()} />
                </Row>
              </Column>

              <Column spacing={6} style={{ width: sheetWidth }}>
                <AppText variant="caption" color={colors.textTertiary}>
                  MESSAGE
                </AppText>
                <AppTextInput
                  value={store.message}
                  onChangeText={store.setMessage}
                  placeholder="Message…"
                  multiline
                  numberOfLines={3}
                  style={{ width: sheetWidth, height: 92, paddingTop: 12 }}
                  textStyle={{ fontSize: 15 }}
                />
              </Column>

              <Column spacing={6} style={{ width: sheetWidth }}>
                <AppText variant="caption" color={colors.textTertiary}>
                  TAGS
                </AppText>
                {store.existingTags.length > 0 ? (
                  <>
                    <AppTextInput
                      value={store.tagSearch}
                      onChangeText={store.setTagSearch}
                      placeholder="Filter tags…"
                      autoCapitalize="none"
                      style={{ width: sheetWidth, height: 42 }}
                      textStyle={{ fontSize: 14 }}
                    />
                    <Column spacing={2} style={{ width: sheetWidth }}>
                      {filteredTags.map((tag) => {
                        const selected = store.tags.includes(tag);
                        return (
                          <Row
                            key={tag}
                            alignment="center"
                            spacing={8}
                            onPress={() => store.toggleTag(tag)}
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
                      {filteredTags.length === 0 ? (
                        <AppText variant="subheadline" color={colors.textTertiary}>
                          No matching tags
                        </AppText>
                      ) : null}
                    </Column>
                  </>
                ) : (
                  <AppText variant="subheadline" color={colors.textTertiary}>
                    No tags yet — create them from the Reminders filter bar
                  </AppText>
                )}
              </Column>

              <Column spacing={4} style={{ width: sheetWidth }}>
                <AppText variant="subheadline" color={colors.textSecondary} align="center">
                  {hint}
                </AppText>
                <AppButton
                  label={isEditing ? "Update reminder" : "Save reminder"}
                  icon="bell"
                  width={sheetWidth}
                  height={50}
                  disabled={!canSave}
                  onPress={() =>
                    target &&
                    store.save({
                      target,
                      phoneNumber,
                      countryCode,
                      contactName,
                      editReminder,
                      onSaved,
                      onClose,
                    })
                  }
                />
              </Column>
            </Column>
          </ScrollView>
        </Column>
      </BottomSheet>

      {store.datePickerOpen ? (
        <DateTimePicker
          presentation="dialog"
          mode="date"
          value={store.customDate ?? new Date()}
          minimumDate={new Date()}
          accentColor={colors.accent}
          themeVariant={isDark ? "dark" : "light"}
          onValueChange={(_event, date) => store.setCustomDate(date)}
          onDismiss={store.closeDatePicker}
        />
      ) : null}
      {store.timePickerOpen ? (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          value={new Date()}
          accentColor={colors.accent}
          themeVariant={isDark ? "dark" : "light"}
          onValueChange={(_event, date) => store.setCustomTime(date.getHours(), date.getMinutes())}
          onDismiss={store.closeTimePicker}
        />
      ) : null}
    </>
  );
}
