import React, { useState, useEffect, useRef, useCallback } from "react";
import EntryCard from "./EntryCard";
import { EntryResult } from "@/types/eurovision";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

// Memoized EntryCard to prevent re-renders when layout changes
const MemoizedEntryCard = React.memo(EntryCard, (prevProps, nextProps) => {
    return prevProps.contestantId === nextProps.contestantId &&
        prevProps.year === nextProps.year;
});

// LazyCard component that reserves space via a placeholder even if not in view
const LazyCard: React.FC<LazyCardProps> = React.memo(({ result, index, numberOfColumns, initialRowCount }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        rootMargin: "0px",
        threshold: 0.1,
    });

    // Calculate row index for delay cascade
    const rowIndex = Math.floor(index / numberOfColumns);
    const isInitiallyVisible = rowIndex < initialRowCount;

    // For initially visible cards use a cascade delay, for later ones nearly instant
    const baseDelay = numberOfColumns === 1 ? 0.1 : 0.1;
    const delay = isInitiallyVisible
        ? baseDelay * rowIndex + Math.random() * 0.175
        : 0.01;
    const initialScale = 0.95 + Math.random() * 0.03;
    const initialY = 40 + Math.random() * 15;
    const initialBlur = 5;
    const customProps: CustomAnimationProps = {
        delay,
        initialScale,
        initialY,
        initialBlur,
        exitScale: initialScale,
    };

    // Use reduced motion if requested (e.g. slower devices)
    const shouldReduceMotion = useReducedMotion();

    const cardVariants = {
        hidden: (custom: CustomAnimationProps) => ({
            opacity: 0,
            scale: custom.initialScale,
            y: custom.initialY,
            filter: shouldReduceMotion ? "none" : `blur(${custom.initialBlur}px)`,
        }),
        visible: (custom: CustomAnimationProps) => ({
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "none",
            transition: {
                delay: custom.delay,
                duration: shouldReduceMotion ? 0.3 : 0.3 + Math.random() * 0.2,
                ease: "easeOut",
            },
        }),
        exit: (custom: CustomAnimationProps) => ({
            opacity: 0,
            scale: custom.exitScale,
            y: -custom.initialY,
            filter: shouldReduceMotion ? "none" : `blur(${custom.initialBlur}px)`,
            transition: {
                duration: shouldReduceMotion ? 0.2 : 0.3 + Math.random() * 0.2,
                ease: "easeIn",
            },
        }),
    };

    // Create a stable key for the card that doesn't change with layout
    const stableKey = `${result.year}-${result.contestantId}`;

    return (
        // Reserve the expected space with a fixed min-height
        <div ref={ref} className="min-h-[200px]">
            {inView ? (
                <motion.div
                    key={stableKey}
                    custom={customProps}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ willChange: "transform, opacity" }}
                    layoutId={stableKey}
                >
                    <MemoizedEntryCard {...result} />
                </motion.div>
            ) : (
                // Placeholder div to reserve space before the card loads
                <div className="min-h-[200px]"></div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Only re-render if the entry data changes or if index changes significantly
    // This prevents re-renders when only the layout changes slightly
    return prevProps.result.contestantId === nextProps.result.contestantId &&
        prevProps.result.year === nextProps.result.year &&
        Math.floor(prevProps.index / prevProps.numberOfColumns) ===
        Math.floor(nextProps.index / nextProps.numberOfColumns);
});

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
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const orientationChangeInProgressRef = useRef(false);

    // Track current visible results
    const [visibleResults, setVisibleResults] = useState<EntryResult[]>([]);

    // Track if we're in the exiting animation phase
    const [isExiting, setIsExiting] = useState(false);

    // Generate a unique key for the results list based on filters
    const resultsKey = `${selectedYear || "all"}-${selectedCountry || "all"}-${showingWinners ? "winners" : "all"}`;

    // Calculate the total height of the results list
    const calculateTotalHeight = (resultsList: EntryResult[]) => {
        if (!resultsList.length) return 0;

        const cardHeight = 200; // Estimated height of each card in pixels
        const gapSize = 24; // Gap size in pixels (6 in tailwind's gap-6)
        const totalRows = Math.ceil(resultsList.length / numberOfColumns);

        // Calculate total height including gaps
        return totalRows * cardHeight + (totalRows - 1) * gapSize;
    };

    // Debounced column count update to prevent frequent re-renders during resize
    const updateColumnCount = useCallback(() => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
            if (window.innerWidth < 768) {
                setNumberOfColumns(1);
            } else if (window.innerWidth < 1024) {
                setNumberOfColumns(2);
            } else {
                setNumberOfColumns(3);
            }
            resizeTimeoutRef.current = null;
        }, 20);
    }, []);

    // Handle orientation change separately from resize
    const handleOrientationChange = useCallback(() => {
        orientationChangeInProgressRef.current = true;
        setTimeout(() => {
            updateColumnCount();
            orientationChangeInProgressRef.current = false;
        }, 300);
    }, [updateColumnCount]);

    // Update column count based on screen width and orientation
    useEffect(() => {
        updateColumnCount();
        window.addEventListener("resize", updateColumnCount);

        if (window.screen && window.screen.orientation) {
            window.screen.orientation.addEventListener("change", handleOrientationChange);
        } else {
            window.addEventListener("orientationchange", handleOrientationChange);
        }

        return () => {
            window.removeEventListener("resize", updateColumnCount);

            if (window.screen && window.screen.orientation) {
                window.screen.orientation.removeEventListener("change", handleOrientationChange);
            } else {
                window.removeEventListener("orientationchange", handleOrientationChange);
            }

            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [updateColumnCount, handleOrientationChange]);

    // Estimate initially visible rows based on window height
    useEffect(() => {
        const estimatedCardHeight = 200;
        const visibleRows = Math.floor(window.innerHeight / estimatedCardHeight);
        setInitialRowCount(visibleRows);
    }, []);

    // Handle changes to filters - trigger exit animations
    useEffect(() => {
        if (visibleResults.length > 0) {
            setIsExiting(true);
        }
    }, [selectedYear, selectedCountry, showingWinners]);

    // Update visible results when not in exiting state
    useEffect(() => {
        if (!isExiting && results.length > 0 && !loading) {
            setVisibleResults(results);
        } else if (!isExiting && results.length === 0 && !loading) {
            setVisibleResults([]);
        }
    }, [results, loading, isExiting]);

    // Handle animation completion
    const handleExitComplete = () => {
        setIsExiting(false);
        // After exit animation completes, update to the latest results
        setVisibleResults(loading ? [] : results);
    };

    // Initial loading state
    if (visibleResults.length === 0 && loading && !isExiting) {
        return (
            <div className="relative" style={{ height: "300px" }}>
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

    if (visibleResults.length === 0 && !loading && !isExiting) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No results found. Try adjusting your filters.</p>
            </div>
        );
    }


    return (
        <div className="mb-16 relative backdrop-blur-xl">
            <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
                <div
                    key={isExiting ? "exiting-" + resultsKey : resultsKey}
                    ref={containerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    style={{ minHeight: `${calculateTotalHeight(visibleResults)}px` }}
                >
                    {visibleResults.map((result, index) => (
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

            {/* Show loading spinner when exiting and loading new results */}
            {isExiting && loading && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
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
            )}
        </div>
    );
};

export default ResultsList;