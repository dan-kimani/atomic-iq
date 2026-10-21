import { Column, Row, ScrollView, Spacer } from "@expo/ui";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { formatPhoneNumber, useAppStore } from "../../store/useAppStore";
import { useBroadcastStore } from "../../store/useBroadcastStore";
import { AppButton } from "../../ui/app-button";
import { AppIcon } from "../../ui/app-icon";
import { AppText } from "../../ui/app-text";
import { AppTextInput } from "../../ui/app-text-input";
import { Card } from "../../ui/card";
import { ConfirmSheet, type ConfirmAction } from "../../ui/confirm-sheet";
import { IconButton } from "../../ui/icon-button";
import { MessageEditor } from "../../ui/message/message-editor";
import { TemplateChips } from "../../ui/message/template-chips";
import { PageHeader } from "../../ui/page-header";
import { Screen } from "../../ui/screen";
import { EmptyState, SectionHeader } from "../../ui/section-header";
import { radius, useMetrics, useTheme } from "../../ui/theme";

export default function BroadcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const broadcastId = parseInt(id, 10);
  const { colors } = useTheme();
  const { width, contentWidth, insets } = useMetrics();
  const selectedCountry = useAppStore((state) => state.selectedCountry);
  const setCountryPickerOpen = useAppStore((state) => state.setCountryPickerOpen);
  const loadTemplates = useAppStore((state) => state.loadTemplates);

  const message = useBroadcastStore((state) => state.message);
  const contacts = useBroadcastStore((state) => state.contacts);
  const loaded = useBroadcastStore((state) => state.loaded);
  const loadDetail = useBroadcastStore((state) => state.loadDetail);
  const setMessage = useBroadcastStore((state) => state.setMessage);
  const addContact = useBroadcastStore((state) => state.addContact);
  const removeContact = useBroadcastStore((state) => state.removeContact);
  const deleteBroadcast = useBroadcastStore((state) => state.deleteBroadcast);
  const sendToContact = useBroadcastStore((state) => state.sendToContact);

  const [newNumber, setNewNumber] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const load = useCallback(() => {
    const found = loadDetail(broadcastId);
    if (!found) router.back();
    loadTemplates();
  }, [broadcastId, loadDetail, loadTemplates]);

  useFocusEffect(load);

  if (!loaded) return null;

  const sentCount = contacts.filter((contact) => contact.sent).length;
  const done = contacts.length > 0 && sentCount === contacts.length;
  const nextContact = contacts.find((contact) => !contact.sent);
  const innerWidth = contentWidth - 32;
  const inputWidth = Math.max(100, contentWidth - 64 - 46 - 16);

  const handleAddContact = () => {
    const digits = `${selectedCountry.code}${newNumber}`.replace(/\D/g, "");
    if (digits.length < 9) return;
    addContact(broadcastId, newNumber, selectedCountry.code);
    setNewNumber("");
  };

  const handleDelete = () => {
    setConfirmAction({
      title: "Delete broadcast?",
      description: "This removes the draft and every recipient in it.",
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteBroadcast(broadcastId);
        router.back();
      },
    });
  };

  return (
    <Screen
      header={
        <PageHeader
          title="Broadcast"
          subtitle={contacts.length > 0 ? `${sentCount} of ${contacts.length} sent` : "New draft"}
          actions={[
            { name: "trash", label: "Delete", color: colors.danger, onPress: handleDelete },
          ]}
        />
      }
      overlays={
        <>
          {contacts.length > 0 ? (
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
              {done ? (
                <Row
                  alignment="center"
                  spacing={8}
                  style={{
                    width: contentWidth,
                    height: 52,
                    borderRadius: radius.medium,
                    backgroundColor: colors.accentSoft,
                  }}
                >
                  <Spacer flexible />
                  <AppIcon name="check-circle" size={18} color={colors.accent} />
                  <AppText variant="label" color={colors.accentSoftText}>
                    All contacts sent
                  </AppText>
                  <Spacer flexible />
                </Row>
              ) : nextContact ? (
                <AppButton
                  label="Send to next contact"
                  icon="send"
                  width={contentWidth}
                  height={52}
                  onPress={() => sendToContact(nextContact, message)}
                />
              ) : null}
            </View>
          ) : null}
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
            paddingBottom: insets.bottom + 120,
          }}
        >
          {contacts.length > 0 ? (
            <Card width={contentWidth} padding={14} gap={8}>
              <Row alignment="center" style={{ width: innerWidth }}>
                <AppText variant="label" color={colors.textSecondary}>
                  Progress
                </AppText>
                <Spacer flexible />
                <AppText variant="label" color={colors.accent}>
                  {`${sentCount}/${contacts.length}`}
                </AppText>
              </Row>
              <Row
                style={{
                  width: innerWidth,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.surfaceMuted,
                }}
              >
                <Row
                  style={{
                    width: (sentCount / Math.max(1, contacts.length)) * innerWidth,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.accent,
                  }}
                />
              </Row>
            </Card>
          ) : null}

          <Card width={contentWidth} padding={16} gap={10}>
            <SectionHeader title="Message" width={innerWidth} />
            <TemplateChips onSelect={(text) => setMessage(broadcastId, text)} />
            <MessageEditor
              value={message}
              onChangeText={(text) => setMessage(broadcastId, text)}
              placeholder="Broadcast message…"
              width={innerWidth}
            />
          </Card>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Add recipient" width={contentWidth} />
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
              title="Recipients"
              width={contentWidth}
              subtitle={contacts.length > 0 ? `${contacts.length} in this broadcast` : undefined}
            />
            {contacts.length === 0 ? (
              <EmptyState
                icon="broadcast"
                title="No recipients yet"
                message="Add a phone number above, then send when you’re ready."
                width={contentWidth}
              />
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id} width={contentWidth} padding={12} gap={0}>
                  <Row alignment="center" spacing={10} style={{ width: innerWidth }}>
                    <AppIcon
                      name={contact.sent ? "check-circle" : "circle"}
                      size={20}
                      color={contact.sent ? colors.accent : colors.textTertiary}
                    />
                    <AppText
                      variant="callout"
                      color={contact.sent ? colors.textTertiary : colors.text}
                      numberOfLines={1}
                    >
                      {`${contact.countryCode} ${formatPhoneNumber(contact.phoneNumber)}`}
                    </AppText>
                    <Spacer flexible />
                    {!contact.sent ? (
                      <AppButton
                        label="Send"
                        icon="send"
                        variant="soft"
                        width={82}
                        height={34}
                        onPress={() => sendToContact(contact, message)}
                      />
                    ) : null}
                    <IconButton
                      name="close"
                      size={14}
                      width={32}
                      height={32}
                      background="transparent"
                      color={colors.textTertiary}
                      onPress={() => removeContact(contact.id)}
                    />
                  </Row>
                </Card>
              ))
            )}
          </Column>
        </Column>
      </ScrollView>
    </Screen>
  );
}
