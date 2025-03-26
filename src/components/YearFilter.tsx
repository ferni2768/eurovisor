"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import 'overlayscrollbars/overlayscrollbars.css';

// Custom CSS for the scrollbar
const customScrollbarStyles = `
  .os-scrollbar {
    --os-size: 12px; /* Increase scrollbar thickness (default is 10px) */
    --os-padding-perpendicular: 2px;
  }
  
  /* Additional styling for the scrollbar */
  .os-scrollbar-handle {
    border-radius: 10px;
  }
`;

interface YearFilterProps {
    selectedYear: number | null;
    onYearChange: (year: number | null) => void;
}

const YearFilter: React.FC<YearFilterProps> = ({ selectedYear, onYearChange }) => {
    // Generate years from 1956 to 2024
    const years = Array.from({ length: 2024 - 1956 + 1 }, (_, i) => 2024 - i);

    // State for dropdown
    const [isOpen, setIsOpen] = useState(false);

    // Ref for dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Apply custom scrollbar styles
    useEffect(() => {
        if (!document.getElementById('os-custom-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'os-custom-styles';
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
            <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Year
            </label>
            <motion.div
                className="flex"
                layout
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
            >
                <motion.button
                    id="year-filter"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 mr-2 text-left flex items-center justify-between"
                    layout
                >
                    {selectedYear ? (
                        <span className="text-gray-500">{selectedYear}</span>
                    ) : (
                        <span className="text-gray-400">All Years</span>
                    )}
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.button>

                <AnimatePresence>
                    {selectedYear && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "50px" }}
                            exit={{ width: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut"
                            }}
                            className="overflow-hidden"
                        >
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onYearChange(null);
                                    setIsOpen(false);
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded w-[40px] h-full flex items-center justify-center"
                                aria-label="Clear year filter"
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
                                    theme: 'os-theme-dark',
                                    autoHide: 'never',
                                    autoHideDelay: 400,
                                    dragScroll: true,
                                    clickScroll: true,
                                },
                                overflow: {
                                    x: 'hidden',
                                    y: 'scroll',
                                }
                            }}
                            className="max-h-72"
                        >
                            {/* Option for "All Years" */}
                            <div
                                onClick={() => {
                                    onYearChange(null);
                                    setIsOpen(false);
                                }}
                                className="cursor-pointer hover:bg-gray-100 py-2 px-3 flex items-center justify-between"
                            >
                                <span className="text-gray-400">All Years</span>
                            </div>
                            {/* Options for each year */}
                            {years.map((year) => (
                                <div
                                    key={year}
                                    onClick={() => {
                                        onYearChange(year);
                                        setIsOpen(false);
                                    }}
                                    className="cursor-pointer hover:bg-gray-100 py-2 px-3 flex items-center"
                                >
                                    <span className="text-gray-500">{year}</span>
                                </div>
                            ))}
                        </OverlayScrollbarsComponent>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YearFilter;