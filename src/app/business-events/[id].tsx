import { Column, Row, ScrollView, Spacer } from "@expo/ui";
import * as Linking from "expo-linking";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";

import * as db from "../../db";
import { useAppStore } from "../../store/useAppStore";
import { useBusinessEventDetailStore } from "../../store/useBusinessEventDetailStore";
import { useBusinessEventStore } from "../../store/useBusinessEventStore";
import { prepareEventForm } from "../../store/useEventFormStore";
import { AppButton } from "../../ui/app-button";
import { AppIcon } from "../../ui/app-icon";
import { AppText } from "../../ui/app-text";
import { AppTextInput } from "../../ui/app-text-input";
import { EventSheet, type EventSavePayload } from "../../ui/business-events/event-sheet";
import { fmtReminderSchedule, formatEventPhone, parseTags } from "../../ui/business-events/format";
import { Card } from "../../ui/card";
import { ConfirmSheet, type ConfirmAction } from "../../ui/confirm-sheet";
import { IconButton } from "../../ui/icon-button";
import { MessageEditor } from "../../ui/message/message-editor";
import { TemplateChips } from "../../ui/message/template-chips";
import { PageHeader } from "../../ui/page-header";
import { Screen } from "../../ui/screen";
import { EmptyState, SectionHeader } from "../../ui/section-header";
import { radius, useMetrics, useTheme } from "../../ui/theme";

