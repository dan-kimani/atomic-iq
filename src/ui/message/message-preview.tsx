import { AppText } from "../app-text";
import { useTheme } from "../theme";
import { parseMessage } from "./message-markup";
import { MessagePreviewShell } from "./preview-shell";

interface Props {
  text: string;
  width: number;
}

/**
 * Web fallback preview. Native builds use platform-specific renderers with
 * inline SwiftUI / Compose text spans.
 */
export function MessagePreview({ text, width }: Props) {
  const { colors } = useTheme();

  if (!text.trim()) return null;

  return (
    <MessagePreviewShell width={width}>
      {parseMessage(text).map((line) => (
        <AppText key={line.raw} variant="subheadline" color={colors.textSecondary}>
          {(line.prefix ?? "") + line.raw}
        </AppText>
      ))}
    </MessagePreviewShell>
  );
}
