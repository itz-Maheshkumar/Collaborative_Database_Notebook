# Collaborative Database Notebook

A web-based, Jupyter-style notebook application for querying and exploring multiple databases. Users pick a database engine, connect to it, and write/run queries inside notebook "cells" — with results and errors displayed inline, just like a code notebook.

---

## 1. Objective

Most database clients (DBeaver, TablePlus, pgAdmin, etc.) are desktop tools built for a single user working alone. **Collaborative Database Notebook** brings the notebook workflow — cells, inline output, saved history, shareable documents — to database querying itself, in the browser, with collaboration in mind.

The goal is to let a user:

1. Choose which database engine they want to work with from a supported list.
2. Connect to an instance of that database (their own credentials/connection string).
3. Create notebooks made of query cells, run them, and see results or errors rendered inline.
4. Save, edit, revisit, and (eventually) share those notebooks with teammates.
5. Learn how to use each supported database through built-in, in-app tutorials — without leaving the tool.

---

## 2. Core Features

- **Multi-database support** — connect to PostgreSQL, MySQL, MongoDB, or SQLite from the same interface.
- **Notebook interface** — create, rename, delete, and organize notebooks; each notebook is an ordered list of cells.
- **Query cells with a run shell** — each cell is an editable query box (SQL or Mongo query syntax depending on the connected engine) with a "Run" action.
- **Basic CRUD operations only (v1 scope)** — for now, the app supports basic **Create, Read, Update, and Delete** operations across all four supported databases. Advanced operations (joins across notebooks, stored procedures, aggregation pipelines, transactions, etc.) are intentionally out of scope for this version and may be added later — see [Roadmap](#10-roadmap--future-enhancements). This keeps the connector layer, error handling, and UI simple to build and reason about first.
- **Inline output & error handling** — successful queries render as a results table (with pagination for large result sets); failed queries print the exact database error message beneath the cell instead of crashing the notebook.
- **Connection manager** — securely store, edit, test, and switch between multiple saved database connections per user.
- **Schema explorer** — sidebar tree view of databases/schemas/tables/collections and their columns or fields for the active connection.
- **In-app tutorials** — a guided "Learn" panel with short lessons and runnable example queries for each of the 4 supported databases, aimed at users who are new to that engine.
- **Query history** — every executed query (successful or failed) is logged per notebook, with the ability to re-run or copy a past query.
- **Autosave & versioning** — notebooks save automatically; basic version history so accidental edits/deletions can be undone.
- **User authentication** — sign up, log in, manage account and stored connections; all notebook and connection data is scoped to the authenticated user.
- **(Planned) Real-time collaboration** — multiple users editing/viewing the same notebook simultaneously, in the spirit of the "collaborative" name (see [Roadmap](#10-roadmap--future-enhancements)).
- **Admin dashboard** — a separate, role-gated area for admin users to monitor and moderate all user activity (see [Admin Dashboard](#3-admin-dashboard) below).

---

## 3. Admin Dashboard

A dedicated dashboard, accessible only to users with the **admin** role, for monitoring and moderating the platform.

### User Management & Moderation
- **View all users** — list of every registered user with account status (active, warned, blocked).
- **Block / unblock a user** — immediately prevent (or restore) a user's ability to log in or run queries.
- **Delete a user** — permanently remove a user account and, optionally, their associated notebooks.
- **Issue warnings** — send a warning to a user (e.g., for abusive queries or policy violations), with a log of past warnings kept on their account.
- **View user activity log** — per-user history of logins, notebooks created/edited, and queries executed (including failed/error queries).

### Analytics Overview
- **Total users** — count of all registered users, plus new signups over time (daily/weekly/monthly).
- **Total notebooks created** — overall count of notebooks created across the platform.
- **Notebooks per database** — a breakdown of how many notebooks were created for each of the 4 supported databases (PostgreSQL, MySQL, MongoDB, SQLite), shown as a simple chart/table.
- **Active vs. blocked users** — quick counts/status breakdown.
- **Query volume** — total queries executed platform-wide, and how many succeeded vs. failed (useful for spotting abuse or recurring errors).

### Other Admin Capabilities
- **Search/filter users** — by username, email, status, or signup date.
- **Audit log** — a running log of admin actions themselves (who blocked/deleted/warned whom, and when), for accountability.
- **Role management** — promote/demote a user between `user` and `admin` roles.

### Access Control
The dashboard lives behind a protected `/admin` route in the Next.js app, guarded by a role check on both the frontend (hide/redirect non-admins) and the backend (FastAPI dependency that verifies the JWT's role claim is `admin` before allowing any admin-only endpoint to execute). Regular users never see or can reach this dashboard.

---

## 4. Supported Databases

Users choose one of the following four databases when creating a new connection:

| # | Database | Type | Typical Use Case Shown in App |
|---|----------|------|-------------------------------|
| 1 | **PostgreSQL** | Relational (SQL) | General-purpose relational querying, joins, transactions |
| 2 | **MySQL** | Relational (SQL) | Web-app style relational data, common LAMP-stack workloads |
| 3 | **MongoDB** | Document (NoSQL) | Schema-flexible, JSON-like document querying |
| 4 | **SQLite** | Embedded / File-based (SQL) | Lightweight, zero-config querying of local `.db` files |

### Application's Own Database

**PostgreSQL** doubles as the application's **internal system database**, storing:

- User accounts, hashed passwords, and auth/session tokens
- Saved third-party database connection metadata (host, port, engine type — credentials encrypted at rest)
- Notebooks, cells, cell run history, and query logs
- Tutorial progress/completion state per user

Using PostgreSQL for both purposes (an available user-facing engine *and* the app's own backing store) keeps the infrastructure footprint smaller — one primary datastore to operate, back up, and secure — while still letting users query Postgres directly as one of their 4 options.

---

## 5. Tech Stack

Kept intentionally simple:

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js (React) |
| **API / Backend** | FastAPI (Python) |
| **Framework (database layer)** | SQLAlchemy (async) |
| **App Database** | PostgreSQL |
| **Containerization** | Docker & Docker Compose |
| **CI/CD** | GitHub Actions |

**Why SQLAlchemy?** It's the single framework used across the backend to talk to the databases. It has first-class async support, works natively with FastAPI and Pydantic, and covers PostgreSQL, MySQL, and SQLite through one consistent query interface — the closest thing to "one framework" for the relational side of this project. MongoDB, being a document store, is accessed through its own native async driver (Motor) rather than being forced through SQLAlchemy, since it isn't a relational database.

- **Auth**: JWT-based authentication (`python-jose` + `passlib` for password hashing)
- **Editor/Shell UI**: Monaco Editor (the editor engine behind VS Code) for the notebook's query cells

---

## 6. In-App Tutorials

Each of the 4 supported databases has a short "Getting Started" tutorial built into the app's Learn panel, covering:

- Connecting to that database type for the first time
- Basic query syntax differences (e.g., SQL `SELECT` vs. MongoDB's `find()`)
- 3–5 runnable example queries the user can execute directly into a scratch notebook
- Common errors and what they mean (e.g., connection refused, auth failed, syntax error)

Tutorials are static content (Markdown + embedded runnable code blocks) stored alongside the frontend, so they load fast and don't require a database round-trip to display.

> **Note:** Even though the application itself currently only executes basic CRUD operations (see [Core Features](#2-core-features)), the tutorial content is not limited to that scope. Tutorials can include explanations and reference material for any level of query complexity — from beginner `SELECT`/`find()` basics up to advanced joins, aggregation pipelines, or indexing concepts — purely as learning material, even if a given advanced example isn't directly runnable in the notebook shell yet.

---

## 7. Security Considerations

- Database credentials for user-added connections are **encrypted at rest** (e.g., using `cryptography`'s Fernet or a KMS-backed secret) and never returned in plaintext by the API after creation.
- All API endpoints (other than auth) require a valid JWT.
- Query execution runs with **read-focused defaults**; consider a setting to disable destructive statements (`DROP`, `DELETE`, `TRUNCATE`) per connection for safety.
- Rate limit query execution per user/connection to prevent runaway or abusive queries.
- Each user's notebooks and connections are strictly scoped to their account (no cross-user data leakage).

---

## 8. High-Level Architecture

```
┌─────────────────┐        HTTPS/WebSocket        ┌──────────────────┐
│   Next.js UI     │ ─────────────────────────────▶│   FastAPI API     │
│ (Notebook, Shell, │                                │ (Auth, Notebooks, │
│  Schema Explorer) │◀───────────────────────────── │  Query Execution) │
└─────────────────┘                                └────────┬─────────┘
                                                             │
                                       ┌─────────────────────┼─────────────────────┐
                                       │                     │                     │
                                 ┌─────▼─────┐        ┌──────▼─────┐       ┌───────▼──────┐
                                 │ PostgreSQL │        │   MySQL /   │       │   MongoDB /   │
                                 │ (App DB +  │        │   SQLite    │       │  (user data)  │
                                 │ user opt.) │        │ (user data) │       │               │
                                 └────────────┘        └────────────┘       └───────────────┘
```

---

## 9. CI/CD Pipeline

CI/CD is handled with **GitHub Actions**, split into a continuous integration workflow and a continuous deployment workflow.

### Continuous Integration (CI)
Triggered on every push and pull request to `main`/`develop`:

1. **Install dependencies** — frontend (`npm ci`) and backend (`pip install -r requirements.txt`)
2. **Lint** — ESLint/Prettier for the Next.js frontend, Ruff/Flake8 for the FastAPI backend
3. **Type-check** — `tsc --noEmit` for the frontend, `mypy` for the backend
4. **Unit & integration tests** — Jest/React Testing Library for the frontend, Pytest for the backend (including spun-up test containers for PostgreSQL/MySQL/MongoDB/SQLite via Docker)
5. **Build** — `next build` for the frontend, backend package build/import check
6. **Report status** — pipeline must pass before a PR can be merged

### Continuous Deployment (CD)
Triggered on merge to `main` (or on a tagged release):

1. **Build Docker images** — one image for the Next.js frontend, one for the FastAPI backend
2. **Push images** — to a container registry (e.g., GitHub Container Registry or Docker Hub)
3. **Run database migrations** — Alembic migrations applied against the PostgreSQL app database
4. **Deploy** — pull and roll out the new images to the target environment (e.g., via Docker Compose on a VM, or a managed platform such as Render/Railway/AWS ECS)
5. **Smoke test** — basic health-check hit against the deployed API before marking the deploy successful
6. **Rollback** — on failed health check, redeploy the previous known-good image tag

---

## 10. Roadmap / Future Enhancements

- Real-time multi-user collaborative editing (via WebSockets/CRDTs, e.g. Yjs)
- Notebook sharing via public/private links
- Export notebooks to PDF/Markdown
- Query result charting/visualization
- Support for additional databases (Redis, Oracle, SQL Server)
- Role-based access control for shared/team workspaces

---

## 11. License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Collaborative Database Notebook Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```