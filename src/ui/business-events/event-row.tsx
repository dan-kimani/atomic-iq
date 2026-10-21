import { Column, Row, Spacer } from "@expo/ui";

import type { BusinessEventData } from "../../store/useBusinessEventStore";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { Card } from "../card";
import { radius, useTheme } from "../theme";
import { fmtReminderSchedule, parseTags } from "./format";

interface Props {
  event: BusinessEventData;
  width: number;
  selectionMode: boolean;
  selected: boolean;
  onOpen: () => void;
  onToggleSelection: () => void;
  onToggleStatus: () => void;
}

export function BusinessEventRow({
  event,
  width,
  selectionMode,
  selected,
  onOpen,
  onToggleSelection,
  onToggleStatus,
}: Props) {
  const { colors } = useTheme();
  const innerWidth = width - 28;
  const statusWidth = 64;
  const mainWidth = innerWidth - statusWidth - 8;
  const tags = parseTags(event.tags);
  const reminder = fmtReminderSchedule(event);
  const active = event.status === "active";

  return (
    <Card width={width} padding={14} gap={6}>
      <Row alignment="center" spacing={8} style={{ width: innerWidth }}>
        <Row
          alignment="center"
          spacing={8}
          onPress={selectionMode ? onToggleSelection : onOpen}
          style={{ width: mainWidth }}
        >
          {selectionMode ? (
            <AppIcon
              name={selected ? "check-circle" : "circle"}
              size={20}
              color={selected ? colors.accent : colors.textTertiary}
            />
          ) : null}
          <Column spacing={3} style={{ width: mainWidth - (selectionMode ? 28 : 0) }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {event.name}
            </AppText>
            {event.period ? (
              <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
                {event.period}
              </AppText>
            ) : null}
            {reminder ? (
              <Row alignment="center" spacing={4}>
                <AppIcon name="bell" size={11} color={colors.warning} />
                <AppText variant="caption" color={colors.warningSoftText} numberOfLines={1}>
                  {reminder}
                </AppText>
              </Row>
            ) : null}
            {tags.length > 0 ? (
              <AppText variant="caption" color={colors.tagSoftText} numberOfLines={1}>
                {tags.map((tag) => `#${tag}`).join("  ")}
              </AppText>
            ) : null}
            <AppText variant="caption" color={colors.textTertiary}>
              {`${event.contactCount} contact${event.contactCount === 1 ? "" : "s"}`}
            </AppText>
          </Column>
        </Row>
        <Spacer flexible />
        <Row
          alignment="center"
          onPress={onToggleStatus}
          style={{
            width: statusWidth,
            height: 28,
            borderRadius: radius.pill,
            backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
          }}
        >
          <Spacer flexible />
          <AppText variant="caption" color={active ? colors.accentSoftText : colors.textSecondary}>
            {active ? "Active" : "Done"}
          </AppText>
          <Spacer flexible />
        </Row>
      </Row>
    </Card>
  );
}
