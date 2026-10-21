import { Row } from "@expo/ui";

import { AppIcon, type AppIconName } from "./app-icon";
import { AppText } from "./app-text";
import { radius, useTheme } from "./theme";

type ChipTone = "accent" | "warning" | "info" | "tag" | "neutral";

interface ChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: AppIconName;
  tone?: ChipTone;
  count?: number;
  disabled?: boolean;
}

export function Chip({
  label,
  onPress,
  selected = false,
  icon,
  tone = "neutral",
  count,
  disabled,
}: ChipProps) {
  const { colors } = useTheme();

  const activeColor =
    tone === "accent"
      ? colors.accent
      : tone === "warning"
        ? colors.warning
        : tone === "info"
          ? colors.info
          : tone === "tag"
            ? colors.tag
            : colors.text;

  const selectedBackground =
    tone === "warning"
      ? "#B45309"
      : tone === "info"
        ? "#0369A1"
        : tone === "tag"
          ? "#4F46E5"
          : colors.accent;

  const selectedForeground =
    tone === "neutral" || tone === "accent" ? colors.accentForeground : "#FFFFFF";
  const foreground = selected ? selectedForeground : activeColor;

  return (
    <Row
      alignment="center"
      spacing={6}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        height: 34,
        paddingHorizontal: 12,
        backgroundColor: selected ? selectedBackground : colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? selectedBackground : colors.border,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {icon ? <AppIcon name={icon} size={14} color={foreground} /> : null}
      <AppText variant="label" color={foreground} numberOfLines={1}>
        {label}
      </AppText>
      {count != null && count > 0 ? (
        <Row
          alignment="center"
          style={{
            height: 18,
            paddingHorizontal: 5,
            borderRadius: radius.pill,
            backgroundColor: selected ? "rgba(255,255,255,0.22)" : colors.surfaceMuted,
          }}
        >
          <AppText variant="caption" color={selected ? selectedForeground : colors.textSecondary}>
            {String(count)}
          </AppText>
        </Row>
      ) : null}
    </Row>
  );
}
