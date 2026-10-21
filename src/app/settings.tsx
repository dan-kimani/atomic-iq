import { Column, Row, ScrollView, Spacer, Switch } from "@expo/ui";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Children, Fragment, type ReactNode, useState } from "react";
import { Share } from "react-native";

import { clearAllBroadcasts, clearAllRecent, clearAllReminders, clearAllTemplates } from "../db";
import { useAppStore, getCountryName } from "../store/useAppStore";
import { AppIcon } from "../ui/app-icon";
import { AppText } from "../ui/app-text";
import { Card } from "../ui/card";
import { ConfirmSheet, type ConfirmAction } from "../ui/confirm-sheet";
import { FrequencyPickerSheet } from "../ui/frequency-sheet";
import { PageHeader } from "../ui/page-header";
import { Screen } from "../ui/screen";
import { SectionHeader } from "../ui/section-header";
import { SettingsRow } from "../ui/settings/settings-row";
import { radius, useMetrics, useTheme } from "../ui/theme";
import { showToast } from "../ui/toast";

function SettingsGroup({ children, width }: { children: ReactNode; width: number }) {
  const { colors } = useTheme();
  const items = Children.toArray(children);

  return (
    <Card width={width} padding={0} gap={0}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {child}
          {index < items.length - 1 ? (
            <Row style={{ width, height: 1, backgroundColor: colors.border }} />
          ) : null}
        </Fragment>
      ))}
    </Card>
  );
}

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { width, contentWidth, insets } = useMetrics();
  const selectedCountry = useAppStore((state) => state.selectedCountry);
  const setCountryPickerOpen = useAppStore((state) => state.setCountryPickerOpen);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const clearAllRecentContacts = useAppStore((state) => state.clearAllRecentContacts);
  const clipboardDetection = useAppStore((state) => state.clipboardDetection);
  const toggleClipboard = useAppStore((state) => state.toggleClipboardDetection);
  const notificationSound = useAppStore((state) => state.notificationSound);
  const toggleSound = useAppStore((state) => state.toggleNotificationSound);
  const hapticFeedback = useAppStore((state) => state.hapticFeedback);
  const toggleHaptic = useAppStore((state) => state.toggleHapticFeedback);
  const backupFrequency = useAppStore((state) => state.backupFrequency);
  const setBackupFrequency = useAppStore((state) => state.setBackupFrequency);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [frequencyOpen, setFrequencyOpen] = useState(false);

  const groupWidth = contentWidth;
  const themeOptions = [
    { key: "light" as const, label: "Light", icon: "sun" as const },
    { key: "dark" as const, label: "Dark", icon: "moon" as const },
    { key: "system" as const, label: "System", icon: "contrast" as const },
  ];
  const themeButtonWidth = Math.floor((groupWidth - 28 - 16) / 3);

  const confirmClear = (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmLabel = "Clear",
  ) => {
    setConfirmAction({
      title,
      description,
      confirmLabel,
      icon: <AppIcon name="trash" size={26} color={colors.danger} />,
      onConfirm,
    });
  };

  return (
    <Screen
      header={
        <PageHeader
          title="Settings"
          subtitle={`Atomic IQ ${Constants.expoConfig?.version ?? "0.0.0"}`}
        />
      }
      overlays={
        <>
          <ConfirmSheet action={confirmAction} onClose={() => setConfirmAction(null)} />
          <FrequencyPickerSheet
            visible={frequencyOpen}
            selected={backupFrequency}
            onSelect={setBackupFrequency}
            onClose={() => setFrequencyOpen(false)}
          />
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
          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Preferences" width={contentWidth} />
            <SettingsGroup width={groupWidth}>
              <SettingsRow
                icon="globe"
                label="Default country"
                subtitle={`${getCountryName(selectedCountry.country)} (${selectedCountry.code})`}
                tint={colors.tag}
                soft={colors.tagSoft}
                width={groupWidth}
                onPress={() => setCountryPickerOpen(true)}
              />
              <SettingsRow
                icon="clipboard"
                label="Clipboard detection"
                subtitle="Detect phone numbers copied elsewhere"
                tint={colors.accent}
                soft={colors.accentSoft}
                width={groupWidth}
                trailing={<Switch value={clipboardDetection} onValueChange={toggleClipboard} />}
                trailingWidth={52}
              />
            </SettingsGroup>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Notifications" width={contentWidth} />
            <SettingsGroup width={groupWidth}>
              <SettingsRow
                icon="volume"
                label="Reminder sound"
                subtitle="Play a sound for follow-up notifications"
                tint={colors.warning}
                soft={colors.warningSoft}
                width={groupWidth}
                trailing={<Switch value={notificationSound} onValueChange={toggleSound} />}
                trailingWidth={52}
              />
            </SettingsGroup>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Appearance" width={contentWidth} />
            <Card width={groupWidth} padding={14} gap={10}>
              <Row alignment="center" spacing={10} style={{ width: groupWidth - 28 }}>
                <AppIcon
                  name={isDark ? "moon" : "sun"}
                  size={17}
                  color={isDark ? colors.tag : colors.warning}
                />
                <AppText variant="callout">Theme</AppText>
              </Row>
              <Row spacing={8} style={{ width: groupWidth - 28 }}>
                {themeOptions.map((option) => {
                  const active = theme === option.key;
                  return (
                    <Row
                      key={option.key}
                      alignment="center"
                      spacing={5}
                      onPress={() => setTheme(option.key)}
                      style={{
                        width: themeButtonWidth,
                        height: 42,
                        borderRadius: radius.small,
                        backgroundColor: active ? colors.accent : colors.surfaceMuted,
                      }}
                    >
                      <Spacer flexible />
                      <AppIcon
                        name={option.icon}
                        size={14}
                        color={active ? colors.accentForeground : colors.textSecondary}
                      />
                      <AppText
                        variant="label"
                        color={active ? colors.accentForeground : colors.textSecondary}
                      >
                        {option.label}
                      </AppText>
                      <Spacer flexible />
                    </Row>
                  );
                })}
              </Row>
            </Card>
            <SettingsGroup width={groupWidth}>
              <SettingsRow
                icon="vibrate"
                label="Haptic feedback"
                subtitle="Vibrate on selections and outcomes"
                width={groupWidth}
                trailing={<Switch value={hapticFeedback} onValueChange={toggleHaptic} />}
                trailingWidth={52}
              />
            </SettingsGroup>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Data" width={contentWidth} />
            <SettingsGroup width={groupWidth}>
              <SettingsRow
                icon="trash"
                label="Clear recent contacts"
                subtitle="Remove every saved number"
                width={groupWidth}
                tint={colors.danger}
                soft={colors.dangerSoft}
                destructive
                onPress={() =>
                  confirmClear(
                    "Clear recent contacts?",
                    "This permanently removes all saved numbers from this device.",
                    () => {
                      clearAllRecent();
                      clearAllRecentContacts();
                    },
                  )
                }
              />
              <SettingsRow
                icon="templates"
                label="Clear all templates"
                subtitle="Remove every quick response"
                width={groupWidth}
                tint={colors.danger}
                soft={colors.dangerSoft}
                destructive
                onPress={() =>
                  confirmClear(
                    "Clear all templates?",
                    "This permanently removes every quick response.",
                    clearAllTemplates,
                  )
                }
              />
              <SettingsRow
                icon="bell"
                label="Clear all reminders"
                subtitle="Remove every follow-up reminder"
                width={groupWidth}
                tint={colors.danger}
                soft={colors.dangerSoft}
                destructive
                onPress={() =>
                  confirmClear(
                    "Clear all reminders?",
                    "This permanently removes every follow-up reminder.",
                    clearAllReminders,
                  )
                }
              />
              <SettingsRow
                icon="broadcast"
                label="Clear all broadcasts"
                subtitle="Remove every draft and recipient"
                width={groupWidth}
                tint={colors.danger}
                soft={colors.dangerSoft}
                destructive
                onPress={() =>
                  confirmClear(
                    "Clear all broadcasts?",
                    "This permanently removes every broadcast draft and its recipients.",
                    clearAllBroadcasts,
                  )
                }
              />
            </SettingsGroup>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Backup" width={contentWidth} />
            <SettingsGroup width={groupWidth}>
              <SettingsRow
                icon="database"
                label="Last backup"
                subtitle="Never — keep a snapshot of your data"
                tint={colors.tag}
                soft={colors.tagSoft}
                width={groupWidth}
              />
              <SettingsRow
                icon="clock"
                label="Backup frequency"
                width={groupWidth}
                tint={colors.warning}
                soft={colors.warningSoft}
                onPress={() => setFrequencyOpen(true)}
                trailing={
                  <AppText variant="subheadline" color={colors.textSecondary}>
                    {backupFrequency.charAt(0).toUpperCase() + backupFrequency.slice(1)}
                  </AppText>
                }
                trailingWidth={58}
              />
              <SettingsRow
                icon="download"
                label="Back up now"
                subtitle="Export your data to a file"
                width={groupWidth}
                tint={colors.accent}
                soft={colors.accentSoft}
                onPress={() =>
                  showToast({
                    kind: "info",
                    title: "Coming soon",
                    message: "Backup export will arrive in a future update.",
                  })
                }
              />
            </SettingsGroup>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Privacy" width={contentWidth} />
            <Card width={groupWidth} padding={14} gap={8}>
              <Row alignment="center" spacing={10} style={{ width: groupWidth - 28 }}>
                <Row
                  alignment="center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: colors.accentSoft,
                  }}
                >
                  <Spacer flexible />
                  <AppIcon name="shield" size={17} color={colors.accent} />
                  <Spacer flexible />
                </Row>
                <AppText variant="callout">Your data stays on-device</AppText>
              </Row>
              <AppText variant="subheadline" color={colors.textSecondary}>
                Contacts, messages, reminders, tags and events are stored in a local SQLite
                database. Nothing leaves this phone.
              </AppText>
            </Card>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="Support" width={contentWidth} />
            <SettingsGroup width={groupWidth}>
              <SettingsRow
                icon="star"
                label="Rate Atomic IQ"
                subtitle="If you find it useful"
                width={groupWidth}
                tint={colors.warning}
                soft={colors.warningSoft}
                onPress={() =>
                  Linking.openURL("https://play.google.com/store/apps/details?id=com.atomiciq.com")
                }
              />
              <SettingsRow
                icon="heart"
                label="Share with a friend"
                subtitle="Spread the word"
                width={groupWidth}
                tint={colors.danger}
                soft={colors.dangerSoft}
                onPress={() =>
                  Share.share({
                    message:
                      "Check out Atomic IQ — open WhatsApp chats without saving contacts! https://atomiciq.com",
                  })
                }
              />
              <SettingsRow
                icon="message"
                label="Send feedback"
                subtitle="We'd love to hear from you"
                width={groupWidth}
                tint={colors.accent}
                soft={colors.accentSoft}
                onPress={() =>
                  Linking.openURL(
                    "whatsapp://send?phone=254732887318&text=Hi%2C%20feedback%20about%20Atomic%20IQ...",
                  )
                }
              />
            </SettingsGroup>
          </Column>

          <Column spacing={8} style={{ width: contentWidth }}>
            <SectionHeader title="About" width={contentWidth} />
            <SettingsGroup width={groupWidth}>
              <SettingsRow
                icon="phone-device"
                label="Atomic IQ"
                subtitle={`Version ${Constants.expoConfig?.version ?? "0.0.0"}`}
                width={groupWidth}
                tint={colors.accent}
                soft={colors.accentSoft}
              />
            </SettingsGroup>
          </Column>
        </Column>
      </ScrollView>
    </Screen>
  );
}
