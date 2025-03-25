"use client";
import { useState, useEffect, useCallback } from "react";
import FilterSection from "@/components/FilterSection";
import ResultsList from "@/components/ResultsList";
import { EntryResult, Contest } from "@/types/eurovision";
import {
  fetchInitialData,
  fetchWinners,
  fetchYearEntries,
  fetchCountryEntries,
  fetchCountryInYear
} from "@/lib/dataFetchers";

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

        {showingWinners && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-center">
            <span className="font-semibold text-black">🏆 Showing Eurovision Winners by Year 🏆</span>
          </div>
        )}

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