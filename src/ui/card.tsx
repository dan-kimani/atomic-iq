import { Column } from "@expo/ui";
import type { ReactNode } from "react";

import { radius, useTheme } from "./theme";

interface CardProps {
  children?: ReactNode;
  width: number;
  onPress?: () => void;
  tone?: "surface" | "muted" | "accent" | "danger" | "transparent";
  padding?: number;
  gap?: number;
  cornerRadius?: number;
  disabled?: boolean;
  opacity?: number;
}

export function Card({
  children,
  width,
  onPress,
  tone = "surface",
  padding = 16,
  gap = 10,
  cornerRadius = radius.medium,
  disabled,
  opacity = 1,
}: CardProps) {
  const { colors } = useTheme();

  const backgroundColor =
    tone === "surface"
      ? colors.surface
      : tone === "muted"
        ? colors.surfaceMuted
        : tone === "accent"
          ? colors.accentSoft
          : tone === "danger"
            ? colors.dangerSoft
            : "transparent";

  return (
    <Column
      alignment="start"
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        width,
        backgroundColor,
        borderRadius: cornerRadius,
        borderWidth: tone === "transparent" ? 0 : 1,
        borderColor: tone === "danger" ? colors.dangerSoft : colors.border,
        opacity,
      }}
    >
      <Column alignment="start" spacing={gap} style={{ width, padding }}>
        {children}
      </Column>
    </Column>
  );
}
