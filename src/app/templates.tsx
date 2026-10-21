import { Column, ScrollView } from "@expo/ui";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { useAppStore } from "../store/useAppStore";
import { AppButton } from "../ui/app-button";
import { Card } from "../ui/card";
import { ConfirmSheet, type ConfirmAction } from "../ui/confirm-sheet";
import { MessageEditor } from "../ui/message/message-editor";
import { PageHeader } from "../ui/page-header";
import { Screen } from "../ui/screen";
import { EmptyState, SectionHeader } from "../ui/section-header";
import { TemplateItem } from "../ui/templates/template-item";
import { useMetrics } from "../ui/theme";

export default function TemplatesScreen() {
  const { width, contentWidth, insets } = useMetrics();
  const templates = useAppStore((state) => state.templates);
  const loadTemplates = useAppStore((state) => state.loadTemplates);
  const addTemplate = useAppStore((state) => state.addTemplate);
  const deleteTemplate = useAppStore((state) => state.deleteTemplate);
  const [newText, setNewText] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates]),
  );

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addTemplate(text);
    setNewText("");
  };

  const handleUpdate = (id: number, text: string) => {
    deleteTemplate(id);
    addTemplate(text);
  };

  const requestDelete = (id: number) => {
    setConfirmAction({
      title: "Delete template?",
      description: "This quick response will be removed from every composer.",
      confirmLabel: "Delete",
      onConfirm: () => deleteTemplate(id),
    });
  };

  const innerWidth = contentWidth - 32;

  return (
    <Screen
      header={
        <PageHeader
          title="Quick Responses"
          subtitle={`${templates.length} saved template${templates.length === 1 ? "" : "s"}`}
        />
      }
      overlays={<ConfirmSheet action={confirmAction} onClose={() => setConfirmAction(null)} />}
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
          <Card width={contentWidth} padding={16} gap={10}>
            <SectionHeader title="New template" width={innerWidth} />
            <MessageEditor
              value={newText}
              onChangeText={setNewText}
              placeholder="Write a quick response…"
              width={innerWidth}
            />
            <AppButton
              label="Add template"
              icon="plus"
              width={innerWidth}
              height={46}
              disabled={!newText.trim()}
              onPress={handleAdd}
            />
          </Card>

          {templates.length === 0 ? (
            <EmptyState
              icon="templates"
              title="No templates yet"
              message="Save order updates, payment requests, and follow-ups here."
              width={contentWidth}
            />
          ) : (
            <Column spacing={8} style={{ width: contentWidth }}>
              <SectionHeader title="Saved" width={contentWidth} />
              {templates.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  width={contentWidth}
                  onDelete={requestDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </Column>
          )}
        </Column>
      </ScrollView>
    </Screen>
  );
}
