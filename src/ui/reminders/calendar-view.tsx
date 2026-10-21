import { Column, Row, Spacer } from "@expo/ui";
import { useMemo, useState } from "react";

import { AppText } from "../app-text";
import { IconButton } from "../icon-button";
import { radius, useTheme } from "../theme";

interface Reminder {
  id: number;
  scheduledAt: number;
  completed: number;
}

interface Props {
  reminders: Reminder[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  width: number;
}

const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const GAP = 4;

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(day);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function sameMonth(y1: number, m1: number, y2: number, m2: number): boolean {
  return y1 === y2 && m1 === m2;
}

export function CalendarView({ reminders, selectedDate, onSelectDate, width }: Props) {
  const { colors } = useTheme();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const isCurrentMonth = sameMonth(year, month, today.getFullYear(), today.getMonth());
  const cellWidth = Math.floor((width - GAP * 6) / 7);
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const reminderDates = useMemo(() => {
    const set = new Set<string>();
    for (const reminder of reminders) {
      const date = new Date(reminder.scheduledAt);
      set.add(isoDate(date.getFullYear(), date.getMonth(), date.getDate()));
    }
    return set;
  }, [reminders]);

  const completedDates = useMemo(() => {
    const set = new Set<string>();
    for (const reminder of reminders) {
      if (reminder.completed) {
        const date = new Date(reminder.scheduledAt);
        set.add(isoDate(date.getFullYear(), date.getMonth(), date.getDate()));
      }
    }
    return set;
  }, [reminders]);

  const overdueDates = useMemo(() => {
    const now = Date.now();
    const set = new Set<string>();
    for (const reminder of reminders) {
      if (!reminder.completed && reminder.scheduledAt <= now) {
        const date = new Date(reminder.scheduledAt);
        set.add(isoDate(date.getFullYear(), date.getMonth(), date.getDate()));
      }
    }
    return set;
  }, [reminders]);

  const days = getCalendarDays(year, month);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const monthLabel = new Date(year, month).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  return (
    <Column spacing={10} style={{ width }}>
      <Row alignment="center" style={{ width }}>
        <IconButton
          name="chevron-left"
          size={18}
          background="transparent"
          onPress={goToPrevMonth}
        />
        <Spacer flexible />
        <AppText variant="headline">{monthLabel}</AppText>
        {!isCurrentMonth ? (
          <>
            <Spacer size={8} />
            <Row
              alignment="center"
              onPress={() => {
                setYear(today.getFullYear());
                setMonth(today.getMonth());
              }}
              style={{
                height: 26,
                paddingHorizontal: 10,
                borderRadius: radius.pill,
                backgroundColor: colors.accentSoft,
              }}
            >
              <AppText variant="caption" color={colors.accentSoftText}>
                Today
              </AppText>
            </Row>
          </>
        ) : null}
        <Spacer flexible />
        <IconButton
          name="chevron-right"
          size={18}
          background="transparent"
          onPress={goToNextMonth}
        />
      </Row>

      <Row spacing={GAP} style={{ width }}>
        {DAY_NAMES.map((name) => (
          <Column key={name} alignment="center" style={{ width: cellWidth, height: 22 }}>
            <AppText variant="caption" color={colors.textTertiary}>
              {name}
            </AppText>
          </Column>
        ))}
      </Row>

      {weeks.map((week, weekIndex) => (
        <Row key={`week-${weekIndex}`} spacing={GAP} style={{ width }}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return (
                <Column
                  key={`empty-${weekIndex}-${dayIndex}`}
                  style={{ width: cellWidth, height: 40 }}
                />
              );
            }
            const date = isoDate(year, month, day);
            const isToday = date === todayIso;
            const isSelected = date === selectedDate;
            const has = reminderDates.has(date);
            const isOverdue = overdueDates.has(date);
            const isDone = has && completedDates.has(date) && !overdueDates.has(date);
            const dotColor = isOverdue ? colors.danger : isDone ? colors.accent : colors.tag;

            return (
              <Row
                key={date}
                alignment="center"
                onPress={() => onSelectDate(isSelected ? null : date)}
                style={{
                  width: cellWidth,
                  height: 40,
                  borderRadius: radius.small,
                  backgroundColor: isSelected
                    ? colors.accent
                    : isToday
                      ? colors.surfaceMuted
                      : "transparent",
                }}
              >
                <Spacer flexible />
                <Column alignment="center" spacing={2}>
                  <AppText
                    variant="subheadline"
                    color={
                      isSelected ? colors.accentForeground : isToday ? colors.accent : colors.text
                    }
                  >
                    {String(day)}
                  </AppText>
                  {has ? (
                    <Column
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: isSelected ? colors.accentForeground : dotColor,
                      }}
                    />
                  ) : null}
                </Column>
                <Spacer flexible />
              </Row>
            );
          })}
        </Row>
      ))}

      <Row alignment="center" spacing={14} style={{ width }}>
        <Spacer flexible />
        <Row alignment="center" spacing={4}>
          <Column style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.tag }} />
          <AppText variant="caption" color={colors.textTertiary}>
            Upcoming
          </AppText>
        </Row>
        <Row alignment="center" spacing={4}>
          <Column
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger }}
          />
          <AppText variant="caption" color={colors.textTertiary}>
            Overdue
          </AppText>
        </Row>
        <Row alignment="center" spacing={4}>
          <Column
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }}
          />
          <AppText variant="caption" color={colors.textTertiary}>
            Done
          </AppText>
        </Row>
        <Spacer flexible />
      </Row>
    </Column>
  );
}
