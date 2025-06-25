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
    --os-size: 12px;
    --os-padding-perpendicular: 2px;
  }
  .os-scrollbar-handle {
    border-radius: 10px; /* Rounded scrollbar handle */
  }
`;

// Animation variants for dropdown
const variants = {
    open: {
        height: "auto",
        opacity: 1,
        borderRadius: "0 0 1.5rem 1.5rem",
        transition: {
            height: {
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.75,
            },
            opacity: { duration: 0 },
        },
    },
    closed: {
        height: 0,
        opacity: 0,
        borderRadius: "1.5rem",
        transition: {
            height: {
                type: "tween",
                duration: 0.15,
                ease: "easeOut",
            },
            opacity: { duration: 0, delay: 0.15 },
        },
    },
};

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

    // Fetch countries from API only once
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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
        <div className="w-full md:w-1/2 overflow-visible" ref={dropdownRef}>
            <label
                htmlFor="country-filter"
                className="block text-sm font-medium text-white mb-1"
            >
                Filter by Country
            </label>
            <div className="flex items-center">
                <div className="relative flex-grow">
                    <motion.button
                        id="country-filter"
                        onClick={() => setIsOpen(!isOpen)}
                        className="min-w-0 w-full rounded-full bg-white/55 hover:bg-white/70 border border-gray-300 shadow-sm focus:outline-none focus:border-white py-2 px-5 text-left flex items-center justify-between transition-all duration-200 cursor-pointer"
                        layout
                        animate={{
                            borderRadius: isOpen ? "1.5rem 1.5rem 0 0" : "1.5rem",
                        }}
                        transition={{
                            borderRadius: { duration: 0.2, ease: "easeInOut" },
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="text-black">Loading countries...</span>
                        ) : selectedCountryObj ? (
                            <div className="flex items-center gap-2">
                                {selectedCountryObj.code === "YU" || selectedCountryObj.code === "CS" ? (
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
                                ) : (
                                    <Flag
                                        code={selectedCountryObj.code}
                                        style={{ height: "1.5em", width: "2em" }}
                                        className="rounded inline-block"
                                    />
                                )}
                                <span className="text-black">{selectedCountryObj.name}</span>
                            </div>
                        ) : (
                            <span className="text-black">All Countries</span>
                        )}

                        <motion.svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </motion.svg>
                    </motion.button>

                    {/* Dropdown container */}
                    <motion.div
                        variants={variants}
                        animate={isOpen ? "open" : "closed"}
                        initial="closed"
                        className="absolute z-10 w-full bg-neutral-800 border border-gray-300 shadow-lg overflow-hidden"
                        style={{ borderTop: "none" }}
                    >
                        <OverlayScrollbarsComponent
                            options={{
                                scrollbars: {
                                    theme: "os-theme-dark",
                                    autoHide: "scroll",
                                    autoHideDelay: 400,
                                    dragScroll: true,
                                    clickScroll: true,
                                },
                                overflow: {
                                    x: "hidden",
                                    y: "scroll",
                                },
                            }}
                            className="max-h-72 pt-2 pb-2 pl-2 pr-4"
                        >
                            {/* Option for "All Countries" */}
                            <div
                                onClick={() => {
                                    onCountryChange(null);
                                    setIsOpen(false);
                                }}
                                className="cursor-pointer hover:bg-gray-500 rounded-2xl py-2 px-3 flex items-center justify-between"
                            >
                                <span className="text-gray-50">All Countries</span>
                            </div>

                            {/* Loading indicator */}
                            {loading && (
                                <div className="py-4 text-center text-gray-50">
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
                                        className="cursor-pointer hover:bg-gray-500 rounded-2xl py-2 px-3 flex items-center"
                                    >
                                        {country.code === "YU" || country.code === "CS" ? (
                                            <div className="flex">
                                                <Flag
                                                    code="RS"
                                                    style={{
                                                        height: "1.5em",
                                                        width: "2em",
                                                        marginRight: "4px",
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
                                        <span className="ml-2 text-gray-50">{country.name}</span>
                                    </div>
                                ))}
                        </OverlayScrollbarsComponent>
                    </motion.div>
                </div>
                <AnimatePresence>
                    {selectedCountry && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "40px" }}
                            exit={{ width: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                            }}
                            className="ml-2 flex-shrink-0 overflow-hidden"
                        >
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCountryChange(null);
                                    setIsOpen(false);
                                }}
                                className="bg-white/60 hover:bg-white/100 cursor-pointer text-gray-800 font-bold py-2 px-4 rounded-full w-[40px] h-full flex items-center justify-center"
                                aria-label="Clear country filter"
                                style={{ minWidth: "40px" }}
                            >
                                ✕
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CountryFilter;