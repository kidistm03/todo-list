// ============================================================
// todo.js
// This module is responsible for creating Todo objects.
// Each todo has: title, description, dueDate, priority, notes.
// We use a Factory Function (a plain function that returns an object).
// ============================================================

// A counter to give each todo a unique ID
let todoIdCounter = 1;

/**
 * createTodo - Factory function that creates a new todo object.
 *
 * @param {string} title       - The main task name (required)
 * @param {string} description - Extra detail about the task
 * @param {string} dueDate     - Due date as a string (e.g. "2025-06-01")
 * @param {string} priority    - "low", "medium", or "high"
 * @param {string} notes       - Optional additional notes
 * @returns {object}           - A todo object
 */
function createTodo(title, description, dueDate, priority = "low", notes = "") {
  return {
    id: todoIdCounter++,   // unique ID for this todo
    title,
    description,
    dueDate,
    priority,
    notes,
    done: false,           // not completed by default
  };
}

export { createTodo, todoIdCounter };

// We also export a helper to set the counter when loading from localStorage
// so IDs continue from where they left off
export function setTodoIdCounter(value) {
  todoIdCounter = value;
}
