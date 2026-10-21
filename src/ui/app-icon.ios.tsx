import { Icon, RNHostView } from "@expo/ui";
import { Image } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import type { AppIconName, AppIconProps } from "./app-icon";

const SYMBOLS: Record<AppIconName, SFSymbol> = {
  message: "message.fill",
  home: "house",
  bell: "bell.fill",
  smile: "face.smiling",
  templates: "text.bubble.fill",
  events: "checklist",
  contacts: "person.2.fill",
  broadcast: "megaphone.fill",
  grid: "square.grid.2x2",
  settings: "gearshape.fill",
  plus: "plus",
  close: "xmark",
  check: "checkmark",
  circle: "circle",
  send: "paperplane.fill",
  trash: "trash.fill",
  edit: "pencil",
  phone: "phone.fill",
  whatsapp: "phone.bubble.left.fill",
  sms: "envelope.fill",
  "save-contact": "person.badge.plus",
  tag: "tag.fill",
  clock: "clock.fill",
  star: "star.fill",
  sun: "sun.max.fill",
  calendar: "calendar",
  list: "list.bullet",
  search: "magnifyingglass",
  copy: "doc.on.doc",
  refresh: "arrow.clockwise",
  warning: "exclamationmark.triangle.fill",
  moon: "moon.fill",
  "phone-device": "iphone",
  vibrate: "iphone.radiowaves.left.and.right",
  database: "externaldrive.fill",
  download: "arrow.down.circle.fill",
  shield: "shield.fill",
  heart: "heart.fill",
  globe: "globe",
  clipboard: "doc.on.clipboard",
  volume: "speaker.wave.2.fill",
  info: "info.circle.fill",
  share: "square.and.arrow.up",
  "chevron-right": "chevron.right",
  "chevron-down": "chevron.down",
  "chevron-up": "chevron.up",
  "chevron-left": "chevron.left",
  "arrow-left": "arrow.left",
  "check-circle": "checkmark.circle.fill",
  contrast: "circle.lefthalf.filled",
  bold: "bold",
  italic: "italic",
  strikethrough: "strikethrough",
  code: "chevron.left.forwardslash.chevron.right",
  "list-ordered": "list.number",
  quote: "text.quote",
  more: "ellipsis",
};

export function AppIcon({ name, size = 20, color }: AppIconProps) {
  if (name === "whatsapp") {
    return (
      <RNHostView matchContents>
        <Image
          source={require("../../assets/whatsapp-logo.png")}
          style={{ width: size, height: size, tintColor: color }}
          resizeMode="contain"
        />
      </RNHostView>
    );
  }
  return <Icon name={SYMBOLS[name]} size={size} color={color} />;
}
