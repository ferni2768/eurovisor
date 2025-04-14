import React, { useState, useEffect, useRef, useCallback } from "react";
import EntryCard from "./EntryCard";
import { EntryResult } from "@/types/eurovision";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import ErrorCard from "./ErrorCard";

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
    return prevProps.contestantId === nextProps.contestantId && prevProps.year === nextProps.year;
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

// Error-specific custom properties and variants to mimic entry card transitions
const errorCustomProps: CustomAnimationProps = {
    delay: 0.2,
    initialScale: 0.95,
    initialY: 40,
    initialBlur: 5,
    exitScale: 0.95,
};

const errorCardVariants = {
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
        filter: "none",
        transition: {
            delay: custom.delay,
            duration: 0.3,
            ease: "easeOut",
        },
    }),
    exit: (custom: CustomAnimationProps) => ({
        opacity: 0,
        scale: custom.exitScale,
        y: -custom.initialY,
        filter: `blur(${custom.initialBlur}px)`,
        transition: {
            duration: 0.3,
            ease: "easeIn",
        },
    }),
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
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const orientationChangeInProgressRef = useRef(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [nextErrorMessage, setNextErrorMessage] = useState<string | null>(null);
    const [pendingError, setPendingError] = useState<string | null>(null);

    const [isExitingError, setIsExitingError] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [animatingComponent, setAnimatingComponent] = useState<'none' | 'error' | 'entries'>('none');

    const [showEntriesAfterErrorExit, setShowEntriesAfterErrorExit] = useState(false);
    const [showErrorAfterEntriesExit, setShowErrorAfterEntriesExit] = useState(false);

    // Track current visible results
    const [visibleResults, setVisibleResults] = useState<EntryResult[]>([]);
    // Generate a unique key for the results list based on filters
    const resultsKey = `${selectedYear || "all"}-${selectedCountry || "all"}-${showingWinners ? "winners" : "all"}`;

    // Calculate the total height of the results list
    const calculateTotalHeight = (resultsList: EntryResult[]) => {
        if (!resultsList.length) return 0;

        const cardHeight = 200;
        const gapSize = 24;
        const totalRows = Math.ceil(resultsList.length / numberOfColumns);

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
            setAnimatingComponent('entries');
        }
    }, [selectedYear, selectedCountry, showingWinners]);

    // Update visible results when not in exiting state
    useEffect(() => {
        if (!isExiting && results.length > 0 && !loading && animatingComponent === 'none') {
            setVisibleResults(results);
        } else if (!isExiting && results.length === 0 && !loading && animatingComponent === 'none') {
            setVisibleResults([]);
        }
    }, [results, loading, isExiting, animatingComponent]);

    // Handle animation completion for entries
    const handleEntriesExitComplete = () => {
        setIsExiting(false);

        if (showErrorAfterEntriesExit) {
            // Now that entries have exited, show the error
            setErrorMessage(pendingError);
            setPendingError(null);
            setShowErrorAfterEntriesExit(false);
            setAnimatingComponent('error');
        } else {
            // Update to the latest results
            setVisibleResults(loading ? [] : results);
            setAnimatingComponent('none');
        }
    };

    // Handle animation completion for error
    const handleErrorExitComplete = () => {
        setIsExitingError(false);

        if (nextErrorMessage) {
            // If we have a next error message, show it now
            setErrorMessage(nextErrorMessage);
            setNextErrorMessage(null);
            setAnimatingComponent('error');
        } else if (showEntriesAfterErrorExit) {
            // Now that error has exited, show the entries
            setVisibleResults(loading ? [] : results);
            setShowEntriesAfterErrorExit(false);
            setAnimatingComponent('entries');
        } else {
            setErrorMessage(null);
            setAnimatingComponent('none');
        }
    };

    // Handle error state changes
    useEffect(() => {
        if (error !== errorMessage && error !== pendingError && error !== nextErrorMessage) {
            if (error) {
                // If we have a new error
                if (visibleResults.length > 0) {
                    // If we have entries showing, exit them first
                    setPendingError(error);
                    setIsExiting(true);
                    setShowErrorAfterEntriesExit(true);
                } else if (errorMessage) {
                    // If we already had an error, animate out the old one first
                    setNextErrorMessage(errorMessage);
                    setIsExitingError(true);
                    setAnimatingComponent('error');

                    setTimeout(async () => {
                        setIsExitingError(false);
                        await setErrorMessage(error);
                    }, 300);
                } else {
                    // If we didn't have an error before and no entries, just show the new one
                    setErrorMessage(error);
                    setAnimatingComponent('error');
                }
            }
        }

        if (!error && animatingComponent === 'error' && results.length > 0) {
            setErrorMessage(null);
            setTimeout(() => {
                setAnimatingComponent('none');
            }, 300);
        }
    }, [error, errorMessage, pendingError, nextErrorMessage, results, visibleResults.length]);

    // Initial loading state
    if (visibleResults.length === 0 && loading && !isExiting && !errorMessage && animatingComponent === 'none') {
        return (
            <div className="relative" style={{ height: "300px" }}>
                <div className="absolute top-1/2 mt-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="60px"
                            viewBox="0 -960 960 960"
                            width="60px"
                            fill="#ffffff"
                            className="animate-bounce"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                opacity: { duration: 0.5, ease: "easeInOut", delay: 0.3 },
                            }}
                        >
                            <path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47Z" />
                        </motion.svg>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="mb-16 relative">
            {/* Error card with AnimatePresence */}
            <AnimatePresence mode="wait" onExitComplete={handleErrorExitComplete}>
                {errorMessage && (
                    <motion.div
                        key={`error-${error}`}
                        custom={errorCustomProps}
                        variants={errorCardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <ErrorCard error={errorMessage} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Only show results if there's no error or we're transitioning from error to results */}
            {(!errorMessage || (isExitingError && showEntriesAfterErrorExit)) && (
                <AnimatePresence
                    mode="wait"
                    onExitComplete={handleEntriesExitComplete}
                >
                    {(visibleResults.length > 0 || isExiting) && (
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
                    )}
                </AnimatePresence>
            )}

            {/* Show loading spinner when exiting and loading new results */}
            {isExiting && loading && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="40px"
                        viewBox="0 -960 960 960"
                        width="40px"
                        fill="#6366f1"
                        className="animate-bounce"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: 0.5, ease: "easeInOut", delay: 0.3 },
                        }}
                    >
                        <path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47Z" />
                    </motion.svg>
                </div>
            )}
        </div>
    );
};

export default ResultsList;