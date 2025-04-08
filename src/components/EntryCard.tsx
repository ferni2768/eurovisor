"use client";
import { useState, useEffect, useRef } from "react";
import { getContestantDetails } from "@/services/eurovisionService";
import Flag from "react-world-flags";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import '@/styles/customPlayButton.css';

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
    didQualify,
}: EntryCardProps) {
    const [videoId, setVideoId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const videoDataFetched = useRef(false);

    // Improved YouTube video ID extraction function
    const getYoutubeIdFromUrl = (url: string): string | null => {
        // This comprehensive regex handles all YouTube URL formats including youtube-nocookie.com
        const regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);

        if (match && match[1]) {
            return match[1];
        }

        // Fallback for direct embed URLs
        const embedRegex = /(?:youtube(?:-nocookie)?\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
        const embedMatch = url.match(embedRegex);

        return embedMatch ? embedMatch[1] : null;
    };

    // Fetch video details only once
    useEffect(() => {
        const fetchDetails = async () => {
            if (videoDataFetched.current) return;
            try {
                setLoading(true);
                const details = await getContestantDetails(year, contestantId);

                if (details.videoUrls && details.videoUrls.length > 0) {
                    const videoUrl = details.videoUrls[0];

                    const extractedId = getYoutubeIdFromUrl(videoUrl);

                    if (extractedId) {
                        setVideoId(extractedId);
                        videoDataFetched.current = true;
                    } else {
                        setError(`Could not extract video ID from URL: ${videoUrl}`);
                    }
                } else {
                    setError("No video URL available for this entry");
                }
            } catch (err) {
                console.error("Error fetching video details:", err);
                setError("Failed to load video details");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [year, contestantId]);

    // Render badge based on contest details
    const renderBadge = () => {
        if (year === 2020) {
            return (
                <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 whitespace-nowrap flex-shrink-0">
                    😷 COVID Canceled
                </div>
            );
        } else if (isWinner) {
            return (
                <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap flex-shrink-0">
                    🏆 Winner
                </div>
            );
        } else if (didQualify === false) {
            return (
                <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 whitespace-nowrap flex-shrink-0">
                    ❌ Non-Qualifying
                </div>
            );
        } else if (place !== undefined) {
            return (
                <div
                    className={`text-sm font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${place <= 3 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}
                >
                    {`${place}${getOrdinalSuffix(place)} place`}
                </div>
            );
        }
        return null;
    };

    // Render the video section based on loading state and availability
    const renderVideoSection = () => {
        if (loading) {
            return <div className="absolute inset-0 bg-neutral-600/50 animate-pulse rounded-xl" />;
        }

        if (error) {
            return (
                <div className="absolute inset-0 text-center py-4 text-red-500 flex items-center justify-center rounded-xl">
                    <p>{error}</p>
                </div>
            );
        }

        if (videoId) {
            return (
                <LiteYouTubeEmbed
                    id={videoId}
                    title={`${artist} - ${song}`}
                    poster="hqdefault"
                    wrapperClass="yt-lite rounded-xl absolute inset-0"
                    iframeClass="rounded-xl"
                    playerClass="custom-play-button"
                    noCookie={true}
                    adNetwork={false}
                />
            );
        }

        return (
            <div className="absolute inset-0 text-center py-4 text-gray-500 flex items-center justify-center rounded-xl">
                <p>No video available</p>
            </div>
        );
    };


    return (
        <div className="bg-white/25 rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-2 border-white/20 border-2 shadow-[0_5px_15px_rgba(176,167,235,0.1)]">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <h3 className="text-lg font-semibold text-white">{song}</h3>
                        <p className="text-white">{artist}</p>
                    </div>
                    {renderBadge()}
                </div>

                <div className="flex items-center text-sm text-white mb-4">
                    <span className="flex items-center">
                        {country === "YU" ? (
                            <div className="flex mr-1">
                                <Flag
                                    code="RS"
                                    style={{ height: "1.2em", width: "1.8em", marginRight: "2px" }}
                                    className="rounded inline-block"
                                />
                                <Flag
                                    code="ME"
                                    style={{ height: "1.2em", width: "1.8em" }}
                                    className="rounded inline-block"
                                />
                            </div>
                        ) : (
                            <Flag
                                code={country}
                                style={{ height: "1.2em", width: "1.8em" }}
                                className="rounded inline-block mr-1"
                            />
                        )}
                        {countryName}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                        <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                        </svg>
                        {year}
                    </span>
                </div>

                <div className="relative w-full mb-4 rounded-xl overflow-hidden cursor-pointer" style={{ paddingBottom: videoId ? 0 : "56.25%" }}>
                    {renderVideoSection()}
                </div>
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