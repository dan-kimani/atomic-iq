import { Column, ScrollView } from "@expo/ui";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { useAppStore } from "../store/useAppStore";
import { type BusinessEventData, useBusinessEventStore } from "../store/useBusinessEventStore";
import { prepareEventForm } from "../store/useEventFormStore";
import { AppButton } from "../ui/app-button";
import { AppIcon } from "../ui/app-icon";
import { BusinessEventRow } from "../ui/business-events/event-row";
import { EventSheet, type EventSavePayload } from "../ui/business-events/event-sheet";
import { ConfirmSheet, type ConfirmAction } from "../ui/confirm-sheet";
import { PageHeader } from "../ui/page-header";
import { Screen } from "../ui/screen";
import { EmptyState, SectionHeader } from "../ui/section-header";
import { useMetrics, useTheme } from "../ui/theme";

export default function BusinessEventsScreen() {
  const { colors } = useTheme();
  const { width, contentWidth, insets } = useMetrics();
  const events = useBusinessEventStore((state) => state.events);
  const selectedIds = useBusinessEventStore((state) => state.selectedIds);
  const selectionMode = useBusinessEventStore((state) => state.selectionMode);
  const loadEvents = useBusinessEventStore((state) => state.loadEvents);
  const toggleStatus = useBusinessEventStore((state) => state.toggleStatus);
  const createEvent = useBusinessEventStore((state) => state.createEvent);
  const updateEvent = useBusinessEventStore((state) => state.updateEvent);
  const updateEventReminder = useBusinessEventStore((state) => state.updateEventReminder);
  const toggleSelection = useBusinessEventStore((state) => state.toggleSelection);
  const clearSelection = useBusinessEventStore((state) => state.clearSelection);
  const setSelectionMode = useBusinessEventStore((state) => state.setSelectionMode);
  const createBroadcastFromSelection = useBusinessEventStore(
    (state) => state.createBroadcastFromSelection,
  );
  const getMergedContactCount = useBusinessEventStore((state) => state.getMergedContactCount);
  const checkDueReminders = useBusinessEventStore((state) => state.checkDueReminders);

  const customTags = useAppStore((state) => state.customTags);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<BusinessEventData | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
      checkDueReminders();
    }, [loadEvents, checkDueReminders]),
  );

  const activeEvents = events.filter((event) => event.status === "active");
  const doneEvents = events.filter((event) => event.status === "done");
  const mergedCount = selectionMode ? getMergedContactCount() : 0;

  const handleSheetSave = async (data: EventSavePayload) => {
    setSheetVisible(false);
    const tagsValue = data.tags.length > 0 ? data.tags.join(",") : null;

    if (editEvent) {
      updateEvent(editEvent.id, {
        name: data.name,
        period: data.period,
        tags: tagsValue,
      });
      await updateEventReminder(
        editEvent.id,
        data.reminderEnabled,
        data.reminderInterval,
        data.reminderTime,
        data.reminderDay,
      );
    } else {
      const id = createEvent(data.name, data.tags, data.period);
      loadEvents();
      if (data.reminderEnabled && data.reminderInterval) {
        await updateEventReminder(
          id,
          data.reminderEnabled,
          data.reminderInterval,
          data.reminderTime,
          data.reminderDay,
        );
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
        ? "It leaves the active list but its contacts stay available."
        : "It returns to the active list.",
      icon: <AppIcon name="check-circle" size={26} color={colors.accent} />,
      confirmLabel: isActive ? "Mark done" : "Reopen",
      destructive: false,
      onConfirm: () => {
        toggleStatus(event.id);
        loadEvents();
      },
    });
  };

  const handleBroadcast = () => {
    const broadcastId = createBroadcastFromSelection();
    if (broadcastId !== null) {
      setSelectionMode(false);
      router.push(`/broadcast/${broadcastId}`);
    }
  };

  return (
    <Screen
      header={
        <PageHeader
          title="Business Events"
          subtitle="Group contacts by interest — broadcast when ready."
          actions={[
            {
              name: "check",
              label: "Select",
              color: selectionMode ? colors.accent : colors.icon,
              background: selectionMode ? colors.accentSoft : colors.surfaceMuted,
              onPress: () => {
                if (selectionMode) clearSelection();
                else setSelectionMode(true);
              },
            },
            {
              name: "plus",
              label: "New event",
              background: colors.accent,
              color: colors.accentForeground,
              onPress: () => {
                prepareEventForm(null, customTags);
                setEditEvent(null);
                setSheetVisible(true);
              },
            },
          ]}
        />
      }
      overlays={
        <>
          {selectionMode && selectedIds.length > 0 ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: insets.bottom + 78,
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 10,
                backgroundColor: colors.background,
              }}
            >
              <AppButton
                label={`Send broadcast (${mergedCount} contact${mergedCount === 1 ? "" : "s"})`}
                icon="broadcast"
                width={contentWidth}
                height={52}
                disabled={mergedCount === 0}
                onPress={handleBroadcast}
              />
            </View>
          ) : null}
          <EventSheet
            visible={sheetVisible}
            editEvent={editEvent}
            onClose={() => {
              setSheetVisible(false);
              setEditEvent(null);
            }}
            onSave={handleSheetSave}
          />
          <ConfirmSheet action={confirmAction} onClose={() => setConfirmAction(null)} />
        </>
      }
    >
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
            paddingBottom: insets.bottom + (selectionMode ? 100 : 112),
          }}
        >
          {events.length === 0 ? (
            <EmptyState
              icon="events"
              title="No events yet"
              message="Create an event to group contacts by a shared interest or tag."
              width={contentWidth}
            />
          ) : (
            <>
              {activeEvents.length > 0 ? (
                <Column spacing={8} style={{ width: contentWidth }}>
                  <SectionHeader title="Active" width={contentWidth} />
                  {activeEvents.map((event) => (
                    <BusinessEventRow
                      key={event.id}
                      event={event}
                      width={contentWidth}
                      selectionMode={selectionMode}
                      selected={selectedIds.includes(event.id)}
                      onOpen={() => router.push(`/business-events/${event.id}`)}
                      onToggleSelection={() => toggleSelection(event.id)}
                      onToggleStatus={() => handleToggleStatus(event)}
                    />
                  ))}
                </Column>
              ) : null}
              {doneEvents.length > 0 ? (
                <Column spacing={8} style={{ width: contentWidth }}>
                  <SectionHeader title="Done" width={contentWidth} />
                  {doneEvents.map((event) => (
                    <BusinessEventRow
                      key={event.id}
                      event={event}
                      width={contentWidth}
                      selectionMode={selectionMode}
                      selected={selectedIds.includes(event.id)}
                      onOpen={() => router.push(`/business-events/${event.id}`)}
                      onToggleSelection={() => toggleSelection(event.id)}
                      onToggleStatus={() => handleToggleStatus(event)}
                    />
                  ))}
                </Column>
              ) : null}
            </>
          )}
        </Column>
      </ScrollView>
    </Screen>
  );
}
