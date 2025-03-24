"use client";
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
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>
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
        </div>
    );
}