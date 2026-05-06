# Advanced Todo List — Nexus Bootcamp Project 6

A fully functional Todo List app with multiple projects, priorities, and localStorage persistence.
Built with HTML, CSS, JavaScript, and bundled with Webpack.


## How to Run Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Start dev server (with live reload)
```bash
npm start
```

### 3. Build for production
```bash
npm run build
```
The bundled output will be in the `dist/` folder.

---

## 📁 Folder Structure

```
todo-list/
├── dist/               # Webpack build output (auto-generated)
├── src/
│   ├── css/
│   │   └── style.css   # All styling
│   ├── js/
│   │   ├── index.js    # Entry point — wires everything together
│   │   ├── todo.js     # Todo factory function
│   │   ├── project.js  # Project factory function
│   │   ├── storage.js  # localStorage save/load
│   │   └── dom.js      # All UI rendering logic
│   └── index.html      # Base HTML template
├── .babelrc            # Babel config (for browser compatibility)
├── .gitignore
├── package.json
├── webpack.config.js
└── README.md
```


## Features

- Create, view, edit, delete **todos** with title, description, due date, priority, notes
- Support for **multiple projects** — create and switch between them
- **Color-coded priorities**: High,Medium, Low
- **Date formatting** with `date-fns` library
- **Persistent data** with `localStorage`
- **Responsive** — works on mobile and desktop
- Bundled with **Webpack**

## 🌐 Deployment

Deploy the `dist/` folder to [Netlify](https://netlify.com) or [Vercel](https://vercel.com).
