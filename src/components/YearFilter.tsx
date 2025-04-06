"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
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
    // Generate years from 1956 to 2024
    const years = Array.from({ length: 2024 - 1956 + 1 }, (_, i) => 2024 - i);

    // State for dropdown
    const [isOpen, setIsOpen] = useState(false);

    // Ref for dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                        className="bg-white/55 hover:bg-white/80 w-full border border-gray-300 shadow-sm focus:outline-none focus:border-white py-2 px-5 text-left flex items-center justify-between transition-all duration-200 cursor-pointer"
                        layout
                        animate={{
                            borderRadius: isOpen ? "1.5rem 1.5rem 0 0" : "1.5rem",
                        }}
                        transition={{
                            borderRadius: { duration: 0.2, ease: "easeInOut" },
                        }}
                    >
                        {selectedYear ? (
                            <span className="text-black">{selectedYear}</span>
                        ) : (
                            <span className="text-black">All Years</span>
                        )}
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
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
                            className="max-h-72 pt-2 pb-2 pl-2 pr-3"
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
                            {/* Options for each year */}
                            {years.map((year) => (
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
                            className="ml-2 overflow-hidden"
                        >
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onYearChange(null);
                                    setIsOpen(false);
                                }}
                                className="bg-white/60 hover:bg-white/80 cursor-pointer text-gray-800 font-bold py-2 px-4 rounded-full w-[40px] h-full flex items-center justify-center"
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