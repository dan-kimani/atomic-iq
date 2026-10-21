import { BottomSheet, Column, Row, Spacer } from "@expo/ui";
import type { ReactNode } from "react";

import { AppButton } from "./app-button";
import { AppText } from "./app-text";
import { radius, useMetrics, useTheme } from "./theme";

export interface ConfirmAction {
  title: string;
  description: string;
  icon?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmSheetProps {
  action: ConfirmAction | null;
  onClose: () => void;
}

export function ConfirmSheet({ action, onClose }: ConfirmSheetProps) {
  const { colors } = useTheme();
  const { sheetWidth } = useMetrics();
  const destructive = action?.destructive !== false;
  const accentSoft = destructive ? colors.dangerSoft : colors.accentSoft;

  return (
    <BottomSheet isPresented={!!action} onDismiss={onClose}>
      {action ? (
        <Column alignment="center" spacing={16} style={{ width: sheetWidth }}>
          <Row
            alignment="center"
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.large,
              backgroundColor: accentSoft,
            }}
          >
            <Spacer flexible />
            {action.icon}
            {!action.icon ? (
              <AppText variant="title" color={destructive ? colors.danger : colors.accent}>
                !
              </AppText>
            ) : null}
            <Spacer flexible />
          </Row>
          <Column alignment="center" spacing={6} style={{ width: sheetWidth }}>
            <AppText variant="headline" align="center">
              {action.title}
            </AppText>
            <AppText variant="subheadline" color={colors.textSecondary} align="center">
              {action.description}
            </AppText>
          </Column>
          <Row spacing={10} style={{ width: sheetWidth, paddingTop: 4 }}>
            <AppButton
              label="Cancel"
              variant="secondary"
              width={(sheetWidth - 10) / 2}
              height={46}
              onPress={onClose}
            />
            <AppButton
              label={action.confirmLabel ?? "Confirm"}
              variant={destructive ? "danger" : "primary"}
              width={(sheetWidth - 10) / 2}
              height={46}
              onPress={() => {
                action.onConfirm();
                onClose();
              }}
            />
          </Row>
        </Column>
      ) : null}
    </BottomSheet>
  );
}
