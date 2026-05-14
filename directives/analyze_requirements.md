# Directive: Analyze Requirements

> **Purpose:** Extract entities, attributes, relationships, and constraints from natural language business requirements using LLM-based analysis.

---

## Overview

This directive guides the AI agent through transforming user-provided business requirements (plain English text) into a structured JSON schema that represents:
- **Entities** (tables)
- **Attributes** (columns with data types)
- **Relationships** (foreign keys, cardinality)
- **Constraints** (primary keys, unique, not null)

---

## Inputs

**Required:**
- `userRequirements` (string): Natural language description of the system
  - Example: "I need a library management system where members can borrow books"

**Optional:**
- `domain` (string): Industry context (e.g., "e-commerce", "healthcare", "education")
- `existingSchema` (JSON): Previous schema to extend/modify
- `clarificationMode` (boolean): If true, ask follow-up questions instead of making assumptions

---

## Tools to Use

**Primary:**
- `execution/analyze_requirements.ts`
  - Calls LLM API (OpenAI GPT-4 or Claude or Gemini)
  - Uses prompt engineering with few-shot examples
  - Returns structured JSON

**Validation:**
- `execution/utils/schema_validator.ts`
  - Validates JSON structure
  - Checks for common errors (missing PKs, orphaned FKs)

---

## LLM Prompt Engineering

### System Prompt Template

```text
You are an expert database architect specializing in entity-relationship modeling and normalization. Your task is to analyze business requirements and extract a structured database schema.

**Output Format:** JSON only, no explanations outside the JSON structure.

**Schema Structure:**
{
  "entities": [
    {
      "name": "EntityName",
      "description": "Brief description",
      "attributes": [
        {
          "name": "attribute_name",
          "dataType": "VARCHAR(255)" | "INTEGER" | "DATE" | "BOOLEAN" | "TEXT" | "DECIMAL(10,2)",
          "isPrimaryKey": true | false,
          "isNullable": true | false,
          "isUnique": true | false,
          "defaultValue": "value" | null
        }
      ]
    }
  ],
  "relationships": [
    {
      "fromEntity": "EntityName1",
      "toEntity": "EntityName2",
      "type": "one-to-one" | "one-to-many" | "many-to-many",
      "foreignKey": "attribute_name_in_fromEntity",
      "referencedKey": "attribute_name_in_toEntity",
      "onDelete": "CASCADE" | "SET NULL" | "RESTRICT",
      "onUpdate": "CASCADE" | "RESTRICT"
    }
  ]
}

**Rules:**
1. Use snake_case for entity and attribute names (e.g., "book_author", not "BookAuthor")
2. Every entity MUST have exactly one primary key
3. Primary keys should be INTEGER with auto-increment (unless natural keys exist)
4. Foreign keys must reference existing primary keys
5. For many-to-many relationships, create a junction table
6. Infer data types from context (e.g., "email" → VARCHAR(255), "age" → INTEGER)
7. Mark attributes as NOT NULL (isNullable: false) if they're essential
8. Add unique constraints for naturally unique fields (email, username, ISBN)
```

### Few-Shot Examples

**Example 1: Simple E-commerce System**

**User Input:**
```
I need an online store where customers can place orders for products. Each product has a name, price, and stock quantity. Customers have names, emails, and addresses.
```

