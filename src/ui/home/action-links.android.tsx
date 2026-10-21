import { FlowRow } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";

import { ActionLink, type ActionLinkItem } from "./action-link";

interface Props {
  items: ActionLinkItem[];
  width: number;
}

/**
 * Compose's `FlowRow` wraps items that do not fit and distributes each row edge to
 * edge, so the links reflow on narrow screens instead of overflowing.
 */
export function ActionLinks({ items }: Props) {
  return (
    <FlowRow
      horizontalArrangement="spaceBetween"
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={[fillMaxWidth()]}
    >
      {items.map((item) => (
        <ActionLink key={item.label} {...item} />
      ))}
    </FlowRow>
  );
}
