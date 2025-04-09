import { countryNameToCode } from "./countryUtils";

// Mapping from country code to flag color hues in HSL format
// Each inner array is [hue, variance]
// Represents unique colors excluding white and black
export const flagHues: Record<string, [number, number][]> = {
    "AL": [[0, 20]],
    "AD": [[240, 20], [60, 20], [0, 20]],
    "AM": [[0, 20], [220, 20], [30, 20]],
    "AU": [[220, 20], [0, 20]],
    "AT": [[0, 20]],
    "AZ": [[220, 20], [0, 20], [120, 20]],
    "BY": [[0, 20], [120, 20]],
    "BE": [[60, 20], [0, 20]],
    "BA": [[220, 20], [60, 20]],
    "BG": [[120, 20], [0, 20]],
    "HR": [[0, 20], [220, 20]],
    "CY": [[30, 20]],
    "CZ": [[220, 20], [0, 20]],
    "DK": [[0, 20]],
    "EE": [[220, 20]],
    "FI": [[220, 20]],
    "FR": [[220, 20], [0, 20]],
    "GE": [[0, 20]],
    "DE": [[0, 20], [60, 20]],
    "GR": [[220, 20]],
    "HU": [[0, 20], [120, 20]],
    "IS": [[220, 20], [0, 20]],
    "IE": [[120, 20], [30, 20]],
    "IL": [[220, 20]],
    "IT": [[120, 20], [0, 20]],
    "LV": [[350, 20]],
    "LT": [[60, 20], [120, 20], [0, 20]],
    "LU": [[0, 20], [220, 20]],
    "MT": [[0, 20]],
    "MD": [[220, 20], [60, 20], [0, 20]],
    "MC": [[0, 20]],
    "ME": [[0, 20], [40, 20]],
    "MA": [[0, 20], [120, 20]],
    "NL": [[0, 20], [220, 20]],
    "MK": [[0, 20], [60, 20]],
    "NO": [[0, 20], [220, 20]],
    "PL": [[0, 20]],
    "PT": [[120, 20], [0, 20]],
    "RO": [[220, 20], [60, 20], [0, 20]],
    "RU": [[220, 20], [0, 20]],
    "SM": [[220, 20], [40, 20]],
    "CS": [[0, 20], [220, 20]],
    "RS": [[0, 20], [220, 20]],
    "SK": [[220, 20], [0, 20]],
    "SI": [[220, 20], [0, 20]],
    "ES": [[0, 20], [60, 20]],
    "SE": [[220, 20], [60, 20]],
    "CH": [[0, 20]],
    "TR": [[0, 20]],
    "UA": [[220, 20], [60, 20]],
    "GB": [[0, 20], [220, 20]],
    "GB-WLS": [[0, 20], [120, 20]],
    "YU": [[0, 20], [220, 20]]
};

// Returns hue configuration based on selected filters
export function getBackgroundHueConfig({
    selectedYear,
    selectedCountry
}: { selectedYear?: number; selectedCountry?: string }): [number, number][] {
    if (selectedCountry) {
        const code = countryNameToCode[selectedCountry] || selectedCountry;
        return flagHues[code] || [[0, 360]];
    }
    if (selectedYear && !selectedCountry) {
        return [[260, 30], [280, 20]]; // Purple-to-blue for year only
    }
    if (!selectedYear && !selectedCountry) {
        return [[30, 15], [40, 10]];   // Orange-to-gold for winners
    }
    return [[0, 360]]; // Default full rainbow
}