**Expected LLM Output:**
```json
{
  "entities": [
    {
      "name": "customer",
      "description": "Registered users who can place orders",
      "attributes": [
        {
          "name": "customer_id",
          "dataType": "INTEGER",
          "isPrimaryKey": true,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "name",
          "dataType": "VARCHAR(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "email",
          "dataType": "VARCHAR(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "address",
          "dataType": "TEXT",
          "isPrimaryKey": false,
          "isNullable": true,
          "isUnique": false
        }
      ]
    },
    {
      "name": "product",
      "description": "Items available for purchase",
      "attributes": [
        {
          "name": "product_id",
          "dataType": "INTEGER",
          "isPrimaryKey": true,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "name",
          "dataType": "VARCHAR(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "price",
          "dataType": "DECIMAL(10,2)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "stock_quantity",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false,
          "defaultValue": "0"
        }
      ]
    },
    {
      "name": "order",
      "description": "Customer purchase orders",
      "attributes": [
        {
          "name": "order_id",
          "dataType": "INTEGER",
          "isPrimaryKey": true,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "customer_id",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "order_date",
          "dataType": "TIMESTAMP",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false,
          "defaultValue": "CURRENT_TIMESTAMP"
        },
        {
          "name": "total_amount",
          "dataType": "DECIMAL(10,2)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        }
      ]
    },
    {
      "name": "order_item",
      "description": "Line items for each order (junction table for order-product)",
      "attributes": [
        {
          "name": "order_item_id",
          "dataType": "INTEGER",
          "isPrimaryKey": true,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "order_id",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "product_id",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "quantity",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "unit_price",
          "dataType": "DECIMAL(10,2)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        }
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
    },
    {
      "fromEntity": "order_item",
      "toEntity": "order",
      "type": "many-to-one",
      "foreignKey": "order_id",
      "referencedKey": "order_id",
      "onDelete": "CASCADE",
      "onUpdate": "CASCADE"
    },
    {
      "fromEntity": "order_item",
      "toEntity": "product",
      "type": "many-to-one",
      "foreignKey": "product_id",
      "referencedKey": "product_id",
      "onDelete": "RESTRICT",
      "onUpdate": "CASCADE"
    }
  ]
}
```

**Example 2: Library Management System**

**User Input:**
```
Create a library system where members can borrow books. Books have titles, ISBNs, authors, and publication years. Members have names, email addresses, and membership dates. Track which books are currently borrowed and when they're due back.
```

**Expected LLM Output:**
```json
{
  "entities": [
    {
      "name": "member",
      "description": "Library members who can borrow books",
      "attributes": [
        {
          "name": "member_id",
          "dataType": "INTEGER",
          "isPrimaryKey": true,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "name",
          "dataType": "VARCHAR(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "email",
          "dataType": "VARCHAR(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "membership_date",
          "dataType": "DATE",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false,
          "defaultValue": "CURRENT_DATE"
        }
      ]
    },
    {
      "name": "book",
      "description": "Books available in the library",
      "attributes": [
        {
          "name": "book_id",
          "dataType": "INTEGER",
          "isPrimaryKey": true,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "isbn",
          "dataType": "VARCHAR(13)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "title",
          "dataType": "VARCHAR(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "author",
          "dataType": "VARCHAR(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "publication_year",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": true,
          "isUnique": false
        }
      ]
    },
    {
      "name": "loan",
      "description": "Tracks book borrowing transactions",
      "attributes": [
        {
          "name": "loan_id",
          "dataType": "INTEGER",
          "isPrimaryKey": true,
          "isNullable": false,
          "isUnique": true
        },
        {
          "name": "book_id",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "member_id",
          "dataType": "INTEGER",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "borrow_date",
          "dataType": "DATE",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false,
          "defaultValue": "CURRENT_DATE"
        },
        {
          "name": "due_date",
          "dataType": "DATE",
          "isPrimaryKey": false,
          "isNullable": false,
          "isUnique": false
        },
        {
          "name": "return_date",
          "dataType": "DATE",
          "isPrimaryKey": false,
          "isNullable": true,
          "isUnique": false
        }
      ]
    }
  ],
  "relationships": [
    {
      "fromEntity": "loan",
      "toEntity": "book",
      "type": "many-to-one",
      "foreignKey": "book_id",
      "referencedKey": "book_id",
      "onDelete": "RESTRICT",
      "onUpdate": "CASCADE"
    },
    {
      "fromEntity": "loan",
      "toEntity": "member",
      "type": "many-to-one",
      "foreignKey": "member_id",
      "referencedKey": "member_id",
      "onDelete": "RESTRICT",
      "onUpdate": "CASCADE"
    }
  ]
}
```

