import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  mysqlEnum,
  json,
} from 'drizzle-orm/mysql-core';

export const storeSettings = mysqlTable('store_settings', {
  id: int().autoincrement().primaryKey(),
  key: varchar({ length: 255 }).notNull().unique(),
  value: text().notNull(),
  updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
});

export const orderFormFields = mysqlTable('order_form_fields', {
  id: int().autoincrement().primaryKey(),
  label: varchar({ length: 255 }).notNull(),
  fieldType: mysqlEnum('fieldType', ['text', 'email', 'phone', 'textarea', 'dropdown', 'checkbox']).notNull(),
  required: boolean().notNull().default(true),
  sortOrder: int().notNull().default(0),
  options: json().$type<string[]>(),
  isActive: boolean().notNull().default(true),
});
