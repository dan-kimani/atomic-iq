import { Row, Spacer } from "@expo/ui";

import { AppIcon, type AppIconName } from "./app-icon";
import { radius, useTheme } from "./theme";

interface IconButtonProps {
  name: AppIconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
}

export function IconButton({
  name,
  onPress,
  size = 20,
  color,
  background,
  width = 36,
  height = 36,
  disabled,
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Row
      alignment="center"
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        width,
        height,
        backgroundColor: background ?? colors.surfaceMuted,
        borderRadius: radius.small,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Spacer flexible />
      <AppIcon name={name} size={size} color={color ?? colors.icon} />
      <Spacer flexible />
    </Row>
  );
}