---

## Workflow Steps

### Step 1: Receive User Input
```javascript
const userInput = {
  requirements: "I need a blog platform where users can write posts and comment on them.",
  domain: "content-management",
  clarificationMode: false
};
```

### Step 2: Call LLM with Prompt
```typescript
// execution/analyze_requirements.ts
import { analyzeRequirements } from './analyze_requirements';

const schema = await analyzeRequirements({
  userRequirements: userInput.requirements,
  systemPrompt: SYSTEM_PROMPT, // From template above
  fewShotExamples: [EXAMPLE_1, EXAMPLE_2], // Include in context
  model: 'gpt-4' // or 'claude-3-opus-20240229'
});
```

### Step 3: Validate Output
```typescript
import { validateSchema } from './utils/schema_validator';

const validation = validateSchema(schema);

if (!validation.isValid) {
  console.error('Schema validation failed:', validation.errors);
  // Either: retry with clarification, or ask user for help
}
```

### Step 4: Save to Temporary Storage
```typescript
import fs from 'fs/promises';

await fs.writeFile(
  '.tmp/parsed_schemas/schema_v1.json',
  JSON.stringify(schema, null, 2)
);
```

---

## Edge Cases & Error Handling

### 1. Ambiguous Entity Names
**Problem:** User says "Track users who manage users"
**LLM might output:** `user` entity with confusing self-referential relationship

**Solution:**
- Prompt LLM to use descriptive names: `admin_user`, `regular_user`
- OR ask clarification: "Do you mean two types of users, or a hierarchical relationship?"

**Clarification Template:**
```
I detected potential ambiguity in entity naming:
- "users who manage users" could mean:
  A) Two entity types (Admins and Users)
  B) One entity with self-reference (User.manager_id → User.user_id)

Which interpretation is correct?
```

### 2. Multi-Valued Attributes
**Problem:** User says "Customers can have multiple phone numbers"
**Bad LLM output:** `phone_numbers` attribute as TEXT with comma-separated values

**Solution:**
- Create a separate `customer_phone` entity (many-to-one relationship)
- Update system prompt to explicitly forbid comma-separated values

**Prompt Addition:**
```
CRITICAL: If an attribute can have multiple values (e.g., "multiple phone numbers"), create a separate entity with a many-to-one relationship. NEVER use comma-separated values in a single column.
```

