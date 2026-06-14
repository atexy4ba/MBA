import { mysqlTable, varchar, int, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: int().autoincrement().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'customer']).notNull().default('admin'),
  createdAt: timestamp().notNull().defaultNow(),
});

export const refreshTokens = mysqlTable('refresh_tokens', {
  id: int().autoincrement().primaryKey(),
  userId: int().notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar({ length: 500 }).notNull().unique(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
