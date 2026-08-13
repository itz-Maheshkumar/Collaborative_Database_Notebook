---
id: mysql
title: MySQL Essentials
description: Master MySQL queries — SELECT, filtering, aggregations, indexes, and SHOW commands.
engine: mysql
difficulty: beginner
estimatedMinutes: 20
sections:
  - id: intro
    title: Introduction
  - id: select
    title: SELECT & SHOW
  - id: filtering
    title: Filtering & Sorting
  - id: aggregations
    title: Aggregations
  - id: indexes
    title: Indexes & Performance
---

## Introduction

MySQL is one of the world's most popular relational databases, widely used in web applications. It is fully ANSI SQL-compliant and supports powerful indexing and replication features.

> **Tip:** Use the Schema Explorer panel on the left to browse your tables and column names before writing queries.

---

## SELECT & SHOW

The most common commands you'll use:

```sql
-- See all tables in the current database
SHOW TABLES;

-- Describe a table's structure
DESCRIBE users;

-- Basic select
SELECT * FROM users LIMIT 25;

-- Specific columns with alias
SELECT
  id,
  email AS user_email,
  created_at AS registered
FROM users;
```

---

## Filtering & Sorting

```sql
-- WHERE with conditions
SELECT * FROM products
WHERE price < 50 AND stock > 0;

-- LIKE for pattern matching
SELECT * FROM users
WHERE email LIKE '%@company.com';

-- IN for multiple values
SELECT * FROM orders
WHERE status IN ('pending', 'processing');

-- ORDER BY ascending / descending
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 20;
```

---

## Aggregations

```sql
-- Count rows per category
SELECT category, COUNT(*) AS total_products
FROM products
GROUP BY category
ORDER BY total_products DESC;

-- Sum revenue by month
SELECT
  MONTH(created_at) AS month,
  SUM(total_amount) AS revenue
FROM orders
WHERE YEAR(created_at) = 2024
GROUP BY MONTH(created_at);

-- HAVING to filter groups
SELECT user_id, COUNT(*) AS order_count
FROM orders
GROUP BY user_id
HAVING order_count >= 3;
```

---

## Indexes & Performance

Indexes dramatically speed up lookups on large tables:

```sql
-- View existing indexes
SHOW INDEX FROM users;

-- Create an index on a column
CREATE INDEX idx_email ON users(email);

-- Use EXPLAIN to understand query performance
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

> **Best Practice:** Always index foreign key columns and columns used frequently in `WHERE` clauses. Avoid over-indexing — every index slows down `INSERT`, `UPDATE`, and `DELETE`.
