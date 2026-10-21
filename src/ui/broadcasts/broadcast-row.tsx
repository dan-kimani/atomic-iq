import { Column, Row, Spacer } from "@expo/ui";

import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { Card } from "../card";
import { radius, useTheme } from "../theme";

interface BroadcastDraftRow {
  id: number;
  message: string;
  createdAt: number;
  total: number;
  sent: number;
}

interface Props {
  draft: BroadcastDraftRow;
  width: number;
  onPress: () => void;
}

export function BroadcastRow({ draft, width, onPress }: Props) {
  const { colors } = useTheme();
  const innerWidth = width - 28;
  const done = draft.total > 0 && draft.sent === draft.total;
  const progress = draft.total > 0 ? (draft.sent / draft.total) * innerWidth : 0;

  return (
    <Card width={width} padding={14} gap={8} onPress={onPress}>
      <Row alignment="center" spacing={10} style={{ width: innerWidth }}>
        <Column spacing={3} style={{ width: innerWidth - 28 }}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {draft.message || "No message yet"}
          </AppText>
          <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
            {`${draft.sent}/${draft.total} sent · ${new Date(draft.createdAt).toLocaleDateString()}`}
          </AppText>
        </Column>
        <Spacer flexible />
        {done ? (
          <Row
            alignment="center"
            style={{
              height: 24,
              paddingHorizontal: 8,
              borderRadius: radius.pill,
              backgroundColor: colors.accentSoft,
            }}
          >
            <AppText variant="caption" color={colors.accentSoftText}>
              Done
            </AppText>
          </Row>
        ) : (
          <AppIcon name="chevron-right" size={16} color={colors.textTertiary} />
        )}
      </Row>
      <Row
        style={{
          width: innerWidth,
          height: 5,
          borderRadius: 3,
          backgroundColor: colors.surfaceMuted,
        }}
      >
        <Row
          style={{
            width: progress,
            height: 5,
            borderRadius: 3,
            backgroundColor: done ? colors.accent : colors.tag,
          }}
        />
      </Row>
    </Card>
  );
}
