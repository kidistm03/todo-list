// ============================================================
// index.js
// This is the ENTRY POINT of the app.
// It ties together all modules: project, todo, storage, dom.
// Think of this as the "manager" of the whole application.
// ============================================================

// Import our CSS (Webpack will handle bundling it)
import "../css/style.css";

// Import our modules
import { createProject, setProjectIdCounter } from "./project.js";
import { createTodo, setTodoIdCounter } from "./todo.js";
import { saveData, loadData } from "./storage.js";
import {
  renderProjects,
  renderTodos,
  toggleTodoDetails,
  fillForm,
  clearForm,
  showTodoForm,
  hideTodoForm,
  showProjectForm,
  hideProjectForm,
} from "./dom.js";

// ============================================================
// APP STATE
// These are the variables that hold all the app's data.
// ============================================================

let projects = [];         // Array of all project objects
let activeProjectId = null; // ID of the currently selected project
let editingTodoId = null;   // If we're editing, this holds the todo's ID

// ============================================================
// INITIALIZATION
// Run when the page first loads
// ============================================================

function init() {
  // Try to load saved data from localStorage
  const savedData = loadData();

  if (savedData && savedData.projects.length > 0) {
    // Restore projects from storage
    projects = savedData.projects;

    // Restore the ID counters so new IDs continue from where we left off
    setProjectIdCounter(savedData.projectIdCounter || projects.length + 1);
    setTodoIdCounter(savedData.todoIdCounter || 1);

    // Select the first project by default
    activeProjectId = projects[0].id;
  } else {
    // First time loading — create a default "Personal" project
    const defaultProject = createProject("Personal");
    projects.push(defaultProject);
    activeProjectId = defaultProject.id;
    save(); // Save this initial state
  }

  // Render everything on screen
  renderAll();
}

// ============================================================
// HELPER: Get the currently active project object
// ============================================================

function getActiveProject() {
  return projects.find((p) => p.id === activeProjectId) || null;
}

// ============================================================
// HELPER: Save and re-render
// Call this after any change to keep storage and UI in sync
// ============================================================

function save() {
  // We save both the projects and the current ID counters
  saveData({
    projects,
    projectIdCounter: projects.length + 1,
    todoIdCounter: Date.now(), // use timestamp as a safe large number
  });
}

function renderAll() {
  renderProjects(projects, activeProjectId, selectProject, deleteProject);
  renderTodos(getActiveProject(), expandTodo, toggleDone, startEditTodo, deleteTodo);
}

// ============================================================
// PROJECT ACTIONS
// ============================================================

// Select a project (switch the active one)
function selectProject(projectId) {
  activeProjectId = projectId;
  hideTodoForm(); // Hide the form when switching projects
  renderAll();
}

// Delete a project
function deleteProject(projectId) {
  // Ask the user to confirm before deleting
  const confirmed = window.confirm("Delete this project and all its todos?");
  if (!confirmed) return;

  // Remove the project from the array
  projects = projects.filter((p) => p.id !== projectId);

  // If we deleted the active project, select the first remaining one
  if (activeProjectId === projectId) {
    activeProjectId = projects.length > 0 ? projects[0].id : null;
  }

  save();
  renderAll();
}

// Add a new project
function addProject() {
  const nameInput = document.getElementById("new-project-name");
  const name = nameInput.value.trim();

  if (!name) {
    alert("Please enter a project name!");
    return;
  }

  const newProject = createProject(name);
  projects.push(newProject);
  activeProjectId = newProject.id; // Switch to the new project

  hideProjectForm();
  save();
  renderAll();
}

// ============================================================
// TODO ACTIONS
// ============================================================

// Expand/collapse a todo's details
function expandTodo(card) {
  toggleTodoDetails(card);
}

// Toggle a todo's "done" status
function toggleDone(todoId) {
  const project = getActiveProject();
  if (!project) return;

  // Find the todo and flip its done property
  const todo = project.todos.find((t) => t.id === todoId);
  if (todo) {
    todo.done = !todo.done;
    save();
    renderAll();
  }
}

// Start editing a todo: fill the form with its data
function startEditTodo(todo) {
  editingTodoId = todo.id;  // Remember which todo we're editing
  fillForm(todo);
  showTodoForm();
}

// Delete a todo
function deleteTodo(todoId) {
  const confirmed = window.confirm("Delete this todo?");
  if (!confirmed) return;

  const project = getActiveProject();
  if (!project) return;

  // Filter out the deleted todo
  project.todos = project.todos.filter((t) => t.id !== todoId);

  save();
  renderAll();
}

// Save a todo (handles both adding new and editing existing)
function saveTodo() {
  // Read values from the form
  const title = document.getElementById("todo-title").value.trim();
  const description = document.getElementById("todo-desc").value.trim();
  const dueDate = document.getElementById("todo-date").value;
  const priority = document.getElementById("todo-priority").value;
  const notes = document.getElementById("todo-notes").value.trim();

  // Validate: title and date are required
  if (!title) {
    alert("Please enter a title for the todo!");
    return;
  }
  if (!dueDate) {
    alert("Please pick a due date!");
    return;
  }

  const project = getActiveProject();
  if (!project) return;

  if (editingTodoId !== null) {
    // --- EDITING MODE: update the existing todo ---
    const todo = project.todos.find((t) => t.id === editingTodoId);
    if (todo) {
      todo.title = title;
      todo.description = description;
      todo.dueDate = dueDate;
      todo.priority = priority;
      todo.notes = notes;
    }
    editingTodoId = null; // Reset editing state

  } else {
    // --- ADD MODE: create a brand new todo ---
    const newTodo = createTodo(title, description, dueDate, priority, notes);
    project.todos.push(newTodo);
  }

  clearForm();
  hideTodoForm();
  save();
  renderAll();
}

// ============================================================
// EVENT LISTENERS
// Set up all button clicks when the page loads
// ============================================================

// "Add Todo" button
document.getElementById("add-todo-btn").addEventListener("click", () => {
  editingTodoId = null; // Make sure we're in "add" mode
  clearForm();
  showTodoForm();
});

// "Save Todo" button in the form
document.getElementById("save-todo-btn").addEventListener("click", saveTodo);

// "Cancel" button in the todo form
document.getElementById("cancel-todo-btn").addEventListener("click", () => {
  clearForm();
  hideTodoForm();
  editingTodoId = null;
});

// "New Project" button
document.getElementById("add-project-btn").addEventListener("click", showProjectForm);

// "Save" in the new project form
document.getElementById("save-project-btn").addEventListener("click", addProject);

// "Cancel" in the new project form
document.getElementById("cancel-project-btn").addEventListener("click", hideProjectForm);

// Allow pressing Enter in the project name input to save
document.getElementById("new-project-name").addEventListener("keyup", (e) => {
  if (e.key === "Enter") addProject();
});

// ============================================================
// START THE APP
// ============================================================
init();
