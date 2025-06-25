"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { getYears } from "@/services/eurovisionService";
import "overlayscrollbars/overlayscrollbars.css";

// Custom CSS for the scrollbar
const customScrollbarStyles = `
  .os-scrollbar {
    --os-size: 12px;
    --os-padding-perpendicular: 2px;
  }
  
  /* Additional styling for the scrollbar */
  .os-scrollbar-handle {
    border-radius: 10px;
  }
`;

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

interface YearFilterProps {
    selectedYear: number | null;
    onYearChange: (year: number | null) => void;
}

const YearFilter: React.FC<YearFilterProps> = ({ selectedYear, onYearChange }) => {
    // State for years and loading
    const [years, setYears] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for dropdown
    const [isOpen, setIsOpen] = useState(false);

    // Ref for dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch years from API
    useEffect(() => {
        const fetchYears = async () => {
            try {
                setLoading(true);
                const yearsData = await getYears();
                if (yearsData && Array.isArray(yearsData)) {
                    // Sort years in descending order (newest first)
                    const sortedYears = yearsData.sort((a: number, b: number) => b - a);
                    setYears(sortedYears);
                    setError(null);
                } else {
                    throw new Error('Invalid years data received');
                }
            } catch (err) {
                setError("Failed to load years");
                console.error(err);
                // Fallback to hardcoded years if API fails
                const fallbackYears = Array.from({ length: 2025 - 1956 + 1 }, (_, i) => 2025 - i);
                setYears(fallbackYears);
            } finally {
                setLoading(false);
            }
        };
        fetchYears();
    }, []);

    // Apply custom scrollbar styles
    useEffect(() => {
        if (!document.getElementById("os-custom-styles")) {
            const styleElement = document.createElement("style");
            styleElement.id = "os-custom-styles";
            styleElement.textContent = customScrollbarStyles;
            document.head.appendChild(styleElement);
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <div className="w-full md:w-1/2" ref={dropdownRef}>
            <label htmlFor="year-filter" className="block text-sm font-medium text-white mb-1">
                Filter by Year
            </label>
            <div className="flex items-center">
                <div className="relative flex-grow">
                    <motion.button
                        id="year-filter"
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
                            <span className="text-black">Loading years...</span>
                        ) : selectedYear ? (
                            <span className="text-black">{selectedYear}</span>
                        ) : (
                            <span className="text-black">All Years</span>
                        )}

                        <motion.svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                            {/* Option for "All Years" */}
                            <div
                                onClick={() => {
                                    onYearChange(null);
                                    setIsOpen(false);
                                }}
                                className="cursor-pointer hover:bg-gray-500 rounded-2xl py-2 px-3 flex items-center justify-between"
                            >
                                <span className="text-gray-50">All Years</span>
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
                                    Loading years...
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <div className="py-4 text-center text-red-500">{error}</div>
                            )}

                            {/* Options for each year */}
                            {!loading &&
                                !error &&
                                years.map((year) => (
                                    <div
                                        key={year}
                                        onClick={() => {
                                            onYearChange(year);
                                            setIsOpen(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-500 rounded-2xl py-2 px-3 flex items-center"
                                    >
                                        <span className="text-gray-50">{year}</span>
                                    </div>
                                ))}
                        </OverlayScrollbarsComponent>
                    </motion.div>
                </div>
                <AnimatePresence>
                    {selectedYear && (
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
                                    onYearChange(null);
                                    setIsOpen(false);
                                }}
                                className="bg-white/60 hover:bg-white/100 cursor-pointer text-gray-800 font-bold py-2 px-4 rounded-full w-[40px] h-full flex items-center justify-center"
                                aria-label="Clear year filter"
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

export default YearFilter;