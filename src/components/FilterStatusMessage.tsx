"use client";
import { countryCodeToName } from "@/utils/countryUtils";
import Flag from "react-world-flags";

interface FilterStatusMessageProps {
    selectedYear: number | null;
    selectedCountry: string | null;
    showingWinners: boolean;
}

export default function FilterStatusMessage({
    selectedYear,
    selectedCountry,
    showingWinners
}: FilterStatusMessageProps) {
    let message = "Eurovision Winners by Year";
    let bgColor = "bg-yellow-100";
    let borderColor = "border-yellow-300";
    let icon = "🏆";

    if (selectedYear && selectedCountry) {
        const countryName = countryCodeToName[selectedCountry] || selectedCountry;
        message = `${countryName}'s entry in the ${selectedYear} Eurovision`;
        bgColor = "bg-indigo-100";
        borderColor = "border-indigo-300";
        icon = "🎯";
    } else if (selectedYear) {
        message = `All entries from the ${selectedYear} Eurovision`;
        bgColor = "bg-blue-100";
        borderColor = "border-blue-300";
        icon = "📅";
    } else if (selectedCountry) {
        const countryName = countryCodeToName[selectedCountry] || selectedCountry;
        message = `All Eurovision entries from ${countryName}`;
        bgColor = "bg-green-100";
        borderColor = "border-green-300";
        icon = "🌍";
    } else {
        message = "Eurovision Winners by Year";
        bgColor = "bg-yellow-100";
        borderColor = "border-yellow-300";
        icon = "🏆";
    }


    return (
        <div
            className={`mb-4 ${bgColor} border ${borderColor} rounded-md text-center transition-all duration-300 shadow-sm hover:shadow`}
            style={{
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <div className="font-semibold text-black flex items-center justify-center gap-2 px-3 w-full">
                <div style={{ width: "32px", display: "flex", justifyContent: "center" }}>
                    {selectedCountry ? (
                        selectedCountry === "YU" ? (
                            <div className="flex">
                                <Flag
                                    code="RS"
                                    style={{ height: "1.5em", width: "2em", marginRight: "2px" }}
                                    className="rounded inline-block"
                                />
                                <Flag
                                    code="ME"
                                    style={{ height: "1.5em", width: "2em" }}
                                    className="rounded inline-block"
                                />
                            </div>
                        ) : (
                            <Flag
                                code={selectedCountry}
                                style={{ height: "1.5em", width: "2em" }}
                                className="rounded inline-block"
                            />
                        )
                    ) : (
                        <span className="text-xl">{icon}</span>
                    )}
                </div>
                <span className="truncate">{message}</span>
            </div>
        </div>
    );
}