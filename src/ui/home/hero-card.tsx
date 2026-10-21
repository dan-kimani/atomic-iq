import { Column, Row, Spacer } from "@expo/ui";

import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { useTheme, withAlpha } from "../theme";

interface Props {
  width: number;
}

function HeroArt() {
  const { colors } = useTheme();

  return (
    <Row
      alignment="center"
      spacing={5}
      style={{
        width: 104,
        height: 96,
        borderRadius: 48,
        backgroundColor: withAlpha(colors.brand, 0.06),
      }}
    >
      <Column alignment="center" style={{ width: 24, paddingTop: 24 }}>
        <AppIcon name="send" size={24} color={colors.brand} />
      </Column>

      <Column
        style={{
          width: 56,
          height: 82,
          padding: 7,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: withAlpha(colors.accent, 0.16),
        }}
      >
        <Row alignment="center" style={{ width: 42, height: 8 }}>
          <Column
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.warning,
            }}
          />
          <Spacer flexible />
          <Column
            style={{
              width: 14,
              height: 3,
              borderRadius: 2,
              backgroundColor: colors.surfaceStrong,
            }}
          />
        </Row>
        <Spacer size={4} />
        <Column
          style={{
            width: 42,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accentSoft,
          }}
        />
        <Spacer size={5} />
        <Row
          alignment="center"
          style={{
            width: 42,
            height: 30,
            borderRadius: 9,
            backgroundColor: colors.brand,
          }}
        >
          <Column spacing={3} style={{ width: 26, paddingLeft: 6 }}>
            <Column
              style={{
                width: 22,
                height: 3,
                borderRadius: 2,
                backgroundColor: colors.accentForeground,
              }}
            />
            <Column
              style={{
                width: 14,
                height: 3,
                borderRadius: 2,
                backgroundColor: colors.accentForeground,
              }}
            />
          </Column>
        </Row>
        <Spacer size={5} />
        <Column
          style={{
            width: 32,
            height: 5,
            borderRadius: 3,
            backgroundColor: colors.surfaceMuted,
          }}
        />
      </Column>
    </Row>
  );
}

export function HeroCard({ width }: Props) {
  const { colors } = useTheme();
  const copyWidth = width - 112;

  return (
    <Row alignment="center" spacing={4} style={{ width, paddingVertical: 4 }}>
      <Column spacing={4} style={{ width: copyWidth }}>
        <AppText variant="caption" color={colors.accent}>
          CONNECT INSTANTLY
        </AppText>
        <AppText variant="heroCard" numberOfLines={2}>
          Reach anyone in seconds
        </AppText>
        <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={2}>
          Open a chat with any number — nothing saved to your contacts.
        </AppText>
      </Column>
      <Spacer flexible />
      <HeroArt />
    </Row>
  );
}
