import { z } from 'zod';

export const AttributeSchema = z.object({
  name: z.string(),
  dataType: z.string(),
  isPrimaryKey: z.boolean().default(false),
  isNullable: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  defaultValue: z.string().nullable().optional(),
});

export const EntitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  attributes: z.array(AttributeSchema),
});

export const RelationshipSchema = z.object({
  fromEntity: z.string(),
  toEntity: z.string(),
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
  foreignKey: z.string(),
  referencedKey: z.string(),
  onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).default('RESTRICT'),
  onUpdate: z.enum(['CASCADE', 'RESTRICT', 'NO ACTION']).default('CASCADE'),
});

export const DatabaseSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema).default([]),
});

export type Attribute = z.infer<typeof AttributeSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Schema = z.infer<typeof DatabaseSchema>;

export function validateSchema(data: unknown): { isValid: boolean; data?: Schema; errors?: any } {
  const result = DatabaseSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, data: result.data };
  }
  return { isValid: false, errors: result.error.format() };
}
