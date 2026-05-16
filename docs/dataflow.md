# DesignDB — Data Flow Documentation

**Milestone:** M3 — Data Cleaning & Preparation  
**Project:** DesignDB — AI-Integrated Relational Database Designer  
**Domain:** DesignDB's own application database (meta-schema)

---

## Overview

DesignDB is a web application that converts natural language into normalized database schemas with visual ER diagrams. The application itself runs on a relational database — **this document describes that internal database**, the data it stores, and how data flows through the system.

Because DesignDB generates custom ERDs for users, the most authentic demonstration of M3 competencies is using **DesignDB's own data model** as the subject domain.

---

## Database Schema (6 Tables)

```
users
  └──< projects          (one user → many projects)
         └──< schemas    (one project → many schema versions)
                ├──< entities        (one schema → many tables)
                │      └──< attributes   (one entity → many columns)
                └──< relationships   (one schema → many FK relationships)
```

---

## Table Descriptions & Normalization Status

### 1. `users`
Stores DesignDB user accounts.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | INTEGER PK | Auto-increment surrogate key |
| `username` | VARCHAR(255) | Unique login handle |
| `email` | VARCHAR(255) | Unique, NOT NULL |
| `full_name` | VARCHAR(255) | Display name |
| `role` | VARCHAR(50) | `admin`, `designer`, `viewer`, `editor` |
| `created_at` | TIMESTAMP | Account registration time |
| `is_active` | BOOLEAN | Soft-delete flag |

**Normalization:** 3NF ✅ — All attributes depend solely on `user_id`. No partial or transitive dependencies.

---

### 2. `projects`
An ERD design project created by a user.

| Column | Type | Notes |
|--------|------|-------|
| `project_id` | INTEGER PK | |
| `user_id` | INTEGER FK → `users` | Owner of the project |
| `title` | VARCHAR(255) | Project name |
| `description` | TEXT | Summary of the domain |
| `is_public` | BOOLEAN | Visibility flag |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | Last edit time |

**Normalization:** 3NF ✅ — `user_id` is a FK, not a transitive determinant. No anomalies.

---

### 3. `schemas`
A versioned database schema within a project. A project can have multiple schema versions (e.g., `v1_draft`, `v3_final`).

| Column | Type | Notes |
|--------|------|-------|
| `schema_id` | INTEGER PK | |
| `project_id` | INTEGER FK → `projects` | Parent project |
| `schema_name` | VARCHAR(255) | Version label |
| `version` | INTEGER | Iteration number |
| `is_normalized` | BOOLEAN | Set to `TRUE` after 3NF pass |
| `dialect` | VARCHAR(50) | `postgresql`, `mysql`, `sqlite` |
| `created_at` | TIMESTAMP | |

**Normalization:** 3NF ✅

---

### 4. `entities`
A database table (entity) defined within a schema.

| Column | Type | Notes |
|--------|------|-------|
| `entity_id` | INTEGER PK | |
| `schema_id` | INTEGER FK → `schemas` | Parent schema |
| `entity_name` | VARCHAR(255) | Table name (e.g., `Order`, `Product`) |
| `description` | TEXT | Purpose of the table |
| `estimated_row_count` | INTEGER | Row count hint for data generation |

**Normalization:** 3NF ✅

---

### 5. `attributes`
A column within an entity.

| Column | Type | Notes |
|--------|------|-------|
| `attribute_id` | INTEGER PK | |
| `entity_id` | INTEGER FK → `entities` | Parent entity |
| `attr_name` | VARCHAR(255) | Column name |
| `data_type` | VARCHAR(100) | `INTEGER`, `VARCHAR(255)`, etc. |
| `is_primary_key` | BOOLEAN | |
| `is_nullable` | BOOLEAN | |
| `is_unique` | BOOLEAN | |
| `default_value` | VARCHAR(255) | Optional default |

**Normalization:** 3NF ✅ — `entity_id` is FK, all other fields depend solely on `attribute_id`.

---

### 6. `relationships`
A foreign key relationship between two entities within a schema.

