import { Column, ScrollView } from "@expo/ui";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { createBroadcast } from "../db";
import { useBroadcastStore } from "../store/useBroadcastStore";
import { BroadcastRow } from "../ui/broadcasts/broadcast-row";
import { PageHeader } from "../ui/page-header";
import { Screen } from "../ui/screen";
import { EmptyState, SectionHeader } from "../ui/section-header";
import { useMetrics, useTheme } from "../ui/theme";

export default function BroadcastListScreen() {
  const { width, contentWidth, insets } = useMetrics();
  const { colors } = useTheme();
  const drafts = useBroadcastStore((state) => state.drafts);
  const loadList = useBroadcastStore((state) => state.loadList);

  useFocusEffect(
    useCallback(() => {
      loadList();
    }, [loadList]),
  );

  return (
    <Screen
      header={
        <PageHeader
          title="Broadcasts"
          subtitle={`${drafts.length} draft${drafts.length === 1 ? "" : "s"}`}
          actions={[
            { name: "refresh", label: "Refresh", onPress: loadList },
            {
              name: "plus",
              label: "New broadcast",
              background: colors.accentSoft,
              color: colors.accent,
              onPress: () => {
                const id = createBroadcast("");
                router.push(`/broadcast/${id}`);
              },
            },
          ]}
        />
      }
    >
      <ScrollView
        direction="vertical"
        showsIndicators={false}
        style={{ width, paddingHorizontal: 16 }}
      >
        <Column
          spacing={16}
          style={{
            width: contentWidth,
            paddingTop: insets.top + 84,
            paddingBottom: insets.bottom + 112,
          }}
        >
          <SectionHeader title="Your drafts" width={contentWidth} />
          {drafts.length === 0 ? (
            <EmptyState
              icon="broadcast"
              title="No broadcasts yet"
              message="Create a message once, then send it to your customers one by one."
              width={contentWidth}
            />
          ) : (
            <Column spacing={8} style={{ width: contentWidth }}>
              {drafts.map((draft) => (
                <BroadcastRow
                  key={draft.id}
                  draft={draft}
                  width={contentWidth}
                  onPress={() => router.push(`/broadcast/${draft.id}`)}
                />
              ))}
            </Column>
          )}
        </Column>
      </ScrollView>
    </Screen>
  );
}
