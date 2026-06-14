import { mysqlTable, varchar, int, boolean } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const categories = mysqlTable('categories', {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  parentId: int().references((): any => categories.id, { onDelete: 'set null' }),
  imageUrl: varchar({ length: 500 }),
  sortOrder: int().notNull().default(0),
  isActive: boolean().notNull().default(true),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categoryParent',
  }),
  children: many(categories, {
    relationName: 'categoryParent',
  }),
}));
