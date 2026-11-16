import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const domainEvents = pgTable("domain_events", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
});

export { domainEvents };
