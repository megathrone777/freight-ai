import { and, eq, gt, gte, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { loads } from "@/lib/db/schema";
import { embed } from "@/lib/embeddings";
import { cities } from "@/lib/loads/cities";
import { haversineKm } from "@/lib/loads/feeds";
import { recordTrace } from "@/lib/loads/ingest";

import {
  CheckRouteInputSchema,
  CheckRouteOutputSchema,
  ProposePriceInputSchema,
  ProposePriceOutputSchema,
  SearchLoadsInputSchema,
  SearchLoadsOutputSchema,
} from "./schemas";

import type { z } from "zod";

const canonicalCityName = (name: string | undefined): string | undefined => {
  if (!name) {
    return undefined;
  }
  const normalized: string = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  return cities.find(
    (city) =>
      city.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalized
  )?.name ?? name;
};

type CheckRouteOutput = z.infer<typeof CheckRouteOutputSchema>;
type ProposePriceOutput = z.infer<typeof ProposePriceOutputSchema>;
type SearchLoadsInput = z.infer<typeof SearchLoadsInputSchema>;
type SearchLoadsOutput = z.infer<typeof SearchLoadsOutputSchema>;

const tools = {
  check_route: {
    description: "Check whether a requested route is in the Czech carrier coverage area and estimate distance.",
    execute: async (input: { destination: string; origin: string }): Promise<CheckRouteOutput> => {
      const startedAt: number = Date.now();
      const origin = cities.find((city) => city.name.toLowerCase() === input.origin.toLowerCase());
      const destination = cities.find((city) => city.name.toLowerCase() === input.destination.toLowerCase());
      const output = CheckRouteOutputSchema.parse({
        distanceKm: origin && destination ? Math.round(haversineKm(origin, destination)) : null,
        found: Boolean(origin && destination),
        message: origin && destination
          ? `Route available: ${origin.name} to ${destination.name}.`
          : "One or both locations are outside the recognized Czech city list.",
      });

      await recordTrace("check_route", input, output, Date.now() - startedAt);

      return output;
    },
    inputSchema: CheckRouteInputSchema,
    outputSchema: CheckRouteOutputSchema,
  },
  propose_price: {
    description: "Calculate a carrier counter-price; negotiation is limited to ten percent above or below the listing.",
    execute: async (input: { loadId: string; targetPrice: number }): Promise<ProposePriceOutput> => {
      const startedAt: number = Date.now();
      const [load] = await db.select({ id: loads.id, price: loads.price }).from(loads).where(eq(loads.id, input.loadId)).limit(1);

      if (!load) {
        throw new Error(`Load ${input.loadId} was not found.`);
      }
      const minimum: number = +(load.price * 0.9).toFixed(2);
      const maximum: number = +(load.price * 1.1).toFixed(2);
      const output = ProposePriceOutputSchema.parse({
        accepted: input.targetPrice >= minimum && input.targetPrice <= maximum,
        allowedRange: { maximum, minimum },
        loadId: load.id,
        proposedPrice: Math.min(maximum, Math.max(minimum, input.targetPrice)),
      });

      await recordTrace("propose_price", input, output, Date.now() - startedAt);

      return output;
    },
    inputSchema: ProposePriceInputSchema,
    outputSchema: ProposePriceOutputSchema,
  },
  search_loads: {
    description: "Find active freight that matches the carrier route, weight capacity, pickup date and optional map bounds.",
    execute: async (input: SearchLoadsInput): Promise<SearchLoadsOutput> => {
      const startedAt: number = Date.now();
      const embedding = await embed(`${input.origin ?? ""} ${input.destination ?? ""} ${input.query}`, "query");
      const vectorLiteral: string = `[${embedding.join(",")}]`;
      const origin: string | undefined = canonicalCityName(input.origin);
      const destination: string | undefined = canonicalCityName(input.destination);
      const filters = [eq(loads.status, "active"), gt(loads.expiresAt, new Date())];

      if (input.maxWeightT !== undefined) {
        filters.push(lte(loads.weightT, input.maxWeightT));
      }
      if (origin) {
        filters.push(sql`lower(${loads.origin}) LIKE ${`%${origin.toLowerCase()}%`}`);
      }
      if (destination) {
        filters.push(sql`lower(${loads.destination}) LIKE ${`%${destination.toLowerCase()}%`}`);
      }
      if (input.pickupAfter) {
        filters.push(gte(loads.pickupAt, new Date(`${input.pickupAfter}T00:00:00.000Z`)));
      }
      if (input.pickupBefore) {
        filters.push(lte(loads.pickupAt, new Date(`${input.pickupBefore}T23:59:59.999Z`)));
      }
      if (input.bbox) {
        filters.push(
          gte(loads.originLat, input.bbox.south),
          lte(loads.originLat, input.bbox.north),
          gte(loads.originLon, input.bbox.west),
          lte(loads.originLon, input.bbox.east)
        );
      }
      const candidates = await db.select({
        createdAt: loads.createdAt,
        description: loads.description,
        destination: loads.destination,
        destinationLat: loads.destinationLat,
        destinationLon: loads.destinationLon,
        expiresAt: loads.expiresAt,
        id: loads.id,
        origin: loads.origin,
        originLat: loads.originLat,
        originLon: loads.originLon,
        pickupAt: loads.pickupAt,
        price: loads.price,
        similarity: sql<number>`1 - (${loads.embedding} <=> ${vectorLiteral}::vector)`,
        source: loads.source,
        status: loads.status,
        updatedAt: loads.updatedAt,
        weightT: loads.weightT,
      }).from(loads).where(and(...filters))
        .orderBy(sql`${loads.embedding} <=> ${vectorLiteral}::vector`).limit(5);
      const output = SearchLoadsOutputSchema.parse({
        loads: candidates.map((load) => ({
          ...load,
          createdAt: load.createdAt.toISOString(),
          expiresAt: load.expiresAt.toISOString(),
          pickupAt: load.pickupAt.toISOString(),
          reason: input.maxWeightT !== undefined
            ? `Fits the ${origin ?? "requested"} route and stays within ${input.maxWeightT} t capacity.`
            : `Strong semantic match for ${origin ?? "the requested"} route.`,
          similarity: +load.similarity,
          updatedAt: load.updatedAt.toISOString(),
        })),
      });

      await recordTrace("search_loads", input, output, Date.now() - startedAt);

      return output;
    },
    inputSchema: SearchLoadsInputSchema,
    outputSchema: SearchLoadsOutputSchema,
  },
};

export { tools };
