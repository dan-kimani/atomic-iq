import { Column, Row, Spacer } from "@expo/ui";
import { router } from "expo-router";

import { AppIcon, type AppIconName } from "../app-icon";
import { AppText } from "../app-text";
import { radius, useTheme } from "../theme";

interface QuickAction {
  icon: AppIconName;
  label: string;
  route: string;
  color: string;
  soft: string;
}

interface Props {
  width: number;
}

export function QuickActions({ width }: Props) {
  const { colors } = useTheme();
  const actions: QuickAction[] = [
    {
      icon: "bell",
      label: "Reminders",
      route: "/reminders",
      color: colors.warning,
      soft: colors.warningSoft,
    },
    {
      icon: "templates",
      label: "Templates",
      route: "/templates",
      color: colors.tag,
      soft: colors.tagSoft,
    },
    {
      icon: "events",
      label: "Events",
      route: "/business-events",
      color: colors.info,
      soft: colors.infoSoft,
    },
    {
      icon: "broadcast",
      label: "Broadcast",
      route: "/broadcast",
      color: colors.brand,
      soft: colors.accentSoft,
    },
  ];
  const itemWidth = Math.floor((width - 3 * 8) / 4);

  return (
    <Row spacing={8} style={{ width }}>
      {actions.map((action) => (
        <Column
          key={action.label}
          alignment="center"
          onPress={() => router.push(action.route as never)}
          style={{
            width: itemWidth,
            height: 68,
            backgroundColor: colors.surface,
            borderRadius: radius.large,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Column alignment="center" spacing={6} style={{ width: itemWidth, paddingTop: 8 }}>
            <Row
              alignment="center"
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: action.soft,
              }}
            >
              <Spacer flexible />
              <AppIcon name={action.icon} size={17} color={action.color} />
              <Spacer flexible />
            </Row>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {action.label}
            </AppText>
          </Column>
        </Column>
      ))}
    </Row>
  );
}
