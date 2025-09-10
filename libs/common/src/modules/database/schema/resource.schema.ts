import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { material } from '@app/common/modules/database/schema/material.schema';
import { resourceTypeEnum } from '@app/common/modules/database/schema/enums.schema';
import { timestamps } from '@app/common/modules/database/schema/timestamps';
import { TABLES } from '../tables.constants';

export const resource = pgTable(TABLES.RESOURCE, {
  materialId: uuid('materialId')
    .primaryKey()
    .references(() => material.id, {
      onDelete: 'cascade',
    }),

  resourceAddress: text('resourceAddress').notNull(),
  resourceType: resourceTypeEnum('resourceType'),
  fileKey: text('fileKey'),
  metaData: text('metaData').array(),

  ...timestamps,
});

export const resourceRelation = relations(resource, ({ one }) => ({
  material: one(material, {
    fields: [resource.materialId],
    references: [material.id],
  }),
}));
