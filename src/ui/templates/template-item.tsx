import { Row, Spacer } from "@expo/ui";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

import { haptics, ImpactFeedbackStyle } from "../../lib/haptics";
import { AppButton } from "../app-button";
import { AppText } from "../app-text";
import { Card } from "../card";
import { IconButton } from "../icon-button";
import { MessageEditor } from "../message/message-editor";
import { useTheme } from "../theme";

interface Props {
  template: { id: number; text: string };
  width: number;
  onDelete: (id: number) => void;
  onUpdate: (id: number, newText: string) => void;
}

export function TemplateItem({ template, width, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const { colors } = useTheme();
  const innerWidth = width - 28;

  const startEditing = () => {
    setEditText(template.text);
    setEditing(true);
  };

  const save = () => {
    const trimmed = editText.trim();
    if (trimmed) onUpdate(template.id, trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <Card width={width} padding={14} gap={10}>
        <MessageEditor
          value={editText}
          onChangeText={setEditText}
          placeholder="Edit template…"
          width={innerWidth}
        />
        <Row spacing={8} style={{ width: innerWidth }}>
          <AppButton
            label="Cancel"
            variant="secondary"
            width={(innerWidth - 8) / 2}
            height={42}
            onPress={() => setEditing(false)}
          />
          <AppButton label="Save" width={(innerWidth - 8) / 2} height={42} onPress={save} />
        </Row>
      </Card>
    );
  }

  return (
    <Card width={width} padding={14} gap={0}>
      <Row alignment="center" spacing={8} style={{ width: innerWidth }}>
        <Row alignment="center" onPress={startEditing} style={{ width: innerWidth - 72 }}>
          <AppText variant="callout" numberOfLines={3}>
            {template.text}
          </AppText>
        </Row>
        <Spacer flexible />
        <IconButton
          name="copy"
          size={16}
          width={32}
          height={32}
          background="transparent"
          color={colors.textTertiary}
          onPress={() => {
            Clipboard.setStringAsync(template.text);
            haptics.impactAsync(ImpactFeedbackStyle.Light);
          }}
        />
        <IconButton
          name="trash"
          size={16}
          width={32}
          height={32}
          background="transparent"
          color={colors.danger}
          onPress={() => onDelete(template.id)}
        />
      </Row>
    </Card>
  );
}
