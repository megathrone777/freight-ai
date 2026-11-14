import { sql } from "drizzle-orm";
import { customType, doublePrecision, index, jsonb, pgEnum, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector(1024)",
  fromDriver: (value) => value.slice(1, -1).split(",").map(Number),
  toDriver: (value) => `[${value.join(",")}]`,
});

const loadStatus = pgEnum("load_status", ["active", "negotiating", "expired"]);
const negotiationStatus = pgEnum("negotiation_status", ["pending", "accepted", "rejected", "expired"]);

const loads = pgTable("loads", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  description: text("description").notNull(),
  destination: text("destination").notNull(),
  destinationLat: doublePrecision("destination_lat").notNull(),
  destinationLon: doublePrecision("destination_lon").notNull(),
  embedding: vector("embedding").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  id: text("id").primaryKey(),
  origin: text("origin").notNull(),
  originLat: doublePrecision("origin_lat").notNull(),
  originLon: doublePrecision("origin_lon").notNull(),
  pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
  price: doublePrecision("price").notNull(),
  source: text("source").notNull(),
  status: loadStatus("status").notNull().default("active"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  weightT: doublePrecision("weight_t").notNull(),
}, (table) => [
  index("loads_embedding_hnsw_idx").using("hnsw", sql`${table.embedding} vector_cosine_ops`),
  index("loads_status_idx").on(table.status),
  index("loads_expires_at_idx").on(table.expiresAt),
  index("loads_updated_at_idx").on(table.updatedAt),
  index("loads_route_date_idx").on(table.origin, table.destination, table.pickupAt),
]);

const negotiations = pgTable("negotiations", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  currentPrice: doublePrecision("current_price").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  id: text("id").primaryKey(),
  initialPrice: doublePrecision("initial_price").notNull(),
  loadId: text("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
  status: negotiationStatus("status").notNull().default("pending"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const negotiationMessages = pgTable("negotiation_messages", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  details: jsonb("details").notNull().$type<Record<string, boolean | number | string>>().default({}),
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  negotiationId: text("negotiation_id").notNull().references(() => negotiations.id, { onDelete: "cascade" }),
  price: doublePrecision("price").notNull(),
  status: text("status").notNull(),
});

const traces = pgTable("traces", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  id: text("id").primaryKey(),
  input: jsonb("input").notNull().$type<Record<string, unknown>>().default({}),
  latencyMs: integer("latency_ms").notNull(),
  name: text("name").notNull(),
  output: jsonb("output").notNull().$type<Record<string, unknown>>().default({}),
});

const domainEvents = pgTable("domain_events", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
});

export { domainEvents, loads, negotiationMessages, negotiations, traces };
