// Map country names to country codes
export const countryNameToCode: Record<string, string> = {
    "Albania": "AL",
    "Andorra": "AD",
    "Armenia": "AM",
    "Australia": "AU",
    "Austria": "AT",
    "Azerbaijan": "AZ",
    "Belarus": "BY",
    "Belgium": "BE",
    "Bosnia & Herzegovina": "BA",
    "Bulgaria": "BG",
    "Croatia": "HR",
    "Cyprus": "CY",
    "Czech Republic": "CZ",
    "Denmark": "DK",
    "Estonia": "EE",
    "Finland": "FI",
    "France": "FR",
    "Georgia": "GE",
    "Germany": "DE",
    "Greece": "GR",
    "Hungary": "HU",
    "Iceland": "IS",
    "Ireland": "IE",
    "Israel": "IL",
    "Italy": "IT",
    "Latvia": "LV",
    "Lithuania": "LT",
    "Luxembourg": "LU",
    "Malta": "MT",
    "Moldova": "MD",
    "Monaco": "MC",
    "Montenegro": "ME",
    "Morocco": "MA",
    "Netherlands": "NL",
    "North Macedonia": "MK",
    "Norway": "NO",
    "Poland": "PL",
    "Portugal": "PT",
    "Romania": "RO",
    "Russia": "RU",
    "San Marino": "SM",
    "Serbia": "RS",
    "Serbia & Montenegro": "CS",
    "Slovakia": "SK",
    "Slovenia": "SI",
    "Spain": "ES",
    "Sweden": "SE",
    "Switzerland": "CH",
    "Turkey": "TR",
    "Ukraine": "UA",
    "United Kingdom": "GB",
    "Yugoslavia": "YU"
};

// Map country codes to country names
export const countryCodeToName: Record<string, string> = Object.entries(countryNameToCode).reduce(
    (acc, [name, code]) => {
        acc[code] = name;
        return acc;
    },
    {} as Record<string, string>
);