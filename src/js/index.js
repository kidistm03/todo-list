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
import { parseISO, isValid, isToday, isWithinInterval, addDays } from "date-fns";

// ============================================================
// APP STATE
// ============================================================

let projects = [];
let activeView = { type: "category", id: "all" };
let editingTodoId = null;

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
// FILTERING LOGIC
// ============================================================

function getAllTodosFlat() {
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
    switch (activeView.id) {
        case "today":
            return allTodos.filter(todo => {
                if (!todo.dueDate) return false;
                const due = parseISO(todo.dueDate);
                return isValid(due) && isToday(due);
            });
        case "week": {
            const today = new Date();
            const nextWeek = addDays(today, 7);
            return allTodos.filter(todo => {
                if (!todo.dueDate) return false;
                const due = parseISO(todo.dueDate);
                return isValid(due) && isWithinInterval(due, { start: today, end: nextWeek });
            });
        }
        case "important":
            return allTodos.filter(todo => todo.priority === "high");
        default:
            return allTodos;
    }
}

// ============================================================
// RENDER
// ============================================================

function renderAll() {
    const activeProjectId = (activeView.type === "project") ? activeView.id : null;
    renderProjects(projects, activeProjectId, selectProject, deleteProject);

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

    // ✅ Done button now deletes the task
    renderTodos(todos, title, {
        onToggleDone: deleteTodo,
        onEditTodo: startEditTodo,
        onDeleteTodo: deleteTodo,
    });

    // Highlight active category
    document.querySelectorAll("#default-categories li").forEach(el => {
        const cat = el.dataset.category;
        if (activeView.type === "category" && activeView.id === cat) {
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
                if (todo.projectId !== projectId) {
                    const index = proj.todos.findIndex(t => t.id === editingTodoId);
                    proj.todos.splice(index, 1);
                    const targetProject = projects.find(p => p.id === projectId);
                    if (targetProject) targetProject.todos.push({ ...todo, projectId });
                }
                break;
            }
        }
    } else {
        const newTodo = createTodo(title, description, dueDate, priority, notes);
        newTodo.projectId = projectId;
        newTodo.done = false;
        const targetProject = projects.find(p => p.id === projectId);
        if (targetProject) targetProject.todos.push(newTodo);
        else projects[0].todos.push(newTodo);
    }

    editingTodoId = null;
    saveToLocalStorage();
    renderAll();
    return true;
}

// ============================================================
// MODAL & FORM SETUP (dynamically add missing fields)
// ============================================================

function ensureModalFields() {
    const modal = document.getElementById("todo-modal");
    const form = document.getElementById("todo-form");
    if (!modal || !form) return;

    // Add Notes field if missing
    if (!document.getElementById("todo-notes")) {
        const notesGroup = document.createElement("div");
        notesGroup.className = "input-group";
        notesGroup.innerHTML = `<label for="todo-notes">Notes (optional)</label><textarea id="todo-notes" rows="2"></textarea>`;
        const insertBefore = form.querySelector(".form-buttons") || form.lastElementChild;
        form.insertBefore(notesGroup, insertBefore);
    }

    // Add Project dropdown if missing
    if (!document.getElementById("todo-project-id")) {
        const projGroup = document.createElement("div");
        projGroup.className = "input-group";
        projGroup.innerHTML = `<label for="todo-project-id">Project</label><select id="todo-project-id"></select>`;
        const insertBefore = form.querySelector(".form-buttons") || form.lastElementChild;
        form.insertBefore(projGroup, insertBefore);
    }
}

function setupModalHandlers() {
    const modal = document.getElementById("todo-modal");
    const form = document.getElementById("todo-form");
    const cancelBtn = document.getElementById("cancel-modal-btn") || document.getElementById("cancel-todo-btn");

    if (!modal || !form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("todo-title").value.trim();
        const description = document.getElementById("todo-desc").value;
        const dueDate = document.getElementById("todo-date").value;
        const priority = document.getElementById("todo-priority").value;
        const notes = document.getElementById("todo-notes")?.value || "";
        const projectId = parseInt(document.getElementById("todo-project-id")?.value || projects[0]?.id);

        if (saveTodoFromModal(title, description, dueDate, priority, notes, projectId)) {
            closeTodoModal();
            clearForm();
        }
    });

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            closeTodoModal();
            clearForm();
            editingTodoId = null;
        });
    }

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeTodoModal();
    });
}

// ============================================================
// DARK MODE (works with your checkbox)
// ============================================================

function setupDarkMode() {
    const checkbox = document.getElementById("theme-toggle");
    if (!checkbox) return;

    // Load saved preference
    const savedDark = localStorage.getItem("dark");
    if (savedDark === "true") {
        document.body.classList.add("dark");
        checkbox.checked = true;
    } else {
        document.body.classList.remove("dark");
        checkbox.checked = false;
    }

    checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
            document.body.classList.add("dark");
            localStorage.setItem("dark", "true");
        } else {
            document.body.classList.remove("dark");
            localStorage.setItem("dark", "false");
        }
    });
}

// ============================================================
// GLOBAL LISTENERS
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

    // Category clicks – using your data-category attributes
    document.querySelectorAll("#default-categories li").forEach(el => {
        el.addEventListener("click", () => {
            const cat = el.dataset.category;
            if (cat) {
                activeView = { type: "category", id: cat };
                renderAll();
                if (window.innerWidth <= 768) {
                    document.getElementById("sidebar")?.classList.remove("open");
                }
            }
        });
    });
}

// ============================================================
// INIT
// ============================================================

function init() {
    ensureModalFields();          // Add missing notes & project select
    const hasData = loadFromLocalStorage();
    if (!hasData) {
        const defaultProject = createProject("Default Project");
        const sampleTodo = createTodo(
            "Welcome!",
            "Click Done to delete this task.",
            new Date().toISOString().slice(0, 10),
            "medium",
            "Try adding a new project or task."
        );
        sampleTodo.projectId = defaultProject.id;
        defaultProject.todos.push(sampleTodo);
        projects = [defaultProject];
        setProjectIdCounter(100);
        setTodoIdCounter(Date.now());
        saveToLocalStorage();
    }

    activeView = { type: "category", id: "all" };
    setupDarkMode();
    setupGlobalListeners();
    setupModalHandlers();
    renderAll();
}

init();