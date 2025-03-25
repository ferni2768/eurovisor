// Base URL for the API
const API_BASE_URL = "https://eurovisionapi.runasp.net/api";

// Get all countries that have participated
export const getCountries = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/countries`);
        if (!response.ok) {
            throw new Error('Failed to fetch countries');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching countries:", error);
        throw error;
    }
};

// Get all contest years
export const getYears = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/contests/years`);
        if (!response.ok) {
            throw new Error('Failed to fetch years');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching years:", error);
        throw error;
    }
};

// Get all contests
export const getContests = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/contests`);
        if (!response.ok) {
            throw new Error('Failed to fetch contests');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching contests:", error);
        throw error;
    }
};

// Get contest details for a specific year
export const getContestByYear = async (year) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contests/${year}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch contest for year ${year}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching contest for year ${year}:`, error);
        throw error;
    }
};

// Get contestant details
export const getContestantDetails = async (year, id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contests/${year}/contestants/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch contestant details for year ${year}, id ${id}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching contestant details for year ${year}, id ${id}:`, error);
        throw error;
    }
};