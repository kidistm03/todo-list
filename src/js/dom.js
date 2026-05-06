// ============================================================
// dom.js
// Handles UI rendering and DOM updates
// ============================================================

import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";

/**
 * Helper: format a date string nicely
 * Updated to match the "cute" UI requirements.
 */
function formatDate(dateStr) {
    if (!dateStr) return "No due date";

    try {
        const date = parseISO(dateStr);
        if (!isValid(date)) return dateStr;
        
        // Returns a nice relative date like "today" or "in 3 days"
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return dateStr;
    }
}

/**
 * Render the list of projects in the sidebar
 */
function renderProjects(projects, activeProjectId, onSelectProject, onDeleteProject) {
    const list = document.getElementById("project-list");
    list.innerHTML = ""; 

    projects.forEach((project) => {
        const li = document.createElement("li");
        // Apply active class for the "cute" highlight effect
        if (project.id === activeProjectId) {
            li.classList.add("active");
        }

        const nameSpan = document.createElement("span");
        nameSpan.textContent = `📁 ${project.name}`; // Added icon for visual appeal
        nameSpan.addEventListener("click", () => {
            onSelectProject(project.id);
            // Auto-hide sidebar on mobile after selection
            if (window.innerWidth <= 900) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "×";
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
 * Render the todos for the selected project
 */
function renderTodos(project, onExpandTodo, onToggleDone, onEditTodo, onDeleteTodo) {
    const todoListDiv = document.getElementById("todo-list");
    const titleEl = document.getElementById("current-project-title");
    const addBtn = document.getElementById("add-todo-btn");

    if (!project) {
        titleEl.textContent = "Select a project";
        todoListDiv.innerHTML = "";
        addBtn.classList.add("hidden");
        return;
    }

    titleEl.textContent = project.name;
    addBtn.classList.remove("hidden");
    todoListDiv.innerHTML = "";

    if (project.todos.length === 0) {
        todoListDiv.innerHTML = '<p class="empty-message">Yay! No Tasks!</p>'; // Matched text to image_67747c.png
        return;
    }

    project.todos.forEach((todo) => {
        const card = document.createElement("div");
        // Added 'todo-card' class to match the new CSS
        card.classList.add("todo-card", `priority-${todo.priority}`); 

        if (todo.done) card.classList.add("done");

        const priorityEmoji = {
            high: "🔴 High",
            medium: "🟡 Medium",
            low: "🟢 Low",
        };

        card.innerHTML = `
            <div class="todo-header">
                <h3>${todo.title}</h3>
                <div class="todo-actions">
                    <button class="btn-expand">Details</button>
                    <button class="btn-done">${todo.done ? "Undo" : "Done"}</button>
                    <button class="btn-edit">Edit</button>
                    <button class="btn-delete">Delete</button>
                </div>
            </div>
            <p class="todo-due">📅 Due: ${formatDate(todo.dueDate)}</p>
            <span class="todo-priority-badge badge-${todo.priority}">${priorityEmoji[todo.priority]}</span>
            <div class="todo-details" style="display: none;">
                <p><strong>Description:</strong> ${todo.description || "None"}</p>
                <p><strong>Notes:</strong> ${todo.notes || "None"}</p>
            </div>
        `;

        // Event Listeners
        card.querySelector(".btn-expand").addEventListener("click", () => toggleTodoDetails(card));
        card.querySelector(".btn-done").addEventListener("click", () => onToggleDone(todo.id));
        card.querySelector(".btn-edit").addEventListener("click", () => onEditTodo(todo));
        card.querySelector(".btn-delete").addEventListener("click", () => onDeleteTodo(todo.id));

        todoListDiv.appendChild(card);
    });
}

// ---- UI State Functions ----

function toggleTodoDetails(card) {
    const details = card.querySelector(".todo-details");
    details.style.display = (details.style.display === "block") ? "none" : "block";
}

function fillForm(todo) {
    document.getElementById("todo-title").value = todo.title;
    document.getElementById("todo-desc").value = todo.description || "";
    document.getElementById("todo-date").value = todo.dueDate || "";
    document.getElementById("todo-priority").value = todo.priority;
    document.getElementById("todo-notes").value = todo.notes || "";
    document.getElementById("form-title").textContent = "Edit Todo";
}

function clearForm() {
    document.getElementById("todo-title").value = "";
    document.getElementById("todo-desc").value = "";
    document.getElementById("todo-date").value = "";
    document.getElementById("todo-priority").value = "low";
    document.getElementById("todo-notes").value = "";
    document.getElementById("form-title").textContent = "Add New Todo";
}

// Exporting modules as required by project structure
export {
    renderProjects,
    renderTodos,
    toggleTodoDetails,
    fillForm,
    clearForm,
};