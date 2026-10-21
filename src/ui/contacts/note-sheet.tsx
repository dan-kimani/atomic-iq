import { BottomSheet, Column, Row, ScrollView, Spacer } from "@expo/ui";
import { useState } from "react";

import * as db from "../../db";
import { useAppStore } from "../../store/useAppStore";
import { AppButton } from "../app-button";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { AppTextInput } from "../app-text-input";
import { radius, useMetrics, useTheme } from "../theme";

interface Props {
  visible: boolean;
  phoneNumber: string;
  countryCode: string;
  contactName?: string;
  initialNote: string;
  initialTags: string[];
  onClose: () => void;
  onSave: (note: string, tags: string[]) => void;
}

/**
 * The form lives in a child that only mounts while the sheet is visible, so
 * initial values are set by `useState` instead of an effect that resets state.
 */
export function NoteSheet(props: Props) {
  return (
    <BottomSheet
      isPresented={props.visible}
      onDismiss={props.onClose}
      snapPoints={["half", "full"]}
    >
      {props.visible ? (
        <NoteSheetContent
          key={`${props.phoneNumber}-${props.initialNote}-${props.initialTags.join(",")}`}
          phoneNumber={props.phoneNumber}
          countryCode={props.countryCode}
          contactName={props.contactName}
          initialNote={props.initialNote}
          initialTags={props.initialTags}
          onClose={props.onClose}
          onSave={props.onSave}
        />
      ) : null}
    </BottomSheet>
  );
}

type ContentProps = Omit<Props, "visible">;

function NoteSheetContent({
  phoneNumber,
  countryCode,
  contactName,
  initialNote,
  initialTags,
  onClose,
  onSave,
}: ContentProps) {
  const { colors } = useTheme();
  const { sheetWidth, height } = useMetrics();
  const storeCustomTags = useAppStore((state) => state.customTags);
  const [note, setNote] = useState(initialNote);
  const [tags, setTags] = useState(initialTags);
  const [tagSearch, setTagSearch] = useState("");
  const [allTags] = useState(() => {
    let contactTags: string[] = [];
    let reminderTags: string[] = [];
    try {
      contactTags = db.getAllContactTags();
    } catch {
      // migrations not ready
    }
    try {
      reminderTags = db.getAllTags();
    } catch {
      // migrations not ready
    }
    return [
      ...new Set([...storeCustomTags, ...reminderTags, ...contactTags, ...initialTags]),
    ].sort();
  });

  const filteredTags = tagSearch.trim()
    ? allTags.filter((tag) => tag.toLowerCase().includes(tagSearch.toLowerCase().trim()))
    : allTags;

  const toggleTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  const hasExisting = initialNote.length > 0 || initialTags.length > 0;

  return (
    <Column spacing={14} style={{ width: sheetWidth }}>
      <Column spacing={2} style={{ width: sheetWidth }}>
        <AppText variant="title">{hasExisting ? "Edit details" : "Add details"}</AppText>
        <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
          {contactName || `${countryCode} ${phoneNumber}`}
        </AppText>
      </Column>

      <ScrollView
        direction="vertical"
        showsIndicators={false}
        style={{ width: sheetWidth, height: Math.max(300, height - 280) }}
      >
        <Column spacing={14} style={{ width: sheetWidth }}>
          <Column spacing={6} style={{ width: sheetWidth }}>
            <AppText variant="caption" color={colors.textTertiary}>
              NOTE
            </AppText>
            <AppTextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note about this contact…"
              multiline
              numberOfLines={3}
              style={{ width: sheetWidth, height: 100, paddingTop: 12 }}
              textStyle={{ fontSize: 15 }}
            />
          </Column>

          <Column spacing={6} style={{ width: sheetWidth }}>
            <AppText variant="caption" color={colors.textTertiary}>
              TAGS
            </AppText>
            {allTags.length > 0 ? (
              <>
                <AppTextInput
                  value={tagSearch}
                  onChangeText={setTagSearch}
                  placeholder="Filter tags…"
                  autoCapitalize="none"
                  style={{ width: sheetWidth, height: 42 }}
                  textStyle={{ fontSize: 14 }}
                />
                <Column
                  spacing={2}
                  style={{
                    width: sheetWidth,
                    height: 148,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: radius.small,
                    padding: 4,
                  }}
                >
                  <ScrollView
                    direction="vertical"
                    showsIndicators={false}
                    style={{ width: sheetWidth - 8, height: 140 }}
                  >
                    <Column spacing={2} style={{ width: sheetWidth - 8 }}>
                      {filteredTags.map((tag) => {
                        const selected = tags.includes(tag);
                        return (
                          <Row
                            key={tag}
                            alignment="center"
                            spacing={8}
                            onPress={() => toggleTag(tag)}
                            style={{
                              width: sheetWidth - 8,
                              height: 38,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                              backgroundColor: selected ? colors.tagSoft : "transparent",
                            }}
                          >
                            <AppText variant="callout" numberOfLines={1}>
                              {tag}
                            </AppText>
                            <Spacer flexible />
                            <AppIcon
                              name={selected ? "check-circle" : "circle"}
                              size={17}
                              color={selected ? colors.tag : colors.textTertiary}
                            />
                          </Row>
                        );
                      })}
                      {filteredTags.length === 0 ? (
                        <AppText variant="subheadline" color={colors.textTertiary}>
                          No matching tags
                        </AppText>
                      ) : null}
                    </Column>
                  </ScrollView>
                </Column>
              </>
            ) : (
              <AppText variant="subheadline" color={colors.textTertiary}>
                No tags yet — create them on the Reminders page
              </AppText>
            )}
          </Column>
        </Column>
      </ScrollView>

      <Row spacing={10} style={{ width: sheetWidth }}>
        <AppButton
          label="Cancel"
          variant="secondary"
          width={(sheetWidth - 10) / 2}
          onPress={onClose}
        />
        <AppButton
          label="Save"
          width={(sheetWidth - 10) / 2}
          onPress={() => onSave(note.trim(), tags)}
        />
      </Row>
    </Column>
  );
}
