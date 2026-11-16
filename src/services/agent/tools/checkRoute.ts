import { tool } from "ai";
import { z } from "zod/v4";

import { cities } from "@/globals";
import { loads } from "@/services";

const inputSchema = z.object({
  destination: z.string().min(1),
  origin: z.string().min(1),
});

const outputSchema = z.object({
  distanceKm: z.number().nullable(),
  found: z.boolean(),
  message: z.string(),
});

const checkRoute = tool({
  description:
    "Check whether a requested route is in the Czech carrier coverage area and estimate distance.",

  execute: async (input: {
    destination: string;
    origin: string;
  }): Promise<z.infer<typeof outputSchema>> => {
    const startedAt: number = Date.now();
    const origin = cities.find((city) => city.name.toLowerCase() === input.origin.toLowerCase());
    const destination = cities.find(
      (city) => city.name.toLowerCase() === input.destination.toLowerCase()
    );
    const output = outputSchema.parse({
      distanceKm:
        origin && destination ? Math.round(loads.feeds.haversineKm(origin, destination)) : null,
      found: Boolean(origin && destination),
      message:
        origin && destination
          ? `Route available: ${origin.name} to ${destination.name}.`
          : "One or both locations are outside the recognized Czech city list.",
    });

    await loads.ingest.recordTrace("check_route", input, output, Date.now() - startedAt);

    return output;
  },

  inputSchema,
  outputSchema,
});

export { checkRoute };
