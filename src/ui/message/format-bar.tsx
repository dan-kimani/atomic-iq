import { Row, Spacer } from "@expo/ui";

import { AppIcon, type AppIconName } from "../app-icon";
import { radius, useTheme } from "../theme";

interface FormatBarProps {
  onFormat: (wrapper: string, linePrefix?: boolean) => void;
  width: number;
}

interface FormatItem {
  icon: AppIconName;
  wrapper: string;
  line?: boolean;
  label: string;
}

const INLINE: FormatItem[] = [
  { icon: "bold", wrapper: "*", label: "Bold" },
  { icon: "italic", wrapper: "_", label: "Italic" },
  { icon: "strikethrough", wrapper: "~", label: "Strikethrough" },
  { icon: "code", wrapper: "`", label: "Monospace" },
];

const LINE: FormatItem[] = [
  { icon: "list", wrapper: "* ", line: true, label: "Bullet list" },
  { icon: "list-ordered", wrapper: "1. ", line: true, label: "Numbered list" },
  { icon: "quote", wrapper: "> ", line: true, label: "Quote" },
];

export function FormatBar({ onFormat, width }: FormatBarProps) {
  const { colors } = useTheme();
  const button = Math.floor((width - 6 * 6) / 7);

  return (
    <Row spacing={6} style={{ width }}>
      {[...INLINE, ...LINE].map((item) => (
        <Row
          key={item.label}
          alignment="center"
          onPress={() => onFormat(item.wrapper, item.line)}
          style={{
            width: button,
            height: 34,
            borderRadius: radius.small,
            backgroundColor: colors.surfaceMuted,
          }}
        >
          <Spacer flexible />
          <AppIcon name={item.icon} size={16} color={colors.textSecondary} />
          <Spacer flexible />
        </Row>
      ))}
    </Row>
  );
}
