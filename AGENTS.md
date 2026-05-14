# Agent Instructions - DesignDB

> AI-Integrated Relational Database Designer
> Natural Language → 3NF Database Schema → ER Diagrams

You operate within a 3-layer architecture specifically designed for **DesignDB**, a web-based ERD generator that transforms business requirements into normalized database schemas with visual diagrams.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**
- SOPs written in Markdown, live in `directives/`
- Define goals, inputs, tools/scripts, outputs, and edge cases for each database design workflow
- Natural language instructions covering:
  - AI requirements analysis (extracting entities/attributes from text)
  - 3NF normalization validation
  - ER diagram generation with Mermaid.js
  - SQL export (PostgreSQL, MySQL, SQLite)
  - UI/UX integration with ShadCN and external services

**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing and workflow orchestration
- Read directives, call execution tools in the right order, handle errors, ask for clarification
- Update directives with learnings from API constraints, normalization edge cases, and diagram rendering issues
- You don't manually parse natural language or validate normalization—you coordinate tools that do

**Layer 3: Execution (Doing the work)**
- Deterministic Node.js/TypeScript scripts in `execution/`
- Environment variables, API tokens stored in `.env`
- Handle:
  - LLM API calls (OpenAI/Claude for requirements extraction)
  - Database normalization algorithms
  - Mermaid.js diagram generation
  - SQL script generation
  - External API integrations (Eraser.io, DiagramGPT alternatives)
- Reliable, testable, fast. Use scripts instead of manual work.

**Why this works:** LLMs are probabilistic; database normalization and SQL generation are deterministic. By separating concerns, we achieve 99%+ success rates on complex workflows.

---

## DesignDB-Specific Operating Principles

### 1. Check for tools first
Before writing a script, check `execution/` for existing tools:
- `analyze_requirements.js` - LLM-based entity/attribute extraction
- `normalize_schema.js` - 3NF validation logic
- `generate_mermaid.js` - ER diagram generation
- `export_sql.js` - Multi-dialect SQL export
- `integrate_external_diagram.js` - Eraser.io/DiagramGPT API wrappers

Only create new scripts if none exist.

### 2. Self-anneal when things break
- **Example 1:** LLM misses an entity → check prompt engineering in directive → update system prompt → test again
- **Example 2:** Normalization validation fails on edge case → update algorithm → add test case → update directive
- **Example 3:** Mermaid.js fails to render complex relationships → simplify syntax → test → document workaround
- **Example 4:** Eraser.io rate limit hit → implement retry logic with exponential backoff → update directive

### 3. Update directives as you learn
When you discover:
- LLM prompt patterns that extract entities more reliably
- Normalization edge cases (multi-valued attributes, weak entities)
- Mermaid.js syntax limitations or workarounds
- External API constraints (Eraser.io limits, DiagramGPT response formats)
- UI component integration patterns with ShadCN/HyperUI

→ Update the relevant directive. But **don't create or overwrite directives without asking** unless explicitly instructed.

---

## Technology Stack Context

**Frontend:**
- **Framework:** React/Next.js with TypeScript
- **UI Components:** ShadCN, HyperUI, Untitled UI, Uiverse.io
- **Styling:** Tailwind CSS
- **Diagrams:** Mermaid.js (primary), Eraser.io API, DiagramGPT (suggested: Mermaid Live Editor API - free)

**Backend:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js or Next.js API routes
- **Database:** SQLite (metadata storage), PostgreSQL (production option)
- **LLM Integration:** OpenAI API or Anthropic Claude API via LangChain.js

**External Integrations:**
- **Eraser.io:** Cloud-based diagram generation (check free tier limits)
- **DiagramGPT Alternative:** Mermaid Live Editor API (free, open-source)
- **Excalidraw API:** Optional for freehand-style diagrams

**Normalization Engine:**
- Custom TypeScript implementation (deterministic)
- Algorithms: Candidate key detection, functional dependency analysis, BCNF/3NF decomposition

---

## Self-Annealing Loop for DesignDB

Errors are learning opportunities. When something breaks:

1. **Fix it**
   - LLM hallucinated a relationship? → Adjust prompt with few-shot examples
   - Normalization logic wrong? → Debug algorithm with test cases
   - Mermaid.js syntax error? → Check Mermaid docs, update generator

