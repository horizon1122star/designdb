import { Schema } from './utils/schema_validator';
import { logger } from './utils/logger';

export function generateMermaid(schema: Schema): string {
    logger.logInfo('generateMermaid', 'Starting diagram generation');
    
    let mermaidStr = 'erDiagram\n';

    // 1. Generate Entities
    for (const entity of schema.entities) {
        mermaidStr += `    ${entity.name} {\n`;
        
        for (const attr of entity.attributes) {
            // Mermaid fields format: type name key
            const isPk = attr.isPrimaryKey ? ' PK' : '';
            // Check if it's a foreign key
            const isFk = schema.relationships.some(r => r.fromEntity === entity.name && r.foreignKey === attr.name) ? ' FK' : '';
            
            // Mermaid ER diagrams type should not contain spaces, so convert spaces to underscores if any
            const safeType = attr.dataType.replace(/\s+/g, '_');
            mermaidStr += `        ${safeType} ${attr.name}${isPk}${isFk}\n`;
        }
        
        mermaidStr += `    }\n\n`;
    }

    // 2. Generate Relationships
    for (const rel of schema.relationships) {
        let cardinality = '';
        
        switch (rel.type) {
            case 'one-to-one': cardinality = '||--||'; break;
            case 'one-to-many': cardinality = '||--o{'; break;
            case 'many-to-one': cardinality = '}o--||'; break;
            case 'many-to-many': cardinality = '}o--o{'; break;
            default: cardinality = '||--o{';
        }

        // Mermaid order: fromEntity cardinality toEntity : "Label"
        mermaidStr += `    ${rel.fromEntity} ${cardinality} ${rel.toEntity} : "${rel.foreignKey} -> ${rel.referencedKey}"\n`;
    }

    logger.logInfo('generateMermaid', `Generated ${schema.entities.length} entities and ${schema.relationships.length} relationships.`);
    
    return mermaidStr;
}
