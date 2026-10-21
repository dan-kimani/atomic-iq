import { Host } from "@expo/ui";
import { usePathname, useRouter } from "expo-router";
import type { ComponentRef, RefObject } from "react";
import { Pressable, View } from "react-native";

import { SoftTabBarGlass } from "./fade-header";
import { getActiveTabKey, TabBar, TABS } from "./tab-bar";
import { useMetrics, useTheme, withAlpha } from "./theme";

interface Props {
  blurTarget: RefObject<ComponentRef<typeof View> | null>;
}

export function FloatingTabBar({ blurTarget }: Props) {
  const { colors, scheme } = useTheme();
  const { contentWidth, insets } = useMetrics();
  const pathname = usePathname();
  const router = useRouter();
  const fadeHeight = insets.bottom + 156;
  const activeKey = getActiveTabKey(pathname);
  const current = pathname.replace(/\/+$/, "") || "/";
  const isTabRoot =
    current === "/" ||
    current === "/broadcast" ||
    current === "/reminders" ||
    current === "/business-events" ||
    current === "/settings" ||
    current === "/templates";

  const navigate = (route: string) => {
    if (route === current) return;
    if (route === "/") {
      // Reset to Home rather than stacking another Home entry.
      router.dismissAll();
      router.replace("/");
      return;
    }
    if (current === "/") {
      // Home is the parent: each tab is pushed directly on top of it.
      router.push(route as never);
      return;
    }
    if (isTabRoot) {
      // Replace the previous tab so tabs never chain beneath each other.
      router.replace(route as never);
      return;
    }
    // From a nested detail page, collapse back to Home first.
    router.dismissAll();
    router.push(route as never);
  };

  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: fadeHeight,
          experimental_backgroundImage: `linear-gradient(to bottom, ${withAlpha(colors.background, 0)} 0%, ${withAlpha(colors.background, 0.4)} 35%, ${withAlpha(colors.background, 0.85)} 70%, ${withAlpha(colors.background, 0.98)} 100%)`,
        }}
      />
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          alignItems: "center",
          paddingBottom: insets.bottom + 8,
        }}
      >
        <View style={{ width: contentWidth, height: 62 }}>
          <SoftTabBarGlass
            mask={require("../../assets/tab-bar-mask.png")}
            blurTarget={blurTarget}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View style={{ width: "100%", height: "100%" }}>
            <Host colorScheme={scheme} seedColor={colors.accent} matchContents>
              <TabBar width={contentWidth} activePath={pathname} />
            </Host>
          </View>
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              flexDirection: "row",
              paddingHorizontal: 6,
            }}
          >
            {TABS.map((tab) => (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: tab.key === activeKey }}
                onPress={() => navigate(tab.route)}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </View>
      </View>
    </>
  );
}
