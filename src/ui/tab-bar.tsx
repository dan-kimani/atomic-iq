import { Row, Spacer } from "@expo/ui";

import { AppIcon, type AppIconName } from "./app-icon";
import { BrandLogo } from "./brand-logo";
import { useTheme } from "./theme";

interface TabItem {
  key: string;
  icon: AppIconName;
  label: string;
  route: string;
}

export const TABS: TabItem[] = [
  { key: "home", icon: "home", label: "Home", route: "/" },
  { key: "broadcasts", icon: "broadcast", label: "Broadcasts", route: "/broadcast" },
  { key: "reminders", icon: "bell", label: "Reminders", route: "/reminders" },
  { key: "events", icon: "calendar", label: "Events", route: "/business-events" },
  { key: "settings", icon: "settings", label: "Settings", route: "/settings" },
];

export function getActiveTabKey(pathname: string): string {
  if (pathname.startsWith("/broadcast")) return "broadcasts";
  if (pathname.startsWith("/reminders")) return "reminders";
  if (pathname.startsWith("/business-events")) return "events";
  if (pathname.startsWith("/settings") || pathname.startsWith("/templates")) return "settings";
  return "home";
}

interface Props {
  width: number;
  activePath: string;
}

export function TabBar({ width, activePath }: Props) {
  const { colors } = useTheme();
  const itemWidth = Math.floor((width - 12) / TABS.length);
  const activeKey = getActiveTabKey(activePath);

  return (
    <Row alignment="center" style={{ width, height: 62, paddingHorizontal: 6 }}>
      {TABS.map((tab) => {
        const active = tab.key === activeKey;

        return (
          <Row key={tab.label} alignment="center" style={{ width: itemWidth, height: 54 }}>
            <Spacer flexible />
            <Row
              alignment="center"
              style={{
                width: active ? 54 : 36,
                height: active ? 34 : 36,
                borderRadius: active ? 17 : 18,
                backgroundColor: active ? colors.accentSoft : "transparent",
              }}
            >
              <Spacer flexible />
              {tab.key === "home" ? (
                <BrandLogo size={active ? 30 : 23} />
              ) : (
                <AppIcon
                  name={tab.icon}
                  size={22}
                  color={active ? colors.accent : colors.textTertiary}
                />
              )}
              <Spacer flexible />
            </Row>
            <Spacer flexible />
          </Row>
        );
      })}
    </Row>
  );
}
