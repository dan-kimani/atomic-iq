import { Column, Row, Spacer } from "@expo/ui";

import { formatPhoneNumber } from "../../store/useAppStore";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { Card } from "../card";
import { IconButton } from "../icon-button";
import { radius, useTheme } from "../theme";

export interface ReminderData {
  id: number;
  phoneNumber: string;
  countryCode: string;
  message: string;
  scheduledAt: number;
  notificationId: string | null;
  completed: number;
  priority: number;
  myDay: number;
  tags: string | null;
}

interface Props {
  reminder: ReminderData;
  isOverdue: boolean;
  isCompleted?: boolean;
  width: number;
  onMenu: () => void;
}

function Badge({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <Row
      alignment="center"
      style={{
        height: 20,
        paddingHorizontal: 7,
        borderRadius: radius.pill,
        backgroundColor: background,
      }}
    >
      <AppText variant="caption" color={color}>
        {label}
      </AppText>
    </Row>
  );
}

export function ReminderRow({ reminder, isOverdue, isCompleted = false, width, onMenu }: Props) {
  const { colors } = useTheme();
  const innerWidth = width - 28;
  const mainWidth = innerWidth - 40;
  const tags =
    reminder.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => `#${tag}`)
      .join("  ") ?? "";

  return (
    <Card width={width} padding={14} gap={4} opacity={isCompleted ? 0.62 : 1}>
      <Row alignment="center" spacing={8} style={{ width: innerWidth }}>
        <Column spacing={3} style={{ width: mainWidth }}>
          <Row alignment="center" spacing={6}>
            {isCompleted ? <AppIcon name="check" size={14} color={colors.accent} /> : null}
            <AppText variant="bodyStrong" numberOfLines={1}>
              {`${reminder.countryCode} ${formatPhoneNumber(reminder.phoneNumber)}`}
            </AppText>
          </Row>
          {reminder.message ? (
            <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={2}>
              {reminder.message}
            </AppText>
          ) : null}
          <Row alignment="center" spacing={5}>
            <AppIcon
              name="clock"
              size={11}
              color={isOverdue ? colors.danger : colors.textTertiary}
            />
            <AppText
              variant="caption"
              color={isOverdue ? colors.danger : colors.textTertiary}
              numberOfLines={1}
            >
              {isCompleted
                ? `Completed ${new Date(reminder.scheduledAt).toLocaleString()}`
                : `${isOverdue ? "Overdue · " : ""}${new Date(reminder.scheduledAt).toLocaleString()}`}
            </AppText>
          </Row>
          {!isCompleted && (reminder.priority === 1 || reminder.myDay === 1 || tags) ? (
            <Row alignment="center" spacing={6} style={{ width: mainWidth }}>
              {reminder.priority === 1 ? (
                <Badge
                  label="Priority"
                  color={colors.warningSoftText}
                  background={colors.warningSoft}
                />
              ) : null}
              {reminder.myDay === 1 ? (
                <Badge label="My Day" color={colors.infoSoftText} background={colors.infoSoft} />
              ) : null}
              {tags ? (
                <AppText variant="caption" color={colors.tagSoftText} numberOfLines={1}>
                  {tags}
                </AppText>
              ) : null}
            </Row>
          ) : null}
        </Column>
        <Spacer flexible />
        <IconButton
          name="more"
          size={16}
          width={32}
          height={32}
          background="transparent"
          color={colors.textTertiary}
          onPress={onMenu}
        />
      </Row>
    </Card>
  );
}
