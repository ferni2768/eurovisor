"use client";
import { useState } from "react";
import YearFilter from "@/components/YearFilter";
import CountryFilter from "@/components/CountryFilter";

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-indigo-700">Eurovisor</h1>
        <p className="text-gray-600">Explore Eurovision Song Contest performances</p>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <YearFilter
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
            <CountryFilter
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Results</h2>
          <p className="text-gray-700">
            {selectedYear && selectedCountry && (
              <>Showing results for {selectedCountry} in {selectedYear}</>
            )}
            {selectedYear && !selectedCountry && (
              <>Showing results for {selectedYear}</>
            )}
            {!selectedYear && selectedCountry && (
              <>Showing results for {selectedCountry}</>
            )}
            {!selectedYear && !selectedCountry && (
              <>Please select filters to see results</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}