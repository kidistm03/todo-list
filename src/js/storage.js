// ============================================================
// storage.js
// This module handles saving and loading data to/from localStorage.
// localStorage stores data as strings, so we convert to/from JSON.
// ============================================================

const STORAGE_KEY = "todoAppData"; // The key we use in localStorage

/**
 * saveData - Saves all projects to localStorage.
 *
 * @param {Array} projects - The array of project objects to save
 */
function saveData(projects) {
  // JSON.stringify converts the array to a string like: '[{"id":1,"name":"Work",...}]'
  const jsonString = JSON.stringify(projects);
  localStorage.setItem(STORAGE_KEY, jsonString);
}

/**
 * loadData - Loads projects from localStorage.
 *
 * @returns {Array|null} - The saved projects array, or null if nothing was saved
 */
function loadData() {
  const jsonString = localStorage.getItem(STORAGE_KEY);

  // If nothing was saved yet, return null
  if (!jsonString) return null;

  // JSON.parse converts the string back to a JavaScript array
  return JSON.parse(jsonString);
}

export { saveData, loadData };
