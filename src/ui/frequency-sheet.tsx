import { BottomSheet, Column, Row, Spacer } from "@expo/ui";

import { AppButton } from "./app-button";
import { AppIcon } from "./app-icon";
import { AppText } from "./app-text";
import { IconButton } from "./icon-button";
import { radius, useMetrics, useTheme } from "./theme";

interface Props {
  visible: boolean;
  selected: "hourly" | "daily" | "weekly";
  onSelect: (frequency: "hourly" | "daily" | "weekly") => void;
  onClose: () => void;
}

const OPTIONS: { key: "hourly" | "daily" | "weekly"; label: string }[] = [
  { key: "hourly", label: "Hourly" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
];

export function FrequencyPickerSheet({ visible, selected, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { sheetWidth } = useMetrics();

  return (
    <BottomSheet isPresented={visible} onDismiss={onClose}>
      <Column spacing={10} style={{ width: sheetWidth }}>
        <Row alignment="center" style={{ width: sheetWidth }}>
          <AppText variant="headline">Backup frequency</AppText>
          <Spacer flexible />
          <IconButton name="close" size={16} background={colors.surfaceMuted} onPress={onClose} />
        </Row>

        {OPTIONS.map((option) => {
          const active = selected === option.key;
          return (
            <Row
              key={option.key}
              alignment="center"
              spacing={10}
              onPress={() => {
                onSelect(option.key);
                onClose();
              }}
              style={{
                width: sheetWidth,
                height: 48,
                paddingHorizontal: 12,
                borderRadius: radius.small,
                backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
              }}
            >
              <AppText variant="body" color={active ? colors.accentSoftText : colors.text}>
                {option.label}
              </AppText>
              <Spacer flexible />
              {active ? <AppIcon name="check" size={17} color={colors.accent} /> : null}
            </Row>
          );
        })}

        <AppButton label="Cancel" variant="secondary" width={sheetWidth} onPress={onClose} />
      </Column>
    </BottomSheet>
  );
}
