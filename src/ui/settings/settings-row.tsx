import { Column, Row, Spacer } from "@expo/ui";
import type { ReactNode } from "react";

import { AppIcon, type AppIconName } from "../app-icon";
import { AppText } from "../app-text";
import { useTheme } from "../theme";

interface SettingsRowProps {
  icon: AppIconName;
  label: string;
  subtitle?: string;
  width: number;
  onPress?: () => void;
  trailing?: ReactNode;
  trailingWidth?: number;
  tint?: string;
  soft?: string;
  destructive?: boolean;
}

export function SettingsRow({
  icon,
  label,
  subtitle,
  width,
  onPress,
  trailing,
  trailingWidth,
  tint,
  soft,
  destructive,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const hasTrailing = trailing != null || onPress != null;
  const tailWidth = trailingWidth ?? (onPress ? 16 : 0);
  const textWidth = Math.max(80, width - 28 - 32 - 12 - (hasTrailing ? tailWidth + 12 : 0));

  return (
    <Row alignment="center" onPress={onPress} style={{ width }}>
      <Row
        alignment="center"
        spacing={12}
        style={{ width, paddingHorizontal: 14, paddingVertical: 13 }}
      >
        <Row
          alignment="center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: soft ?? colors.surfaceMuted,
          }}
        >
          <Spacer flexible />
          <AppIcon name={icon} size={17} color={tint ?? colors.textSecondary} />
          <Spacer flexible />
        </Row>
        <Column spacing={2} style={{ width: textWidth }}>
          <AppText
            variant="callout"
            color={destructive ? colors.danger : colors.text}
            numberOfLines={1}
          >
            {label}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.textTertiary} numberOfLines={2}>
              {subtitle}
            </AppText>
          ) : null}
        </Column>
        <Spacer flexible />
        {trailing ??
          (onPress ? <AppIcon name="chevron-right" size={15} color={colors.textTertiary} /> : null)}
      </Row>
    </Row>
  );
}
