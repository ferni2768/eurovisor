"use client";
import { motion } from "framer-motion";
import YearFilter from "@/components/YearFilter";
import CountryFilter from "@/components/CountryFilter";
import { getFilterColors } from "@/utils/colorUtils";

interface FilterSectionProps {
    selectedYear: number | null;
    selectedCountry: string | null;
    onYearChange: (year: number | null) => void;
    onCountryChange: (country: string | null) => void;
}

export default function FilterSection({
    selectedYear,
    selectedCountry,
    onYearChange,
    onCountryChange
}: FilterSectionProps) {
    const { baseColor, transitionDuration } = getFilterColors(selectedYear, selectedCountry);

    return (
        <motion.div
            className="rounded-4xl shadow-xl py-4 px-6 md:p-6 mb-4 md:mb-8 border-white/30 border-2"
            style={{
                backgroundColor: `rgba(${baseColor}, 0.45)`,
                transition: `background-color ${transitionDuration} ease-in-out`
            }}
            layout
            transition={{
                layout: { duration: 0.3, ease: "easeInOut" }
            }}
        >
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                <YearFilter
                    selectedYear={selectedYear}
                    onYearChange={onYearChange}
                />
                <CountryFilter
                    selectedCountry={selectedCountry}
                    onCountryChange={onCountryChange}
                />
            </div>
        </motion.div>
    );
}