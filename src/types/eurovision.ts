// Eurovision API data types
export interface Contestant {
    id: number;
    country: string;
    artist: string;
    song: string;
    url: string;
}

export interface Performance {
    contestantId: number;
    running: number;
    place: number;
    scores: Score[];
}

export interface Score {
    name: string;
    points: number;
    votes: Record<string, number>;
}

export interface Round {
    name: string;
    date: string;
    performances: Performance[];
}

export interface Contest {
    year: number;
    contestants: Contestant[];
    rounds: Round[];
}

export interface EntryResult {
    year: number;
    contestantId: number;
    country: string;
    countryName: string;
    artist: string;
    song: string;
    place?: number;
    videoUrl?: string;
    isWinner?: boolean;
    didQualify?: boolean;
}