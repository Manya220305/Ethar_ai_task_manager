# Ethar AI - Team Task Manager

A full-stack Team Task Manager web application featuring Role-Based Access Control (Admin/Member), project and team management, task tracking, and an interactive Kanban board.

## 🚀 Features

- **Authentication & RBAC:** Secure signup/login with JWT-based authentication and role-based permissions (Admin & Member).
- **Project Management:** Admins can create projects and assign team members.
- **Task Tracking & Kanban Board:** Create, assign, and track tasks using an intuitive, HTML5 Drag-and-Drop Kanban board.
- **Dynamic Dashboard:** View overall statistics, completion rates, overdue tasks, and upcoming deadlines.
- **Premium UI:** Warm Peach & Terracotta aesthetic, light/dark mode toggle, collapsible sidebar, and glassmorphism design using Tailwind CSS v4.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- TypeScript
- Tailwind CSS v4
- Lucide React (Icons)
- React Router DOM

**Backend:**
- Node.js & Express
- TypeScript
- SQLite (via `better-sqlite3`)
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing

## ⚙️ How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Manya220305/Ethar_ai_task_manager.git
   cd Ethar_ai_task_manager
   ```

2. **Install dependencies:**
   Install dependencies for both the frontend and backend.
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

3. **Database Setup:**
   The SQLite database is initialized automatically. To seed the database with initial testing accounts and mock data, run:
   ```bash
   npm run seed --prefix backend
   ```

4. **Start the Application:**
   Run both the backend API server and frontend development server concurrently from the root directory:
   ```bash
   npm run dev
   ```

   - **Frontend UI:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:5000](http://localhost:5000)

### 🧪 Test Accounts

If you ran the database seed script, you can log in with:

- **Admin Account (Full privileges):**
  - Email: `admin@taskflow.com`
  - Password: `password123`
- **Member Account (Restricted workspace):**
  - Email: `jane@taskflow.com`
  - Password: `password123`

## 📦 Deployment

When deploying to a cloud platform (e.g., Railway, Render, Fly.io):
1. Make sure to configure a **Persistent Disk (Volume)** mapped to where `database.sqlite` is stored so your data persists across deployments.
2. **Build Command:** `npm run build`
3. **Start Command:** `npm start`