export default function BusinessEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = parseInt(id, 10);
  const { colors } = useTheme();
  const { width, contentWidth, insets } = useMetrics();
  const contactNames = useAppStore((state) => state.contactNames);
  const selectedCountry = useAppStore((state) => state.selectedCountry);
  const setCountryPickerOpen = useAppStore((state) => state.setCountryPickerOpen);
  const loadTemplates = useAppStore((state) => state.loadTemplates);
  const customTags = useAppStore((state) => state.customTags);

  const event = useBusinessEventDetailStore((state) => state.event);
  const contacts = useBusinessEventDetailStore((state) => state.contacts);
  const message = useBusinessEventDetailStore((state) => state.message);
  const loaded = useBusinessEventDetailStore((state) => state.loaded);
  const loadDetail = useBusinessEventDetailStore((state) => state.loadDetail);
  const setMessage = useBusinessEventDetailStore((state) => state.setMessage);
  const addContact = useBusinessEventDetailStore((state) => state.addContact);
  const toggleEventStatus = useBusinessEventDetailStore((state) => state.toggleEventStatus);

  const loadEvents = useBusinessEventStore((state) => state.loadEvents);
  const updateEvent = useBusinessEventStore((state) => state.updateEvent);
  const updateEventReminder = useBusinessEventStore((state) => state.updateEventReminder);
  const deleteEvent = useBusinessEventStore((state) => state.deleteEvent);

  const [newNumber, setNewNumber] = useState("");
  const [editVisible, setEditVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDetail(eventId);
      loadTemplates();
    }, [eventId, loadDetail, loadTemplates]),
  );

  if (!loaded || !event) return null;

  const isActive = event.status === "active";
  const reminder = fmtReminderSchedule(event);
  const tags = parseTags(event.tags);
  const innerWidth = contentWidth - 32;
  const inputWidth = Math.max(100, contentWidth - 64 - 46 - 16);

  const handleBroadcast = () => {
    if (contacts.length === 0) return;
    const broadcastId = db.createBroadcast(message);
    for (const contact of contacts) {
      db.addBroadcastContact(broadcastId, contact.phoneNumber, contact.countryCode);
    }
    router.push(`/broadcast/${broadcastId}`);
  };

  const handleToggleStatus = () => {
    setConfirmAction({
      title: isActive ? "Mark event as done?" : "Reopen event?",
      description: isActive
        ? "Its contacts remain available for future broadcasts."
        : "This event will appear in the active list again.",
      icon: <AppIcon name="check-circle" size={26} color={colors.accent} />,
      confirmLabel: isActive ? "Mark done" : "Reopen",
      destructive: false,
      onConfirm: () => {
        toggleEventStatus(eventId);
        loadEvents();
      },
    });
  };

  const handleDelete = () => {
    setConfirmAction({
      title: "Delete event?",
      description: "The event is removed. Contacts and their tags stay in recents.",
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteEvent(eventId);
        loadEvents();
        router.back();
      },
    });
  };

  const handleSheetSave = async (data: EventSavePayload) => {
    setEditVisible(false);
    const tagsValue = data.tags.length > 0 ? data.tags.join(",") : null;
    updateEvent(eventId, { name: data.name, period: data.period, tags: tagsValue });
    loadEvents();
    await updateEventReminder(
      eventId,
      data.reminderEnabled,
      data.reminderInterval,
      data.reminderTime,
      data.reminderDay,
    );
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
    <Screen
      header={
        <PageHeader
          title={event.name}
          subtitle={event.period ?? undefined}
          actions={[
            {
              name: "edit",
              label: "Edit event",
              onPress: () => {
                prepareEventForm(event, customTags);
                setEditVisible(true);
              },
            },
            {
              name: "trash",
              label: "Delete event",
              color: colors.danger,
              onPress: handleDelete,
            },
          ]}
        />
      }
      overlays={
        <>
          <EventSheet
            visible={editVisible}
            editEvent={event}
            onClose={() => setEditVisible(false)}
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
            paddingBottom: insets.bottom + 112,
          }}
        >
          <Card width={contentWidth} padding={16} gap={10}>
            <Row alignment="center" spacing={8} style={{ width: innerWidth }}>
              <Row
                alignment="center"
                style={{
                  height: 26,
                  paddingHorizontal: 10,
                  borderRadius: radius.pill,
                  backgroundColor: isActive ? colors.accentSoft : colors.surfaceMuted,
                }}
              >
                <AppText
                  variant="caption"
                  color={isActive ? colors.accentSoftText : colors.textSecondary}
                >
                  {isActive ? "Active" : "Done"}
                </AppText>
              </Row>
              <Spacer flexible />
              <AppText variant="caption" color={colors.textTertiary}>
                {`${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
              </AppText>
            </Row>
            {reminder ? (
              <Row alignment="center" spacing={5}>
                <AppIcon name="bell" size={12} color={colors.warning} />
                <AppText variant="subheadline" color={colors.warningSoftText}>
                  {reminder}
                </AppText>
              </Row>
            ) : null}
            {tags.length > 0 ? (
              <AppText variant="caption" color={colors.tagSoftText}>
                {tags.map((tag) => `#${tag}`).join("  ")}
              </AppText>
            ) : null}
            <Row spacing={10} style={{ width: innerWidth }}>
              <AppButton
                label={isActive ? "Mark done" : "Reopen"}
                variant="secondary"
                width={(innerWidth - 10) / 2}
                height={46}
                onPress={handleToggleStatus}
              />
              <AppButton
                label="Broadcast"
                icon="broadcast"
                width={(innerWidth - 10) / 2}
                height={46}
                disabled={contacts.length === 0}
                onPress={handleBroadcast}
              />
            </Row>
          </Card>

          <Card width={contentWidth} padding={16} gap={10}>
            <SectionHeader title="Message" width={innerWidth} />
            <TemplateChips onSelect={setMessage} />
            <MessageEditor
              value={message}
              onChangeText={setMessage}
              placeholder="Broadcast message…"
              width={innerWidth}
            />
          </Card>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Add contact" width={contentWidth} />
            <Row alignment="center" spacing={8} style={{ width: contentWidth }}>
              <Row
                alignment="center"
                onPress={() => setCountryPickerOpen(true)}
                style={{
                  width: 64,
                  height: 48,
                  borderRadius: radius.small,
                  backgroundColor: colors.surfaceMuted,
                }}
              >
                <Spacer flexible />
                <AppText variant="label">{selectedCountry.code}</AppText>
                <Spacer flexible />
              </Row>
              <AppTextInput
                value={newNumber}
                onChangeText={setNewNumber}
                placeholder="712 345 678"
                keyboardType="phone-pad"
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleAddContact}
                style={{ width: inputWidth, height: 48 }}
                textStyle={{ fontSize: 16 }}
              />
              <IconButton
                name="plus"
                size={18}
                width={46}
                height={48}
                background={colors.accent}
                color={colors.accentForeground}
                disabled={newNumber.replace(/\D/g, "").length < 9}
                onPress={handleAddContact}
              />
            </Row>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader
              title="Contacts"
              width={contentWidth}
              subtitle="Numbers tagged with this event’s interests"
            />
            {contacts.length === 0 ? (
              <EmptyState
                icon="events"
                title="No matching contacts"
                message="Add a contact above to tag them automatically."
                width={contentWidth}
              />
            ) : (
              contacts.map((contact) => {
                const name = getContactName(contact.phoneNumber);
                return (
                  <Card
                    key={`${contact.countryCode}${contact.phoneNumber}`}
                    width={contentWidth}
                    padding={12}
                    gap={0}
                    onPress={() => {
                      const digits = `${contact.countryCode}${contact.phoneNumber}`.replace(
                        /\D/g,
                        "",
                      );
                      Linking.openURL(`whatsapp://send?phone=+${digits}`);
                    }}
                  >
                    <Row alignment="center" spacing={8} style={{ width: innerWidth }}>
                      <Column spacing={2} style={{ width: innerWidth - 40 }}>
                        {name ? (
                          <>
                            <AppText variant="bodyStrong" numberOfLines={1}>
                              {name}
                            </AppText>
                            <AppText
                              variant="subheadline"
                              color={colors.textSecondary}
                              numberOfLines={1}
                            >
                              {`${contact.countryCode} ${formatEventPhone(contact.phoneNumber)}`}
                            </AppText>
                          </>
                        ) : (
                          <AppText variant="bodyStrong" numberOfLines={1}>
                            {`${contact.countryCode} ${formatEventPhone(contact.phoneNumber)}`}
                          </AppText>
                        )}
                      </Column>
                      <Spacer flexible />
                      <AppIcon name="chevron-right" size={16} color={colors.textTertiary} />
                    </Row>
                  </Card>
                );
              })
            )}
          </Column>
        </Column>
      </ScrollView>
    </Screen>
  );
}
