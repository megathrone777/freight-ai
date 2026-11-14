import { z } from "zod";

const SearchLoadsInputSchema = z.object({
  bbox: z.object({
    east: z.number().min(-180).max(180),
    north: z.number().min(-90).max(90),
    south: z.number().min(-90).max(90),
    west: z.number().min(-180).max(180),
  }).optional(),
  destination: z.string().optional(),
  maxWeightT: z.number().positive().max(100).optional(),
  origin: z.string().optional(),
  pickupAfter: z.string().date().optional(),
  pickupBefore: z.string().date().optional(),
  query: z.string().min(1),
});

const MatchedLoadSchema = z.object({
  createdAt: z.string().datetime(),
  description: z.string(),
  destination: z.string(),
  destinationLat: z.number(),
  destinationLon: z.number(),
  expiresAt: z.string().datetime(),
  id: z.string(),
  origin: z.string(),
  originLat: z.number(),
  originLon: z.number(),
  pickupAt: z.string().datetime(),
  price: z.number(),
  reason: z.string(),
  similarity: z.number(),
  source: z.string(),
  status: z.enum(["active", "negotiating", "expired"]),
  updatedAt: z.string().datetime(),
  weightT: z.number(),
});

const SearchLoadsOutputSchema = z.object({ loads: z.array(MatchedLoadSchema) });
const CheckRouteInputSchema = z.object({ destination: z.string().min(1), origin: z.string().min(1) });
const CheckRouteOutputSchema = z.object({
  distanceKm: z.number().nullable(),
  found: z.boolean(),
  message: z.string(),
});
const ProposePriceInputSchema = z.object({
  loadId: z.string().min(1),
  targetPrice: z.number().positive(),
});
const ProposePriceOutputSchema = z.object({
  accepted: z.boolean(),
  allowedRange: z.object({ maximum: z.number(), minimum: z.number() }),
  loadId: z.string(),
  proposedPrice: z.number(),
});

export {
  CheckRouteInputSchema,
  CheckRouteOutputSchema,
  MatchedLoadSchema,
  ProposePriceInputSchema,
  ProposePriceOutputSchema,
  SearchLoadsInputSchema,
  SearchLoadsOutputSchema,
};
