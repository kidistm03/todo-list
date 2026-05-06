// ============================================================
// storage.js
// This module handles saving and loading data to/from localStorage.
// localStorage stores data as strings, so we convert to/from JSON.
// ============================================================

// storage.js
// Handles saving to and loading from localStorage (Web Storage API)

const STORAGE_KEY = "whattodo_advanced_app";  // Unique key for this app

/**
 * Save all application data to localStorage.
 * @param {object} data - Contains projects, projectIdCounter, todoIdCounter
 */
function saveData(data) {
    try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
        console.error("Failed to save data to localStorage:", error);
    }
}

/**
 * Load application data from localStorage.
 * @returns {object|null} - Parsed data object if exists, otherwise null
 */
function loadData() {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) return null;
        return JSON.parse(serialized);
    } catch (error) {
        console.error("Failed to load data from localStorage:", error);
        return null;
    }
}

export { saveData, loadData };