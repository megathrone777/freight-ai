import { tool } from "ai";
import { and, eq, gt, gte, lte, sql } from "drizzle-orm";
import { z } from "zod/v4";

import { db, schema } from "@/db";
import { embeddings, loads } from "@/services";

import { canonicalCityName } from "../utils";

const inputSchema = z.object({
  bbox: z
    .object({
      east: z.number().min(-180).max(180),
      north: z.number().min(-90).max(90),
      south: z.number().min(-90).max(90),
      west: z.number().min(-180).max(180),
    })
    .optional(),
  destination: z.string().optional(),
  maxWeightT: z.number().positive().max(100).optional(),
  origin: z.string().optional(),
  pickupAfter: z.iso.date().optional(),
  pickupBefore: z.iso.date().optional(),
  query: z.string().min(1),
});

const outputSchema = z.object({
  loads: z.array(
    z.object({
      createdAt: z.iso.datetime(),
      description: z.string(),
      destination: z.string(),
      destinationLat: z.number(),
      destinationLon: z.number(),
      expiresAt: z.iso.datetime(),
      id: z.string(),
      origin: z.string(),
      originLat: z.number(),
      originLon: z.number(),
      pickupAt: z.iso.datetime(),
      price: z.number(),
      reason: z.string(),
      similarity: z.number(),
      source: z.string(),
      status: z.enum(["active", "negotiating", "expired"]),
      updatedAt: z.iso.datetime(),
      weightT: z.number(),
    })
  ),
});

type TSearchLoadsInput = z.infer<typeof inputSchema>;
type TSearchLoadsOutput = z.infer<typeof outputSchema>;

const executeSearchLoads = async (
  input: TSearchLoadsInput
): Promise<TSearchLoadsOutput> => {
  const startedAt: number = Date.now();
  const embedding = await embeddings.embed(
    `${input.origin ?? ""} ${input.destination ?? ""} ${input.query}`,
    "query"
  );
  const vectorLiteral: string = `[${embedding.join(",")}]`;
  const origin: string | undefined = canonicalCityName(input.origin);
  const destination: string | undefined = canonicalCityName(input.destination);
  const filters = [eq(schema.loads.status, "active"), gt(schema.loads.expiresAt, new Date())];

  if (input.maxWeightT !== undefined) {
    filters.push(lte(schema.loads.weightT, input.maxWeightT));
  }

  if (origin) {
    filters.push(sql`lower(${schema.loads.origin}) LIKE ${`%${origin.toLowerCase()}%`}`);
  }

  if (destination) {
    filters.push(sql`lower(${schema.loads.destination}) LIKE ${`%${destination.toLowerCase()}%`}`);
  }

  if (input.pickupAfter) {
    filters.push(gte(schema.loads.pickupAt, new Date(`${input.pickupAfter}T00:00:00.000Z`)));
  }

  if (input.pickupBefore) {
    filters.push(lte(schema.loads.pickupAt, new Date(`${input.pickupBefore}T23:59:59.999Z`)));
  }

  if (input.bbox) {
    filters.push(
      gte(schema.loads.originLat, input.bbox.south),
      lte(schema.loads.originLat, input.bbox.north),
      gte(schema.loads.originLon, input.bbox.west),
      lte(schema.loads.originLon, input.bbox.east)
    );
  }

  const candidates = await db
    .select({
      createdAt: schema.loads.createdAt,
      description: schema.loads.description,
      destination: schema.loads.destination,
      destinationLat: schema.loads.destinationLat,
      destinationLon: schema.loads.destinationLon,
      expiresAt: schema.loads.expiresAt,
      id: schema.loads.id,
      origin: schema.loads.origin,
      originLat: schema.loads.originLat,
      originLon: schema.loads.originLon,
      pickupAt: schema.loads.pickupAt,
      price: schema.loads.price,
      similarity: sql<number>`1 - (${schema.loads.embedding} <=> ${vectorLiteral}::vector)`,
      source: schema.loads.source,
      status: schema.loads.status,
      updatedAt: schema.loads.updatedAt,
      weightT: schema.loads.weightT,
    })
    .from(schema.loads)
    .where(and(...filters))
    .orderBy(sql`${schema.loads.embedding} <=> ${vectorLiteral}::vector`)
    .limit(5);

  const output = outputSchema.parse({
    loads: candidates.map((load) => ({
      ...load,
      createdAt: load.createdAt.toISOString(),
      expiresAt: load.expiresAt.toISOString(),
      pickupAt: load.pickupAt.toISOString(),
      reason:
        input.maxWeightT !== undefined
          ? `Fits the ${origin ?? "requested"} route and stays within ${input.maxWeightT} t capacity.`
          : `Strong semantic match for ${origin ?? "the requested"} route.`,
      similarity: +load.similarity,
      updatedAt: load.updatedAt.toISOString(),
    })),
  });

  await loads.ingest.recordTrace("search_loads", input, output, Date.now() - startedAt);

  return output;
};

const searchLoads = tool({
  description:
    "Find active freight that matches the carrier route, weight capacity, pickup date and optional map bounds.",
  execute: executeSearchLoads,
  inputSchema,
  outputSchema,
});

export { executeSearchLoads, searchLoads, type TSearchLoadsInput };
