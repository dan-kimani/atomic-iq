import { TextInput, useNativeState, type TextInputProps } from "@expo/ui";
import { useEffect, useRef } from "react";

import { useTheme } from "./theme";

type BridgeProps = Omit<TextInputProps, "value" | "defaultValue" | "selection"> & {
  value: string;
  onChangeText: (text: string) => void;
  /** Skip the default field chrome when the caller supplies its own container. */
  bare?: boolean;
};

/**
 * Bridges the plain string values used by the Zustand stores into the native
 * observable state required by `@expo/ui`'s TextInput.
 */
export function AppTextInput({
  value,
  onChangeText,
  style,
  textStyle,
  bare = false,
  ...rest
}: BridgeProps) {
  const { colors } = useTheme();
  const state = useNativeState(value);
  const lastValue = useRef(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      state.value = value;
    }
  }, [state, value]);

  const flatStyle =
    style && !Array.isArray(style)
      ? style
      : Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : undefined;
  const fixedHeight = typeof flatStyle?.height === "number" ? flatStyle.height : undefined;
  const fontSize = typeof textStyle?.fontSize === "number" ? textStyle.fontSize : 16;
  const lineHeight =
    typeof textStyle?.lineHeight === "number" ? textStyle.lineHeight : Math.ceil(fontSize * 1.4);
  const borderWidth =
    typeof flatStyle?.borderWidth === "number" ? flatStyle.borderWidth : bare ? 0 : 1;
  // BasicTextField's decoration box lays text out from the top. Equal
  // vertical padding on fixed-height, single-line fields keeps the value and
  // placeholder optically centered inside the field.
  const centeredPadding =
    fixedHeight !== undefined && !rest.multiline
      ? Math.max(0, Math.floor((fixedHeight - lineHeight - borderWidth * 2) / 2))
      : undefined;
  const opticalOffset = centeredPadding !== undefined ? 4 : 0;

  return (
    <TextInput
      {...rest}
      value={state}
      onChangeText={(text) => {
        lastValue.current = text;
        onChangeText(text);
      }}
      placeholderTextColor={rest.placeholderTextColor ?? colors.textTertiary}
      cursorColor={rest.cursorColor ?? colors.accent}
      selectionColor={rest.selectionColor ?? colors.accent}
      textStyle={{ color: colors.text, fontSize: 16, ...textStyle }}
      style={{
        ...(bare
          ? {}
          : {
              backgroundColor: colors.surfaceMuted,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }),
        ...flatStyle,
        ...(centeredPadding !== undefined
          ? {
              paddingTop: centeredPadding + opticalOffset,
              paddingBottom: Math.max(0, centeredPadding - opticalOffset),
            }
          : null),
      }}
    />
  );
}
