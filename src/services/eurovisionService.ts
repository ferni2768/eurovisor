// Base URL for the API
const API_BASE_URL = "https://eurovisionapi.runasp.net/api";

// Get all countries that have participated
export const getCountries = async (options?: RequestInit) => {
    try {
        const response = await fetch(`${API_BASE_URL}/countries`, options);
        if (!response.ok) {
            throw new Error('Failed to fetch countries');
        }
        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
            // console.log("getCountries request aborted");
            return;
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};

// Get all contest years
export const getYears = async (options?: RequestInit) => {
    try {
        const response = await fetch(`${API_BASE_URL}/senior/contests/years`, options);
        if (!response.ok) {
            throw new Error('Failed to fetch years');
        }
        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
            // console.log("getYears request aborted");
            return;
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};

// Get all contests
export const getContests = async (options?: RequestInit) => {
    try {
        const response = await fetch(`${API_BASE_URL}/senior/contests`, options);
        if (!response.ok) {
            throw new Error('Failed to fetch contests');
        }
        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
            // console.log("getContests request aborted");
            return;
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};

// Get contest details for a specific year
export const getContestByYear = async (year: number, options?: RequestInit) => {
    try {
        const response = await fetch(`${API_BASE_URL}/senior/contests/${year}`, options);
        if (!response.ok) {
            throw new Error(`Failed to fetch contest for year ${year}`);
        }
        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
            // console.log(`getContestByYear request aborted for year ${year}`);
            return;
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};

// Get contestant details
export const getContestantDetails = async (year: number, id: number, options?: RequestInit) => {
    try {
        const response = await fetch(`${API_BASE_URL}/senior/contests/${year}/contestants/${id}`, options);
        if (!response.ok) {
            throw new Error(`Failed to fetch contestant details for year ${year}, id ${id}`);
        }
        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
            // console.log(`getContestantDetails request aborted for year ${year}, id ${id}`);
            return;
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};