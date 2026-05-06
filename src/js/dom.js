// ============================================================
// dom.js
// Handles UI rendering and DOM updates
// ============================================================

import { formatDistanceToNow, parseISO, isValid } from "date-fns";

/**
 * Format a due date into a human‑readable relative string (e.g., "today", "in 2 days").
 */
function formatDate(dateStr) {
    if (!dateStr) return "No due date";
    try {
        const date = parseISO(dateStr);
        if (!isValid(date)) return dateStr;
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return dateStr;
    }
}

/**
 * Render the list of projects in the sidebar.
 * @param {Array} projects - Array of project objects.
 * @param {string|number} activeProjectId - ID of the currently active project (if any).
 * @param {Function} onSelectProject - Callback when a project is selected.
 * @param {Function} onDeleteProject - Callback when a project is deleted.
 */
export function renderProjects(projects, activeProjectId, onSelectProject, onDeleteProject) {
    const list = document.getElementById("project-list");
    if (!list) return;
    list.innerHTML = "";

    projects.forEach((project) => {
        const li = document.createElement("li");
        li.className = "project-item";
        if (project.id === activeProjectId) li.classList.add("active");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = `📁 ${project.name}`;
        nameSpan.style.flex = "1";
        nameSpan.addEventListener("click", () => {
            onSelectProject(project.id);
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                document.getElementById("sidebar")?.classList.remove("open");
            }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.classList.add("delete-project-btn");
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            onDeleteProject(project.id);
        });

        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

/**
 * Render the todo list based on the current active view (category or project).
 * @param {Array} todos - Filtered array of todo objects to display.
 * @param {string} title - Title to show in the content header.
 * @param {Object} callbacks - Contains onToggleDone, onEditTodo, onDeleteTodo functions.
 */
export function renderTodos(todos, title, { onToggleDone, onEditTodo, onDeleteTodo }) {
    const container = document.getElementById("todo-list-container");
    const titleEl = document.getElementById("current-project-title");
    if (!container || !titleEl) return;

    titleEl.textContent = title;
    container.innerHTML = "";

    if (!todos.length) {
        container.innerHTML = `<div class="empty-message">✨ Yay! No Tasks! ✨</div>`;
        return;
    }

    todos.forEach((todo) => {
        const card = document.createElement("div");
        card.className = `todo-card priority-${todo.priority}`;

        const dueRelative = todo.dueDate ? formatDate(todo.dueDate) : "No date";

        // optional project tag when viewing a category
        const projectTag = todo.projectName
            ? `<span style="font-size:0.7rem; background:var(--border); padding:0.2rem 0.6rem; border-radius:20px;">📁 ${todo.projectName}</span>`
            : "";

        card.innerHTML = `
            <div class="todo-row">
                <div class="todo-info">
                    <div class="todo-title">
                        <strong>${escapeHtml(todo.title)}</strong>
                        <span class="priority-badge">${priorityIcon(todo.priority)}</span>
                        ${projectTag}
                    </div>
                    ${todo.description ? `<div class="todo-desc">${escapeHtml(todo.description)}</div>` : ""}
                    <div class="todo-meta">
                        <span>📅 ${dueRelative}</span>
                        ${todo.done ? '<span>✅ Completed</span>' : ""}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="done-toggle" data-id="${todo.id}">${todo.done ? "Undo" : "Done"}</button>
                    <button class="expand-btn" data-id="${todo.id}">📄 Details</button>
                    <button class="edit-btn" data-id="${todo.id}">✏️ Edit</button>
                    <button class="delete-btn" data-id="${todo.id}">🗑️ Delete</button>
                </div>
            </div>
            <div class="expand-details" id="expand-${todo.id}" style="display: none;">
                <strong>📝 Notes:</strong> ${escapeHtml(todo.notes || "—")}<br>
                <strong>📌 Due date:</strong> ${todo.dueDate || "none"} &nbsp;|&nbsp;
                <strong>Priority:</strong> ${todo.priority}
            </div>
        `;

        // Attach event listeners
        const doneBtn = card.querySelector(".done-toggle");
        const expandBtn = card.querySelector(".expand-btn");
        const editBtn = card.querySelector(".edit-btn");
        const deleteBtnCard = card.querySelector(".delete-btn");

        doneBtn?.addEventListener("click", () => onToggleDone(todo.id));
        expandBtn?.addEventListener("click", () => {
            const detailsDiv = card.querySelector(".expand-details");
            if (detailsDiv) {
                detailsDiv.style.display = detailsDiv.style.display === "block" ? "none" : "block";
            }
        });
        editBtn?.addEventListener("click", () => onEditTodo(todo.id));
        deleteBtnCard?.addEventListener("click", () => onDeleteTodo(todo.id));

        container.appendChild(card);
    });
}

/**
 * Helper: return emoji + text for priority.
 */
function priorityIcon(priority) {
    if (priority === "high") return "🔴 High";
    if (priority === "medium") return "🟡 Medium";
    return "🟢 Low";
}

/**
 * Simple escape to prevent XSS.
 */
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, (m) => {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}

// ---------- Modal / Form Helpers ----------

/**
 * Fill the todo form with an existing todo's data for editing.
 * @param {Object} todo - Todo object to edit.
 */
export function fillForm(todo) {
    document.getElementById("todo-title").value = todo.title || "";
    document.getElementById("todo-desc").value = todo.description || "";
    document.getElementById("todo-date").value = todo.dueDate || "";
    document.getElementById("todo-priority").value = todo.priority || "medium";
    document.getElementById("todo-notes").value = todo.notes || "";
    document.getElementById("form-title").textContent = "Edit Task";
}

/**
 * Clear the todo form to default empty state.
 */
export function clearForm() {
    document.getElementById("todo-title").value = "";
    document.getElementById("todo-desc").value = "";
    document.getElementById("todo-date").value = "";
    document.getElementById("todo-priority").value = "medium";
    document.getElementById("todo-notes").value = "";
    document.getElementById("form-title").textContent = "New Task";
}

/**
 * Populate the project dropdown inside the modal.
 * @param {Array} projects - List of project objects.
 * @param {string|number} selectedProjectId - ID of the currently selected project.
 */
export function populateProjectSelect(projects, selectedProjectId) {
    const select = document.getElementById("todo-project-id");
    if (!select) return;
    select.innerHTML = projects.map(p => `<option value="${p.id}" ${p.id == selectedProjectId ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
}

/**
 * Show the "Add Project" inline form.
 */
export function showProjectForm() {
    const form = document.getElementById("new-project-form");
    const btn = document.getElementById("add-project-btn");
    if (form) form.classList.remove("hidden");
    if (btn) btn.classList.add("hidden");
}

/**
 * Hide the "Add Project" inline form and reset input.
 */
export function hideProjectForm() {
    const form = document.getElementById("new-project-form");
    const btn = document.getElementById("add-project-btn");
    if (form) form.classList.add("hidden");
    if (btn) btn.classList.remove("hidden");
    const input = document.getElementById("new-project-name");
    if (input) input.value = "";
}

/**
 * Open the modal for creating/editing a todo.
 * @param {boolean} isEdit - True if editing existing todo.
 */
export function openTodoModal(isEdit = false) {
    const modal = document.getElementById("todo-modal");
    if (modal) modal.showModal();
}

/**
 * Close the todo modal.
 */
export function closeTodoModal() {
    const modal = document.getElementById("todo-modal");
    if (modal) modal.close();
}