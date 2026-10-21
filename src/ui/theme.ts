import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIsDark } from "../hooks/useIsDark";

interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  icon: string;
  accent: string;
  brand: string;
  accentForeground: string;
  accentSoft: string;
  accentSoftText: string;
  danger: string;
  dangerSoft: string;
  dangerSoftText: string;
  warning: string;
  warningSoft: string;
  warningSoftText: string;
  info: string;
  infoSoft: string;
  infoSoftText: string;
  note: string;
  noteSoft: string;
  noteSoftText: string;
  tag: string;
  tagSoft: string;
  tagSoftText: string;
  overlay: string;
}

const light: ThemeColors = {
  background: "#F5F7F6",
  surface: "#FFFFFF",
  surfaceMuted: "#F2F4F7",
  surfaceStrong: "#E4E7EC",
  border: "#EAECF0",
  borderStrong: "#D0D5DD",
  text: "#101828",
  textSecondary: "#475467",
  textTertiary: "#667085",
  icon: "#667085",
  accent: "#067647",
  brand: "#16B364",
  accentForeground: "#FFFFFF",
  accentSoft: "#ECFDF3",
  accentSoftText: "#067647",
  danger: "#D92D20",
  dangerSoft: "#FEF3F2",
  dangerSoftText: "#B42318",
  warning: "#F79009",
  warningSoft: "#FFFAEB",
  warningSoftText: "#B54708",
  info: "#2E90FA",
  infoSoft: "#EFF8FF",
  infoSoftText: "#175CD3",
  note: "#7A5AF8",
  noteSoft: "#F4F3FF",
  noteSoftText: "#5925DC",
  tag: "#6938EF",
  tagSoft: "#F4F3FF",
  tagSoftText: "#5925DC",
  overlay: "rgba(16, 24, 40, 0.45)",
};

const dark: ThemeColors = {
  background: "#121215",
  surface: "#1D1D21",
  surfaceMuted: "#2A2A30",
  surfaceStrong: "#3A3A42",
  border: "#303037",
  borderStrong: "#4A4A53",
  text: "#EAEAEF",
  textSecondary: "#AAAAB3",
  textTertiary: "#85858E",
  icon: "#AAAAB3",
  accent: "#34D399",
  brand: "#34D399",
  accentForeground: "#03291C",
  accentSoft: "#0B2E23",
  accentSoftText: "#6EE7B7",
  danger: "#F87171",
  dangerSoft: "#3A1414",
  dangerSoftText: "#FCA5A5",
  warning: "#FBBF24",
  warningSoft: "#3A2A0A",
  warningSoftText: "#FCD34D",
  info: "#38BDF8",
  infoSoft: "#082F49",
  infoSoftText: "#7DD3FC",
  note: "#A78BFA",
  noteSoft: "#2A1D45",
  noteSoftText: "#C4B5FD",
  tag: "#818CF8",
  tagSoft: "#1E1B4B",
  tagSoftText: "#A5B4FC",
  overlay: "rgba(0, 0, 0, 0.55)",
};

/** Convert a hex color to rgba so surfaces can be made translucent per theme. */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.startsWith("#") ? color.slice(1) : color;
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;
  if (normalized.length !== 6 || /[^0-9a-f]/i.test(normalized)) return color;
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useTheme() {
  const isDark = useIsDark();
  return {
    isDark,
    scheme: isDark ? ("dark" as const) : ("light" as const),
    colors: isDark ? dark : light,
  };
}

export function useMetrics(pagePadding = 16) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableWidth = Math.max(0, width - insets.left - insets.right);
  const availableHeight = Math.max(0, height - insets.top - insets.bottom);

  return {
    width: availableWidth,
    screenWidth: width,
    height: availableHeight,
    screenHeight: height,
    insets,
    pagePadding,
    contentWidth: Math.max(0, availableWidth - pagePadding * 2),
    sheetWidth: Math.max(0, availableWidth - 32),
  };
}

/** Native hosts already inset iOS/web content; Android needs manual status-bar padding. */
export function useHostTopInset() {
  const insets = useSafeAreaInsets();
  return process.env.EXPO_OS === "android" ? insets.top : 0;
}

export const radius = {
  small: 10,
  medium: 14,
  large: 18,
  xlarge: 20,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 30, fontWeight: "700" as const, lineHeight: 36 },
  heroCard: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26 },
  title: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  headline: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: "600" as const, lineHeight: 21 },
  callout: { fontSize: 15, fontWeight: "400" as const, lineHeight: 21 },
  subheadline: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "600" as const, lineHeight: 17 },
  caption: { fontSize: 11, fontWeight: "600" as const, lineHeight: 15 },
} as const;
