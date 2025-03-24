"use client";
import React, { useState, useRef, useEffect } from "react";
import Flag from "react-world-flags";

interface CountryFilterProps {
    selectedCountry: string | null;
    onCountryChange: (country: string | null) => void;
}

const countries = [
    { code: "AL", name: "Albania" },
    { code: "AM", name: "Armenia" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BY", name: "Belarus" },
    { code: "BE", name: "Belgium" },
    { code: "BA", name: "Bosnia & Herzegovina" },
    { code: "BG", name: "Bulgaria" },
    { code: "HR", name: "Croatia" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "EE", name: "Estonia" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GE", name: "Georgia" },
    { code: "DE", name: "Germany" },
    { code: "GR", name: "Greece" },
    { code: "HU", name: "Hungary" },
    { code: "IS", name: "Iceland" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IT", name: "Italy" },
    { code: "LV", name: "Latvia" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MT", name: "Malta" },
    { code: "MD", name: "Moldova" },
    { code: "ME", name: "Montenegro" },
    { code: "NL", name: "Netherlands" },
    { code: "MK", name: "North Macedonia" },
    { code: "NO", name: "Norway" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russia" },
    { code: "SM", name: "San Marino" },
    { code: "RS", name: "Serbia" },
    { code: "CS", name: "Serbia & Montenegro" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "ES", name: "Spain" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "UA", name: "Ukraine" },
    { code: "GB", name: "United Kingdom" },
];

const CountryFilter: React.FC<CountryFilterProps> = ({ selectedCountry, onCountryChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Sort countries alphabetically
    const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));

    // Close dropdown when clicking outside
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Find the selected country object
    const selectedCountryObj = sortedCountries.find(country => country.name === selectedCountry);


    return (
        <div className="w-full md:w-1/2" ref={dropdownRef}>
            <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Country
            </label>
            <div className="flex gap-2">
                <button
                    id="country-filter"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-left flex items-center justify-between"
                >
                    {selectedCountryObj ? (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">{selectedCountryObj.name}</span>
                            <Flag
                                code={selectedCountryObj.code}
                                style={{ height: "1.5em", width: "2em" }}
                                className="rounded inline-block"
                            />
                        </div>
                    ) : (
                        <span className="text-gray-400">All Countries</span>
                    )}
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {selectedCountry && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCountryChange(null);
                            setIsOpen(false);
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                        aria-label="Clear country filter"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="w-full relative">
                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full max-h-72 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto">
                        {/* Option for "All Countries" */}
                        <div
                            onClick={() => {
                                onCountryChange(null);
                                setIsOpen(false);
                            }}
                            className="cursor-pointer hover:bg-gray-100 py-2 px-3 flex items-center justify-between"
                        >
                            <span className="text-gray-400">All Countries</span>
                            <span className="text-gray-500">🌐</span>
                        </div>
                        {/* Options for each country */}
                        {sortedCountries.map((country) => (
                            <div
                                key={country.code}
                                onClick={() => {
                                    onCountryChange(country.name);
                                    setIsOpen(false);
                                }}
                                className="cursor-pointer hover:bg-gray-100 py-2 px-3 flex items-center"
                            >
                                <Flag
                                    code={country.code}
                                    style={{ height: "1.5em", width: "2em" }}
                                    className="rounded inline-block"
                                />
                                <span className="ml-2 text-gray-500">{country.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountryFilter;