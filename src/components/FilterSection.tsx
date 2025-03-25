"use client";
import { motion } from "framer-motion";
import YearFilter from "@/components/YearFilter";
import CountryFilter from "@/components/CountryFilter";

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
    return (
        <motion.div
            className="bg-white rounded-lg shadow p-6 mb-8"
            layout
            transition={{
                layout: { duration: 0.3, ease: "easeInOut" }
            }}
        >
            <div className="flex flex-col md:flex-row gap-4">
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