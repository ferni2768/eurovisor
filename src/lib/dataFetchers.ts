import { getContests, getContestByYear, getCountries } from "@/services/eurovisionService";
import { EntryResult, Contest, Contestant, Performance, Round } from "@/types/eurovision";

// Function to fetch winners for all years
export const fetchWinners = async (
    contestsData: Contest[],
    countriesData: Record<string, string>,
    callbacks: {
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setShowingWinners: (showing: boolean) => void;
        setResults: (results: EntryResult[]) => void;
        signal?: AbortSignal;
    }
) => {
    const { setLoading, setError, setShowingWinners, setResults, signal } = callbacks;

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
                getContestByYear(contest.year, { signal })
                    .then(contestData => {
                        if (!contestData || !contestData.rounds) {
                            // console.log(`No contest data or rounds for year ${contest.year}`);
                            return null;
                        }

                        // Find the final round
                        const finalRound = contestData.rounds.find((r: Round) => r && r.name === "final");
                        if (!finalRound || !finalRound.performances) {
                            // console.log(`No final round or performances for year ${contest.year}`);
                            return null;
                        }

                        // Find the winner (place === 1)
                        const winnerPerformance = finalRound.performances.find(
                            (p: Performance) => p && p.place === 1
                        );
                        if (!winnerPerformance) {
                            // console.log(`No winner performance for year ${contest.year}`);
                            return null;
                        }

                        // Find the contestant details
                        if (!contestData.contestants) {
                            // console.log(`No contestants for year ${contest.year}`);
                            return null;
                        }

                        const winnerContestant = contestData.contestants.find(
                            (c: Contestant) => c && c.id === winnerPerformance.contestantId
                        );
                        if (!winnerContestant) {
                            // console.log(`No winner contestant for year ${contest.year}`);
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
                    .catch(_err => {
                        // console.error(`Error fetching contest ${contest.year}:`, err);
                        return null;
                    })
            );

            const batchResults = await Promise.all(batchPromises);
            winners.push(...batchResults.filter(Boolean) as EntryResult[]);
        }

        // Sort by year (newest first)
        winners.sort((a, b) => b.year - a.year);

        setResults(winners);
    } catch (_err) {
        // console.error("Error fetching winners:", err);
        setError("Failed to load Eurovision winners. Please try again later.");
        setShowingWinners(false);
    } finally {
        setLoading(false);
    }
};

// Function to fetch all entries for a specific country
export const fetchCountryEntries = async (
    countryCode: string,
    contestsData: Contest[],
    countriesData: Record<string, string>,
    callbacks: {
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setResults: (results: EntryResult[]) => void;
        signal?: AbortSignal;
    }
) => {
    const { setLoading, setError, setResults, signal } = callbacks;

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
                getContestByYear(contest.year, { signal })
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
                    .catch(_err => {
                        // console.error(`Error fetching contest ${contest.year}:`, err);
                        return null;
                    })
            );

            const batchResults = await Promise.all(batchPromises);
            countryEntries.push(...batchResults.filter(Boolean) as EntryResult[]);
        }

        // Sort by year (newest first)
        countryEntries.sort((a, b) => b.year - a.year);

        setResults(countryEntries);
    } catch (_err) {
        // console.error("Error fetching country entries:", err);
        setError(`Failed to load entries for ${countriesData[countryCode] || countryCode}. Please try again later.`);
    } finally {
        setLoading(false);
    }
};

// Function to fetch all entries for a specific year (including non-qualifying entries)
export const fetchYearEntries = async (
    year: number,
    countriesData: Record<string, string>,
    callbacks: {
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setResults: (results: EntryResult[]) => void;
        setCurrentContest: (contest: Contest | null) => void;
        signal?: AbortSignal;
    }
) => {
    const { setLoading, setError, setResults, setCurrentContest, signal } = callbacks;

    setLoading(true);
    setError(null);

    try {
        const contestData = await getContestByYear(year, { signal });
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
    } catch (_err) {
        // console.error(`Error fetching entries for year ${year}:`, err);
        setError(`Failed to load entries for Eurovision ${year}. Please try again later.`);
    } finally {
        setLoading(false);
    }
};

// Function to fetch a specific country in a specific year
export const fetchCountryInYear = async (
    year: number,
    countryCode: string,
    countriesData: Record<string, string>,
    callbacks: {
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setResults: (results: EntryResult[]) => void;
        setCurrentContest: (contest: Contest | null) => void;
        signal?: AbortSignal;
    }
) => {
    const { setLoading, setError, setResults, setCurrentContest, signal } = callbacks;

    setLoading(true);
    setError(null);

    try {
        const contestData = await getContestByYear(year, { signal });
        if (!contestData || !contestData.contestants) {
            setResults([]);
            setError(`No data available for Eurovision ${year}`);
            return;
        }

        setCurrentContest(contestData);

        // Find the contestant for the selected country
        const contestant = contestData.contestants.find((c: Contestant) => c && c.country === countryCode);

        if (!contestant) {
            setResults([]);
            setError(`${countriesData[countryCode] || countryCode} did not participate in Eurovision ${year}`);
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
            countryName: countriesData[contestant.country] || contestant.country,
            artist: contestant.artist,
            song: contestant.song,
            place,
            isWinner,
            didQualify
        }]);
    } catch (_err) {
        // console.error(`Error fetching entry for ${countriesData[countryCode] || countryCode} in ${year}:`, err);
        setError(`Failed to load entry for ${countriesData[countryCode] || countryCode} in Eurovision ${year}. Please try again later.`);
    } finally {
        setLoading(false);
    }
};

// Function to fetch initial data (countries and contests)
export const fetchInitialData = async (
    callbacks: {
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setCountryNames: (countries: Record<string, string>) => void;
        setContests: (contests: Contest[]) => void;
        setInitialDataLoaded: (loaded: boolean) => void;
        signal?: AbortSignal;
    }
) => {
    const { setLoading, setError, setCountryNames, setContests, setInitialDataLoaded, signal } = callbacks;

    setLoading(true);
    setError(null);

    try {
        // Fetch country names and contests in parallel
        const [countriesData, contestsData] = await Promise.all([
            getCountries({ signal }),
            getContests({ signal })
        ]);

        setCountryNames(countriesData);
        setContests(contestsData);
        setInitialDataLoaded(true);

        return { countriesData, contestsData };
    } catch (_err) {
        // console.error("Failed to load initial data:", err);
        setError("Failed to load initial data. Please try again later.");
        return null;
    } finally {
        setLoading(false);
    }
};