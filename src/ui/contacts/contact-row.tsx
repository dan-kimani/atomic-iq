import { Column, Row, Spacer, Text } from "@expo/ui";
import { format, isToday } from "date-fns";

import { countryFlagEmoji } from "../../lib/country-flag";
import { formatPhoneNumber, getCountryName } from "../../store/useAppStore";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { IconButton } from "../icon-button";
import { useTheme } from "../theme";

export interface RecentContact {
  phoneNumber: string;
  countryCode: string;
  country: string;
  flag: string;
  usedAt: Date;
  notes?: string | null;
  tags?: string | null;
}

interface Props {
  contact: RecentContact;
  contactName?: string;
  width: number;
  onSelect: () => void;
  onMenu: () => void;
  onWhatsApp: () => void;
}

const AVATAR_SIZE = 40;

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function ContactRow({ contact, contactName, width, onSelect, onMenu, onWhatsApp }: Props) {
  const { colors } = useTheme();
  const name = contactName?.trim();
  const title = name || `${contact.countryCode} ${formatPhoneNumber(contact.phoneNumber)}`;
  const subtitle =
    contact.notes?.trim() ||
    (name
      ? `${contact.countryCode} ${formatPhoneNumber(contact.phoneNumber)}`
      : getCountryName(contact.country));
  const time = isToday(contact.usedAt)
    ? format(contact.usedAt, "HH:mm")
    : format(contact.usedAt, "MMM d");
  const textWidth = Math.max(60, width - 202);

  const palettes = [
    { background: colors.accentSoft, foreground: colors.accentSoftText },
    { background: colors.tagSoft, foreground: colors.tagSoftText },
    { background: colors.warningSoft, foreground: colors.warningSoftText },
    { background: colors.infoSoft, foreground: colors.infoSoftText },
  ];
  const paletteIndex =
    contact.phoneNumber
      .replace(/\D/g, "")
      .split("")
      .reduce((total, digit) => total + Number(digit), 0) % palettes.length;
  const palette = palettes[paletteIndex] ?? palettes[0];

  return (
    <Row
      alignment="center"
      spacing={8}
      onPress={onSelect}
      style={{ width, paddingHorizontal: 16, paddingVertical: 9 }}
    >
      <Row
        alignment="center"
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          backgroundColor: palette.background,
        }}
      >
        <Spacer flexible />
        {name ? (
          <AppText variant="label" color={palette.foreground}>
            {initialsOf(name)}
          </AppText>
        ) : (
          <Text textStyle={{ fontSize: 20 }}>
            {countryFlagEmoji(contact.country, contact.flag)}
          </Text>
        )}
        <Spacer flexible />
      </Row>

      <Column spacing={2} style={{ width: textWidth }}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
          {subtitle}
        </AppText>
      </Column>

      <Spacer flexible />
      <AppText variant="caption" color={colors.textTertiary}>
        {time}
      </AppText>

      <Row alignment="center" onPress={onWhatsApp} style={{ width: 26, height: 26 }}>
        <AppIcon name="whatsapp" size={18} color={colors.brand} />
      </Row>

      <IconButton
        name="more"
        size={16}
        width={28}
        height={28}
        background="transparent"
        color={colors.textTertiary}
        onPress={onMenu}
      />
    </Row>
  );
}
