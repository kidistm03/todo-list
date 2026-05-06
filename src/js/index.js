// ============================================================
// index.js
// This is the ENTRY POINT of the app.
// It ties together all modules: project, todo, storage, dom.
// Think of this as the "manager" of the whole application.
// ============================================================

// Import our CSS (Webpack will handle bundling it)
import "../css/style.css";
import { createProject, setProjectIdCounter } from "./project.js";
import { createTodo, setTodoIdCounter } from "./todo.js";
import { saveData, loadData } from "./storage.js";
import {
    renderProjects,
    renderTodos,
    fillForm,
    clearForm,
    populateProjectSelect,
    showProjectForm,
    hideProjectForm,
    openTodoModal,
    closeTodoModal,
} from "./dom.js";
import { format, parseISO, isValid, isToday, isWithinInterval, addDays } from "date-fns";

// ============================================================
// APP STATE
// ============================================================

let projects = [];                // Array of project objects { id, name, todos: [] }
let activeView = { type: "category", id: "all" };   // 'category' or 'project'
let editingTodoId = null;         // ID of todo being edited, null if adding new

// ============================================================
// STORAGE HELPERS
// ============================================================

function saveToLocalStorage() {
    saveData({
        projects,
        projectIdCounter: projects.length + 100,
        todoIdCounter: Date.now(),
    });
}

function loadFromLocalStorage() {
    const saved = loadData();
    if (saved && saved.projects && saved.projects.length > 0) {
        projects = saved.projects;
        setProjectIdCounter(saved.projectIdCounter || 100);
        setTodoIdCounter(saved.todoIdCounter || Date.now());
        return true;
    }
    return false;
}

// ============================================================
// FILTERING LOGIC FOR CATEGORIES
// ============================================================

function getAllTodosFlat() {
    // Flatten all todos from all projects, attach projectName for display
    return projects.flatMap(proj =>
        proj.todos.map(todo => ({ ...todo, projectName: proj.name, projectId: proj.id }))
    );
}

function getFilteredTodos() {
    const allTodos = getAllTodosFlat();
    if (activeView.type === "project") {
        const project = projects.find(p => p.id === activeView.id);
        return project ? project.todos.map(t => ({ ...t, projectName: project.name })) : [];
    }

    // Category filtering
    switch (activeView.id) {
        case "today":
            return allTodos.filter(todo => {
                if (!todo.dueDate) return false;
                const due = parseISO(todo.dueDate);
                return isValid(due) && isToday(due);
            });
        case "week":
            const today = new Date();
            const nextWeek = addDays(today, 7);
            return allTodos.filter(todo => {
                if (!todo.dueDate) return false;
                const due = parseISO(todo.dueDate);
                return isValid(due) && isWithinInterval(due, { start: today, end: nextWeek });
            });
        case "important":
            return allTodos.filter(todo => todo.priority === "high");
        default: // "all"
            return allTodos;
    }
}

// ============================================================
// RENDER EVERYTHING (UI UPDATE)
// ============================================================

function renderAll() {
    // Render projects in sidebar
    const activeProjectId = (activeView.type === "project") ? activeView.id : null;
    renderProjects(projects, activeProjectId, selectProject, deleteProject);

    // Get todos based on current view
    let todos = getFilteredTodos();
    let title = "";

    if (activeView.type === "category") {
        switch (activeView.id) {
            case "all": title = "All Tasks"; break;
            case "today": title = "Today"; break;
            case "week": title = "Next 7 Days"; break;
            case "important": title = "Important"; break;
            default: title = "Tasks";
        }
    } else {
        const project = projects.find(p => p.id === activeView.id);
        title = project ? project.name : "Tasks";
    }

    renderTodos(todos, title, {
        onToggleDone: toggleDone,
        onEditTodo: startEditTodo,
        onDeleteTodo: deleteTodo,
    });

    // Update active class for categories sidebar
    document.querySelectorAll(".category-item").forEach(el => {
        const viewId = el.dataset.view;
        if (activeView.type === "category" && activeView.id === viewId) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });
}

// ============================================================
// PROJECT ACTIONS
// ============================================================

function selectProject(projectId) {
    activeView = { type: "project", id: projectId };
    renderAll();
}

function deleteProject(projectId) {
    if (projects.length <= 1) {
        alert("You must keep at least one project.");
        return;
    }
    if (!confirm(`Delete project "${projects.find(p => p.id === projectId)?.name}" and all its tasks?`)) return;

    projects = projects.filter(p => p.id !== projectId);
    if (activeView.type === "project" && activeView.id === projectId) {
        activeView = { type: "category", id: "all" };
    }
    saveToLocalStorage();
    renderAll();
}

function addProject() {
    const nameInput = document.getElementById("new-project-name");
    const name = nameInput.value.trim();
    if (!name) {
        alert("Please enter a project name.");
        return;
    }
    const newProject = createProject(name);
    projects.push(newProject);
    activeView = { type: "project", id: newProject.id };
    hideProjectForm();
    saveToLocalStorage();
    renderAll();
}

// ============================================================
// TODO ACTIONS
// ============================================================

function toggleDone(todoId) {
    // Find the todo across all projects
    for (const project of projects) {
        const todo = project.todos.find(t => t.id === todoId);
        if (todo) {
            todo.done = !todo.done;
            saveToLocalStorage();
            renderAll();
            return;
        }
    }
}

function deleteTodo(todoId) {
    if (!confirm("Delete this task?")) return;
    for (let i = 0; i < projects.length; i++) {
        const index = projects[i].todos.findIndex(t => t.id === todoId);
        if (index !== -1) {
            projects[i].todos.splice(index, 1);
            break;
        }
    }
    saveToLocalStorage();
    renderAll();
}

