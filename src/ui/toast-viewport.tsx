import { Column, Host, Row, Spacer } from "@expo/ui";
import { View } from "react-native";

import { AppIcon, type AppIconName } from "./app-icon";
import { AppText } from "./app-text";
import { radius, useMetrics, useTheme } from "./theme";
import { useToastStore } from "./toast";

function toastVisual(
  kind: "success" | "error" | "info",
  colors: ReturnType<typeof useTheme>["colors"],
) {
  if (kind === "success") {
    return { icon: "check-circle" as AppIconName, color: colors.accent, soft: colors.accentSoft };
  }
  if (kind === "error") {
    return { icon: "warning" as AppIconName, color: colors.danger, soft: colors.dangerSoft };
  }
  return { icon: "info" as AppIconName, color: colors.info, soft: colors.infoSoft };
}

export function ToastViewport() {
  const toast = useToastStore((s) => s.toast);
  const { colors, scheme } = useTheme();
  const { contentWidth, insets } = useMetrics();

  if (!toast) return null;

  const visual = toastVisual(toast.kind ?? "info", colors);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom + 20,
        alignItems: "center",
      }}
    >
      <Host colorScheme={scheme} seedColor={colors.accent} matchContents>
        <Row
          alignment="center"
          spacing={12}
          style={{
            width: contentWidth,
            padding: 14,
            backgroundColor: colors.surface,
            borderRadius: radius.medium,
            borderWidth: 1,
            borderColor: colors.borderStrong,
          }}
        >
          <Row
            alignment="center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: visual.soft,
            }}
          >
            <Spacer flexible />
            <AppIcon name={visual.icon} size={18} color={visual.color} />
            <Spacer flexible />
          </Row>
          <Column spacing={2} style={{ width: contentWidth - 28 - 32 - 12 - 12 }}>
            <AppText variant="label" numberOfLines={1}>
              {toast.title}
            </AppText>
            {toast.message ? (
              <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={2}>
                {toast.message}
              </AppText>
            ) : null}
          </Column>
        </Row>
      </Host>
    </View>
  );
}
