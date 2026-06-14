import { mysqlTable, varchar, int, text, timestamp } from 'drizzle-orm/mysql-core';

export const analyticsEvents = mysqlTable('analytics_events', {
  id: int().autoincrement().primaryKey(),
  eventType: varchar({ length: 100 }).notNull(),
  userId: int(),
  sessionId: varchar({ length: 255 }),
  productId: int(),
  pageUrl: varchar({ length: 500 }),
  referrer: varchar({ length: 500 }),
  ip: varchar({ length: 45 }),
  userAgent: text(),
  metadata: text(),
  createdAt: timestamp().notNull().defaultNow(),
});