function startEditTodo(todoId) {
    // Find the full todo object
    let foundTodo = null;
    let foundProjectId = null;
    for (const proj of projects) {
        const todo = proj.todos.find(t => t.id === todoId);
        if (todo) {
            foundTodo = todo;
            foundProjectId = proj.id;
            break;
        }
    }
    if (foundTodo) {
        editingTodoId = todoId;
        fillForm(foundTodo);
        // Populate project dropdown with current project selected
        populateProjectSelect(projects, foundProjectId);
        openTodoModal(true);
    }
}

function saveTodoFromModal(title, description, dueDate, priority, notes, projectId) {
    if (!title || !dueDate) {
        alert("Title and due date are required.");
        return false;
    }

    if (editingTodoId !== null) {
        // Update existing todo
        for (const proj of projects) {
            const todo = proj.todos.find(t => t.id === editingTodoId);
            if (todo) {
                todo.title = title;
                todo.description = description;
                todo.dueDate = dueDate;
                todo.priority = priority;
                todo.notes = notes;
                // If project changed, move the todo
                if (todo.projectId !== projectId) {
                    // Remove from current project
                    const index = proj.todos.findIndex(t => t.id === editingTodoId);
                    proj.todos.splice(index, 1);
                    // Add to target project
                    const targetProject = projects.find(p => p.id === projectId);
                    if (targetProject) {
                        const movedTodo = { ...todo, projectId: projectId };
                        targetProject.todos.push(movedTodo);
                    }
                }
                break;
            }
        }
    } else {
        // Create new todo
        const newTodo = createTodo(title, description, dueDate, priority, notes);
        newTodo.projectId = projectId;
        newTodo.done = false;
        const targetProject = projects.find(p => p.id === projectId);
        if (targetProject) {
            targetProject.todos.push(newTodo);
        } else {
            // fallback to first project
            projects[0].todos.push(newTodo);
        }
    }

    editingTodoId = null;
    saveToLocalStorage();
    renderAll();
    return true;
}

// ============================================================
// MODAL & FORM HANDLERS
// ============================================================

function setupModalHandlers() {
    const modal = document.getElementById("todo-modal");
    const form = document.getElementById("todo-form");
    const cancelBtn = document.getElementById("cancel-modal-btn");

    if (!modal || !form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("todo-title").value.trim();
        const description = document.getElementById("todo-desc").value;
        const dueDate = document.getElementById("todo-date").value;
        const priority = document.getElementById("todo-priority").value;
        const notes = document.getElementById("todo-notes").value;
        const projectId = parseInt(document.getElementById("todo-project-id").value);

        if (saveTodoFromModal(title, description, dueDate, priority, notes, projectId)) {
            closeTodoModal();
            clearForm();
        }
    });

    cancelBtn?.addEventListener("click", () => {
        closeTodoModal();
        clearForm();
        editingTodoId = null;
    });

    // Close modal when clicking outside backdrop? Not needed but nice
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeTodoModal();
    });
}

// ============================================================
// GLOBAL EVENT LISTENERS
// ============================================================

function setupGlobalListeners() {
    // Mobile menu toggle
    const menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            document.getElementById("sidebar")?.classList.toggle("open");
        });
    }

    // Add Todo button
    const addTodoBtn = document.getElementById("add-todo-btn");
    if (addTodoBtn) {
        addTodoBtn.addEventListener("click", () => {
            editingTodoId = null;
            clearForm();
            // Preselect current project if active view is a project
            let defaultProjectId = projects[0]?.id;
            if (activeView.type === "project") defaultProjectId = activeView.id;
            populateProjectSelect(projects, defaultProjectId);
            openTodoModal(false);
        });
    }

    // Project form buttons
    const addProjectBtn = document.getElementById("add-project-btn");
    const saveProjectBtn = document.getElementById("save-project-btn");
    const cancelProjectBtn = document.getElementById("cancel-project-btn");
    const newProjectInput = document.getElementById("new-project-name");

    addProjectBtn?.addEventListener("click", showProjectForm);
    saveProjectBtn?.addEventListener("click", addProject);
    cancelProjectBtn?.addEventListener("click", hideProjectForm);
    newProjectInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addProject();
    });

    // Category sidebar clicks
    document.querySelectorAll(".category-item").forEach(el => {
        el.addEventListener("click", () => {
            const viewId = el.dataset.view;
            if (viewId) {
                activeView = { type: "category", id: viewId };
                renderAll();
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    document.getElementById("sidebar")?.classList.remove("open");
                }
            }
        });
    });

    // Dark mode toggle (if needed, but already in HTML)
    const darkToggle = document.getElementById("darkmode-toggle");
    if (darkToggle) {
        darkToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            localStorage.setItem("dark", document.body.classList.contains("dark"));
        });
        if (localStorage.getItem("dark") === "true") {
            document.body.classList.add("dark");
        }
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
    const hasData = loadFromLocalStorage();
    if (!hasData) {
        // Create default project with a sample todo
        const defaultProject = createProject("Default Project");
        const sampleTodo = createTodo(
            "Welcome to WhatToDo!",
            "Edit or delete me, add projects, and organize tasks.",
            new Date().toISOString().slice(0, 10),
            "medium",
            "Try changing priority or due date ✨"
        );
        sampleTodo.projectId = defaultProject.id;
        defaultProject.todos.push(sampleTodo);
        projects = [defaultProject];
        setProjectIdCounter(100);
        setTodoIdCounter(Date.now());
        saveToLocalStorage();
    }

    activeView = { type: "category", id: "all" };
    setupGlobalListeners();
    setupModalHandlers();
    renderAll();
}

// Start the application
init();