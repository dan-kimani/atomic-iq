import MaskedViewBase from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, type ComponentRef, type ReactNode, type RefObject } from "react";
import {
  Animated,
  Image,
  Platform,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme, withAlpha } from "./theme";

const MaskedView = MaskedViewBase as unknown as React.ComponentType<{
  style?: StyleProp<ViewStyle>;
  maskElement?: ReactNode;
  pointerEvents?: "none" | "box-none" | "auto" | "box-only";
  children?: ReactNode;
}>;

const TOP_LOCATIONS = [0, 0.35, 0.6, 0.82, 1] as const;

export function useScrollFade(threshold = 40, forceVisible = false) {
  const [scrollY] = useState(() => new Animated.Value(0));
  const [forced] = useState(() => new Animated.Value(forceVisible ? 1 : 0));

  useEffect(() => {
    Animated.spring(forced, {
      toValue: forceVisible ? 1 : 0,
      stiffness: 300,
      damping: 30,
      useNativeDriver: false,
    }).start();
  }, [forceVisible, forced]);

  const scrollOpacity = scrollY.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const opacity = Animated.add(scrollOpacity, forced).interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const [onScroll] = useState(() =>
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
    }),
  );

  return { opacity, onScroll };
}

interface FadeHeaderProps {
  height: number;
  opacity?: Animated.Value | Animated.AnimatedInterpolation<number> | number;
  glowHeight?: number;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
  /** How far the blur feathers past the header bottom, in dp. */
  blurTail?: number;
  children: ReactNode;
}

export function FadeHeader({
  height,
  opacity = 1,
  glowHeight,
  blurTarget,
  blurTail = 56,
  children,
}: FadeHeaderProps) {
  const { colors, isDark } = useTheme();
  const blurHeight = height + blurTail;
  const blurFadeStart = height / blurHeight;
  const topStops = [
    withAlpha(colors.background, 0.92),
    withAlpha(colors.background, 0.85),
    withAlpha(colors.background, 0.4),
    withAlpha(colors.background, 0.06),
    withAlpha(colors.background, 0),
  ] as const;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: glowHeight ?? height + 130,
          opacity,
        }}
      >
        <LinearGradient
          colors={topStops}
          locations={TOP_LOCATIONS}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: blurHeight,
          opacity,
        }}
      >
        <MaskedView
          style={{ flex: 1 }}
          maskElement={
            <LinearGradient
              colors={["#000000", "#000000", "#00000000"]}
              locations={[0, blurFadeStart, 1] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ flex: 1 }}
            />
          }
        >
          <BlurView
            blurMethod={Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined}
            blurTarget={blurTarget}
            intensity={isDark ? 20 : 12}
            tint={isDark ? "dark" : "light"}
            style={{ flex: 1 }}
          />
        </MaskedView>
      </Animated.View>

      <View>{children}</View>
    </Animated.View>
  );
}

interface SoftTabBarGlassProps {
  mask: ImageSourcePropType;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
  style?: StyleProp<ViewStyle>;
}

/** Frosted floating tab pill with a feathered silhouette. */
export function SoftTabBarGlass({ mask, blurTarget, style }: SoftTabBarGlassProps) {
  const { colors, isDark } = useTheme();

  return (
    <MaskedView
      pointerEvents="none"
      style={style}
      maskElement={
        <Image source={mask} style={{ width: "100%", height: "100%" }} resizeMode="stretch" />
      }
    >
      <View style={{ flex: 1 }}>
        <BlurView
          blurMethod={Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined}
          blurTarget={blurTarget}
          intensity={isDark ? 30 : 22}
          tint={isDark ? "dark" : "light"}
          style={{ flex: 1 }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            experimental_backgroundImage: `linear-gradient(to bottom, ${withAlpha(colors.surface, isDark ? 0.62 : 0.86)} 0%, ${withAlpha(colors.surfaceMuted, isDark ? 0.5 : 0.72)} 46%, ${withAlpha(colors.surfaceStrong, isDark ? 0.32 : 0.38)} 100%)`,
          }}
        />
      </View>
    </MaskedView>
  );
}
