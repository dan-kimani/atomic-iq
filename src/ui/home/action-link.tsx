import { Row } from "@expo/ui";

import { AppIcon, type AppIconName } from "../app-icon";
import { AppText } from "../app-text";
import { useTheme } from "../theme";

export interface ActionLinkItem {
  icon: AppIconName;
  label: string;
  onPress: () => void;
}

interface Props extends ActionLinkItem {
  width?: number;
}

export function ActionLink({ icon, label, onPress, width }: Props) {
  const { colors } = useTheme();

  return (
    <Row alignment="center" onPress={onPress} style={width ? { width } : undefined}>
      <Row alignment="center" spacing={4} style={{ paddingVertical: 2 }}>
        <AppIcon name={icon} size={13} color={colors.accent} />
        <AppText variant="caption" color={colors.accent} numberOfLines={1}>
          {label}
        </AppText>
      </Row>
    </Row>
  );
}
