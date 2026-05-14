<div align="center">
  <img src="https://raw.githubusercontent.com/horizon1122star/designdb/main/assets/logo.png" alt="DesignDB Logo" width="120" onerror="this.style.display='none'">
  <h1>DesignDB</h1>
  <p><b>AI-Integrated Relational Database Designer</b></p>
  <p>Natural Language → 3NF Database Schema → ER Diagrams</p>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>
</div>

---

## 🌟 Overview

**DesignDB** is a next-generation, web-based Entity-Relationship Diagram (ERD) generator that transforms business requirements into normalized database schemas with visual diagrams. Powered by advanced LLMs and deterministic normalization algorithms, DesignDB bridging the gap between natural language requirements and production-ready SQL.

## ✨ Features

- **Natural Language Parsing**: Just describe your system (e.g., "I need a library management system with books, authors, and borrowers"), and DesignDB extracts the necessary entities, attributes, and relationships.
- **Automated Normalization (3NF)**: Custom deterministic engine validates and decomposes your schema into Third Normal Form (1NF, 2NF, 3NF compliance).
- **Instant Diagram Generation**: Automatically creates beautiful, interactive Mermaid.js ER diagrams from the normalized schema.
- **Multi-Dialect SQL Export**: Generates `CREATE TABLE` scripts tailored for PostgreSQL, MySQL, and SQLite.
- **Cloud Integrations**: Supports diagram rendering via Eraser.io and Mermaid Live Editor API.

## 🏗️ The 3-Layer Architecture

DesignDB uses a robust Agentic architecture to ensure >99% success rates on complex database design workflows:

1. **Directive Layer (What to do)**
   - Clear standard operating procedures in Markdown defining goals, inputs, tools, and edge cases.
2. **Orchestration Layer (Decision making)**
   - Intelligent routing, LLM tool calling, error handling, and self-annealing workflows.
3. **Execution Layer (Doing the work)**
   - Deterministic Node.js/TypeScript scripts handling algorithms, diagram generation, and SQL export.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/horizon1122star/designdb.git
   cd designdb
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Setup environment variables
   ```bash
   cp .env.example .env
   # Add your API keys (OpenAI, Anthropic, etc.)
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

**Frontend:**
- React / Next.js
- Tailwind CSS
- ShadCN UI
- Mermaid.js

**Backend:**
- Node.js / TypeScript
- Express.js
- LangChain.js

**Databases & Export:**
- SQLite, PostgreSQL, MySQL

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
