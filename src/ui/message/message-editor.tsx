import { Column, Row, Spacer } from "@expo/ui";
import { useRef } from "react";

import { AppText } from "../app-text";
import { AppTextInput } from "../app-text-input";
import { useTheme } from "../theme";
import { applyFormat } from "./format";
import { FormatBar } from "./format-bar";
import { MessagePreview } from "./message-preview";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  width: number;
}

export function MessageEditor({ value, onChangeText, placeholder = "Message...", width }: Props) {
  const selection = useRef({ start: 0, end: 0 });
  const { colors } = useTheme();

  return (
    <Column spacing={8} style={{ width }}>
      <FormatBar
        width={width}
        onFormat={(wrapper, line) => {
          onChangeText(applyFormat(value, selection.current, wrapper, line));
        }}
      />
      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={(next) => {
          selection.current = next;
        }}
        placeholder={placeholder}
        multiline
        numberOfLines={3}
        maxLength={500}
        returnKeyType="default"
        autoCapitalize="sentences"
        style={{ width, height: 96, paddingTop: 12 }}
        textStyle={{ fontSize: 15, lineHeight: 21 }}
      />
      <Row alignment="center" style={{ width }}>
        <Spacer flexible />
        <AppText variant="caption" color={colors.textTertiary}>
          {`${value.length}/500`}
        </AppText>
      </Row>
      <MessagePreview text={value} width={width} />
    </Column>
  );
}
