# Lacaselo Management System - Architecture & Onboarding Guide

Welcome to the Lacaselo Management System! This guide is designed to onboard new developers and explain the system architecture, authentication flow, folder structure, and local development setup.

## 1. System Overview

The Lacaselo Management System is a modern Web Application designed to manage multiple branches, inventory, expenses, and staff operations (e.g., Bar, Kitchen, Guest House, Gym).

The architecture follows a standard **Monorepo** structure:
- **Frontend**: A React.js Single Page Application (SPA).
- **Backend**: A Node.js / Express.js REST API.
- **Database**: Aiven Cloud MySQL database.
- **Root Repository**: Managed via NPM Workspaces to concurrently boot both frontend and backend using a single `npm start` command.

---

## 2. Directory Structure

```text
lacielo_001/
├── package.json         (Root NPM Workspace definitions)
├── backend/
│   ├── .env             (Secrets: DB credentials, JWT secret)
│   ├── server.js        (Express application entry point, routing, cookies middleware)
│   ├── db.js            (MySQL Connection Pool using `mysql2`)
│   ├── seed.js          (Database seeding script for Branches and Users)
│   └── routes/          (Express Routers: Auth, Bar, Gym, Totals, etc.)
└── frontend/
    ├── package.json     (React app dependencies)
    ├── .env             (Contains: REACT_APP_API_BASE_URL)
    ├── public/
    └── src/
        ├── App.js               (Main React Router configuration & Protected Routes)
        ├── context/
        │   └── AuthContext.js   (React Context managing JWT HttpOnly Sessions)
        └── component/
            ├── ProtectedRoute.js(Wrapper component to block unauthenticated access)
            ├── include/
            │   └── Navbar.js    (Role-based UI Navigation)
            ├── layout/
            └── pages/           (Module views: Bar, Kitchen, Gym, Login, etc.)
```

---

## 3. Data Flow & Authentication Architecture

To maximize security and prevent local Cross-Site Scripting (XSS) leaks, the system uses an **HttpOnly Cookie-based JWT Authentication Flow**:

1. **Login Flow**:
   - The user visits `/login` and submits their `$username` and `$password`.
   - The Frontend `AuthContext.login()` sends a `POST /api/auth/login` request.
   - The Backend verifies the credentials against the remote MySQL `users` table.
   - Upon success, the Backend generates a JWT (JSON Web Token) containing `userId`, `username`, `role`, and `branchId`.
   - The Backend explicitly responds with a `Set-Cookie` header, binding the token to an `HttpOnly`, `Strict` cookie expiring in 24 hours. The cookie is inaccessible to raw JavaScript.

2. **Session Verification (Hydration)**:
   - When the user refreshes to load the React app, `AuthContext.js` fires an API call to `GET /api/auth/verify`.
   - The browser automatically attaches the HttpOnly token cookie.
   - If the signature is valid, the Backend replies by unwrapping the cookie and returning the `user` payload object.
   - The React App updates the state to `isAuthenticated = true`, loading the user's details natively.

3. **Role-Based Access Control (RBAC)**:
   - Within the React Router (`App.js`), `<ProtectedRoute />` prevents layout rendering until verification concludes. If it fails, users are sent back to `/login`.
   - Within `Navbar.js`, each navigation item contains an `allowedRoles` array (e.g., `['SUPER_ADMIN', 'ADMIN', 'BAR_MAN']`).
   - Standard roles in the system (`enum` in the DB) include: `SUPER_ADMIN`, `BAR_MAN`, `MANAGER`, `CHIEF_KITCHEN`, `ADMIN`, `TOKEN_MAN`, `LAND_LORD`, `GYM`.

---

## 4. Local Environment Setup

### Prerequisites
- Node.js (v18 or higher)
- NPM
- A MySQL Client (optional - DBeaver/TablePlus)

### Running Locally

1. **Workspace Installation**:
   Install all dependencies for both the Frontend and Backend simultaneously.
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   In `backend/.env`, set the database configuration and secret JWT key:
   ```dotenv
   DB_HOST=127.0.0.1
   DB_USER=lacaselo_user
   DB_PASS=localpassword
   DB_NAME=lacaselo_management
   DB_PORT=3307
   JWT_SECRET=super_secret_jwt_key
   ```
   In `frontend/.env`, set the API Base URL:
   ```dotenv
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

3. **Seeding the Database (Optional)**:
   If the database is bare, you can execute the Node script to populate branches and testing users representing every Role:
   ```bash
   cd backend
   node seed.js
   ```

4. **Booting the System**:
   You only need one command from the project root! It runs both `react-scripts` and `node server.js` concurrently.
   ```bash
   npm start
   ```
   - **Backend API**: `http://localhost:5000`
   - **Frontend App**: `http://localhost:3000`

---

## 5. Technical Decisions & Gotchas

- **Aiven Cloud MySQL & Promises**: The backend uses the robust `mysql2` package. Because the primary application utilizes modern `async/await`, database queries should hit `db.promise().query(...)`. Standard `.query` without `promise()` relies on legacy callbacks and will crash when paired with `await`.
- **CORS Configuration**: The Backend strictly allows network calls from defined clients alongside specific properties: `{ credentials: true }`. This enables the explicit cross-origin transfer of HTTP-only Cookies required between `localhost:3000` and `localhost:5000`.
- **ZOMBIE PORTS**: Ensure you gracefully stop `npm start` utilizing `CTRL+C`. Orphaned Node instances will seize port 5000 and throw `EADDRINUSE` upon subsequent boots. Run `npx kill-port 5000 3000` from the root directory to fix blocked ports.
