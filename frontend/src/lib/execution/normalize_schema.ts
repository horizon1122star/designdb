import { Schema, Entity, Attribute, Relationship, validateSchema } from './utils/schema_validator';
import { logger } from './utils/logger';

export interface NormalizationOptions {
  strictMode?: boolean;
  autoDecompose?: boolean;
}

export interface NormalizationParams {
  schema: Schema;
  options: NormalizationOptions;
}

export interface NormalizationResult {
  schema: Schema;
  issuesFound: number;
  report: string;
}

export function normalizeTo3NF({ schema, options }: NormalizationParams): NormalizationResult {
  logger.logInfo('normalizeTo3NF', 'Starting deterministic normal form passes');

  let currentSchema = JSON.parse(JSON.stringify(schema)) as Schema; // deep copy
  const logs: string[] = [];
  let issuesCount = 0;

  // PASS 1: 1NF Validation (Atomicity)
  const oneNFSchema = apply1NF(currentSchema, logs);
  if (oneNFSchema.changed) issuesCount++;
  currentSchema = oneNFSchema.schema;

  // PASS 2: 2NF Validation
  const twoNFSchema = apply2NF(currentSchema, logs);
  if (twoNFSchema.changed) issuesCount++;
  currentSchema = twoNFSchema.schema;

  // PASS 3: 3NF Validation
  const threeNFSchema = apply3NF(currentSchema, logs, options.strictMode);
  if (threeNFSchema.changed) issuesCount++;
  currentSchema = threeNFSchema.schema;

  // Final Validation
  const validation = validateSchema(currentSchema);
  if (!validation.isValid) {
      logger.logError('normalizeTo3NF', 'Normalization resulted in invalid schema', validation.errors);
      throw new Error("Fatal: Decomposed schema is invalid.");
  }

  const report = generateReport(schema, currentSchema, logs, issuesCount);
  logger.logInfo('normalizeTo3NF', `Completed with ${issuesCount} anomalies resolved.`);

  return {
    schema: currentSchema,
    issuesFound: issuesCount,
    report
  };
}

function apply1NF(schema: Schema, logs: string[]): { schema: Schema, changed: boolean } {
  let changed = false;
  const newEntities: Entity[] = [];
  const newRelationships: Relationship[] = [];

  for (const entity of schema.entities) {
    const atomicAttributes: Attribute[] = [];
    let pk = entity.attributes.find(a => a.isPrimaryKey);

    if (!pk) {
      pk = {
        name: `${entity.name}_id`,
        dataType: 'INTEGER',
        isPrimaryKey: true,
        isNullable: false,
        isUnique: true
      };
      atomicAttributes.push(pk);
      logs.push(`[1NF] Injected missing primary key '${pk.name}' into '${entity.name}'`);
      changed = true;
    }

    for (const attr of entity.attributes) {
      if (!attr.isPrimaryKey && (attr.name.endsWith('s') && attr.name !== 'status' && attr.name !== 'address' || attr.name.includes('_list'))) {
         const newEntityName = `${entity.name}_${attr.name.replace(/_list|s$/g, '')}`;
         const newPkName = `${newEntityName}_id`;
         
         const newEntity: Entity = {
            name: newEntityName,
            description: `1NF abstraction for ${attr.name}`,
            attributes: [
              { name: newPkName, dataType: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true },
              { name: pk!.name, dataType: pk!.dataType, isPrimaryKey: false, isNullable: false, isUnique: false },
              { name: 'value', dataType: attr.dataType || 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, isUnique: false }
            ]
         };

         newEntities.push(newEntity);
         newRelationships.push({
             fromEntity: newEntityName,
             toEntity: entity.name,
             type: 'many-to-one',
             foreignKey: pk!.name,
             referencedKey: pk!.name,
             onDelete: 'CASCADE',
             onUpdate: 'CASCADE'
         });

         logs.push(`[1NF] Extracted repeating group '${attr.name}' from '${entity.name}' into new entity '${newEntityName}'`);
         changed = true;
      } else {
         atomicAttributes.push(attr);
      }
    }
    entity.attributes = atomicAttributes;
  }

  schema.entities.push(...newEntities);
  schema.relationships.push(...newRelationships);

  return { schema, changed };
}

