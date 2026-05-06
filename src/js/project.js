// ============================================================
// project.js
// This module handles creating Project objects.
// A project is just a named container that holds an array of todos.
// ============================================================

// Counter for unique project IDs
let projectIdCounter = 1;

/**
 * createProject - Factory function that creates a new project object.
 *
 * @param {string} name - The name of the project
 * @returns {object}    - A project object with an empty todos array
 */
function createProject(name) {
  return {
    id: projectIdCounter++,  // unique ID
    name,
    todos: [],               // starts with no todos
  };
}

// Helper to set the counter when loading from storage
function setProjectIdCounter(value) {
  projectIdCounter = value;
}

export { createProject, setProjectIdCounter };