import { Text } from "@expo/ui";

import { typography, useTheme } from "./theme";

type TextVariant = keyof typeof typography;

interface AppTextProps {
  children?: string;
  variant?: TextVariant;
  color?: string;
  align?: "left" | "center" | "right";
  numberOfLines?: number;
  onPress?: () => void;
}

export function AppText({
  children,
  variant = "body",
  color,
  align,
  numberOfLines,
  onPress,
}: AppTextProps) {
  const { colors } = useTheme();
  const style = typography[variant];

  return (
    <Text
      numberOfLines={numberOfLines}
      onPress={onPress}
      textStyle={{
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        color: color ?? colors.text,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}