2. **Update the tool**
   - Add error handling (try/catch, retry logic)
   - Log failures to `.tmp/logs/` for debugging
   - Add unit tests in `tests/`

3. **Test tool thoroughly**
   - Run against edge cases (cyclical dependencies, ternary relationships)
   - Validate SQL output with real databases
   - Check diagram rendering in browser

4. **Update directive**
   - Document the edge case
   - Add troubleshooting steps
   - Include example inputs/outputs

5. **System is now stronger**
   - Future requests avoid the same error
   - Knowledge compounds over time

---

## File Organization

### Deliverables vs Intermediates

**Deliverables (user-facing outputs):**
- ER diagrams (Mermaid.js `.mmd` files, PNG exports, or Eraser.io links)
- SQL scripts (`.sql` files for PostgreSQL, MySQL, SQLite)
- Normalization reports (JSON or Markdown)
- Shareable project links (if using cloud storage)

**Intermediates (processing artifacts):**
- Raw LLM responses (`.tmp/llm_outputs/`)
- Parsed entity-relationship data (`.tmp/parsed_schemas/`)
- Normalization step-by-step logs (`.tmp/normalization_logs/`)
- Temp Mermaid files before finalization (`.tmp/diagrams/`)

### Directory Structure

```
designdb/
├── .tmp/                         # All intermediate files (never commit)
│   ├── llm_outputs/              # Raw LLM responses
│   ├── parsed_schemas/           # Intermediate JSON schemas
│   ├── normalization_logs/       # Step-by-step normalization traces
│   ├── diagrams/                 # Temp Mermaid/SVG files
│   └── logs/                     # Error logs, debug info
│
├── execution/                    # Deterministic TypeScript scripts
│   ├── analyze_requirements.ts   # LLM-based requirements extraction
│   ├── normalize_schema.ts       # 3NF validation logic
│   ├── generate_mermaid.ts       # Mermaid.js diagram generation
│   ├── export_sql.ts             # Multi-dialect SQL export
│   ├── integrate_eraser.ts       # Eraser.io API wrapper
│   ├── integrate_diagramgpt.ts   # DiagramGPT/alternative API wrapper
│   └── utils/                    # Helper functions (logging, validation)
│
├── directives/                   # SOPs in Markdown
│   ├── analyze_requirements.md   # How to extract entities/attributes
│   ├── normalize_database.md     # 3NF validation workflow
│   ├── generate_diagrams.md      # ER diagram creation guidelines
│   ├── export_schemas.md         # SQL export procedures
│   └── integrate_ui_components.md # ShadCN/HyperUI integration patterns
│
├── src/                          # Frontend source code
│   ├── components/               # React components (ShadCN, custom)
│   ├── pages/                    # Next.js pages or routes
│   ├── lib/                      # Client-side utilities
│   └── styles/                   # Tailwind CSS, global styles
│
├── tests/                        # Unit and integration tests
│   ├── normalization.test.ts     # Test 3NF algorithms
│   ├── mermaid_generation.test.ts # Test diagram syntax
│   └── sql_export.test.ts        # Validate SQL output
│
├── .env                          # Environment variables (API keys, secrets)
├── .gitignore                    # Exclude .tmp/, .env, node_modules/
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

**Key principle:** Local files (`.tmp/`) are only for processing. Deliverables are either:
1. Saved to user's local machine (download as `.sql`, `.mmd`, `.png`)
2. Stored in cloud services (if implementing project management features)
3. Displayed directly in the web app (interactive Mermaid diagrams)

Everything in `.tmp/` can be deleted and regenerated.

---

## DesignDB-Specific Workflows

### Workflow 1: Requirements → Schema
**Directive:** `directives/analyze_requirements.md`

1. User inputs natural language (e.g., "I need a library management system with books, authors, and borrowers")
2. Call `execution/analyze_requirements.ts` → LLM extracts entities, attributes, relationships
3. Call `execution/normalize_schema.ts` → Validate 1NF/2NF/3NF, decompose if needed
4. Output: JSON schema with tables, columns, primary/foreign keys

### Workflow 2: Schema → Diagram
**Directive:** `directives/generate_diagrams.md`

1. Input: Normalized JSON schema
2. Call `execution/generate_mermaid.ts` → Generate Mermaid.js ER diagram syntax
3. Optionally call `execution/integrate_eraser.ts` → Upload to Eraser.io for cloud rendering
4. Output: `.mmd` file, PNG export, or Eraser.io shareable link

### Workflow 3: Schema → SQL
**Directive:** `directives/export_schemas.md`

1. Input: Normalized JSON schema
2. User selects SQL dialect (PostgreSQL/MySQL/SQLite)
3. Call `execution/export_sql.ts` → Generate `CREATE TABLE`, constraints, indexes
4. Output: `.sql` file with proper syntax for selected dialect

---

## External Integration Guidelines

### Eraser.io
- **Free Tier:** 10 diagrams/month (check current limits)
- **Use Case:** Cloud-hosted, shareable ER diagrams
- **Directive:** `directives/integrate_eraser.md`
- **Tool:** `execution/integrate_eraser.ts`

### DiagramGPT Alternative: Mermaid Live Editor API
- **Free:** Open-source, no rate limits
- **API Endpoint:** `https://mermaid.ink/` (renders Mermaid → PNG/SVG)
- **Use Case:** Generate downloadable diagram images
- **Example:**
  ```typescript
  const mermaidCode = encodeURIComponent(mermaidSyntax);
  const imageUrl = `https://mermaid.ink/img/${mermaidCode}`;
  ```

### ShadCN/HyperUI/Untitled UI
- **Use Case:** Pre-built React components for forms, modals, tables
- **Directive:** `directives/integrate_ui_components.md`
- **Pattern:** Copy components from ShadCN docs → customize with Tailwind → integrate

---

## Error Handling Patterns

### LLM Errors
- **Hallucinated entities:** Use few-shot prompting with validated examples
- **Missing relationships:** Explicitly ask LLM to identify "connects to" patterns
- **Inconsistent naming:** Post-process with normalization (camelCase → snake_case)

### Normalization Errors
- **False positives (claiming 3NF when not):** Add stricter transitive dependency checks
- **False negatives (over-decomposing):** Review candidate key detection logic
- **Cyclic dependencies:** Flag for manual review, suggest design alternatives

### Diagram Rendering Errors
- **Mermaid.js syntax errors:** Validate with online parser before rendering
- **Too many entities (>20):** Suggest breaking into sub-diagrams
- **Complex many-to-many relationships:** Use junction tables, simplify visuals

---

## Summary

You are the orchestration layer for **DesignDB**, a web app that turns natural language into production-ready database schemas. You:

1. **Read directives** to understand workflows (requirements analysis, normalization, diagram generation, SQL export)
2. **Call deterministic tools** (TypeScript scripts) to execute logic
3. **Handle errors gracefully** (retry LLM calls, log failures, update algorithms)
4. **Continuously improve** (update directives with learnings, add test cases, refine prompts)

**Core philosophy:**
- **Be pragmatic:** Use existing tools (Mermaid.js, Eraser.io) before building custom solutions
- **Be reliable:** Validate every step (schema normalization, SQL syntax, diagram rendering)
- **Self-anneal:** Every error makes the system smarter

**Tech stack cheat sheet:**
- **Frontend:** React + Next.js + TypeScript + ShadCN + Tailwind
- **Backend:** Node.js + Express + TypeScript
- **LLM:** OpenAI/Claude via LangChain.js
- **Diagrams:** Mermaid.js + Mermaid Live Editor API (free alternative to DiagramGPT)
- **Database:** SQLite (metadata) + multi-dialect SQL export

---

## Quick Reference: Common Tasks

| Task | Directive | Tool |
|------|-----------|------|
| Extract entities from text | `analyze_requirements.md` | `analyze_requirements.ts` |
| Validate 3NF compliance | `normalize_database.md` | `normalize_schema.ts` |
| Generate Mermaid diagram | `generate_diagrams.md` | `generate_mermaid.ts` |
| Export PostgreSQL script | `export_schemas.md` | `export_sql.ts --dialect=postgres` |
| Upload to Eraser.io | `integrate_eraser.md` | `integrate_eraser.ts` |
| Render diagram as PNG | `generate_diagrams.md` | Use Mermaid Live Editor API |

---

**Next steps for initial setup:**
1. Review existing directives in `directives/`
2. Inventory tools in `execution/`
3. Test end-to-end workflow: requirements → schema → diagram → SQL
4. Update this file with project-specific learnings
