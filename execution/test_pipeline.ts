import { normalizeTo3NF } from './normalize_schema';
import { generateMermaid } from './generate_mermaid';
import { generateTables } from './export_sql';
import fs from 'fs/promises';
import path from 'path';
import { Schema } from './utils/schema_validator';

async function runTestPipeline() {
  console.log('--- STARTING DESIGN-DB E2E MOCK PIPELINE ---\n');

  // 1. Mock output from `analyse_requirements.ts`
  // We include a 1NF violation (tags_list) to see normalization in action.
  const mockSchema: Schema = {
    entities: [
      {
        name: 'user',
        attributes: [
          { name: 'user_id', dataType: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true },
          { name: 'email', dataType: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, isUnique: true },
          { name: 'tags_list', dataType: 'VARCHAR(255)', isPrimaryKey: false, isNullable: true, isUnique: false }
        ]
      },
      {
        name: 'order',
        attributes: [
          { name: 'order_id', dataType: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true },
          { name: 'user_id', dataType: 'INTEGER', isPrimaryKey: false, isNullable: false, isUnique: false },
          { name: 'total_amount', dataType: 'DECIMAL(10,2)', isPrimaryKey: false, isNullable: false, isUnique: false }
        ]
      }
    ],
    relationships: [
      {
        fromEntity: 'order',
        toEntity: 'user',
        type: 'many-to-one',
        foreignKey: 'user_id',
        referencedKey: 'user_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    ]
  };

  console.log('1. Extracted Mock Schema (pre-normalization)');

  // 2. Normalization Engine (3NF)
  console.log('\n2. Running Normalization Engine...');
  const normResult = normalizeTo3NF({
      schema: mockSchema,
      options: { strictMode: true, autoDecompose: true }
  });
  console.log(`- Resolved anomalies: ${normResult.issuesFound}`);
  console.log(`- New Entity Count: ${normResult.schema.entities.length}`);

  // Ensure tmp output directory
  const outDir = path.resolve(process.cwd(), '.tmp', 'exports');
  await fs.mkdir(outDir, { recursive: true });

  // 3. Generate Mermaid
  console.log('\n3. Generating Mermaid Diagram...');
  const mmd = generateMermaid(normResult.schema);
  await fs.writeFile(path.join(outDir, 'diagram.mmd'), mmd);
  console.log('- Wrote diagram to .tmp/exports/diagram.mmd');

  // 4. Generate SQL (Postgres)
  console.log('\n4. Generating PostgreSQL DDL...');
  const sql = generateTables(normResult.schema, 'postgres', { includeDropTables: true });
  await fs.writeFile(path.join(outDir, 'schema.sql'), sql);
  console.log('- Wrote sql to .tmp/exports/schema.sql');

  console.log('\n--- PIPELINE COMPLETED SUCCESSFULLY ---');
}

runTestPipeline().catch(console.error);
