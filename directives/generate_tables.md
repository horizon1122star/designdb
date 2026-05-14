# Directive: Generate Tables

> **Purpose:** Transform a normalized JSON database schema into production-ready SQL `CREATE TABLE` statements (DDL) across multiple dialects (PostgreSQL, MySQL, SQLite).

---

## Overview

This directive guides the AI agent through taking the validated, 3NF-compliant JSON schema and generating the actual physical database tables. This includes creating tables, defining columns with correct data types, establishing primary/foreign key constraints, and adding necessary indexes. 

While requirements analysis is probabilistic (LLM-based), table generation is **strictly deterministic.**

---

## Inputs

**Required:**
- `normalizedSchema` (JSON): The validated, normalized JSON schema output from the previous steps.
- `sqlDialect` (string): The target SQL engine (e.g., "postgres", "mysql", "sqlite").

**Optional:**
- `includeSeedData` (boolean): If true, generate basic `INSERT` statements for mock data.
- `includeDropTables` (boolean): If true, prepend `DROP TABLE IF EXISTS` statements.
- `useAlterTable` (boolean): If true, create tables without constraints first, then add constraints using `ALTER TABLE`.

---

## Tools to Use

**Primary:**
- `execution/export_sql.ts` (or `execution/generate_tables.ts`)
  - Deterministic script to map JSON schema to SQL DDL syntax.
  - Takes `--dialect` flag.
  - Returns raw `.sql` text.

**Validation:**
- `execution/utils/sql_validator.ts`
  - Validates basic DDL syntax before returning it to the user.
  - Ensures correctly matched types and properly ordered creation syntax.

---

## Processing Logic

### Execution Flow

We rely on TypeScript execution scripts rather than LLMs for this step to ensure 100% syntactical accuracy.

1. **Dependency Sorting (Crucial):**
   - Tables must be created in the correct topological order. Entities with no foreign keys (independent tables) must be created *first*.
   - Tables with relationships (dependent tables, junction tables) must be created *after* their referenced tables.
   
2. **Dialect Mapping:**
   - **Postgres:** Use `SERIAL` or `GENERATED ALWAYS AS IDENTITY` for auto-increment primary keys.
   - **MySQL:** Use `AUTO_INCREMENT`.
   - **SQLite:** Use `INTEGER PRIMARY KEY AUTOINCREMENT`.

3. **Constraint Formatting:**
   - Define Primary Keys cleanly.
   - Define Foreign Keys with correct `ON DELETE` and `ON UPDATE` cascading behaviors.
   - Apply `UNIQUE` and `NOT NULL` constraints based on the JSON specification.

### Example Conversion

**Input Normalized JSON Schema snippet:**
```json
{
  "entities": [
    {
      "name": "customer",
      "attributes": [
        { "name": "customer_id", "dataType": "INTEGER", "isPrimaryKey": true, "isNullable": false }
      ]
    },
    {
      "name": "order",
      "attributes": [
        { "name": "order_id", "dataType": "INTEGER", "isPrimaryKey": true, "isNullable": false },
        { "name": "customer_id", "dataType": "INTEGER", "isPrimaryKey": false, "isNullable": false }
      ]
    }
  ],
  "relationships": [
    {
      "fromEntity": "order",
      "toEntity": "customer",
      "type": "many-to-one",
      "foreignKey": "customer_id",
      "referencedKey": "customer_id",
      "onDelete": "CASCADE",
      "onUpdate": "CASCADE"
    }
  ]
}
```

**Expected PostgreSQL Output:**
```sql
CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY
);

CREATE TABLE "order" (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

---

## Workflow Steps

### Step 1: Receive Target Configuration
```javascript
const config = {
  dialect: "postgres",
  includeDropTables: true
};
// Read schema from .tmp/parsed_schemas/normalized_schema.json
```

### Step 2: Execute DDL Script
```typescript
// execution/export_sql.ts
import { generateTables } from './export_sql';

const sqlOutput = generateTables(normalizedSchema, config.dialect, config);
```

### Step 3: Save to Temporary Storage for Delivery
```typescript
import fs from 'fs/promises';

