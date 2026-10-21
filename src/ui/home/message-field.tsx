import { Column, Row, Spacer } from "@expo/ui";

import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { AppTextInput } from "../app-text-input";
import { radius, useTheme } from "../theme";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  width: number;
}

/** Compact message composer used on the home card. */
export function MessageField({ value, onChangeText, width }: Props) {
  const { colors } = useTheme();
  const innerWidth = width - 18;

  return (
    <Column
      spacing={4}
      style={{
        width,
        padding: 8,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.medium,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        bare
        placeholder="Type your message..."
        multiline
        maxLength={1000}
        style={{
          width: innerWidth,
          height: 40,
          paddingHorizontal: 0,
          paddingTop: 6,
          paddingBottom: 0,
        }}
        textStyle={{ fontSize: 15, lineHeight: 21 }}
      />
      <Row alignment="center" style={{ width: innerWidth, height: 18 }}>
        <Row
          alignment="center"
          onPress={() => onChangeText(`${value}🙂`)}
          style={{ width: 24, height: 24 }}
        >
          <AppIcon name="smile" size={18} color={colors.textTertiary} />
        </Row>
        <Spacer flexible />
        <AppText variant="caption" color={colors.textTertiary}>
          {`${value.length} / 1000`}
        </AppText>
      </Row>
    </Column>
  );
}
