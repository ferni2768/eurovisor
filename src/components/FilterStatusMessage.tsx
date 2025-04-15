"use client";
import { countryCodeToName } from "@/utils/countryUtils";
import { getFilterColors } from "@/utils/colorUtils";
import Flag from "react-world-flags";

interface FilterStatusMessageProps {
    selectedYear: number | null;
    selectedCountry: string | null;
    showingWinners: boolean;
}

export default function FilterStatusMessage({ selectedYear, selectedCountry }: FilterStatusMessageProps) {
    let message = "Eurovision Winners by Year";
    let icon = "🏆";

    // Get colors based on filter selections
    const { topColor, middleColor, bottomColor } = getFilterColors(selectedYear, selectedCountry);

    if (selectedYear && selectedCountry) {
        message = `${(countryCodeToName[selectedCountry] || selectedCountry)}'s entry in the ${selectedYear} Eurovision`;
        icon = "🎯";
    } else if (selectedYear) {
        message = `All entries from the ${selectedYear} Eurovision`;
        icon = "📅";
    } else if (selectedCountry) {
        message = `All Eurovision entries from ${(countryCodeToName[selectedCountry] || selectedCountry)}`;
        icon = "🌍";
    }


    return (
        <div className="mb-4 relative">
            {/* Original component with background */}
            <div
                className="rounded-t-4xl text-center transition-all duration-300 ease-in-out"
                style={{
                    height: "45px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(180deg, ${topColor} -40%, ${middleColor} 30%, ${bottomColor} 100%)`,
                    position: "relative",
                }}
            >
                {/* Gradient border overlay */}
                <div
                    className="absolute inset-0 rounded-t-4xl pointer-events-none"
                    style={{
                        boxShadow: `
                            inset 0 2px 0 rgba(255, 255, 255, 0.3),
                            inset 2px 0 0 rgba(255, 255, 255, 0.05),
                            inset -2px 0 0 rgba(255, 255, 255, 0.05),
                            inset 0 -2px 0 rgba(255, 255, 255, 0)
                        `,
                    }}
                />

                <div className="font-semibold text-white flex items-center justify-center gap-2 px-3 w-full">
                    {selectedCountry ? (
                        selectedCountry === "YU" || selectedCountry === "CS" ? (
                            <div style={{ width: "70px", display: "flex", justifyContent: "center" }}>
                                <div className="flex">
                                    <Flag
                                        code="RS"
                                        style={{ height: "1.5em", width: "2em", marginRight: "4px" }}
                                        className="rounded inline-block"
                                    />
                                    <Flag
                                        code="ME"
                                        style={{ height: "1.5em", width: "2em" }}
                                        className="rounded inline-block"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ width: "32px", display: "flex", justifyContent: "center" }}>
                                <Flag
                                    code={selectedCountry}
                                    style={{ height: "1.5em", width: "2em" }}
                                    className="rounded inline-block"
                                />
                            </div>
                        )) : (
                        <div style={{ width: "32px", display: "flex", justifyContent: "center" }}>
                            <span className="text-xl">{icon}</span>
                        </div>
                    )}
                    <span className="truncate">{message}</span>
                </div>
            </div>
        </div>
    );
}