await fs.writeFile(
  '.tmp/sql_exports/schema_v1.sql',
  sqlOutput
);
```

---

## Edge Cases & Error Handling

### 1. Circular Dependencies (Cyclic References)
**Problem:** Table A references Table B, and Table B references Table A. A simple creation order determination fails because topological sorting detects a loop.
**Solution:**
- **Action:** Switch automatically to a 2-pass export method.
  - **Pass 1:** Run `CREATE TABLE` without any `FOREIGN KEY` constraints.
  - **Pass 2:** Run `ALTER TABLE ADD CONSTRAINT` for all relationships after every table exists.

### 2. SQL Reserved Keywords
**Problem:** An entity is named `user`, `order`, `group`, or `select`, which are reserved keywords in most SQL dialects. This will crash the SQL execution.
**Solution:**
- The execution tool must maintain a list of reserved keywords per dialect.
- **Action:** Escape/quote table names and column names in dialect-specific syntax (e.g., `"order"` in Postgres/SQLite, `` `order` `` in MySQL).

### 3. Dialect-Specific Types
**Problem:** The base pseudo-schema uses generic types like `BOOLEAN` or `DATETIME`, but the target dialect expects specific variations.
**Solution:**
- Use a dedicated type-mapping dictionary inside the export script for each dialect.
- Example: Convert `BOOLEAN` to `TINYINT(1)` for strictly older MySQL versions if configured, or map `DATETIME` to `TIMESTAMP WITH TIME ZONE` in Postgres.

### 4. Drop Table Order
**Problem:** If the user requests drop tables, dropping them in the wrong order throws foreign key constraint violations.
**Solution:**
- `DROP TABLE` statements must be generated in the **exact reverse order** of table creation (dependent tables dropped before independent tables).
- Alternatively, use `DROP TABLE IF EXISTS "table" CASCADE;` where natively supported (like PostgreSQL).

---

## Success Criteria

A successfully generated SQL script should:

✅ **Be syntactically perfect** for the chosen dialect.
✅ **Execute flawlessly** in a real database without order constraint errors.
✅ **Escape reserved keywords** safely and automatically.
✅ **Correctly implement all cascading relationships** (`ON DELETE`, `ON UPDATE`) defined in the schema.
✅ **Include explicit index creation statements** for foreign keys to ensure performance best practices.

---

## Output Format

**File Location:** `.tmp/sql_exports/schema_{timestamp}.sql`

**File Content Structure:**
```sql
-- DesignDB Export DDL
-- Dialect: PostgreSQL
-- Generated At: 2026-04-12T10:30:00Z

-- ==========================================
-- DROP TABLES (If requested)
-- ==========================================
DROP TABLE IF EXISTS "order" CASCADE;
DROP TABLE IF EXISTS customer CASCADE;

-- ==========================================
-- CREATE TABLES
-- ==========================================
CREATE TABLE customer (
  -- columns ...
);

CREATE TABLE "order" (
  -- columns ...
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_order_customer_id ON "order"(customer_id);
```

---

## Testing Strategy

**Test Cases to Run:**
1. Generate a Postgres script and validate it against a linter.
2. Generate a MySQL script and validate against a linter.
3. Inject a schema with circular relationships and verify the script uses `ALTER TABLE` fallbacks instead of crashing.
4. Pass an entity explicitly named `where` and ensure it gets properly quoted across all dialects.

---

## Next Steps After This Directive

1. ✅ Pass `.sql` file to the frontend UI for user display.
2. → **Next Step:** `directives/integrate_ui_components.md` (Integrate the generated SQL view into a copy-to-clipboard ShadCN component or Monaco Editor window).
3. → **Optional Step:** Trigger mock data generation tools if `includeSeedData` is set to true.

---

## Update Log

**v1.0:**
- Derived from `analyze_requirements.md` format.
- Established strict determinism rules (TypeScript vs LLM).
- Detailed edge cases around topological sorting and reserved keywords.
