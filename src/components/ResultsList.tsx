import React, { useState, useEffect, useRef } from "react";
import EntryCard from "./EntryCard";
import { EntryResult } from "@/types/eurovision";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface ResultsListProps {
    results: EntryResult[];
    loading: boolean;
    error: string | null;
    selectedYear: number | null;
    selectedCountry: string | null;
    showingWinners?: boolean;
}

interface LazyCardProps {
    result: EntryResult;
    index: number;
    numberOfColumns: number;
    initialRowCount: number;
}

interface CustomAnimationProps {
    delay: number;
    initialScale: number;
    initialY: number;
    initialBlur: number;
    exitScale: number;
}

// LazyCard component that reserves space via a placeholder even if not in view
const LazyCard: React.FC<LazyCardProps> = ({ result, index, numberOfColumns, initialRowCount }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        rootMargin: '0px', // Trigger animation only when in view
        threshold: 0.1
    });

    // Calculate row index for delay cascade
    const rowIndex = Math.floor(index / numberOfColumns);
    const isInitiallyVisible = rowIndex < initialRowCount;

    // For initially visible cards use a cascade delay, for later ones nearly instant
    const baseDelay = numberOfColumns === 1 ? 0.05 : 0.1;
    const delay = isInitiallyVisible
        ? baseDelay * rowIndex + Math.random() * 0.1
        : 0.01;
    const initialScale = 0.95 + Math.random() * 0.03;
    const initialY = 20 + Math.random() * 10;
    const initialBlur = 2 + Math.random() * 2;
    const customProps: CustomAnimationProps = {
        delay,
        initialScale,
        initialY,
        initialBlur,
        exitScale: initialScale,
    };

    const cardVariants = {
        hidden: (custom: CustomAnimationProps) => ({
            opacity: 0,
            scale: custom.initialScale,
            y: custom.initialY,
            filter: `blur(${custom.initialBlur}px)`,
        }),
        visible: (custom: CustomAnimationProps) => ({
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                delay: custom.delay,
                duration: 0.5 + Math.random() * 0.2,
                ease: "easeOut",
            },
        }),
        exit: (custom: CustomAnimationProps) => ({
            opacity: 0,
            scale: custom.exitScale,
            y: -custom.initialY,
            filter: `blur(${custom.initialBlur}px)`,
            transition: {
                duration: 0.5 + Math.random() * 0.2,
                ease: "easeIn",
            },
        }),
    };

    return (
        // Reserve the expected space with a fixed min-height
        <div ref={ref} className="min-h-[200px]">
            {inView ? (
                <motion.div
                    key={`${result.year}-${result.contestantId}`}
                    custom={customProps}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <EntryCard
                        year={result.year}
                        contestantId={result.contestantId}
                        country={result.country}
                        countryName={result.countryName}
                        artist={result.artist}
                        song={result.song}
                        place={result.place}
                        isWinner={result.isWinner}
                        didQualify={result.didQualify}
                    />
                </motion.div>
            ) : (
                // Placeholder div to reserve space before the card loads
                <div className="min-h-[200px]"></div>
            )}
        </div>
    );
};

const ResultsList: React.FC<ResultsListProps> = ({
    results,
    loading,
    error,
    selectedYear,
    selectedCountry,
    showingWinners,
}) => {
    const [numberOfColumns, setNumberOfColumns] = useState(3);
    const [initialRowCount, setInitialRowCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate the total height of the results list
    const calculateTotalHeight = () => {
        if (!results.length) return 0;

        const cardHeight = 200; // Estimated height of each card in pixels
        const gapSize = 24; // Gap size in pixels (6 in tailwind's gap-6)
        const totalRows = Math.ceil(results.length / numberOfColumns);

        // Calculate total height including gaps
        return totalRows * cardHeight + (totalRows - 1) * gapSize;
    };

    // Update column count based on screen width
    useEffect(() => {
        const updateColumnCount = () => {
            if (window.innerWidth < 768) {
                setNumberOfColumns(1);
            } else if (window.innerWidth < 1024) {
                setNumberOfColumns(2);
            } else {
                setNumberOfColumns(3);
            }
        };

        updateColumnCount();
        window.addEventListener('resize', updateColumnCount);
        return () => window.removeEventListener('resize', updateColumnCount);
    }, []);

    // Estimate initially visible rows based on window height
    useEffect(() => {
        const estimatedCardHeight = 200;
        const visibleRows = Math.floor(window.innerHeight / estimatedCardHeight);
        setInitialRowCount(visibleRows);
    }, []);

    if (loading) {
        // Create a placeholder with the correct height during loading
        const placeholderHeight = calculateTotalHeight();

        return (
            <div
                className="relative"
                style={{ height: `${placeholderHeight}px` }}
            >
                <div className="absolute top-1/2 mt-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <svg
                        className="animate-spin h-10 w-10 text-indigo-500"
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
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                role="alert"
            >
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No results found. Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="mb-16">
            <AnimatePresence mode="wait">
                <div
                    ref={containerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    style={{ minHeight: `${calculateTotalHeight()}px` }}
                >
                    {results.map((result, index) => (
                        <LazyCard
                            key={`${result.year}-${result.contestantId}`}
                            result={result}
                            index={index}
                            numberOfColumns={numberOfColumns}
                            initialRowCount={initialRowCount}
                        />
                    ))}
                </div>
            </AnimatePresence>
        </div>
    );
};

export default ResultsList;