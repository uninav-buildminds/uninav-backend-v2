import { PgArray, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { material } from 'src/drizzle/schema/material.schema';
import { resourceTypeEnum } from 'src/drizzle/schema/enums.schema';

export const resource = pgTable('resource', {
  materialId: uuid('materialId')
    .primaryKey()
    .references(() => material.id, {
      onDelete: 'cascade',
    }),

  resourceAddress: text('resourceAddress').notNull(),
  resourceType: resourceTypeEnum('resourceType'),

  metaData: text('metaData').array(),
});

export const resourceRelation = relations(resource, ({ one }) => ({
  material: one(material, {
    fields: [resource.materialId],
    references: [material.id],
  }),
}));
