import React from "react";
import EntryCard from "./EntryCard";
import { EntryResult } from "@/types/eurovision";

interface ResultsListProps {
    results: EntryResult[];
    loading: boolean;
    error: string | null;
    selectedYear: number | null;
    selectedCountry: string | null;
    showingWinners?: boolean;
}

const ResultsList: React.FC<ResultsListProps> = ({
    results,
    loading,
    error,
    selectedYear,
    selectedCountry,
    showingWinners
}) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
                <EntryCard
                    key={`${result.year}-${result.contestantId}`}
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
            ))}
        </div>
    );
};

export default ResultsList;