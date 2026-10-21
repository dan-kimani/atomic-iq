import { Text as SwiftText } from "@expo/ui/swift-ui";
import {
  background,
  bold,
  font,
  foregroundStyle,
  italic,
  strikethrough,
  type ModifierConfig,
} from "@expo/ui/swift-ui/modifiers";

import { useTheme } from "../theme";
import { parseMessage } from "./message-markup";
import { MessagePreviewShell } from "./preview-shell";

interface Props {
  text: string;
  width: number;
}

export function MessagePreview({ text, width }: Props) {
  const { colors } = useTheme();
  const base = colors.textSecondary;
  const dim = colors.textTertiary;

  if (!text.trim()) return null;

  return (
    <MessagePreviewShell width={width}>
      {parseMessage(text).map((line) => (
        <SwiftText key={line.raw} modifiers={[font({ size: 14 }), foregroundStyle(base)]}>
          {line.prefix ? (
            <SwiftText modifiers={[foregroundStyle(line.prefixMuted ? dim : base)]}>
              {line.prefix}
            </SwiftText>
          ) : null}
          {line.segments.map((segment, index) => {
            const modifiers: ModifierConfig[] = [foregroundStyle(base)];
            if (segment.bold) modifiers.push(bold());
            if (segment.italic) modifiers.push(italic());
            if (segment.strike) {
              modifiers.push(strikethrough({ isActive: true, pattern: "solid", color: base }));
            }
            if (segment.mono) {
              modifiers.push(font({ design: "monospaced", size: 12 }));
              modifiers.push(background(colors.surfaceStrong));
            }
            return (
              <SwiftText key={`${line.raw}-${index}`} modifiers={modifiers}>
                {segment.text}
              </SwiftText>
            );
          })}
        </SwiftText>
      ))}
    </MessagePreviewShell>
  );
}
