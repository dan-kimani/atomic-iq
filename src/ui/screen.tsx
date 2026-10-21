import { Host } from "@expo/ui";
import { BlurTargetView } from "expo-blur";
import { useRef, type ComponentRef, type ReactNode } from "react";
import { View } from "react-native";

import { FadeHeader } from "./fade-header";
import { useHostTopInset, useMetrics, useTheme } from "./theme";

interface ScreenProps {
  header: ReactNode;
  children: ReactNode;
  overlays?: ReactNode;
}

const HEADER_HEIGHT = 58;

/**
 * Full-screen React Native shell. `@expo/ui` cannot host an Expo Router stack,
 * so the shell stays a plain View and every visible surface inside it is rendered
 * by a native `Host`.
 *
 * The header floats above the scroll content with a blurred backing that fades
 * out at its bottom edge. Content scrolls behind it instead of stopping at a
 * hard header boundary.
 */
export function Screen({ header, children, overlays }: ScreenProps) {
  const { colors, scheme } = useTheme();
  const topInset = useHostTopInset();
  const { pagePadding } = useMetrics();
  const blurTargetRef = useRef<ComponentRef<typeof View>>(null);
  const headerTop = topInset + 12;
  const headerBottom = headerTop + HEADER_HEIGHT;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <Host
          colorScheme={scheme}
          seedColor={colors.accent}
          useViewportSizeMeasurement
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          {children}
        </Host>
      </BlurTargetView>

      <FadeHeader
        height={headerBottom}
        opacity={1}
        glowHeight={headerBottom + 80}
        blurTarget={blurTargetRef}
      >
        <View style={{ paddingTop: headerTop, paddingHorizontal: pagePadding }}>
          <Host colorScheme={scheme} seedColor={colors.accent} matchContents>
            {header}
          </Host>
        </View>
      </FadeHeader>

      {overlays}
    </View>
  );
}
