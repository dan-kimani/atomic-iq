import { BottomSheet, Column, Row, ScrollView, Spacer } from "@expo/ui";

import { AppButton } from "./app-button";
import { AppIcon, type AppIconName } from "./app-icon";
import { AppText } from "./app-text";
import { radius, useMetrics, useTheme } from "./theme";

export interface SheetAction {
  label: string;
  icon: AppIconName;
  onPress: () => void;
  destructive?: boolean;
  detail?: string;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: SheetAction[];
}

export function ActionSheet({ visible, onClose, title, subtitle, actions }: ActionSheetProps) {
  const { colors } = useTheme();
  const { sheetWidth } = useMetrics();
  // Without a snap point the sheet sizes to its content, so every action and the
  // cancel button stay visible; long menus simply take more vertical space.
  const listHeight = actions.length * 56 + 8;

  return (
    <BottomSheet isPresented={visible} onDismiss={onClose}>
      <Column spacing={4} style={{ width: sheetWidth }}>
        {title ? (
          <Column spacing={2} style={{ width: sheetWidth, paddingBottom: 8 }}>
            <AppText variant="headline" numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </Column>
        ) : null}

        <ScrollView
          direction="vertical"
          showsIndicators
          style={{ width: sheetWidth, height: listHeight }}
        >
          <Column spacing={4} style={{ width: sheetWidth }}>
            {actions.map((action) => (
              <Row
                key={action.label}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                style={{ width: sheetWidth, borderRadius: radius.small }}
              >
                <Row
                  alignment="center"
                  spacing={12}
                  style={{
                    width: sheetWidth,
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                  }}
                >
                  <Row
                    alignment="center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      backgroundColor: action.destructive ? colors.dangerSoft : colors.surfaceMuted,
                    }}
                  >
                    <Spacer flexible />
                    <AppIcon
                      name={action.icon}
                      size={17}
                      color={action.destructive ? colors.danger : colors.textSecondary}
                    />
                    <Spacer flexible />
                  </Row>
                  <AppText
                    variant="body"
                    color={action.destructive ? colors.danger : colors.text}
                    numberOfLines={1}
                  >
                    {action.label}
                  </AppText>
                  <Spacer flexible />
                  {action.detail ? (
                    <AppText variant="subheadline" color={colors.textTertiary} numberOfLines={1}>
                      {action.detail}
                    </AppText>
                  ) : null}
                </Row>
              </Row>
            ))}
          </Column>
        </ScrollView>

        <Row style={{ width: sheetWidth, paddingTop: 10 }}>
          <AppButton label="Cancel" variant="secondary" width={sheetWidth} onPress={onClose} />
        </Row>
      </Column>
    </BottomSheet>
  );
}
