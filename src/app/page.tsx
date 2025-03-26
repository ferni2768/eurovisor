"use client";
import { useState, useEffect, useCallback } from "react";
import FilterSection from "@/components/FilterSection";
import FilterStatusMessage from "@/components/FilterStatusMessage";
import ResultsList from "@/components/ResultsList";
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
    --os-size: 12px; /* Increase scrollbar thickness (default is 10px) */
    --os-padding-perpendicular: 2px;
  }
  
  /* Additional styling for the scrollbar */
  .os-scrollbar-handle {
    border-radius: 10px;
  }
`;

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [contests, setContests] = useState<any[]>([]);
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [results, setResults] = useState<EntryResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [showingWinners, setShowingWinners] = useState<boolean>(false);

  // Initialize OverlayScrollbars
  const [initialize, instance] = useOverlayScrollbars({
    options: {
      scrollbars: {
        theme: 'os-theme-dark',
        autoHide: 'move',
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

  // Handle filter changes
  const applyFilters = useCallback(async () => {
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
          { setLoading, setError, setShowingWinners, setResults }
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
          { setLoading, setError, setResults, setCurrentContest }
        );
      }
      // Case 3: Only year selected
      else if (selectedYear && !selectedCountry) {
        await fetchYearEntries(
          selectedYear,
          countryNames,
          { setLoading, setError, setResults, setCurrentContest }
        );
      }
      // Case 4: Only country selected
      else if (!selectedYear && selectedCountry) {
        await fetchCountryEntries(
          selectedCountry,
          contests,
          countryNames,
          { setLoading, setError, setResults }
        );
      }
    } catch (err) {
      console.error("Error applying filters:", err);
      setError("Failed to apply filters. Please try again.");
      setShowingWinners(false);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedCountry, contests, countryNames, initialDataLoaded]);

  // Apply filters whenever they change
  useEffect(() => {
    if (initialDataLoaded) {
      applyFilters();
    }
  }, [selectedYear, selectedCountry, applyFilters, initialDataLoaded]);


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-indigo-700">Eurovisor</h1>
        <p className="text-gray-600">Explore Eurovision Song Contest performances</p>
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
  );
}