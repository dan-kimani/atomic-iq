import { Column, Row, ScrollView, Spacer } from "@expo/ui";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useAppStore } from "../store/useAppStore";
import { useRemindersPageStore } from "../store/useRemindersPageStore";
import { prepareReminderForm, type ReminderEditData } from "../store/useReminderStore";
import { ActionSheet, type SheetAction } from "../ui/action-sheet";
import { AppText } from "../ui/app-text";
import { ConfirmSheet, type ConfirmAction } from "../ui/confirm-sheet";
import { PageHeader } from "../ui/page-header";
import { CalendarView } from "../ui/reminders/calendar-view";
import { FilterBar } from "../ui/reminders/filter-bar";
import { ReminderRow, type ReminderData } from "../ui/reminders/reminder-row";
import { ReminderSheet } from "../ui/reminders/reminder-sheet";
import { TagPickerSheet } from "../ui/reminders/tag-picker-sheet";
import { Screen } from "../ui/screen";
import { EmptyState, SectionHeader } from "../ui/section-header";
import { useMetrics, useTheme } from "../ui/theme";

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { width, contentWidth, insets } = useMetrics();
  const store = useRemindersPageStore();
  const customTags = useAppStore((state) => state.customTags);
  const addCustomTag = useAppStore((state) => state.addCustomTag);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useFocusEffect(
    useCallback(() => {
      store.load();
    }, [store.load]),
  );

  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayReminders = store.reminders.filter((reminder) => {
    if (reminder.myDay === 1) return true;
    const time = reminder.scheduledAt;
    return time >= todayStart.getTime() && time <= todayEnd.getTime();
  });
  const priorityReminders = store.reminders.filter((reminder) => reminder.priority === 1);

  const allTags: string[] = (() => {
    const tagSet = new Set<string>();
    for (const reminder of store.reminders) {
      if (reminder.tags) {
        reminder.tags.split(",").forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    }
    for (const tag of customTags) tagSet.add(tag);
    return [...tagSet].sort();
  })();

  const tagCounts: Record<string, number> = {};
  for (const tag of allTags) {
    tagCounts[tag] = store.reminders.filter(
      (reminder) => reminder.tags && reminder.tags.split(",").some((item) => item.trim() === tag),
    ).length;
  }

  const filtered =
    store.filter === "all"
      ? store.reminders
      : store.filter === "today"
        ? todayReminders
        : store.filter === "priority"
          ? priorityReminders
          : store.reminders.filter((reminder) => {
              if (!reminder.tags) return false;
              return reminder.tags.split(",").some((tag) => tag.trim() === store.filter);
            });

  const upcoming = filtered.filter((reminder) => !reminder.completed && reminder.scheduledAt > now);
  const overdue = filtered.filter((reminder) => !reminder.completed && reminder.scheduledAt <= now);
  const done = filtered.filter((reminder) => reminder.completed);

  const dateMatches = (reminder: ReminderData) =>
    isoDate(new Date(reminder.scheduledAt)) === store.selectedDate;
  const selectedDateReminders = store.selectedDate ? store.reminders.filter(dateMatches) : [];
  const selectedDateActive = selectedDateReminders.filter((reminder) => !reminder.completed);
  const selectedDateDone = selectedDateReminders.filter((reminder) => reminder.completed);

  const menuReminder = useMemo(
    () => store.reminders.find((reminder) => reminder.id === store.menuReminderId) ?? null,
    [store.reminders, store.menuReminderId],
  );

  const openReminderEditor = (reminder: ReminderData) => {
    prepareReminderForm(reminder as ReminderEditData, customTags);
    store.openEdit(reminder as ReminderEditData);
  };

  const requestDelete = (id: number) => {
    setConfirmAction({
      title: "Delete reminder?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: () => store.deleteReminder(id),
    });
  };

  const requestDeleteTag = (tag: string) => {
    setConfirmAction({
      title: `Delete tag “${tag}”?`,
      description: "This removes the tag from every reminder that uses it.",
      confirmLabel: "Delete",
      onConfirm: () => store.deleteTag(tag),
    });
  };

  const menuActions: SheetAction[] = menuReminder
    ? [
        {
          label: "Open WhatsApp",
          icon: "whatsapp",
          onPress: () => store.openWhatsApp(menuReminder),
        },
        ...(store.menuMode === "active"
          ? [
              {
                label: "Edit reminder",
                icon: "edit" as const,
                onPress: () => openReminderEditor(menuReminder),
              },
              {
                label: "Mark complete",
                icon: "check" as const,
                onPress: () => store.completeReminder(menuReminder.id),
              },
            ]
          : [
              {
                label: "Reopen reminder",
                icon: "refresh" as const,
                onPress: () => store.reopenReminder(menuReminder.id),
              },
              {
                label: "Reschedule",
                icon: "edit" as const,
                onPress: () => openReminderEditor(menuReminder),
              },
            ]),
        {
          label: "Delete reminder",
          icon: "trash",
          destructive: true,
          onPress: () => requestDelete(menuReminder.id),
        },
      ]
    : [];

  const renderSection = (title: string, reminders: ReminderData[], color?: string) => {
    if (reminders.length === 0) return null;
    return (
      <Column spacing={8} style={{ width: contentWidth }}>
        <SectionHeader title={title} width={contentWidth} color={color} />
        {reminders.map((reminder) => (
          <ReminderRow
            key={reminder.id}
            reminder={reminder}
            width={contentWidth}
            isOverdue={!reminder.completed && reminder.scheduledAt <= now}
            isCompleted={reminder.completed === 1}
            onMenu={() => store.openMenu(reminder.id, reminder.completed ? "completed" : "active")}
          />
        ))}
      </Column>
    );
  };

  return (
    <Screen
      header={
        <PageHeader
          title="Reminders"
          subtitle={`${store.reminders.length} total · ${overdue.length} overdue`}
          actions={[
            {
              name: store.viewMode === "list" ? "calendar" : "list",
              label: "Toggle view",
              onPress: () => store.setViewMode(store.viewMode === "list" ? "calendar" : "list"),
            },
          ]}
        />
      }
      overlays={
        <>
          <ActionSheet
            visible={menuReminder !== null}
            onClose={store.closeMenu}
            title={menuReminder ? "Reminder" : undefined}
            subtitle={
              menuReminder ? `${menuReminder.countryCode} ${menuReminder.phoneNumber}` : undefined
            }
            actions={menuActions}
          />
          <TagPickerSheet
            visible={store.tagPickerOpen}
            tags={allTags}
            tagCounts={tagCounts}
            onSelect={(tag) => {
              store.setFilter(tag);
              store.closeTagPicker();
            }}
            onDelete={(tag) => {
              store.closeTagPicker();
              requestDeleteTag(tag);
            }}
            onCreate={addCustomTag}
            onClose={store.closeTagPicker}
          />
          <ReminderSheet
            visible={store.editVisible}
            phoneNumber={store.editReminder?.phoneNumber || ""}
            countryCode={store.editReminder?.countryCode || ""}
            editReminder={store.editReminder}
            onClose={store.closeEdit}
            onSaved={() => {
              store.load();
              store.closeEdit();
            }}
          />
          <ConfirmSheet action={confirmAction} onClose={() => setConfirmAction(null)} />
        </>
      }
    >
      {store.viewMode === "list" ? (
        <ScrollView
          direction="vertical"
          showsIndicators={false}
          style={{ width, paddingHorizontal: 16 }}
        >
          <Column
            spacing={16}
            style={{
              width: contentWidth,
              paddingTop: insets.top + 84,
              paddingBottom: insets.bottom + 112,
            }}
          >
            <FilterBar
              filter={store.filter}
              todayCount={todayReminders.length}
              priorityCount={priorityReminders.length}
              allTags={allTags}
              onFilterChange={store.setFilter}
              onTagPickerOpen={store.openTagPicker}
            />
            {filtered.length === 0 ? (
              <EmptyState
                icon="bell"
                title={store.reminders.length === 0 ? "No reminders yet" : "Nothing here"}
                message={
                  store.reminders.length === 0
                    ? "Open a recent contact’s menu and choose “Set reminder”."
                    : "No reminders match this filter."
                }
                width={contentWidth}
              />
            ) : (
              <>
                {renderSection("Overdue", overdue, colors.danger)}
                {renderSection("Upcoming", upcoming)}
                {renderSection("Completed", done)}
              </>
            )}
          </Column>
        </ScrollView>
      ) : (
        <ScrollView
          direction="vertical"
          showsIndicators={false}
          style={{ width, paddingHorizontal: 16 }}
        >
          <Column
            spacing={16}
            style={{
              width: contentWidth,
              paddingTop: insets.top + 84,
              paddingBottom: insets.bottom + 112,
            }}
          >
            <CalendarView
              reminders={store.reminders}
              selectedDate={store.selectedDate}
              onSelectDate={store.setSelectedDate}
              width={contentWidth}
            />
            {store.selectedDate ? (
              <Column spacing={8} style={{ width: contentWidth }}>
                <Row alignment="center" style={{ width: contentWidth }}>
                  <AppText variant="caption" color={colors.textTertiary}>
                    {new Date(`${store.selectedDate}T00:00:00`)
                      .toLocaleDateString("en", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                      .toUpperCase()}
                  </AppText>
                  <Spacer flexible />
                  <AppText variant="caption" color={colors.textTertiary}>
                    {`${selectedDateReminders.length} reminder${
                      selectedDateReminders.length === 1 ? "" : "s"
                    }`}
                  </AppText>
                </Row>
                {selectedDateReminders.length === 0 ? (
                  <EmptyState
                    icon="calendar"
                    title="No reminders"
                    message="Nothing scheduled for this date."
                    width={contentWidth}
                  />
                ) : (
                  <>
                    {selectedDateActive.map((reminder) => (
                      <ReminderRow
                        key={reminder.id}
                        reminder={reminder}
                        width={contentWidth}
                        isOverdue={reminder.scheduledAt <= Date.now()}
                        onMenu={() => store.openMenu(reminder.id, "active")}
                      />
                    ))}
                    {selectedDateDone.map((reminder) => (
                      <ReminderRow
                        key={reminder.id}
                        reminder={reminder}
                        width={contentWidth}
                        isOverdue={false}
                        isCompleted
                        onMenu={() => store.openMenu(reminder.id, "completed")}
                      />
                    ))}
                  </>
                )}
              </Column>
            ) : (
              <EmptyState
                icon="calendar"
                title="Pick a date"
                message="Select a day to see its reminders."
                width={contentWidth}
              />
            )}
          </Column>
        </ScrollView>
      )}
    </Screen>
  );
}
