"use client";
import { useState, useEffect, useCallback } from "react";
import FilterSection from "@/components/FilterSection";
import ResultsList from "@/components/ResultsList";
import { getContests, getContestByYear, getCountries } from "@/services/eurovisionService";
import { EntryResult, Contest, Contestant, Performance, Round } from "@/types/eurovision";

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
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch country names and contests in parallel
        const [countriesData, contestsData] = await Promise.all([
          getCountries(),
          getContests()
        ]);

        setCountryNames(countriesData);
        setContests(contestsData);
        setInitialDataLoaded(true);

        // Since both filters are initially null (all), fetch winners
        await fetchWinners(contestsData, countriesData);
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load initial data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Function to fetch winners for all years
  const fetchWinners = async (contestsData: any[], countriesData: Record<string, string>) => {
    setLoading(true);
    setError(null);
    setShowingWinners(true);

    try {
      // Sort contests by year (newest first)
      const sortedContests = [...contestsData].sort((a, b) => b.year - a.year);

      // Process contests in batches to avoid overwhelming the browser
      const batchSize = 6; // Browser typically limits to 6 concurrent requests
      const winners: EntryResult[] = [];

      for (let i = 0; i < sortedContests.length; i += batchSize) {
        const batch = sortedContests.slice(i, i + batchSize);
        const batchPromises = batch.map(contest =>
          getContestByYear(contest.year)
            .then(contestData => {
              if (!contestData || !contestData.rounds) {
                console.log(`No contest data or rounds for year ${contest.year}`);
                return null;
              }

              // Find the final round
              const finalRound = contestData.rounds.find((r: Round) => r && r.name === "final");
              if (!finalRound || !finalRound.performances) {
                console.log(`No final round or performances for year ${contest.year}`);
                return null;
              }

              // Find the winner (place === 1)
              const winnerPerformance = finalRound.performances.find(
                (p: Performance) => p && p.place === 1
              );
              if (!winnerPerformance) {
                console.log(`No winner performance for year ${contest.year}`);
                return null;
              }

              // Find the contestant details
              if (!contestData.contestants) {
                console.log(`No contestants for year ${contest.year}`);
                return null;
              }

              const winnerContestant = contestData.contestants.find(
                (c: Contestant) => c && c.id === winnerPerformance.contestantId
              );
              if (!winnerContestant) {
                console.log(`No winner contestant for year ${contest.year}`);
                return null;
              }

              return {
                year: contest.year,
                contestantId: winnerContestant.id,
                country: winnerContestant.country,
                countryName: countriesData[winnerContestant.country] || winnerContestant.country,
                artist: winnerContestant.artist,
                song: winnerContestant.song,
                place: 1, // It's a winner
                isWinner: true,
                didQualify: true
              };
            })
            .catch(err => {
              console.error(`Error fetching contest ${contest.year}:`, err);
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);
        winners.push(...batchResults.filter(Boolean) as EntryResult[]);
      }

      // Sort by year (newest first)
      winners.sort((a, b) => b.year - a.year);

      setResults(winners);
    } catch (err) {
      console.error("Error fetching winners:", err);
      setError("Failed to load Eurovision winners. Please try again later.");
      setShowingWinners(false);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all entries for a specific country
  const fetchCountryEntries = async (countryCode: string, contestsData: any[], countriesData: Record<string, string>) => {
    setLoading(true);
    setError(null);

    try {
      // Sort contests by year (newest first)
      const sortedContests = [...contestsData].sort((a, b) => b.year - a.year);

      // Process contests in batches to avoid overwhelming the browser
      const batchSize = 6; // Browser typically limits to 6 concurrent requests
      const countryEntries: EntryResult[] = [];

      for (let i = 0; i < sortedContests.length; i += batchSize) {
        const batch = sortedContests.slice(i, i + batchSize);
        const batchPromises = batch.map(contest =>
          getContestByYear(contest.year)
            .then(contestData => {
              if (!contestData || !contestData.contestants) return null;

              const contestant = contestData.contestants.find(
                (c: Contestant) => c && c.country === countryCode
              );

              if (!contestant) return null;

              let place: number | undefined = undefined;
              let isWinner = false;
              let didQualify = false;

              if (contestData.rounds) {
                const finalRound = contestData.rounds.find((r: Round) => r && r.name === "final");

                if (finalRound && finalRound.performances) {
                  const performance = finalRound.performances.find(
                    (p: Performance) => p && p.contestantId === contestant.id
                  );
                  if (performance) {
                    place = performance.place;
                    isWinner = place === 1;
                    didQualify = true;
                  } else {
                    // Contestant didn't perform in the final
                    didQualify = false;
                  }
                }
              }

              return {
                year: contest.year,
                contestantId: contestant.id,
                country: contestant.country,
                countryName: countriesData[contestant.country] || contestant.country,
                artist: contestant.artist,
                song: contestant.song,
                place,
                isWinner,
                didQualify
              };
            })
            .catch(err => {
              console.error(`Error fetching contest ${contest.year}:`, err);
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);
        countryEntries.push(...batchResults.filter(Boolean) as EntryResult[]);
      }

      // Sort by year (newest first)
      countryEntries.sort((a, b) => b.year - a.year);

      setResults(countryEntries);
    } catch (err) {
      console.error("Error fetching country entries:", err);
      setError(`Failed to load entries for ${countriesData[countryCode] || countryCode}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all entries for a specific year (including non-qualifying entries)
  const fetchYearEntries = async (year: number, countriesData: Record<string, string>) => {
    setLoading(true);
    setError(null);

    try {
      const contestData = await getContestByYear(year);
      if (!contestData || !contestData.contestants) {
        setResults([]);
        setError(`No data available for Eurovision ${year}`);
        return;
      }

      setCurrentContest(contestData);

      // Get all contestants for this year
      const allEntries: EntryResult[] = [];

      // Find the final round
      const finalRound = contestData.rounds?.find((round: Round) => round && round.name === "final");

      // Find the semi-final rounds
      const semiFinalRounds = contestData.rounds?.filter(
        (round: Round) => round && round.name.toLowerCase().includes("semi")
      ) || [];

      // Process all contestants
      for (const contestant of contestData.contestants) {
        if (!contestant) continue;

        let place: number | undefined = undefined;
        let isWinner = false;
        let didQualify = false;

        // Check if contestant was in the final
        if (finalRound && finalRound.performances) {
          const finalPerformance = finalRound.performances.find(
            (p: Performance) => p && p.contestantId === contestant.id
          );

          if (finalPerformance) {
            place = finalPerformance.place;
            isWinner = place === 1;
            didQualify = true;
          }
        }

        // If not in final, check if they were in a semi-final
        if (!didQualify && semiFinalRounds.length > 0) {
          for (const semiRound of semiFinalRounds) {
            if (semiRound.performances) {
              const semiPerformance = semiRound.performances.find(
                (p: Performance) => p && p.contestantId === contestant.id
              );

              if (semiPerformance) {
                // They were in a semi-final but didn't qualify for the final
                didQualify = false;
                break;
              }
            }
          }
        }

        allEntries.push({
          year,
          contestantId: contestant.id,
          country: contestant.country,
          countryName: countriesData[contestant.country] || contestant.country,
          artist: contestant.artist,
          song: contestant.song,
          place,
          isWinner,
          didQualify
        });
      }

      // Sort entries: winners first, then finalists by place, then non-qualifiers
      allEntries.sort((a, b) => {
        // Winners first
        if (a.isWinner && !b.isWinner) return -1;
        if (!a.isWinner && b.isWinner) return 1;

        // Qualified entries before non-qualified
        if (a.didQualify && !b.didQualify) return -1;
        if (!a.didQualify && b.didQualify) return 1;

        // Sort qualified entries by place
        if (a.didQualify && b.didQualify) {
          if (a.place === undefined && b.place === undefined) return 0;
          if (a.place === undefined) return 1;
          if (b.place === undefined) return -1;
          return a.place - b.place;
        }

        // Sort non-qualified entries alphabetically by country
        return a.countryName.localeCompare(b.countryName);
      });

      setResults(allEntries);
    } catch (err) {
      console.error(`Error fetching entries for year ${year}:`, err);
      setError(`Failed to load entries for Eurovision ${year}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const applyFilters = useCallback(async () => {
    if (!initialDataLoaded) return;

    setLoading(true);
    setError(null);

    try {
      // Case 1: Both filters are "all" - show winners
      if (!selectedYear && !selectedCountry) {
        setShowingWinners(true);
        await fetchWinners(contests, countryNames);
        return;
      } else {
        setShowingWinners(false);
      }

      // Case 2: Both year and country selected
      if (selectedYear && selectedCountry) {
        const contestData = await getContestByYear(selectedYear);
        if (!contestData || !contestData.contestants) {
          setResults([]);
          setError(`No data available for Eurovision ${selectedYear}`);
          return;
        }

        setCurrentContest(contestData);

        // Find the contestant for the selected country
        const contestant = contestData.contestants.find((c: Contestant) => c && c.country === selectedCountry);

        if (!contestant) {
          setResults([]);
          setError(`${countryNames[selectedCountry] || selectedCountry} did not participate in Eurovision ${selectedYear}`);
          return;
        }

        // Find the performance in the final round
        let place: number | undefined = undefined;
        let isWinner = false;
        let didQualify = false;

        if (contestData.rounds) {
          const finalRound = contestData.rounds.find((round: Round) => round && round.name === "final");

          if (finalRound && finalRound.performances) {
            const performance = finalRound.performances.find(
              (p: Performance) => p && p.contestantId === contestant.id
            );
            if (performance) {
              place = performance.place;
              isWinner = place === 1;
              didQualify = true;
            } else {
              // Check if they were in a semi-final
              const semiFinals = contestData.rounds.filter(
                (r: Round) => r && r.name.toLowerCase().includes("semi")
              );

              for (const semi of semiFinals) {
                if (semi.performances) {
                  const semiPerformance = semi.performances.find(
                    (p: Performance) => p && p.contestantId === contestant.id
                  );

                  if (semiPerformance) {
                    // They were in a semi-final but didn't qualify for the final
                    didQualify = false;
                    break;
                  }
                }
              }
            }
          }
        }

        setResults([{
          year: contestData.year,
          contestantId: contestant.id,
          country: contestant.country,
          countryName: countryNames[contestant.country] || contestant.country,
          artist: contestant.artist,
          song: contestant.song,
          place,
          isWinner,
          didQualify
        }]);
      }
      // Case 3: Only year selected
      else if (selectedYear && !selectedCountry) {
        // Use the dedicated function to fetch all entries for the selected year
        await fetchYearEntries(selectedYear, countryNames);
      }
      // Case 4: Only country selected
      else if (!selectedYear && selectedCountry) {
        // Use the dedicated function to fetch all entries for the selected country
        await fetchCountryEntries(selectedCountry, contests, countryNames);
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