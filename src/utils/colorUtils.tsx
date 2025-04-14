import { countryNameToCode } from "./countryUtils";
import { flagHues } from "./backgroundHueConfig";

// Countries without white in their flags
const countriesWithoutWhite = new Set([
    "AL", "AD", "AM", "AZ", "BY", "BE", "DE", "LT", "MD", "ME",
    "MA", "MK", "PT", "RO", "ES", "SE", "UA"
]);

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;
    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l; // Achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export const getFilterColors = (selectedYear: number | null, selectedCountry: string | null) => {
    let baseColor: string;

    if (selectedCountry) {
        const countryCode = countryNameToCode[selectedCountry] || selectedCountry;
        if (!countriesWithoutWhite.has(countryCode)) {
            // Flag has white, use white
            baseColor = "255, 255, 255";
        } else {
            const hues = flagHues[countryCode] || [[0, 20]]; // Default to red if missing
            const hue = hues[0][0];
            const rgb = hslToRgb(hue, 70, 80);
            baseColor = rgb.join(", ");
        }
    } else if (selectedYear) {
        // Only year selected, use light blue
        baseColor = "219, 234, 254";
    } else {
        // Neither selected (winners), use amber
        baseColor = "254, 243, 199";
    }

    // Apply opacities to baseColor for filter message
    return {
        topColor: `rgba(${baseColor}, 0.45)`,
        middleColor: `rgba(${baseColor}, 0.15)`,
        bottomColor: `rgba(${baseColor}, 0)`,
        baseColor,
        transitionDuration: "300ms"
    };
};