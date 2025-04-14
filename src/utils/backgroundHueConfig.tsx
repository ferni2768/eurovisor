import { countryNameToCode } from "./countryUtils";

// Mapping from country code to flag color hues in HSL format
// Each inner array is [hue, variance]
// Represents unique colors excluding white and black
export const flagHues: Record<string, [number, number][]> = {
    "AL": [[0, 20]],
    "AD": [[225, 20], [45, 15], [0, 20]],
    "AM": [[0, 20], [225, 20], [35, 15]],
    "AU": [[220, 20], [0, 20]],
    "AT": [[0, 20]],
    "AZ": [[180, 20], [0, 20], [120, 20]],
    "BY": [[0, 20], [0, 20], [0, 20], [120, 20]],
    "BE": [[45, 15], [0, 20]],
    "BA": [[220, 20], [45, 15]],
    "BG": [[120, 20], [0, 20]],
    "HR": [[0, 20], [220, 20]],
    "CY": [[30, 20]],
    "CZ": [[220, 20], [0, 20]],
    "DK": [[0, 20]],
    "EE": [[195, 20]],
    "FI": [[220, 20]],
    "FR": [[220, 20], [0, 20]],
    "GE": [[0, 20]],
    "DE": [[0, 20], [45, 15]],
    "GR": [[205, 15]],
    "HU": [[0, 20], [105, 20]],
    "IS": [[220, 20], [0, 20]],
    "IE": [[120, 20], [25, 15], [25, 15]],
    "IL": [[220, 20]],
    "IT": [[120, 20], [0, 20]],
    "KZ": [[180, 20], [180, 20], [180, 20], [180, 20], [50, 10]],
    "LV": [[350, 20]],
    "LT": [[45, 15], [45, 15], [120, 20], [0, 20]],
    "LU": [[345, 20], [185, 20]],
    "MT": [[345, 20]],
    "MD": [[215, 20], [45, 15], [350, 20]],
    "MC": [[345, 20]],
    "ME": [[0, 20], [0, 20], [30, 20]],
    "MA": [[345, 20], [345, 20], [345, 20], [345, 20], [345, 20], [120, 20], [120, 20]],
    "NL": [[345, 20], [210, 15]],
    "MK": [[0, 20], [45, 15]],
    "NO": [[345, 20], [225, 20]],
    "PL": [[345, 20]],
    "PT": [[120, 20], [0, 20]],
    "RO": [[0, 20], [225, 20], [35, 15]],
    "RU": [[345, 20], [210, 15]],
    "SM": [[185, 20], [185, 20], [45, 15]],
    "CS": [[0, 20], [45, 15], [345, 20], [210, 15]],
    "RS": [[345, 20], [210, 15]],
    "SK": [[345, 20], [210, 15]],
    "SI": [[345, 20], [210, 15]],
    "ES": [[0, 20], [45, 15]],
    "SE": [[200, 20], [45, 15]],
    "CH": [[345, 20]],
    "TR": [[0, 20]],
    "UA": [[210, 20], [45, 15]],
    "GB": [[220, 20], [0, 20]],
    "GB-WLS": [[0, 20], [120, 20]],
    "YU": [[0, 20], [45, 15], [345, 20], [210, 15]]
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