import { Column, Row, Spacer } from "@expo/ui";
import { offset } from "@expo/ui/jetpack-compose/modifiers";
import { router } from "expo-router";
import { Platform } from "react-native";

import { AppIcon, type AppIconName } from "./app-icon";
import { AppText } from "./app-text";
import { AppTextInput } from "./app-text-input";
import { BrandLogo } from "./brand-logo";
import { IconButton } from "./icon-button";
import { useMetrics, useTheme, withAlpha } from "./theme";

interface HeaderAction {
  name: AppIconName;
  onPress: () => void;
  color?: string;
  background?: string;
  label?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: HeaderAction[];
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const headerActions = actions ?? [];
  const { contentWidth } = useMetrics();
  const { colors } = useTheme();
  const actionsWidth =
    headerActions.length > 0 ? headerActions.length * 36 + (headerActions.length - 1) * 6 : 0;
  const titleWidth = Math.max(96, contentWidth - 44 - actionsWidth - 8);

  return (
    <Row alignment="center" spacing={8} style={{ width: contentWidth, paddingVertical: 4 }}>
      <IconButton
        name="arrow-left"
        size={20}
        background="transparent"
        onPress={() => router.back()}
      />
      <Column spacing={2} style={{ width: titleWidth }}>
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </Column>
      <Spacer flexible />
      {headerActions.length > 0 ? (
        <Row alignment="center" spacing={6}>
          {headerActions.map((action) => (
            <IconButton
              key={action.name + (action.label ?? "")}
              name={action.name}
              color={action.color}
              background={action.background}
              onPress={action.onPress}
            />
          ))}
        </Row>
      ) : null}
    </Row>
  );
}

interface HomeHeaderProps {
  onSettings?: () => void;
  onSearch?: () => void;
  onSearchClose?: () => void;
  onSearchChange?: (query: string) => void;
  searchActive?: boolean;
  searchQuery?: string;
}

export function HomeHeader({
  onSettings,
  onSearch,
  onSearchClose,
  onSearchChange,
  searchActive = false,
  searchQuery = "",
}: HomeHeaderProps) {
  const { contentWidth } = useMetrics();
  const { colors } = useTheme();
  const titleWidth = contentWidth - 40 - 84 - 30 - 8;
  const searchWidth = contentWidth - 42;

  if (searchActive) {
    return (
      <Column spacing={0} style={{ width: contentWidth, paddingTop: 8, paddingBottom: 4 }}>
        <Row alignment="center" spacing={6} style={{ width: contentWidth, height: 49 }}>
          <Row
            alignment="center"
            spacing={8}
            style={{
              width: searchWidth,
              height: 44,
              paddingHorizontal: 12,
              backgroundColor: withAlpha(colors.surface, 0.9),
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <AppIcon name="search" size={18} color={colors.textTertiary} />
            <AppTextInput
              value={searchQuery}
              onChangeText={onSearchChange ?? (() => {})}
              placeholder="Search name or number"
              autoFocus
              bare
              modifiers={Platform.OS === "android" ? [offset(0, 2)] : undefined}
              style={{
                width: searchWidth - 66,
                height: 24,
                paddingHorizontal: 0,
                paddingVertical: 0,
              }}
              textStyle={{ fontSize: 15, lineHeight: 20 }}
            />
          </Row>
          <IconButton
            name="close"
            size={18}
            width={36}
            height={36}
            background="transparent"
            color={colors.textSecondary}
            onPress={onSearchClose ?? onSearch}
          />
        </Row>
      </Column>
    );
  }

  return (
    <Column spacing={0} style={{ width: contentWidth, paddingTop: 8, paddingBottom: 4 }}>
      <Row alignment="center" spacing={10} style={{ width: contentWidth }}>
        <BrandLogo size={40} />
        <Column spacing={1} style={{ width: titleWidth }}>
          <AppText variant="title" numberOfLines={1}>
            Atomic IQ
          </AppText>
          <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
            Message. Call. Organize.
          </AppText>
        </Column>
        <Spacer flexible />
        <Row alignment="center" spacing={4}>
          <IconButton
            name="search"
            size={21}
            width={40}
            height={40}
            background="transparent"
            color={colors.text}
            onPress={onSearch}
          />
          <IconButton
            name="settings"
            size={21}
            width={40}
            height={40}
            background="transparent"
            color={colors.text}
            onPress={onSettings}
          />
        </Row>
      </Row>
    </Column>
  );
}