// ─── 2NF: Eliminate Partial Dependencies ────────────────────────────────────
// A partial dependency occurs when a non-key attribute depends on only PART of
// a composite primary key. We detect composite PKs and check whether any
// non-key attribute's name suggests it belongs to one PK column alone.
function apply2NF(schema: Schema, logs: string[]): { schema: Schema, changed: boolean } {
  let changed = false;
  const newEntities: Entity[] = [];
  const newRelationships: Relationship[] = [];

  for (const entity of schema.entities) {
    const pkAttrs = entity.attributes.filter(a => a.isPrimaryKey);

    // 2NF only applies to composite primary keys
    if (pkAttrs.length < 2) continue;

    const pkNames = pkAttrs.map(a => a.name);

    // Group non-key attributes by which PK column they "belong to"
    // Heuristic: attr name starts with or contains the PK column stem
    const partialGroups: Map<string, Attribute[]> = new Map();

    for (const pk of pkAttrs) {
      const stem = pk.name.replace(/_id$/, '');
      const partials = entity.attributes.filter(a =>
        !a.isPrimaryKey &&
        (a.name.startsWith(stem + '_') || a.name === stem + '_name' || a.name === stem + '_type')
      );
      if (partials.length > 0) {
        partialGroups.set(pk.name, partials);
      }
    }

    for (const [pkColName, partialAttrs] of partialGroups) {
      const pkCol = pkAttrs.find(a => a.name === pkColName)!;
      const stem = pkColName.replace(/_id$/, '');
      const newEntityName = `${stem}`;

      // Avoid duplicating an entity that already exists
      if (schema.entities.find(e => e.name === newEntityName) || newEntities.find(e => e.name === newEntityName)) {
        continue;
      }

      const newEntity: Entity = {
        name: newEntityName,
        description: `2NF decomposition: attributes partially dependent on '${pkColName}'`,
        attributes: [
          { name: pkColName, dataType: pkCol.dataType, isPrimaryKey: true, isNullable: false, isUnique: true },
          ...partialAttrs.map(a => ({ ...a, isPrimaryKey: false }))
        ]
      };

      newEntities.push(newEntity);
      newRelationships.push({
        fromEntity: entity.name,
        toEntity: newEntityName,
        type: 'many-to-one',
        foreignKey: pkColName,
        referencedKey: pkColName,
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      // Remove the migrated attributes from the original entity
      const migratedNames = new Set(partialAttrs.map(a => a.name));
      entity.attributes = entity.attributes.filter(a => !migratedNames.has(a.name));

      logs.push(`[2NF] Decomposed partial dependency: moved [${partialAttrs.map(a => a.name).join(', ')}] from '${entity.name}' into new table '${newEntityName}' (dependent on '${pkColName}')`);
      changed = true;
    }
  }

  schema.entities.push(...newEntities);
  schema.relationships.push(...newRelationships);

  return { schema, changed };
}

// ─── 3NF: Eliminate Transitive Dependencies ──────────────────────────────────
// A transitive dependency occurs when: PK → A → B (non-key determines non-key).
// Common patterns we detect:
//   zip_code → city, state
//   category_id → category_name, category_description
//   department_id → department_name, department_budget
//   country_code → country_name, currency
// We also handle strict mode which checks ALL non-key string attributes
// that share a common prefix (suggesting they form their own lookup table).
function apply3NF(schema: Schema, logs: string[], strictMode?: boolean): { schema: Schema, changed: boolean } {
  let changed = false;
  const newEntities: Entity[] = [];
  const newRelationships: Relationship[] = [];

  // Known transitive dependency patterns: determinant → [dependent attributes]
  const KNOWN_TRANSITIVE_PATTERNS: Array<{ determinant: RegExp; dependents: RegExp[] }> = [
    { determinant: /^zip_?code$/i, dependents: [/^city$/i, /^state$/i, /^province$/i, /^country$/i] },
    { determinant: /^postal_?code$/i, dependents: [/^city$/i, /^state$/i, /^region$/i] },
    { determinant: /^country_?code$/i, dependents: [/^country_?name$/i, /^currency(_code)?$/i] },
  ];

  for (const entity of schema.entities) {
    const pkAttr = entity.attributes.find(a => a.isPrimaryKey);
    if (!pkAttr) continue;

    const nonKeyAttrs = entity.attributes.filter(a => !a.isPrimaryKey);

    // ── Pattern 1: Known transitive clusters (zip→city, etc.) ──
    for (const pattern of KNOWN_TRANSITIVE_PATTERNS) {
      const determinant = nonKeyAttrs.find(a => pattern.determinant.test(a.name));
      if (!determinant) continue;

      const dependents = nonKeyAttrs.filter(a =>
        !a.isPrimaryKey &&
        a.name !== determinant.name &&
        pattern.dependents.some(dep => dep.test(a.name))
      );

      if (dependents.length === 0) continue;

      const newEntityName = determinant.name.replace(/_?(code|id)$/i, '').toLowerCase() + '_lookup';

      if (schema.entities.find(e => e.name === newEntityName) || newEntities.find(e => e.name === newEntityName)) continue;

      const newEntity: Entity = {
        name: newEntityName,
        description: `3NF decomposition: transitive dependency cluster on '${determinant.name}'`,
        attributes: [
          { name: determinant.name, dataType: determinant.dataType, isPrimaryKey: true, isNullable: false, isUnique: true },
          ...dependents.map(a => ({ ...a, isPrimaryKey: false }))
        ]
      };

      newEntities.push(newEntity);
      newRelationships.push({
        fromEntity: entity.name,
        toEntity: newEntityName,
        type: 'many-to-one',
        foreignKey: determinant.name,
        referencedKey: determinant.name,
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      const removed = new Set(dependents.map(a => a.name));
      entity.attributes = entity.attributes.filter(a => !removed.has(a.name));

      logs.push(`[3NF] Extracted transitive dependency: '${determinant.name}' → [${dependents.map(a => a.name).join(', ')}] from '${entity.name}' into '${newEntityName}'`);
      changed = true;
    }

    // ── Pattern 2: Prefix-based clustering (strictMode) ──
    // e.g. category_id, category_name, category_description → separate table
    if (strictMode) {
      const prefixGroups = detectPrefixClusters(nonKeyAttrs);

      for (const [prefix, group] of prefixGroups) {
        // The group must contain an _id or _code that acts as determinant
        const determinant = group.find(a => /_id$|_code$/i.test(a.name));
        if (!determinant) continue;

        const dependents = group.filter(a => a.name !== determinant.name);
        if (dependents.length === 0) continue;

        const newEntityName = prefix;

        if (schema.entities.find(e => e.name === newEntityName) || newEntities.find(e => e.name === newEntityName)) continue;

        const newEntity: Entity = {
          name: newEntityName,
          description: `3NF (strict) decomposition: prefix cluster '${prefix}_*'`,
          attributes: [
            { name: determinant.name, dataType: determinant.dataType, isPrimaryKey: true, isNullable: false, isUnique: true },
            ...dependents.map(a => ({ ...a, isPrimaryKey: false }))
          ]
        };

        newEntities.push(newEntity);
        newRelationships.push({
          fromEntity: entity.name,
          toEntity: newEntityName,
          type: 'many-to-one',
          foreignKey: determinant.name,
          referencedKey: determinant.name,
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        });

        const removed = new Set(dependents.map(a => a.name));
        entity.attributes = entity.attributes.filter(a => !removed.has(a.name));

        logs.push(`[3NF][strict] Extracted prefix cluster '${prefix}_*': moved [${dependents.map(a => a.name).join(', ')}] into '${newEntityName}'`);
        changed = true;
      }
    }
  }

  schema.entities.push(...newEntities);
  schema.relationships.push(...newRelationships);

  return { schema, changed };
}

// Detects groups of attributes sharing a common underscore-prefix
// e.g. [category_id, category_name, category_desc] → { category: [...] }
function detectPrefixClusters(attrs: Attribute[]): Map<string, Attribute[]> {
  const groups = new Map<string, Attribute[]>();

  for (const attr of attrs) {
    const parts = attr.name.split('_');
    if (parts.length < 2) continue;
    const prefix = parts.slice(0, -1).join('_'); // everything before the last segment
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(attr);
  }

  // Only return groups with 2+ members (a lone prefixed attr isn't a cluster)
  for (const [key, val] of groups) {
    if (val.length < 2) groups.delete(key);
  }

  return groups;
}

function generateReport(original: Schema, current: Schema, logs: string[], issuesCount: number): string {
    return `# Normalization Report\n\n**Status:** Success\n**Start Entities:** ${original.entities.length}\n**Final Entities:** ${current.entities.length}\n**Issues Resolved:** ${issuesCount}\n\n## Actions Taken\n${logs.length > 0 ? logs.map(l => `- ${l}`).join('\n') : "Schema was already in 3NF."}\n`;
}
