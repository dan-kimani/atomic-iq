import { Row, Spacer } from "@expo/ui";
import type { ReactNode } from "react";

import { AppIcon, type AppIconName } from "./app-icon";
import { AppText } from "./app-text";
import { radius, useTheme } from "./theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft" | "whatsapp";

interface AppButtonProps {
  label?: string;
  icon?: AppIconName;
  iconSize?: number;
  onPress?: () => void;
  variant?: ButtonVariant;
  width?: number;
  height?: number;
  disabled?: boolean;
  children?: ReactNode;
  align?: "center" | "start";
}

export function AppButton({
  label,
  icon,
  iconSize = 18,
  onPress,
  variant = "primary",
  width,
  height = 48,
  disabled = false,
  children,
  align = "center",
}: AppButtonProps) {
  const { colors } = useTheme();

  const background =
    variant === "primary"
      ? colors.accent
      : variant === "secondary"
        ? colors.surfaceMuted
        : variant === "outline"
          ? "transparent"
          : variant === "ghost"
            ? "transparent"
            : variant === "danger"
              ? colors.danger
              : variant === "whatsapp"
                ? colors.accent
                : colors.accentSoft;

  const border =
    variant === "outline"
      ? colors.borderStrong
      : variant === "danger"
        ? colors.danger
        : variant === "soft"
          ? colors.accentSoft
          : "transparent";

  const foreground =
    variant === "primary"
      ? colors.accentForeground
      : variant === "danger"
        ? "#FFFFFF"
        : variant === "whatsapp"
          ? colors.accentForeground
          : variant === "soft"
            ? colors.accentSoftText
            : variant === "ghost"
              ? colors.accent
              : colors.text;

  const content = children ?? (
    <Row alignment="center" spacing={8}>
      {icon ? (
        // Reserve the icon slot so an asynchronously-loaded native image cannot
        // shift the label when it appears.
        <Row alignment="center" style={{ width: iconSize, height: iconSize }}>
          <AppIcon name={icon} size={iconSize} color={foreground} />
        </Row>
      ) : null}
      {label ? (
        <AppText variant="label" color={foreground}>
          {label}
        </AppText>
      ) : null}
    </Row>
  );

  return (
    <Row
      alignment="center"
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        width,
        height,
        paddingHorizontal: align === "center" ? 12 : 16,
        backgroundColor: background,
        borderRadius: radius.medium,
        borderWidth: variant === "outline" || variant === "danger" || variant === "soft" ? 1 : 0,
        borderColor: border,
        opacity: disabled ? 0.42 : 1,
      }}
    >
      {align === "center" && width != null ? <Spacer flexible /> : null}
      {content}
      {align === "center" && width != null ? <Spacer flexible /> : null}
    </Row>
  );
}
