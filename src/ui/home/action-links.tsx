import { Row } from "@expo/ui";

import { ActionLink, type ActionLinkItem } from "./action-link";

interface Props {
  items: ActionLinkItem[];
  width: number;
}

/**
 * SwiftUI has no flow layout, so the fallback lays the links out in a fixed
 * two-column grid instead of wrapping.
 */
export function ActionLinks({ items, width }: Props) {
  const columnWidth = Math.floor(width / 2);
  const rows: ActionLinkItem[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }

  return (
    <>
      {rows.map((row) => (
        <Row key={row[0].label} alignment="center" style={{ width }}>
          {row.map((item) => (
            <ActionLink key={item.label} {...item} width={columnWidth} />
          ))}
        </Row>
      ))}
    </>
  );
}
