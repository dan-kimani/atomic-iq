import { BottomSheet, Column, Row, ScrollView, Spacer } from "@expo/ui";
import { useState } from "react";

import { AppButton } from "../app-button";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { AppTextInput } from "../app-text-input";
import { IconButton } from "../icon-button";
import { radius, useMetrics, useTheme } from "../theme";

interface Props {
  visible: boolean;
  tags: string[];
  tagCounts: Record<string, number>;
  onSelect: (tag: string) => void;
  onDelete: (tag: string) => void;
  onCreate: (tag: string) => void;
  onClose: () => void;
}

export function TagPickerSheet({
  visible,
  tags,
  tagCounts,
  onSelect,
  onDelete,
  onCreate,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { sheetWidth } = useMetrics();
  const [tagName, setTagName] = useState("");

  const handleCreate = () => {
    const trimmed = tagName.trim();
    if (trimmed) onCreate(trimmed);
    setTagName("");
  };

  return (
    <BottomSheet isPresented={visible} onDismiss={onClose} snapPoints={["half", "full"]}>
      <Column spacing={12} style={{ width: sheetWidth }}>
        <Row alignment="center" style={{ width: sheetWidth }}>
          <AppText variant="title">Tags</AppText>
          <Spacer flexible />
          <IconButton name="close" size={16} background={colors.surfaceMuted} onPress={onClose} />
        </Row>

        <Row spacing={8} alignment="center" style={{ width: sheetWidth }}>
          <AppTextInput
            value={tagName}
            onChangeText={setTagName}
            placeholder="New tag name"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            style={{ width: sheetWidth - 50, height: 42 }}
            textStyle={{ fontSize: 14 }}
          />
          <IconButton
            name="check"
            size={16}
            width={42}
            height={42}
            background={colors.accentSoft}
            color={colors.accent}
            onPress={handleCreate}
          />
        </Row>

        <ScrollView
          direction="vertical"
          showsIndicators={false}
          style={{ width: sheetWidth, height: 320 }}
        >
          <Column spacing={6} style={{ width: sheetWidth }}>
            {tags.length === 0 ? (
              <AppText variant="subheadline" color={colors.textTertiary} align="center">
                No tags yet. Create one above.
              </AppText>
            ) : null}
            {tags.map((tag) => (
              <Row
                key={tag}
                alignment="center"
                spacing={8}
                style={{
                  width: sheetWidth,
                  height: 48,
                  paddingHorizontal: 10,
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radius.small,
                }}
              >
                <Row
                  alignment="center"
                  spacing={8}
                  onPress={() => onSelect(tag)}
                  style={{ width: sheetWidth - 64 }}
                >
                  <AppIcon name="tag" size={14} color={colors.tag} />
                  <AppText variant="callout" numberOfLines={1}>
                    {tag}
                  </AppText>
                  <Spacer flexible />
                  <AppText variant="subheadline" color={colors.textSecondary}>
                    {String(tagCounts[tag] ?? 0)}
                  </AppText>
                </Row>
                <Spacer flexible />
                <IconButton
                  name="trash"
                  size={15}
                  width={32}
                  height={32}
                  background="transparent"
                  color={colors.danger}
                  onPress={() => onDelete(tag)}
                />
              </Row>
            ))}
          </Column>
        </ScrollView>

        <AppButton label="Done" variant="secondary" width={sheetWidth} onPress={onClose} />
      </Column>
    </BottomSheet>
  );
}
