"use client";
import { useState, useEffect } from "react";
import { getContestantDetails } from "@/services/eurovisionService";
import Flag from "react-world-flags";

interface EntryCardProps {
    year: number;
    contestantId: number;
    country: string;
    artist: string;
    song: string;
    countryName: string;
    place?: number;
    isWinner?: boolean;
    didQualify?: boolean;
}

export default function EntryCard({
    year,
    contestantId,
    country,
    artist,
    song,
    countryName,
    place,
    isWinner,
    didQualify
}: EntryCardProps) {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const details = await getContestantDetails(year, contestantId);
                if (details.videoUrls && details.videoUrls.length > 0) {
                    setVideoUrl(details.videoUrls[0]);
                }
            } catch (err) {
                setError("Failed to load video");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [year, contestantId]);

    // Determine which badge to show
    const renderBadge = () => {
        // Special case for 2020 (COVID year)
        if (year === 2020) {
            return (
                <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    😷 COVID Canceled
                </div>
            );
        } else if (isWinner) {
            return (
                <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    🏆 Winner
                </div>
            );
        } else if (didQualify === false) {
            return (
                <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                    ❌ Non-Qualifying
                </div>
            );
        } else if (place !== undefined) {
            return (
                <div className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${place <= 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {`${place}${getOrdinalSuffix(place)} place`}
                </div>
            );
        }
        return null;
    };


    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">{song}</h3>
                        <p className="text-gray-600">{artist}</p>
                    </div>
                    {renderBadge()}
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                        <Flag
                            code={country}
                            style={{ height: "1.2em", width: "1.8em" }}
                            className="rounded inline-block mr-1"
                        />
                        {countryName}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        {year}
                    </span>
                </div>

                {videoUrl && !loading && !error && (
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                        <iframe
                            src={videoUrl}
                            title={`${artist} - ${song}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-64 rounded"
                        ></iframe>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}

                {error && (
                    <div className="text-center py-4 text-red-500">
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to get ordinal suffix for numbers
function getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
        return "st";
    }
    if (j === 2 && k !== 12) {
        return "nd";
    }
    if (j === 3 && k !== 13) {
        return "rd";
    }
    return "th";
}