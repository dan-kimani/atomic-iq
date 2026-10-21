import { Column, Row, Spacer } from "@expo/ui";
import { useState, type ReactNode } from "react";

import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { radius, useTheme } from "../theme";

interface PreviewShellProps {
  width: number;
  children: ReactNode;
}

export function MessagePreviewShell({ width, children }: PreviewShellProps) {
  const [expanded, setExpanded] = useState(true);
  const { colors } = useTheme();

  return (
    <Column
      spacing={0}
      style={{
        width,
        backgroundColor: colors.accentSoft,
        borderRadius: radius.small,
        paddingHorizontal: 12,
        paddingVertical: 2,
      }}
    >
      <Row
        alignment="center"
        onPress={() => setExpanded((value) => !value)}
        style={{ width: width - 24, height: 38 }}
      >
        <AppText variant="caption" color={colors.accentSoftText}>
          PREVIEW
        </AppText>
        <Spacer flexible />
        <AppText variant="caption" color={colors.accentSoftText}>
          {expanded ? "Hide" : "Show"}
        </AppText>
        <AppIcon
          name={expanded ? "chevron-down" : "chevron-right"}
          size={12}
          color={colors.accentSoftText}
        />
      </Row>
      {expanded ? (
        <Column spacing={2} style={{ width: width - 24, paddingBottom: 10 }}>
          {children}
        </Column>
      ) : null}
    </Column>
  );
}
