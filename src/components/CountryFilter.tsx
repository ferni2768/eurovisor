"use client";
import React, { useState, useRef, useEffect } from "react";
import Flag from "react-world-flags";
import { getCountries } from "@/services/eurovisionService";
import { motion, AnimatePresence } from "framer-motion";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";

// Custom CSS for scrollbar
const customScrollbarStyles = `
  .os-scrollbar {
    --os-size: 12px; /* Increase scrollbar thickness (default is 10px) */
    --os-padding-perpendicular: 2px;
  }
  .os-scrollbar-handle {
    border-radius: 10px; /* Rounded scrollbar handle */
  }
`;

interface CountryFilterProps {
    selectedCountry: string | null;
    onCountryChange: (country: string | null) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
    selectedCountry,
    onCountryChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch countries from API
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setLoading(true);
                const countriesData = await getCountries();
                const countriesArray = Object.entries(countriesData).map(([code, name]) => ({
                    code,
                    name: name as string,
                }));
                setCountries(countriesArray);
                setError(null);
            } catch (err) {
                setError("Failed to load countries");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    // Sort countries alphabetically
    const sortedCountries = [...countries].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    // Close dropdown when clicking outside
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Apply custom scrollbar styles to document head
    useEffect(() => {
        if (!document.getElementById("os-custom-styles")) {
            const styleElement = document.createElement("style");
            styleElement.id = "os-custom-styles";
            styleElement.textContent = customScrollbarStyles;
            document.head.appendChild(styleElement);
        }
    }, []);

    // Find the selected country object
    const selectedCountryObj = sortedCountries.find(
        (country) => country.code === selectedCountry
    );


    return (
        <div className="w-full md:w-1/2" ref={dropdownRef}>
            <label
                htmlFor="country-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
            >
                Filter by Country
            </label>
            <motion.div
                className="flex"
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <motion.button
                    id="country-filter"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 mr-2 text-left flex items-center justify-between"
                    disabled={loading}
                    layout
                >
                    {loading ? (
                        <span className="text-gray-400">Loading countries...</span>
                    ) : selectedCountryObj ? (
                        <div className="flex items-center gap-2">
                            {selectedCountryObj.code === "YU" ? (
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
                                    code={selectedCountryObj.code}
                                    style={{ height: "1.5em", width: "2em" }}
                                    className="rounded inline-block"
                                />
                            )}
                            <span className="text-gray-500">{selectedCountryObj.name}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400">All Countries</span>
                    )}
                    <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </motion.button>

                <AnimatePresence>
                    {selectedCountry && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "50px" }}
                            exit={{ width: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCountryChange(null);
                                    setIsOpen(false);
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded w-[40px] h-full flex items-center justify-center"
                                aria-label="Clear country filter"
                                style={{ minWidth: "40px" }}
                            >
                                ✕
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="w-full relative">
                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                        <OverlayScrollbarsComponent
                            options={{
                                scrollbars: {
                                    theme: "os-theme-dark",
                                    autoHide: "never",
                                    autoHideDelay: 400,
                                    dragScroll: true,
                                    clickScroll: true,
                                },
                                overflow: { x: "hidden", y: "scroll" },
                            }}
                            className="max-h-72"
                        >
                            {/* Option for "All Countries" */}
                            <div
                                onClick={() => {
                                    onCountryChange(null);
                                    setIsOpen(false);
                                }}
                                className="cursor-pointer hover:bg-gray-100 py-2 px-3 flex items-center justify-between"
                            >
                                <span className="text-gray-400">All Countries</span>
                            </div>

                            {/* Loading indicator */}
                            {loading && (
                                <div className="py-4 text-center text-gray-500">
                                    <svg
                                        className="animate-spin h-5 w-5 mx-auto mb-2"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Loading countries...
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <div className="py-4 text-center text-red-500">{error}</div>
                            )}

                            {/* Options for each country */}
                            {!loading &&
                                !error &&
                                sortedCountries.map((country) => (
                                    <div
                                        key={country.code}
                                        onClick={() => {
                                            onCountryChange(country.code);
                                            setIsOpen(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-100 py-2 px-3 flex items-center"
                                    >
                                        {country.code === "YU" ? (
                                            <div className="flex">
                                                <Flag
                                                    code="RS"
                                                    style={{
                                                        height: "1.5em",
                                                        width: "2em",
                                                        marginRight: "2px",
                                                    }}
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
                                                code={country.code}
                                                style={{ height: "1.5em", width: "2em" }}
                                                className="rounded inline-block"
                                            />
                                        )}
                                        <span className="ml-2 text-gray-500">{country.name}</span>
                                    </div>
                                ))}
                        </OverlayScrollbarsComponent>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountryFilter;