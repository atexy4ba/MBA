import {
  mysqlTable,
  varchar,
  int,
  text,
  decimal,
  timestamp,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { variants, products } from './products';

export const orderStatusEnum = mysqlEnum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);

export const orders = mysqlTable('orders', {
  id: int().autoincrement().primaryKey(),
  customerName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }).notNull(),
  address: varchar({ length: 500 }).notNull(),
  city: varchar({ length: 255 }).notNull(),
  zip: varchar({ length: 20 }).notNull(),
  country: varchar({ length: 255 }).notNull().default('Algérie'),
  notes: text(),
  status: orderStatusEnum.notNull().default('pending'),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable('order_items', {
  id: int().autoincrement().primaryKey(),
  orderId: int().notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variantId: int().notNull().references(() => variants.id, { onDelete: 'restrict' }),
  productId: int().notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: int().notNull().default(1),
  unitPrice: decimal({ precision: 10, scale: 2 }).notNull(),
});

export const orderStatusHistory = mysqlTable('order_status_history', {
  id: int().autoincrement().primaryKey(),
  orderId: int().notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: orderStatusEnum.notNull(),
  note: text(),
  changedBy: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(variants, {
    fields: [orderItems.variantId],
    references: [variants.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));
