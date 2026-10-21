import { Column, Row, Spacer, Text } from "@expo/ui";
import { offset } from "@expo/ui/jetpack-compose/modifiers";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { countryFlagEmoji } from "../../lib/country-flag";
import {
  getCountriesSnapshot,
  getCountryName,
  subscribeCountries,
  useAppStore,
} from "../../store/useAppStore";
import { AppIcon } from "../app-icon";
import { AppText } from "../app-text";
import { useTheme } from "../theme";

interface Props {
  width: number;
}

export function CountryTrigger({ width }: Props) {
  const selectedCountry = useAppStore((state) => state.selectedCountry);
  const setOpen = useAppStore((state) => state.setCountryPickerOpen);
  const countries = useSyncExternalStore(
    subscribeCountries,
    getCountriesSnapshot,
    getCountriesSnapshot,
  );
  const { colors } = useTheme();
  const countryName =
    countries.length > 0 ? getCountryName(selectedCountry.country) : selectedCountry.country;

  return (
    <Row
      alignment="center"
      spacing={10}
      onPress={() => setOpen(true)}
      style={{
        width,
        height: 44,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
      }}
    >
      <Row
        alignment="center"
        spacing={10}
        modifiers={Platform.OS === "android" ? [offset(0, 5)] : undefined}
        style={{ width, height: 44, paddingHorizontal: 14 }}
      >
        <Text textStyle={{ fontSize: 21 }}>
          {countryFlagEmoji(selectedCountry.country, selectedCountry.flag)}
        </Text>
        <AppText variant="headline">{selectedCountry.code}</AppText>
        <Column spacing={0} style={{ width: Math.max(64, width - 142) }}>
          <AppText variant="subheadline" color={colors.textSecondary} numberOfLines={1}>
            {countryName}
          </AppText>
        </Column>
        <Spacer flexible />
        <AppIcon name="chevron-down" size={16} color={colors.textTertiary} />
      </Row>
    </Row>
  );
}
