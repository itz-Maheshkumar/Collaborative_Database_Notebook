---
id: postgresql
title: PostgreSQL Fundamentals
description: Learn to query relational data with PostgreSQL — from SELECT basics to JOINs and aggregations.
engine: postgresql
difficulty: beginner
estimatedMinutes: 20
sections:
  - id: intro
    title: Introduction
  - id: select
    title: SELECT Queries
  - id: filtering
    title: Filtering with WHERE
  - id: aggregations
    title: Aggregations & GROUP BY
  - id: joins
    title: Joining Tables
---

## Introduction

PostgreSQL is a powerful, open-source object-relational database. It uses **Structured Query Language (SQL)** to store and retrieve data.

In this tutorial, you will learn the essential SQL operations you need to be productive with PostgreSQL.

> **Tip:** Each code block in this tutorial can be copied and pasted directly into a SQL cell in your notebook.

---

## SELECT Queries

The `SELECT` statement is the most fundamental query — it retrieves rows from a table.

```sql
-- Retrieve all columns from a table
SELECT * FROM users;

-- Retrieve specific columns
SELECT id, email, created_at FROM users;

-- Limit the number of results
SELECT * FROM users LIMIT 10;
```

You can also **alias** columns with `AS` to rename them in output:

```sql
SELECT
  email AS user_email,
  created_at AS joined_on
FROM users;
```

---

## Filtering with WHERE

Use `WHERE` to filter rows that match a condition:

```sql
-- Equality filter
SELECT * FROM users WHERE role = 'admin';

-- Multiple conditions with AND / OR
SELECT * FROM orders
WHERE status = 'shipped'
  AND total_amount > 100;

-- Pattern matching with LIKE
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- Range filter with BETWEEN
SELECT * FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';
```

---

## Aggregations & GROUP BY

Aggregate functions compute a single result from many rows:

| Function | Description |
|---|---|
| `COUNT(*)` | Count all rows |
| `SUM(col)` | Sum of a numeric column |
| `AVG(col)` | Average value |
| `MIN(col)` | Minimum value |
| `MAX(col)` | Maximum value |

```sql
-- Count all users
SELECT COUNT(*) FROM users;

-- Count per role
SELECT role, COUNT(*) AS total
FROM users
GROUP BY role
ORDER BY total DESC;

-- Filter grouped results with HAVING
SELECT role, COUNT(*) AS total
FROM users
GROUP BY role
HAVING COUNT(*) > 5;
```

---

## Joining Tables

JOINs combine rows from two or more tables:

```sql
-- INNER JOIN — only matching rows
SELECT
  orders.id AS order_id,
  users.email,
  orders.total_amount
FROM orders
INNER JOIN users ON orders.user_id = users.id;

-- LEFT JOIN — all rows from left table, NULLs for unmatched right rows
SELECT
  users.email,
  orders.id AS order_id
FROM users
LEFT JOIN orders ON orders.user_id = users.id;
```

> **Pro Tip:** Always give your tables aliases when joining multiple tables to keep queries readable:
> ```sql
> SELECT u.email, o.total_amount
> FROM users u
> JOIN orders o ON o.user_id = u.id;
> ```
