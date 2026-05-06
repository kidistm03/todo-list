// ============================================================
// storage.js
// This module handles saving and loading data to/from localStorage.
// localStorage stores data as strings, so we convert to/from JSON.
// ============================================================

const STORAGE_KEY = "todoAppData"; // The key we use in localStorage

/**
 * saveData - Saves all projects and ID counters to localStorage.
 *
 * @param {object} data - The object containing projects and ID counters to save
 */
function saveData(data) {
  // JSON.stringify converts the object to a string
  const jsonString = JSON.stringify(data);
  localStorage.setItem(STORAGE_KEY, jsonString);
}

/**
 * loadData - Loads projects and ID counters from localStorage.
 *
 * @returns {object|null} - The saved data object, or null if nothing was saved
 */
function loadData() {
  const jsonString = localStorage.getItem(STORAGE_KEY);

  // If nothing was saved yet, return null
  if (!jsonString) return null;

  // JSON.parse converts the string back to a JavaScript object
  return JSON.parse(jsonString);
}

export { saveData, loadData };