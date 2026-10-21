import { Row, ScrollView } from "@expo/ui";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

import { haptics, ImpactFeedbackStyle } from "../../lib/haptics";
import { useAppStore } from "../../store/useAppStore";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { AppTextInput } from "../app-text-input";
import { IconButton } from "../icon-button";
import { radius, useTheme } from "../theme";

interface Props {
  onSelect: (text: string) => void;
}

export function TemplateChips({ onSelect }: Props) {
  const templates = useAppStore((state) => state.templates);
  const addTemplate = useAppStore((state) => state.addTemplate);
  const deleteTemplate = useAppStore((state) => state.deleteTemplate);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const { colors } = useTheme();

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) {
      setAdding(false);
      return;
    }
    addTemplate(text);
    setNewText("");
    setAdding(false);
  };

  return (
    <ScrollView direction="horizontal" showsIndicators={false}>
      <Row spacing={6} alignment="center" style={{ paddingVertical: 2 }}>
        {templates.map((template) => (
          <Row key={template.id} spacing={2} alignment="center">
            <Row
              alignment="center"
              onPress={() => onSelect(template.text)}
              style={{
                height: 34,
                paddingHorizontal: 12,
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.pill,
              }}
            >
              <AppText variant="subheadline" color={colors.text} numberOfLines={1}>
                {template.text.length > 32 ? `${template.text.slice(0, 32)}…` : template.text}
              </AppText>
            </Row>
            <IconButton
              name="copy"
              size={13}
              width={24}
              height={24}
              background="transparent"
              color={colors.textTertiary}
              onPress={() => {
                Clipboard.setStringAsync(template.text);
                haptics.impactAsync(ImpactFeedbackStyle.Light);
              }}
            />
            <IconButton
              name="close"
              size={13}
              width={24}
              height={24}
              background="transparent"
              color={colors.textTertiary}
              onPress={() => deleteTemplate(template.id)}
            />
          </Row>
        ))}

        {adding ? (
          <Row spacing={4} alignment="center">
            <AppTextInput
              value={newText}
              onChangeText={setNewText}
              placeholder="New template"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              onBlur={() => {
                if (!newText.trim()) setAdding(false);
              }}
              style={{ width: 168, height: 34, paddingVertical: 6, borderRadius: radius.pill }}
              textStyle={{ fontSize: 13 }}
            />
            <IconButton
              name="check"
              size={15}
              width={30}
              height={30}
              background={colors.accentSoft}
              color={colors.accent}
              onPress={handleAdd}
            />
          </Row>
        ) : (
          <Row
            alignment="center"
            spacing={4}
            onPress={() => setAdding(true)}
            style={{
              height: 34,
              paddingHorizontal: 12,
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.pill,
            }}
          >
            <AppIcon name="plus" size={14} color={colors.textSecondary} />
            <AppText variant="subheadline" color={colors.textSecondary}>
              New
            </AppText>
          </Row>
        )}
      </Row>
    </ScrollView>
  );
}
