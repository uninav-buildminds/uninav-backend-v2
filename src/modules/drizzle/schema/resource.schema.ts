import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { material } from 'src/modules/drizzle/schema/material.schema';
import { resourceTypeEnum } from 'src/modules/drizzle/schema/enums.schema';

export const resource = pgTable('resource', {
  materialId: uuid('materialId')
    .primaryKey()
    .references(() => material.id, {
      onDelete: 'cascade',
    }),

  resourceAddress: text('resourceAddress').notNull(),
  resourceType: resourceTypeEnum('resourceType'),
  fileKey: text('fileKey').notNull(),
  metaData: text('metaData').array(),

  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const resourceRelation = relations(resource, ({ one }) => ({
  material: one(material, {
    fields: [resource.materialId],
    references: [material.id],
  }),
}));
