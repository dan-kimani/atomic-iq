import { getEmojiFlag, type CountryCode } from "react-native-country-picker-modal";

/**
 * `react-native-country-picker-modal` v3 stores `flag` as a dataset key
 * (`flag-ke`) rather than an emoji, so the emoji is derived from the ISO code.
 * Values persisted by earlier builds may still be keys; anything that is
 * already a real flag is passed through.
 */
export function countryFlagEmoji(isoCode?: string | null, storedFlag?: string | null): string {
  if (storedFlag && !storedFlag.startsWith("flag-")) return storedFlag;
  if (!isoCode || !/^[A-Za-z]{2}$/.test(isoCode)) return "🌍";
  return getEmojiFlag(isoCode.toUpperCase() as CountryCode);
}
