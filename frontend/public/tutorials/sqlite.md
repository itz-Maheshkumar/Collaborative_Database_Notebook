---
id: sqlite
title: SQLite Quick Start
description: Explore SQLite — lightweight, file-based SQL database with PRAGMA inspection and CTEs.
engine: sqlite
difficulty: beginner
estimatedMinutes: 15
sections:
  - id: intro
    title: Introduction
  - id: pragma
    title: PRAGMA Inspection
  - id: queries
    title: Core SQL Queries
  - id: cte
    title: Common Table Expressions
  - id: tips
    title: SQLite-Specific Tips
---

## Introduction

SQLite is a self-contained, serverless SQL database engine. It stores an entire database in a single file — making it ideal for local development, prototyping, and embedded applications.

In this notebook, the connection's **database_name** field points to the `.db` file path. Leave it as `:memory:` to work with an ephemeral in-memory database.

---

## PRAGMA Inspection

SQLite's `PRAGMA` commands let you inspect schema metadata:

```sql
-- List all tables
SELECT name FROM sqlite_master WHERE type='table';

-- Inspect columns of a table
PRAGMA table_info(users);

-- Check foreign key enforcement (off by default in SQLite)
PRAGMA foreign_keys;

-- Enable foreign key enforcement for this session
PRAGMA foreign_keys = ON;

-- Check database integrity
PRAGMA integrity_check;
```

---

## Core SQL Queries

```sql
-- Basic SELECT
SELECT * FROM products LIMIT 20;

-- Filtering
SELECT name, price FROM products
WHERE price BETWEEN 10 AND 50
ORDER BY price ASC;

-- Aggregations
SELECT category, COUNT(*) AS count, AVG(price) AS avg_price
FROM products
GROUP BY category;

-- INSERT
INSERT INTO products (name, price, category)
VALUES ('Widget Pro', 29.99, 'Electronics');

-- UPDATE
UPDATE products SET price = 24.99 WHERE id = 5;

-- DELETE
DELETE FROM products WHERE stock = 0;
```

---

## Common Table Expressions

CTEs make complex queries readable by breaking them into named steps:

```sql
WITH
  active_users AS (
    SELECT id, email FROM users WHERE is_active = 1
  ),
  recent_orders AS (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    WHERE created_at >= date('now', '-30 days')
    GROUP BY user_id
  )
SELECT
  u.email,
  COALESCE(o.order_count, 0) AS orders_last_30d
FROM active_users u
LEFT JOIN recent_orders o ON o.user_id = u.id
ORDER BY orders_last_30d DESC;
```

---

## SQLite-Specific Tips

- **Date functions**: Use `date('now')`, `datetime('now')`, `strftime('%Y-%m', created_at)`.
- **Type affinity**: SQLite uses dynamic typing. Column types are suggestions, not enforced (except for `INTEGER PRIMARY KEY`).
- **Last inserted row**: Use `SELECT last_insert_rowid();` after an `INSERT`.
- **JSON support**: SQLite 3.38+ has built-in `json()`, `json_extract()`, and `json_each()` functions.

```sql
-- Get records from the last 7 days
SELECT * FROM events
WHERE created_at >= date('now', '-7 days');

-- Extract year and month
SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
FROM orders
GROUP BY month;
```
