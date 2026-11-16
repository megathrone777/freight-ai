import { jsonb, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

const traces = pgTable("traces", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  id: text("id").primaryKey(),
  input: jsonb("input").notNull().$type<Record<string, unknown>>().default({}),
  latencyMs: integer("latency_ms").notNull(),
  name: text("name").notNull(),
  output: jsonb("output").notNull().$type<Record<string, unknown>>().default({}),
});

export { traces };
