---
id: mongodb
title: MongoDB Query Guide
description: Query MongoDB collections using JSON commands — find, insert, update, delete, and aggregate.
engine: mongodb
difficulty: beginner
estimatedMinutes: 25
sections:
  - id: intro
    title: Introduction
  - id: syntax
    title: JSON Command Syntax
  - id: find
    title: Querying with find
  - id: insert
    title: Inserting Documents
  - id: update
    title: Updating Documents
  - id: delete
    title: Deleting Documents
  - id: aggregate
    title: Aggregation Pipeline
---

## Introduction

MongoDB is a **document-oriented NoSQL database**. Data is stored as flexible JSON-like documents in **collections** (analogous to SQL tables).

In this notebook, MongoDB queries are written as **JSON command objects**. Each command requires an `"operation"` field and a `"collection"` field.

---

## JSON Command Syntax

Every query you write must be a valid JSON object with this structure:

```json
{
  "operation": "<operation_name>",
  "collection": "<collection_name>",
  ...operation specific fields...
}
```

Supported operations: `find`, `insertOne`, `updateMany`, `deleteOne`, `aggregate`.

---

## Querying with find

```json
{
  "operation": "find",
  "collection": "users",
  "filter": {},
  "limit": 50
}
```

**With a filter:**

```json
{
  "operation": "find",
  "collection": "users",
  "filter": { "role": "admin" },
  "limit": 20
}
```

**Comparison operators** (`$gt`, `$lt`, `$gte`, `$lte`, `$ne`):

```json
{
  "operation": "find",
  "collection": "orders",
  "filter": { "total_amount": { "$gt": 100 } },
  "limit": 25
}
```

**Logical operators** (`$and`, `$or`):

```json
{
  "operation": "find",
  "collection": "products",
  "filter": {
    "$and": [
      { "category": "Electronics" },
      { "price": { "$lt": 500 } }
    ]
  },
  "limit": 50
}
```

---

## Inserting Documents

```json
{
  "operation": "insertOne",
  "collection": "users",
  "document": {
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "user",
    "created_at": "2024-01-15"
  }
}
```

The response will contain the `inserted_id` of the new document.

---

## Updating Documents

Use `$set` to update fields without replacing the whole document:

```json
{
  "operation": "updateMany",
  "collection": "users",
  "filter": { "role": "user" },
  "update": { "$set": { "is_active": true } }
}
```

Use `$inc` to increment a numeric field:

```json
{
  "operation": "updateMany",
  "collection": "products",
  "filter": { "category": "Electronics" },
  "update": { "$inc": { "view_count": 1 } }
}
```

---

## Deleting Documents

```json
{
  "operation": "deleteOne",
  "collection": "users",
  "filter": { "email": "alice@example.com" }
}
```

> **Warning:** `deleteOne` removes only the first matching document. Double-check your filter before running delete operations.

---

## Aggregation Pipeline

Aggregations process documents through a sequence of stages:

```json
{
  "operation": "aggregate",
  "collection": "orders",
  "pipeline": [
    { "$match": { "status": "completed" } },
    { "$group": {
        "_id": "$user_id",
        "total_spent": { "$sum": "$total_amount" },
        "order_count": { "$sum": 1 }
      }
    },
    { "$sort": { "total_spent": -1 } },
    { "$limit": 10 }
  ]
}
```

**Common pipeline stages:**

| Stage | Description |
|---|---|
| `$match` | Filter documents (like SQL `WHERE`) |
| `$group` | Group and aggregate (like SQL `GROUP BY`) |
| `$sort` | Sort results |
| `$limit` | Limit number of results |
| `$project` | Select / transform fields |
| `$lookup` | Join with another collection |
