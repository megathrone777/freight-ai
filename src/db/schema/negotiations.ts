import { doublePrecision, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { loads } from "./loads";

const negotiationStatus = pgEnum("negotiation_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
]);

const negotiations = pgTable("negotiations", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  currentPrice: doublePrecision("current_price").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  id: text("id").primaryKey(),
  initialPrice: doublePrecision("initial_price").notNull(),
  loadId: text("load_id")
    .notNull()
    .references(() => loads.id, { onDelete: "cascade" }),
  status: negotiationStatus("status").notNull().default("pending"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export { negotiations };
