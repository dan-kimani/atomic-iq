import { Column, Row, Spacer } from "@expo/ui";
import * as Linking from "expo-linking";
import { useState } from "react";

import { useSmartClipboard } from "../../hooks/useSmartClipboard";
import { haptics, NotificationFeedbackType } from "../../lib/haptics";
import { formatPhoneNumber, useAppStore } from "../../store/useAppStore";
import { AppButton } from "../app-button";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { Card } from "../card";
import { CountryTrigger } from "../country/country-trigger";
import { IconButton } from "../icon-button";
import { Reveal } from "../motion/reveal";
import { radius, useTheme } from "../theme";
import type { ActionLinkItem } from "./action-link";
import { ActionLinks } from "./action-links";
import { MessageField } from "./message-field";
import { PhoneNumberInput } from "./phone-number-input";

const DIGITS_PER_COUNTRY: Record<string, number> = {
  KE: 9,
  US: 10,
  GB: 10,
  IN: 10,
  NG: 10,
  ZA: 9,
  TZ: 9,
  UG: 9,
  RW: 9,
  CN: 11,
  JP: 10,
  DE: 11,
  FR: 9,
  BR: 11,
  AE: 9,
  SA: 9,
  EG: 10,
};

function formatPlaceholder(countryCode: string): string {
  const count = DIGITS_PER_COUNTRY[countryCode] || 9;
  const digits = Array.from({ length: count }, (_, index) => (index + 1) % 10);
  return formatPhoneNumber(digits.join(""));
}

interface Props {
  width: number;
  onAddNote: () => void;
  onSetReminder: () => void;
}

export function PhoneCard({ width, onAddNote, onSetReminder }: Props) {
  const { colors } = useTheme();
  const phoneNumber = useAppStore((state) => state.phoneNumber);
  const rawPhoneNumber = useAppStore((state) => state.rawPhoneNumber);
  const setPhoneNumber = useAppStore((state) => state.setPhoneNumber);
  const selectedCountry = useAppStore((state) => state.selectedCountry);
  const isValidNumber = useAppStore((state) => state.isValidNumber);
  const messageText = useAppStore((state) => state.messageText);
  const setMessageText = useAppStore((state) => state.setMessageText);
  const startChat = useAppStore((state) => state.startChat);
  const startCall = useAppStore((state) => state.startCall);
  const saveContact = useAppStore((state) => state.saveContact);
  const clipboardNumber = useSmartClipboard(rawPhoneNumber);
  const [dismissedClipboard, setDismissedClipboard] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const isValid = isValidNumber();
  const innerWidth = width - 26;
  const half = Math.floor((innerWidth - 8) / 2);
  const showClipboard = clipboardNumber !== null && clipboardNumber !== dismissedClipboard;

  const handleSendSms = () => {
    const digits = `${selectedCountry.code}${rawPhoneNumber}`.replace(/\D/g, "");
    Linking.openURL(`sms:+${digits}`);
    haptics.notificationAsync(NotificationFeedbackType.Success);
  };

  const actions: ActionLinkItem[] = [
    { icon: "sms", label: "Send SMS", onPress: handleSendSms },
    {
      icon: "save-contact",
      label: "Save contact",
      onPress: () => saveContact(selectedCountry.code, rawPhoneNumber),
    },
    { icon: "edit", label: "Note & tags", onPress: onAddNote },
    { icon: "bell", label: "Set reminder", onPress: onSetReminder },
  ];

  return (
    <Card width={width} padding={12} gap={8} cornerRadius={radius.xlarge}>
      <Column spacing={4} style={{ width: innerWidth }}>
        <AppText variant="caption" color={colors.textTertiary}>
          COUNTRY
        </AppText>
        <CountryTrigger width={innerWidth} />
      </Column>

      <Column spacing={4} style={{ width: innerWidth }}>
        <Row alignment="center" style={{ width: innerWidth, height: 22 }}>
          <AppText variant="caption" color={colors.textTertiary}>
            PHONE NUMBER
          </AppText>
          <Spacer flexible />
          {showClipboard && clipboardNumber ? (
            <>
              <Row
                alignment="center"
                spacing={4}
                onPress={() => setPhoneNumber(clipboardNumber)}
                style={{
                  height: 28,
                  paddingHorizontal: 9,
                  backgroundColor: colors.accentSoft,
                  borderRadius: radius.pill,
                }}
              >
                <AppIcon name="clipboard" size={12} color={colors.accentSoftText} />
                <AppText variant="caption" color={colors.accentSoftText} numberOfLines={1}>
                  {`Paste ${clipboardNumber}`}
                </AppText>
              </Row>
              <IconButton
                name="close"
                size={12}
                width={24}
                height={24}
                background="transparent"
                color={colors.textTertiary}
                onPress={() => setDismissedClipboard(clipboardNumber)}
              />
            </>
          ) : null}
        </Row>

        <PhoneNumberInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder={formatPlaceholder(selectedCountry.country)}
          width={innerWidth}
          onClear={() => setPhoneNumber("")}
          borderColor={
            rawPhoneNumber.length === 0 ? colors.border : isValid ? colors.accent : colors.danger
          }
        />

        {rawPhoneNumber.length > 0 ? (
          <Row alignment="center" style={{ width: innerWidth }}>
            <AppIcon
              name={isValid ? "check-circle" : "warning"}
              size={14}
              color={isValid ? colors.accent : colors.danger}
            />
            <Spacer size={5} />
            <AppText variant="subheadline" color={isValid ? colors.accent : colors.danger}>
              {isValid ? "Ready to send" : "Too short"}
            </AppText>
            <Spacer flexible />
            <AppText variant="caption" color={colors.textTertiary}>
              {`${rawPhoneNumber.length} / 15`}
            </AppText>
          </Row>
        ) : null}
      </Column>

      <Reveal visible={isValid}>
        <Column spacing={8} style={{ width: innerWidth }}>
          <Column spacing={2} style={{ width: innerWidth }}>
            <AppText variant="caption" color={colors.textTertiary}>
              ACTIONS
            </AppText>
            <ActionLinks items={actions} width={innerWidth} />
          </Column>

          <Column spacing={4} style={{ width: innerWidth }}>
            <Row alignment="center" style={{ width: innerWidth, height: 24 }}>
              <AppText variant="caption" color={colors.textTertiary}>
                MESSAGE (OPTIONAL)
              </AppText>
              <Spacer flexible />
              <Row
                alignment="center"
                spacing={4}
                onPress={() => {
                  if (showMessage) setMessageText("");
                  setShowMessage((value) => !value);
                }}
                style={{ height: 24 }}
              >
                <AppIcon name={showMessage ? "close" : "plus"} size={12} color={colors.accent} />
                <AppText variant="caption" color={colors.accent}>
                  {showMessage ? "Hide message" : "Add a message"}
                </AppText>
              </Row>
            </Row>

            <Reveal visible={showMessage}>
              <MessageField value={messageText} onChangeText={setMessageText} width={innerWidth} />
            </Reveal>
          </Column>
        </Column>
      </Reveal>

      <Row spacing={8} style={{ width: innerWidth }}>
        <AppButton
          label="Call"
          icon="phone"
          variant="secondary"
          width={half}
          height={44}
          disabled={!isValid}
          onPress={startCall}
        />
        <AppButton
          label="WhatsApp"
          icon="whatsapp"
          variant="whatsapp"
          width={half}
          height={44}
          disabled={!isValid}
          onPress={startChat}
        />
      </Row>
    </Card>
  );
}
