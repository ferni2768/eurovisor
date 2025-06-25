"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import FilterSection from "@/components/FilterSection";
import FilterStatusMessage from "@/components/FilterStatusMessage";
import ResultsList from "@/components/ResultsList";
import BackgroundCanvas from "@/components/BackgroundCanvas";
import { EntryResult, Contest } from "@/types/eurovision";
import {
  fetchInitialData,
  fetchWinners,
  fetchYearEntries,
  fetchCountryEntries,
  fetchCountryInYear
} from "@/lib/dataFetchers";

import 'overlayscrollbars/overlayscrollbars.css';
import { useOverlayScrollbars } from "overlayscrollbars-react";
import {
  OverlayScrollbars,
  ScrollbarsHidingPlugin,
  SizeObserverPlugin
} from "overlayscrollbars";

// Register plugins
OverlayScrollbars.plugin(ScrollbarsHidingPlugin);
OverlayScrollbars.plugin(SizeObserverPlugin);

// Custom CSS for scrollbar
const customScrollbarStyles = `
  .os-scrollbar {
    --os-size: 12px;
    --os-padding-perpendicular: 2px;
  }

  .os-scrollbar-handle {
    border-radius: 10px;
    margin-right: 2px;
    background-color: rgba(255, 255, 255, 0.4);
  }

  .os-scrollbar-track .os-scrollbar-handle:hover {
    background-color: rgba(200, 200, 200, 0.8) !important;
  }
`;

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [, setCurrentContest] = useState<Contest | null>(null);
  const [results, setResults] = useState<EntryResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [showingWinners, setShowingWinners] = useState<boolean>(false);
  const [showFooter, setShowFooter] = useState<boolean>(false);

  // Ref to hold the current AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  // Debounce timer for fast filter changes
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize OverlayScrollbars
  const [initialize, instance] = useOverlayScrollbars({
    options: {
      scrollbars: {
        theme: 'os-theme-dark',
        autoHide: 'scroll',
        autoHideDelay: 400,
        dragScroll: true,
        clickScroll: true,
      },
      overflow: {
        x: 'hidden',
        y: 'scroll',
      }
    },
    defer: true
  });

  // Apply custom scrollbar styles
  useEffect(() => {
    // Add custom styles to the document
    const styleElement = document.createElement('style');
    styleElement.textContent = customScrollbarStyles;
    document.head.appendChild(styleElement);

    return () => {
      // Clean up styles when component unmounts
      document.head.removeChild(styleElement);
    };
  }, []);

  // Apply OverlayScrollbars to the body when component mounts
  useEffect(() => {
    // Add initialization attributes to prevent flickering
    document.documentElement.setAttribute('data-overlayscrollbars-initialize', '');
    document.body.setAttribute('data-overlayscrollbars-initialize', '');

    // Initialize OverlayScrollbars on the body
    initialize(document.body);

    // Clean up when component unmounts
    return () => {
      const osInstance = instance();
      if (osInstance) {
        osInstance.destroy();
      }
      document.documentElement.removeAttribute('data-overlayscrollbars-initialize');
      document.body.removeAttribute('data-overlayscrollbars-initialize');
    };
  }, [initialize, instance]);

  // Fetch country names and contests on initial load
  useEffect(() => {
    const loadInitialData = async () => {
      const data = await fetchInitialData({
        setLoading,
        setError,
        setCountryNames,
        setContests,
        setInitialDataLoaded
      });

      if (data) {
        // Since both filters are initially null (all), fetch winners
        await fetchWinners(
          data.contestsData,
          data.countriesData,
          { setLoading, setError, setShowingWinners, setResults }
        );
      }
    };

    loadInitialData();
  }, []);

  // Handle filter changes with cancellation of previous requests
  const applyFilters = useCallback(async () => {
    // Cancel previous pending requests if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!initialDataLoaded) return;

    setLoading(true);
    setError(null);

    try {
      // Case 1: Both filters are "all" - show winners
      if (!selectedYear && !selectedCountry) {
        setShowingWinners(true);
        await fetchWinners(
          contests,
          countryNames,
          { setLoading, setError, setShowingWinners, setResults, signal: controller.signal }
        );
        return;
      } else {
        setShowingWinners(false);
      }

      // Case 2: Both year and country selected
      if (selectedYear && selectedCountry) {
        await fetchCountryInYear(
          selectedYear,
          selectedCountry,
          countryNames,
          { setLoading, setError, setResults, setCurrentContest, signal: controller.signal }
        );
      }
      // Case 3: Only year selected
      else if (selectedYear && !selectedCountry) {
        await fetchYearEntries(
          selectedYear,
          countryNames,
          { setLoading, setError, setResults, setCurrentContest, signal: controller.signal }
        );
      }
      // Case 4: Only country selected
      else if (!selectedYear && selectedCountry) {
        await fetchCountryEntries(
          selectedCountry,
          contests,
          countryNames,
          { setLoading, setError, setResults, signal: controller.signal }
        );
      }
    } catch (err: unknown) {
      // If the error is an abort error, simply return
      if (err instanceof Error && err.name === "AbortError") {
        // console.log("Request aborted");
        return;
      }
      // console.error("Error applying filters:", err);
      setError("Failed to apply filters. Please try again.");
      setShowingWinners(false);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedCountry, contests, countryNames, initialDataLoaded]);

  // Apply filters whenever they change with debouncing
  useEffect(() => {
    if (initialDataLoaded) {
      // Clear existing debounce timer
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }

      // Set up debounced filter application
      filterDebounceRef.current = setTimeout(() => {
        applyFilters();
      }, 150);

      // Cleanup function
      return () => {
        if (filterDebounceRef.current) {
          clearTimeout(filterDebounceRef.current);
        }
      };
    }
  }, [selectedYear, selectedCountry, applyFilters, initialDataLoaded]);

  // Handle footer visibility with delay and animations
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowFooter(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowFooter(false);
    }
  }, [loading]);


  return (
    <>
      <BackgroundCanvas
        selectedYear={selectedYear}
        selectedCountry={selectedCountry}
      />

      <div className="min-h-screen flex flex-col relative p-4.5">
        <div className="flex-grow">
          <header className="mb-8 text-center">
            <h1
              onClick={() => {
                setSelectedYear(null);
                setSelectedCountry(null);
              }}
              className="text-4xl font-bold text-indigo-50 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
            >
              Eurovisor
            </h1>
            <p className="text-gray-300">Explore Eurovision Song Contest performances</p>
          </header>

          <div className="max-w-6xl mx-auto">
            <FilterSection
              selectedYear={selectedYear}
              selectedCountry={selectedCountry}
              onYearChange={setSelectedYear}
              onCountryChange={setSelectedCountry}
            />

            <FilterStatusMessage
              selectedYear={selectedYear}
              selectedCountry={selectedCountry}
              showingWinners={showingWinners}
            />

            <ResultsList
              results={results}
              loading={loading}
              error={error}
              selectedYear={selectedYear}
              selectedCountry={selectedCountry}
              showingWinners={showingWinners}
            />
          </div>
        </div>

        <footer
          className="text-center mt-2 mb-2 text-sm text-white/"
          style={{
            transition: 'opacity 0.5s',
            opacity: showFooter ? 1 : 0
          }}
        >
          <a
            href="https://github.com/ferni2768/eurovisor"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            v0.2 by ferni2768
          </a>
        </footer>
      </div>
    </>
  );
}