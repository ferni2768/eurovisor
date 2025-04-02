"use client";
import { useState, useEffect, useRef, useCallback, memo } from "react";
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

// Memoized VideoPlayer component to prevent unnecessary re-renders
const VideoPlayer = memo(
    ({
        videoUrl,
        title,
        onLoad,
        isVisible,
    }: {
        videoUrl: string;
        title: string;
        onLoad?: () => void;
        isVisible: boolean;
    }) => {
        const [loaded, setLoaded] = useState(false);
        const iframeRef = useRef<HTMLIFrameElement>(null);

        // Extract YouTube video ID
        const getYoutubeIdFromUrl = (url: string): string | null => {
            const regex =
                /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
            const match = url.match(regex);
            return match ? match[1] : null;
        };

        const videoId = getYoutubeIdFromUrl(videoUrl);

        // Construct proper embed URL
        let embedUrl = videoUrl;
        if (videoId) {
            const origin =
                typeof window !== "undefined" ? window.location.origin : "";
            embedUrl = `https://www.youtube.com/embed/${videoId}?origin=${encodeURIComponent(
                origin
            )}`;
        }

        const handleLoad = useCallback(() => {
            setLoaded(true);
            if (onLoad) onLoad();
        }, [onLoad]);

        // Control iframe src based on visibility
        useEffect(() => {
            if (!iframeRef.current) return;
            if (isVisible) {
                // Only set src if it's not already set (to avoid reloading)
                if (!iframeRef.current.src) {
                    iframeRef.current.src = embedUrl;
                }
            } else if (!loaded) {
                // Remove src if not already loaded
                iframeRef.current.src = "";
            }
        }, [isVisible, embedUrl, loaded]);

        return (
            <iframe
                ref={iframeRef}
                title={title}
                frameBorder="0"
                referrerPolicy="origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={`absolute top-0 left-0 w-full h-full rounded-xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
                    }`}
                onLoad={handleLoad}
                loading="lazy"
            />
        );
    }
);
VideoPlayer.displayName = "VideoPlayer";

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
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isInView, setIsInView] = useState(false);
    const [isCurrentlyVisible, setIsCurrentlyVisible] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const videoDataFetched = useRef(false);

    // Extract YouTube video ID helper
    const getYoutubeIdFromUrl = (url: string): string | null => {
        const regex =
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    // Fetch video details only once
    useEffect(() => {
        const fetchDetails = async () => {
            if (videoDataFetched.current) return;
            try {
                setLoading(true);
                const details = await getContestantDetails(year, contestantId);
                if (details.videoUrls && details.videoUrls.length > 0) {
                    setVideoUrl(details.videoUrls[0]);
                    videoDataFetched.current = true;
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

    // Intersection Observer to track when the card enters/exits the viewport
    useEffect(() => {
        if (!videoContainerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // Once seen, mark it as loaded (persist even if later off-screen)
                    if (entry.isIntersecting && !isInView) {
                        setIsInView(true);
                    }
                    setIsCurrentlyVisible(entry.isIntersecting);
                });
            },
            {
                threshold: 0.1,
                rootMargin: "100px 0px",
            }
        );

        observer.observe(videoContainerRef.current);
        return () => observer.disconnect();
    }, [isInView]);

    const videoId = videoUrl ? getYoutubeIdFromUrl(videoUrl) : null;
    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null;

    const handleVideoLoad = useCallback(() => {
        setVideoLoaded(true);
    }, []);

    // Render badge based on contest details
    const renderBadge = () => {
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
                <div
                    className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${place <= 3 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}
                >
                    {`${place}${getOrdinalSuffix(place)} place`}
                </div>
            );
        }
        return null;
    };

    // Determine if we should show the video player:
    // Only show if the element has been seen and is either currently visible or already loaded.
    const shouldShowVideoPlayer = isInView && (isCurrentlyVisible || videoLoaded);


    return (
        <div className="bg-white/70 rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:shadow-2xl hover:-translate-y-1 border-white/20 border-2">
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

                <div
                    ref={videoContainerRef}
                    className="relative w-full mb-4"
                    style={{ paddingTop: "56.25%" }} // 16:9 aspect ratio
                >
                    {videoUrl && !loading && !error ? (
                        <>
                            {shouldShowVideoPlayer ? (
                                <div className="absolute top-0 left-0 w-full h-full">
                                    {!videoLoaded && thumbnailUrl && (
                                        <div className="absolute inset-0 z-10">
                                            <img
                                                src={thumbnailUrl}
                                                alt=""
                                                className="w-full h-full object-cover rounded"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        </div>
                                    )}
                                    <VideoPlayer
                                        videoUrl={videoUrl}
                                        title={`${artist} - ${song}`}
                                        onLoad={handleVideoLoad}
                                        isVisible={isCurrentlyVisible}
                                    />
                                </div>
                            ) : (
                                <div className="absolute top-0 left-0 w-full h-full">
                                    {thumbnailUrl ? (
                                        <img
                                            src={thumbnailUrl}
                                            alt=""
                                            className="w-full h-full object-cover rounded"
                                            loading="eager"
                                            fetchPriority="high"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-300 animate-pulse rounded" />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg
                                            className="w-16 h-16 text-white opacity-75"
                                            fill="currentColor"
                                            viewBox="0 0 84 84"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <circle cx="42" cy="42" r="42" fill="rgba(0,0,0,0.5)" />
                                            <polygon fill="currentColor" points="33,27 33,57 57,42" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : loading ? (
                        <div className="absolute top-0 left-0 w-full h-full bg-gray-300 animate-pulse rounded" />
                    ) : error ? (
                        <div className="absolute top-0 left-0 w-full h-full text-center py-4 text-red-500 flex items-center justify-center">
                            <p>{error}</p>
                        </div>
                    ) : null}
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