| Column | Type | Notes |
|--------|------|-------|
| `relationship_id` | INTEGER PK | |
| `schema_id` | INTEGER FK → `schemas` | Scope of the relationship |
| `from_entity_id` | INTEGER FK → `entities` | Child table (holds the FK) |
| `to_entity_id` | INTEGER FK → `entities` | Parent table (holds the PK) |
| `rel_type` | VARCHAR(50) | `one-to-many`, `many-to-one`, etc. |
| `foreign_key` | VARCHAR(255) | Column name in `from_entity` |
| `referenced_key` | VARCHAR(255) | Column name in `to_entity` |
| `on_delete` | VARCHAR(20) | `CASCADE`, `RESTRICT`, etc. |
| `on_update` | VARCHAR(20) | `CASCADE`, `RESTRICT`, etc. |

**Normalization:** 3NF ✅

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INPUT LAYER                                │
│                                                                     │
│  User types natural language:                                       │
│  "I need a library system with books, authors, and borrowers"       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                               │
│                                                                     │
│  1. analyse_requirements.ts                                         │
│     └── Gemini API extracts entities, attributes, relationships     │
│     └── Output: JSON Schema (validated with Zod)                    │
│                                                                     │
│  2. normalize_schema.ts                                             │
│     └── 1NF pass: atomicity, PK injection                          │
│     └── 2NF pass: partial dependency elimination                    │
│     └── 3NF pass: transitive dependency elimination                 │
│     └── Output: Normalized JSON Schema + report                     │
│                                                                     │
│  3. generate_mermaid.ts                                             │
│     └── Converts schema to Mermaid.js erDiagram syntax             │
│     └── Output: .mmd string → rendered on Canvas                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                                 │
│                                                                     │
│  DesignDB Application Database (this document's subject):           │
│                                                                     │
│  users → projects → schemas ──┬──> entities → attributes           │
│                               └──> relationships                    │
│                                                                     │
│  Seed Data (data/csv/):                                             │
│    users.csv         60 rows                                        │
│    projects.csv      80 rows                                        │
│    schemas.csv       75 rows                                        │
│    entities.csv      90 rows                                        │
│    attributes.csv   100 rows                                        │
│    relationships.csv 70 rows                                        │
│                                                                     │
│    Total: 475 rows across 6 normalized tables                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        OUTPUT LAYER                                 │
│                                                                     │
│  1. Visual ERD on Canvas (React Flow + TableNode components)        │
│  2. SQL DDL export (export_sql.ts → PostgreSQL / MySQL / SQLite)    │
│  3. Normalization report (Markdown, auto-generated)                 │
│  4. Downloadable .mmd / .sql / .png files                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Cleaning Steps Applied

Since this is synthetic application data (not raw/imported data), cleaning was performed at generation time via `execution/generate_seed_data.ts`:

| Cleaning Step | Action |
|---------------|--------|
| **No NULL PKs** | All PKs are sequential integers; no gaps |
| **FK integrity** | Child rows reference only valid parent PKs (modular arithmetic) |
| **No duplicate emails** | Emails constructed as `first.last{i}@domain` — unique by construction |
| **No orphaned entities** | Every `entity` maps to an existing `schema`; every `schema` maps to an existing `project` |
| **Consistent date ordering** | `created_at` < `updated_at` enforced by offset arithmetic |
| **Role constraints** | Only allowed values: `admin`, `designer`, `viewer`, `editor` |
| **Boolean normalization** | Stored as `0`/`1` for SQLite compatibility |

---

## Seed Data Statistics

| Table | Rows | FK References |
|-------|------|---------------|
| `users` | 60 | None (root table) |
| `projects` | 80 | → `users` |
| `schemas` | 75 | → `projects` |
| `entities` | 90 | → `schemas` |
| `attributes` | 100 | → `entities` |
| `relationships` | 70 | → `schemas`, `entities` (×2) |
| **Total** | **475** | |

---

## Generated By

```
execution/generate_seed_data.ts
Run: npx ts-node execution/generate_seed_data.ts
Output: data/csv/*.csv
```
