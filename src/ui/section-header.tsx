import { Column, Row, Spacer } from "@expo/ui";
import type { ReactNode } from "react";

import { AppIcon, type AppIconName } from "./app-icon";
import { AppText } from "./app-text";
import { radius, useTheme } from "./theme";

interface SectionHeaderProps {
  title: string;
  width: number;
  action?: ReactNode;
  subtitle?: string;
  color?: string;
}

export function SectionHeader({ title, width, action, subtitle, color }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <Column spacing={2} style={{ width }}>
      <Row alignment="center" style={{ width }}>
        <AppText variant="caption" color={color ?? colors.textTertiary}>
          {title.toUpperCase()}
        </AppText>
        <Spacer flexible />
        {action}
      </Row>
      {subtitle ? (
        <AppText variant="subheadline" color={colors.textSecondary}>
          {subtitle}
        </AppText>
      ) : null}
    </Column>
  );
}

interface EmptyStateProps {
  icon: AppIconName;
  title: string;
  message?: string;
  width: number;
}

export function EmptyState({ icon, title, message, width }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <Column alignment="center" spacing={10} style={{ width, paddingVertical: 24 }}>
      <Row
        alignment="center"
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.medium,
          backgroundColor: colors.surfaceMuted,
        }}
      >
        <Spacer flexible />
        <AppIcon name={icon} size={24} color={colors.textTertiary} />
        <Spacer flexible />
      </Row>
      <AppText variant="headline" color={colors.textSecondary} align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="subheadline" color={colors.textTertiary} align="center">
          {message}
        </AppText>
      ) : null}
    </Column>
  );
}
