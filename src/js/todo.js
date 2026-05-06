// ============================================================
// todo.js
// This module is responsible for creating Todo objects.
// Each todo has: title, description, dueDate, priority, notes.
// We use a Factory Function (a plain function that returns an object).
// ============================================================

// A counter to give each todo a unique ID
// todo.js
// Factory function for creating todo objects (meets "Factory functions or ES6 Classes" requirement)
let todoIdCounter = 1;

/**
 * Create a new todo object.
 * @param {string} title - The main task name (required)
 * @param {string} description - Extra details about the task
 * @param {string} dueDate - Due date as a string (YYYY-MM-DD)
 * @param {string} priority - Priority level: "low", "medium", or "high"
 * @param {string} notes - Optional additional notes
 * @returns {object} - A todo object with unique id, title, description, dueDate, priority, notes, and done: false
 */
function createTodo(title, description, dueDate, priority = "low", notes = "") {
    return {
        id: todoIdCounter++,      // auto-incrementing unique ID
        title: title,
        description: description || "",
        dueDate: dueDate,
        priority: priority,       // "low", "medium", or "high"
        notes: notes || "",
        done: false,              // not completed by default
    };
}

/**
 * Set the internal ID counter (used when loading data from localStorage).
 * @param {number} value - The next ID to use for a new todo
 */
function setTodoIdCounter(value) {
    todoIdCounter = value;
}

export { createTodo, setTodoIdCounter };