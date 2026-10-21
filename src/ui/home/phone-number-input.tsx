import { Row, TextInput, useNativeState } from "@expo/ui";
import { offset } from "@expo/ui/jetpack-compose/modifiers";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { IconButton } from "../icon-button";
import { radius, useTheme } from "../theme";

/* oxlint-disable react/immutability -- useNativeState exposes a mutable native observable by design */

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  width: number;
  borderColor: string;
  onClear?: () => void;
}

/**
 * Phone field with digit grouping.
 *
 * The store reformats on every keystroke, which replaces the native text while the
 * field keeps its previous selection offset. Since grouping inserts spaces before
 * the caret, that leaves the caret one slot behind and later digits land in the
 * wrong place. The selection is therefore driven explicitly and re-anchored to the
 * end after each reformat.
 */
export function PhoneNumberInput({
  value,
  onChangeText,
  placeholder,
  width,
  borderColor,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const text = useNativeState(value);
  const selection = useNativeState({ start: value.length, end: value.length });
  const lastValue = useRef(value);

  useEffect(() => {
    if (value === lastValue.current) return;
    lastValue.current = value;
    text.value = value;
    selection.value = { start: value.length, end: value.length };
  }, [selection, text, value]);

  return (
    <Row
      alignment="center"
      style={{
        width,
        height: 44,
        paddingLeft: 12,
        paddingRight: 4,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.medium,
        borderWidth: 1,
        borderColor,
      }}
    >
      <TextInput
        value={text}
        selection={selection}
        onChangeText={(next) => {
          lastValue.current = next;
          onChangeText(next);
        }}
        placeholder={placeholder}
        keyboardType="phone-pad"
        maxLength={20}
        autoComplete="tel"
        modifiers={Platform.OS === "android" ? [offset(0, 5.5)] : undefined}
        placeholderTextColor={colors.textTertiary}
        cursorColor={colors.accent}
        selectionColor={colors.accent}
        textStyle={{ color: colors.text, fontSize: 16, lineHeight: 22 }}
        style={{
          width: width - 44,
          height: 24,
          paddingHorizontal: 0,
          paddingVertical: 0,
          backgroundColor: "transparent",
          borderWidth: 0,
        }}
      />
      {onClear && value.length > 0 ? (
        <IconButton
          name="close"
          size={15}
          width={28}
          height={28}
          background="transparent"
          color={colors.textTertiary}
          onPress={onClear}
        />
      ) : null}
    </Row>
  );
}
