# Collaborative Database Notebook

A web-based, Jupyter-style notebook application for querying and exploring multiple databases. Users pick a database engine, connect to it, and write/run queries inside notebook "cells" — with results and errors displayed inline, just like a code notebook.

---

## Development Modules

Development is broken into **10 sequential modules**. Each module is self-contained and results in working, testable code before the next begins.

| # | Module | Key Deliverables | Status |
|---|--------|-----------------|--------|
| **M1** | [Foundation & Infrastructure](#m1-foundation--infrastructure) | Docker Compose, env config, DB session, backend entry point, frontend design system | ✅ Complete |
| **M2** | [Authentication](#m2-authentication) | User model, JWT auth, register/login endpoints, signup & login pages | ✅ Complete |
| **M3** | [Connection Manager](#m3-connection-manager) | Saved connections CRUD, credential encryption, connection test, frontend forms | ✅ Complete |
| **M4** | [Notebook Core](#m4-notebook-core) | Notebook + cell CRUD, autosave, version history, notebook list & workspace UI | ✅ Complete |
| **M5** | [Query Engine](#m5-query-engine) | All 4 DB connectors, query execution service, inline results table, error display | ✅ Complete |
| **M6** | [Schema Explorer](#m6-schema-explorer) | DB introspection for all 4 engines, sidebar tree view component | ⬜ Pending |
| **M7** | [Query History](#m7-query-history) | Execution log model, history panel UI, re-run / copy actions | ⬜ Pending |
| **M8** | [In-App Tutorials](#m8-in-app-tutorials) | Static markdown content for all 4 DBs, tutorial viewer, progress tracking | ⬜ Pending |
| **M9** | [Admin Dashboard](#m9-admin-dashboard) | User management, analytics overview, audit log, role management endpoints | ⬜ Pending |
| **M10** | [CI/CD & Deployment](#m10-cicd--deployment) | GitHub Actions CI + CD workflows, Docker images, smoke tests | ⬜ Pending |

---

### M1: Foundation & Infrastructure
**Goal:** Everything needed before any feature code — running server, DB connection, frontend shell.
- `docker-compose.yml` — PostgreSQL + backend + frontend services
- `.env.example` — all required environment variables documented
- `backend/app/main.py` — FastAPI app with CORS, routers, lifespan
- `backend/app/core/config.py` — Pydantic settings from env
- `backend/app/db/session.py` — async SQLAlchemy engine + session factory
- `backend/app/db/base.py` — declarative base for all models
- `frontend/src/app/layout.tsx` — root layout with fonts and metadata
- `frontend/src/app/globals.css` — full design system (tokens, dark mode, components)

### M2: Authentication
**Goal:** Users can register, log in, and receive a JWT. All subsequent API calls are authenticated.
- `backend/app/models/user.py` — User ORM model
- `backend/app/schemas/user.py` — Pydantic request/response schemas
- `backend/app/core/security.py` — password hashing, JWT create/verify
- `backend/app/api/v1/auth.py` — `/register`, `/login`, `/me` endpoints
- `backend/app/services/auth_service.py` — business logic
- `frontend/src/app/login/page.tsx` — login page ✅ done
- `frontend/src/app/signup/page.tsx` — signup page
- `frontend/src/lib/auth.ts` — JWT storage, auth helpers
- Alembic initial migration

### M3: Connection Manager
**Goal:** Users can save, edit, test, and switch between database connections.
- `backend/app/models/connection.py` — Connection ORM model
- `backend/app/schemas/connection.py` — request/response schemas
- `backend/app/api/v1/connections.py` — CRUD + test-connection endpoint
- `backend/app/core/security.py` — Fernet encryption for credentials at rest
- `frontend/src/components/connection/ConnectionForm.tsx`
- `frontend/src/components/connection/ConnectionList.tsx`
- `frontend/src/app/connections/page.tsx`

### M4: Notebook Core
**Goal:** Users can create notebooks with cells, edit them, and have them autosaved.
- `backend/app/models/notebook.py` — Notebook + NotebookCell models
- `backend/app/api/v1/notebooks.py` — CRUD endpoints
- `frontend/src/app/notebooks/page.tsx` — notebook list
- `frontend/src/app/notebooks/[id]/page.tsx` — notebook workspace
- `frontend/src/components/notebook/CellEditor.tsx` — Monaco editor cell
- `frontend/src/components/notebook/NotebookToolbar.tsx`

### M5: Query Engine
**Goal:** Cells can be run against the connected database; results or errors appear inline.
- `backend/app/connectors/base.py` — abstract connector interface
- `backend/app/connectors/postgres.py` — asyncpg connector
- `backend/app/connectors/mysql.py` — aiomysql connector
- `backend/app/connectors/sqlite.py` — aiosqlite connector
- `backend/app/connectors/mongodb.py` — Motor connector
- `backend/app/services/query_service.py` — route queries to the right connector
- `backend/app/api/v1/query.py` — execute endpoint
- `frontend/src/components/notebook/CellOutput.tsx` — results table + error display

### M6: Schema Explorer
**Goal:** Sidebar shows live database/table/column tree for the active connection.
- `backend/app/services/schema_service.py` — introspect schemas for all 4 engines
- `frontend/src/components/schema/SchemaExplorer.tsx` — tree view sidebar

### M7: Query History
**Goal:** Every executed query is logged; users can browse, re-run, or copy past queries.
- `backend/app/models/history.py` — QueryHistory model
- `backend/app/api/v1/query.py` — history endpoints
- `frontend/src/components/notebook/QueryHistory.tsx`

### M8: In-App Tutorials
**Goal:** A Learn panel with guided lessons and runnable examples for each database.
- `frontend/src/data/tutorials/postgres.md`
- `frontend/src/data/tutorials/mysql.md`
- `frontend/src/data/tutorials/mongodb.md`
- `frontend/src/data/tutorials/sqlite.md`
- `frontend/src/components/learn/TutorialViewer.tsx`
- `frontend/src/app/learn/page.tsx`
- `backend/app/models/tutorial.py` — progress tracking
- `backend/app/api/v1/tutorials.py`

### M9: Admin Dashboard
**Goal:** Admin users can manage all users, view platform analytics, and read audit logs.
- `backend/app/schemas/admin.py`
- `backend/app/services/admin_service.py`
- `backend/app/api/v1/admin.py` — all admin endpoints (role-gated)
- `frontend/src/components/admin/UserManagementTable.tsx`
- `frontend/src/components/admin/AnalyticsOverview.tsx`
- `frontend/src/components/admin/AuditLogs.tsx`
- `frontend/src/app/admin/page.tsx`

### M10: CI/CD & Deployment
**Goal:** Every push runs lint + tests + build; merges to main auto-deploy.
- `.github/workflows/ci.yml` — lint, type-check, test, build
- `.github/workflows/cd.yml` — build images, migrate, deploy, smoke test
- `backend/Dockerfile` — production FastAPI image
- `frontend/Dockerfile` — production Next.js image

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