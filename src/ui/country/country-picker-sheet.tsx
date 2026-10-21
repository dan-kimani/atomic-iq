import { memo, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import type { Country as PickerCountry } from "react-native-country-picker-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { countryFlagEmoji } from "../../lib/country-flag";
import { getCountriesSnapshot, subscribeCountries, useAppStore } from "../../store/useAppStore";
import { radius, typography, useTheme } from "../theme";

const SHEET_RATIO = 0.78;
const SECTION_HEADER_HEIGHT = 28;

interface CountrySection {
  title: string;
  data: PickerCountry[];
}

function getCountryName(country: PickerCountry): string {
  if (typeof country.name === "string") return country.name;
  return country.name.common || Object.values(country.name)[0] || country.cca2;
}

function FlagSlot({ country }: { country: PickerCountry }) {
  return <Text style={styles.flagEmoji}>{countryFlagEmoji(country.cca2, country.flag)}</Text>;
}

interface CountryRowProps {
  country: PickerCountry;
  active: boolean;
  onSelect: (country: PickerCountry) => void;
}

const CountryRow = memo(function CountryRow({ country, active, onSelect }: CountryRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelect(country)}
      style={({ pressed }) => [
        styles.row,
        active && { backgroundColor: colors.accentSoft },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <FlagSlot country={country} />
      <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
        {getCountryName(country)}
      </Text>
      <Text style={[styles.callingCode, { color: colors.textSecondary }]}>
        {`+${country.callingCode?.[0] ?? ""}`}
      </Text>
      <Text style={[styles.check, { color: colors.accent }]}>{active ? "✓" : ""}</Text>
    </Pressable>
  );
});

export function CountryPickerSheet() {
  const selectedCountry = useAppStore((state) => state.selectedCountry);
  const setSelectedCountry = useAppStore((state) => state.setSelectedCountry);
  const isOpen = useAppStore((state) => state.isCountryPickerOpen);
  const setOpen = useAppStore((state) => state.setCountryPickerOpen);

  const countries = useSyncExternalStore(
    subscribeCountries,
    getCountriesSnapshot,
    getCountriesSnapshot,
  );
  const [query, setQuery] = useState("");
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, [setOpen]);

  const sections = useMemo<CountrySection[]>(() => {
    const needle = query.trim().toLowerCase().replace(/^\+/, "");
    const filtered = needle
      ? countries.filter((country) => {
          const name = getCountryName(country).toLowerCase();
          const callingCode = (country.callingCode?.[0] ?? "").replace(/^\+/, "");
          return (
            name.includes(needle) ||
            callingCode.includes(needle) ||
            country.cca2.toLowerCase().includes(needle)
          );
        })
      : countries;

    const sorted = [...filtered].sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)));

    const groups = new Map<string, PickerCountry[]>();
    for (const country of sorted) {
      const first = getCountryName(country).charAt(0).toUpperCase();
      const key = /[A-Z]/.test(first) ? first : "#";
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(country);
      } else {
        groups.set(key, [country]);
      }
    }

    return [...groups].map(([title, data]) => ({ title, data }));
  }, [countries, query]);

  const handleSelect = useCallback(
    (country: PickerCountry) => {
      setSelectedCountry({
        code: `+${country.callingCode?.[0] ?? ""}`,
        country: country.cca2,
        flag: countryFlagEmoji(country.cca2, country.flag),
      });
      close();
    },
    [close, setSelectedCountry],
  );

  const sheetHeight = Math.round(height * SHEET_RATIO);
  const emptyText =
    countries.length === 0 ? "Loading countries…" : `No countries match “${query.trim()}”`;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close country picker"
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />

          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.text }]}>Country</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={close}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? colors.surfaceStrong : colors.surfaceMuted },
              ]}
            >
              <Text style={[styles.closeGlyph, { color: colors.icon }]}>✕</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, code, or calling code"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            selectionColor={colors.accent}
            style={[
              styles.search,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <SectionList<PickerCountry, CountrySection>
            sections={sections}
            keyExtractor={(item) => item.cca2}
            renderItem={({ item }) => (
              <CountryRow
                country={item}
                active={item.cca2 === selectedCountry.country}
                onSelect={handleSelect}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                  {section.title}
                </Text>
              </View>
            )}
            stickySectionHeadersEnabled
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            initialNumToRender={16}
            maxToRenderPerBatch={16}
            windowSize={7}
            removeClippedSubviews={Platform.OS === "android"}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{emptyText}</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    overflow: "hidden",
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  closeGlyph: {
    fontSize: 15,
    fontWeight: "600",
  },
  search: {
    height: 44,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: radius.small,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  list: {
    flex: 1,
    marginTop: 10,
  },
  sectionHeader: {
    height: SECTION_HEADER_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  row: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  flagEmoji: {
    width: 30,
    fontSize: 22,
    textAlign: "center",
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  callingCode: {
    fontSize: 13,
    fontWeight: "500",
  },
  check: {
    width: 18,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  empty: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
