import { Text as ComposeText } from "@expo/ui/jetpack-compose";

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
        <ComposeText key={line.raw} color={base} style={{ fontSize: 14, lineHeight: 20 }}>
          {line.prefix ? (
            <ComposeText color={line.prefixMuted ? dim : base}>{line.prefix}</ComposeText>
          ) : null}
          {line.segments.map((segment, index) => (
            <ComposeText
              key={`${line.raw}-${index}`}
              color={segment.mono ? colors.text : base}
              style={{
                fontWeight: segment.bold ? "700" : undefined,
                fontStyle: segment.italic ? "italic" : undefined,
                textDecoration: segment.strike ? "lineThrough" : undefined,
                fontFamily: segment.mono ? "monospace" : undefined,
                background: segment.mono ? colors.surfaceStrong : undefined,
              }}
            >
              {segment.text}
            </ComposeText>
          ))}
        </ComposeText>
      ))}
    </MessagePreviewShell>
  );
}
