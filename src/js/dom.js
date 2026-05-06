// ============================================================
// dom.js
// This module handles everything related to displaying content
// on the page. It reads from the app state and updates the DOM.
// ============================================================

import { format, parseISO, isValid } from "date-fns";

// ---- Helper: format a date string nicely using date-fns ----
function formatDate(dateStr) {
  if (!dateStr) return "No due date";

  try {
    // parseISO converts "2025-06-01" into a Date object
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    // format() makes it look like "Jun 1, 2025"
    return format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

// ---- Render the list of projects in the sidebar ----
function renderProjects(projects, activeProjectId, onSelectProject, onDeleteProject) {
  const list = document.getElementById("project-list");
  list.innerHTML = ""; // Clear current list

  // Loop through each project and create a list item
  projects.forEach((project) => {
    const li = document.createElement("li");

    // Highlight the active project
    if (project.id === activeProjectId) {
      li.classList.add("active");
    }

    // Project name span (click to select)
    const nameSpan = document.createElement("span");
    nameSpan.textContent = project.name;
    nameSpan.addEventListener("click", () => onSelectProject(project.id));

    // Delete button (the × symbol)
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
    deleteBtn.classList.add("delete-project-btn");
    deleteBtn.title = "Delete project";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Don't also trigger "select project"
      onDeleteProject(project.id);
    });

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

// ---- Render the todos for the currently selected project ----
function renderTodos(project, onExpandTodo, onToggleDone, onEditTodo, onDeleteTodo) {
  const todoListDiv = document.getElementById("todo-list");
  const titleEl = document.getElementById("current-project-title");
  const addBtn = document.getElementById("add-todo-btn");

  // If no project is selected
  if (!project) {
    titleEl.textContent = "Select a project";
    todoListDiv.innerHTML = "";
    addBtn.classList.add("hidden");
    return;
  }

  // Show the project title and the "Add Todo" button
  titleEl.textContent = project.name;
  addBtn.classList.remove("hidden");

  // Clear the list
  todoListDiv.innerHTML = "";

  // If there are no todos yet
  if (project.todos.length === 0) {
    todoListDiv.innerHTML = '<p class="empty-message">No todos yet. Add one above!</p>';
    return;
  }

  // Loop through each todo and create a card
  project.todos.forEach((todo) => {
    const card = document.createElement("div");
    card.classList.add("todo-item", `priority-${todo.priority}`);

    // If todo is marked done, add a style
    if (todo.done) card.classList.add("done");

    // Priority badge text
    const priorityEmoji = {
      high: "🔴 High",
      medium: "🟡 Medium",
      low: "🟢 Low",
    };

    // Build the card HTML
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

      <!-- This section is hidden until "Details" is clicked -->
      <div class="todo-details">
        <p><strong>Description:</strong> ${todo.description || "None"}</p>
        <p><strong>Notes:</strong> ${todo.notes || "None"}</p>
      </div>
    `;

    // Attach event listeners to the buttons
    card.querySelector(".btn-expand").addEventListener("click", () => {
      onExpandTodo(card, todo.id);
    });

    card.querySelector(".btn-done").addEventListener("click", () => {
      onToggleDone(todo.id);
    });

    card.querySelector(".btn-edit").addEventListener("click", () => {
      onEditTodo(todo);
    });

    card.querySelector(".btn-delete").addEventListener("click", () => {
      onDeleteTodo(todo.id);
    });

    todoListDiv.appendChild(card);
  });
}

// ---- Toggle the expanded details section of a todo ----
function toggleTodoDetails(card) {
  const details = card.querySelector(".todo-details");
  // Toggle between showing and hiding
  if (details.style.display === "block") {
    details.style.display = "none";
  } else {
    details.style.display = "block";
  }
}

// ---- Fill the form with a todo's data (for editing) ----
function fillForm(todo) {
  document.getElementById("todo-title").value = todo.title;
  document.getElementById("todo-desc").value = todo.description || "";
  document.getElementById("todo-date").value = todo.dueDate || "";
  document.getElementById("todo-priority").value = todo.priority;
  document.getElementById("todo-notes").value = todo.notes || "";
  document.getElementById("form-title").textContent = "Edit Todo";
}

// ---- Clear the form (for adding new todos) ----
function clearForm() {
  document.getElementById("todo-title").value = "";
  document.getElementById("todo-desc").value = "";
  document.getElementById("todo-date").value = "";
  document.getElementById("todo-priority").value = "low";
  document.getElementById("todo-notes").value = "";
  document.getElementById("form-title").textContent = "Add New Todo";
}

// ---- Show or hide the todo form ----
function showTodoForm() {
  document.getElementById("todo-form-container").classList.remove("hidden");
}

function hideTodoForm() {
  document.getElementById("todo-form-container").classList.add("hidden");
}

// ---- Show or hide the new project form ----
function showProjectForm() {
  document.getElementById("new-project-form").classList.remove("hidden");
  document.getElementById("add-project-btn").classList.add("hidden");
  document.getElementById("new-project-name").focus();
}

function hideProjectForm() {
  document.getElementById("new-project-form").classList.add("hidden");
  document.getElementById("add-project-btn").classList.remove("hidden");
  document.getElementById("new-project-name").value = "";
}

export {
  renderProjects,
  renderTodos,
  toggleTodoDetails,
  fillForm,
  clearForm,
  showTodoForm,
  hideTodoForm,
  showProjectForm,
  hideProjectForm,
};
