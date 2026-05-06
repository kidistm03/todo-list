// ============================================================
// project.js
// This module handles creating Project objects.
// A project is just a named container that holds an array of todos.
// ============================================================

// Counter for unique project IDs
// project.js
// Factory function for creating project objects (meets "Factory functions or ES6 Classes" requirement)

let projectIdCounter = 1;

/**
 * Create a new project object.
 * @param {string} name - The name of the project (e.g., "Work", "Personal")
 * @returns {object} - Project object with id, name, and an empty todos array
 */
function createProject(name) {
    return {
        id: projectIdCounter++,   // auto-incrementing unique ID
        name: name,
        todos: [],                // each project holds its own array of todo objects
    };
}

/**
 * Set the internal ID counter (used when loading data from localStorage).
 * @param {number} value - The next ID to use for a new project
 */
function setProjectIdCounter(value) {
    projectIdCounter = value;
}

export { createProject, setProjectIdCounter };