### 3. Implicit Relationships
**Problem:** User says "Posts belong to users" (doesn't explicitly say "one-to-many")
**LLM might miss:** The relationship entirely

**Solution:**
- Add keywords to system prompt: "belong to", "has many", "owns", "associated with"
- Post-process: Scan for orphaned entities without relationships

**Validation Check:**
```typescript
function detectOrphanedEntities(schema) {
  const entitiesWithRelationships = new Set();
  
  schema.relationships.forEach(rel => {
    entitiesWithRelationships.add(rel.fromEntity);
    entitiesWithRelationships.add(rel.toEntity);
  });
  
  const orphans = schema.entities.filter(
    entity => !entitiesWithRelationships.has(entity.name)
  );
  
  if (orphans.length > 0) {
    console.warn('Orphaned entities detected:', orphans.map(e => e.name));
    // Ask user: "Should these entities be connected to others?"
  }
}
```

### 4. Missing Primary Keys
**Problem:** LLM forgets to mark a primary key
**Bad output:** Entity with all `isPrimaryKey: false`

**Solution:**
- Add validation rule: Every entity MUST have exactly 1 PK
- Auto-fix: If no PK found, add `{entity_name}_id` as INTEGER PK

**Auto-Fix Code:**
```typescript
function ensurePrimaryKeys(schema) {
  schema.entities.forEach(entity => {
    const hasPK = entity.attributes.some(attr => attr.isPrimaryKey);
    
    if (!hasPK) {
      entity.attributes.unshift({
        name: `${entity.name}_id`,
        dataType: 'INTEGER',
        isPrimaryKey: true,
        isNullable: false,
        isUnique: true
      });
      console.log(`Auto-added primary key for ${entity.name}`);
    }
  });
}
```

### 5. Incorrect Data Types
**Problem:** LLM uses `STRING` instead of `VARCHAR(255)`
**Bad output:** Non-standard SQL data types

**Solution:**
- Post-process with data type mapper
- Normalize to standard SQL types

**Data Type Mapper:**
```typescript
const DATA_TYPE_MAP = {
  'STRING': 'VARCHAR(255)',
  'NUMBER': 'INTEGER',
  'FLOAT': 'DECIMAL(10,2)',
  'BOOL': 'BOOLEAN',
  'DATETIME': 'TIMESTAMP'
};

function normalizeDataTypes(schema) {
  schema.entities.forEach(entity => {
    entity.attributes.forEach(attr => {
      if (DATA_TYPE_MAP[attr.dataType]) {
        attr.dataType = DATA_TYPE_MAP[attr.dataType];
      }
    });
  });
}
```

---

## Success Criteria

A successfully extracted schema should have:

✅ **All entities have primary keys** (exactly 1 per entity)
✅ **Foreign keys reference existing primary keys** (no orphaned FKs)
✅ **No multi-valued attributes** (comma-separated values)
✅ **Standard SQL data types** (VARCHAR, INTEGER, etc.)
✅ **Appropriate nullability** (essential fields are NOT NULL)
✅ **Unique constraints on natural keys** (email, ISBN, username)
✅ **Many-to-many relationships use junction tables**
✅ **Meaningful entity/attribute names** (snake_case, descriptive)

---

## Output Format

**File Location:** `.tmp/parsed_schemas/schema_{timestamp}.json`

**Metadata to Include:**
```json
{
  "metadata": {
    "version": "1.0",
    "createdAt": "2026-04-12T10:30:00Z",
    "originalRequirements": "User's input text...",
    "llmModel": "gpt-4",
    "confidence": 0.92
  },
  "schema": {
    "entities": [...],
    "relationships": [...]
  }
}
```

---

## When to Ask for Clarification

**Trigger clarification if:**
- LLM confidence score < 80%
- Detected ambiguous entity names (e.g., "user" managing "user")
- More than 2 orphaned entities
- User input < 20 words (too vague)
- Contradictory requirements (e.g., "each book has one author" but later "books can have multiple authors")

**Clarification Template:**
```
I analyzed your requirements and have a few questions to ensure accuracy:

1. [Question about ambiguity]
2. [Question about implicit relationship]
3. [Question about data constraint]

Please provide clarification so I can generate the most accurate schema.
```

---

## Testing Strategy

**Test Cases to Run:**
1. Simple 2-entity system (User → Post)
2. Many-to-many with junction table (Student ↔ Course)
3. Self-referential relationship (Employee → Manager)
4. Multi-valued attribute (Customer → Phone Numbers)
5. Ambiguous naming (User managing User)
6. Missing primary key scenario
7. Very short input (< 15 words)
8. Very long input (> 500 words)

**Expected Results:** All should produce valid, normalized JSON schemas.

---

## Next Steps After This Directive

Once schema is extracted:
1. ✅ Validate with `schema_validator.ts`
2. → **Pass to:** `directives/normalize_database.md` (check 3NF compliance)
3. → **Then:** `directives/generate_diagrams.md` (create ER diagram)
4. → **Finally:** `directives/export_schemas.md` (generate SQL)

---

## Update Log

**v1.0 (2026-04-12):**
- Initial directive created
- Added few-shot examples for e-commerce and library systems
- Defined 5 major edge cases with solutions
- Established success criteria

**Future improvements to add here as you self-anneal:**
- [ ] More few-shot examples for different domains
- [ ] Confidence threshold tuning based on real usage
- [ ] Advanced relationship types (ternary, aggregation)
- [ ] Support for inheritance hierarchies
