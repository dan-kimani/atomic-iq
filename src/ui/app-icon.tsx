import { Text } from "@expo/ui";
import { Image } from "react-native";

export type AppIconName =
  | "message"
  | "home"
  | "bell"
  | "smile"
  | "templates"
  | "events"
  | "contacts"
  | "broadcast"
  | "grid"
  | "settings"
  | "plus"
  | "close"
  | "check"
  | "circle"
  | "send"
  | "trash"
  | "edit"
  | "phone"
  | "whatsapp"
  | "sms"
  | "save-contact"
  | "tag"
  | "clock"
  | "star"
  | "sun"
  | "calendar"
  | "list"
  | "search"
  | "copy"
  | "refresh"
  | "warning"
  | "moon"
  | "phone-device"
  | "vibrate"
  | "database"
  | "download"
  | "shield"
  | "heart"
  | "globe"
  | "clipboard"
  | "volume"
  | "info"
  | "share"
  | "chevron-right"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "arrow-left"
  | "check-circle"
  | "contrast"
  | "bold"
  | "italic"
  | "strikethrough"
  | "code"
  | "list-ordered"
  | "quote"
  | "more";

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

const GLYPHS: Record<AppIconName, string> = {
  message: "💬",
  home: "⌂",
  bell: "🔔",
  smile: "☺",
  templates: "📝",
  events: "📋",
  contacts: "👥",
  broadcast: "📢",
  grid: "▦",
  settings: "⚙",
  plus: "＋",
  close: "✕",
  check: "✓",
  circle: "○",
  send: "➤",
  trash: "🗑",
  edit: "✎",
  phone: "✆",
  whatsapp: "💬",
  sms: "✉",
  "save-contact": "👤＋",
  tag: "🏷",
  clock: "🕒",
  star: "★",
  sun: "☀",
  calendar: "📅",
  list: "☰",
  search: "🔍",
  copy: "⧉",
  refresh: "↻",
  warning: "⚠",
  moon: "☾",
  "phone-device": "📱",
  vibrate: "≈",
  database: "▤",
  download: "⤓",
  shield: "🛡",
  heart: "♥",
  globe: "🌐",
  clipboard: "📋",
  volume: "🔊",
  info: "ℹ",
  share: "↗",
  "chevron-right": "›",
  "chevron-down": "⌄",
  "chevron-up": "⌃",
  "chevron-left": "‹",
  "arrow-left": "←",
  "check-circle": "◉",
  contrast: "◐",
  bold: "B",
  italic: "I",
  strikethrough: "S",
  code: "</>",
  "list-ordered": "1.",
  quote: "❝",
  more: "⋯",
};

/**
 * Web fallback for the platform-native `@expo/ui` icon. iOS uses SF Symbols and
 * Android uses Material Symbols; web has no native icon host, so a glyph is rendered.
 */
export function AppIcon({ name, size = 20, color }: AppIconProps) {
  if (name === "whatsapp") {
    return (
      <Image
        source={require("../../assets/whatsapp-logo.png")}
        style={{ width: size, height: size, tintColor: color }}
        resizeMode="contain"
      />
    );
  }
  return <Text textStyle={{ fontSize: size, color: color ?? "#6B7280" }}>{GLYPHS[name]}</Text>;
}
