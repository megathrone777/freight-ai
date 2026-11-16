import { doublePrecision, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { negotiations } from "./negotiations";

const negotiationMessages = pgTable("negotiation_messages", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  details: jsonb("details")
    .notNull()
    .$type<Record<string, boolean | number | string>>()
    .default({}),
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  negotiationId: text("negotiation_id")
    .notNull()
    .references(() => negotiations.id, { onDelete: "cascade" }),
  price: doublePrecision("price").notNull(),
  status: text("status").notNull(),
});

export { negotiationMessages };
