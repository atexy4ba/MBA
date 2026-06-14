import {
  mysqlTable,
  varchar,
  int,
  text,
  decimal,
  json,
  boolean,
  timestamp,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';

export const products = mysqlTable('products', {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  description: text().notNull(),
  categoryId: int().notNull().references(() => categories.id, { onDelete: 'restrict' }),
  isQuantityPricing: boolean().notNull().default(false),
  metadata: json().$type<Record<string, unknown>>(),
  status: mysqlEnum('status', ['active', 'archived']).notNull().default('active'),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
});

export const variants = mysqlTable('variants', {
  id: int().autoincrement().primaryKey(),
  productId: int().notNull().references(() => products.id, { onDelete: 'cascade' }),
  color: varchar({ length: 100 }).notNull(),
  size: varchar({ length: 50 }).notNull(),
  price: decimal({ precision: 10, scale: 2 }).notNull(),
  stock: int().notNull().default(0),
  sku: varchar({ length: 100 }).notNull(),
  imageUrl: varchar({ length: 500 }),
});

export const pricingTiers = mysqlTable('pricing_tiers', {
  id: int().autoincrement().primaryKey(),
  productId: int().notNull().references(() => products.id, { onDelete: 'cascade' }),
  minQuantity: int().notNull(),
  price: decimal({ precision: 10, scale: 2 }).notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(variants),
  pricingTiers: many(pricingTiers),
}));

export const variantsRelations = relations(variants, ({ one }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
}));

export const pricingTiersRelations = relations(pricingTiers, ({ one }) => ({
  product: one(products, {
    fields: [pricingTiers.productId],
    references: [products.id],
  }),
}));
