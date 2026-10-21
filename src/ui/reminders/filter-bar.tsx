import { Row, ScrollView } from "@expo/ui";

import { Chip } from "../chip";
import { useMetrics } from "../theme";

interface Props {
  filter: string;
  todayCount: number;
  priorityCount: number;
  allTags: string[];
  onFilterChange: (filter: string) => void;
  onTagPickerOpen: () => void;
}

export function FilterBar({
  filter,
  todayCount,
  priorityCount,
  allTags,
  onFilterChange,
  onTagPickerOpen,
}: Props) {
  const { contentWidth } = useMetrics();
  const isTagActive = !["all", "today", "priority"].includes(filter);

  return (
    <ScrollView direction="horizontal" showsIndicators={false} style={{ width: contentWidth }}>
      <Row spacing={8} style={{ paddingVertical: 2 }}>
        <Chip label="All" selected={filter === "all"} onPress={() => onFilterChange("all")} />
        <Chip
          label="My Day"
          icon="sun"
          tone="accent"
          selected={filter === "today"}
          count={todayCount}
          onPress={() => onFilterChange(filter === "today" ? "all" : "today")}
        />
        <Chip
          label="Priority"
          icon="star"
          tone="warning"
          selected={filter === "priority"}
          count={priorityCount}
          onPress={() => onFilterChange(filter === "priority" ? "all" : "priority")}
        />
        <Chip
          label={isTagActive ? filter : "Tags"}
          icon="tag"
          tone="tag"
          selected={isTagActive}
          count={isTagActive ? undefined : allTags.length}
          onPress={onTagPickerOpen}
        />
      </Row>
    </ScrollView>
  );
}
