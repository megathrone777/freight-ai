import { type z } from "zod";

import type { schema } from "@/services/loads/schema";

declare global {
  interface TCity {
    lat: number;
    lon: number;
    name: string;
  }

  type TRawSource = "CargoHub" | "RoadLink" | "TransBoard";
  type TRandom = () => number;

  interface TLoadRecord {
    createdAt: string;
    description: string;
    destination: string;
    destinationLat: number;
    destinationLon: number;
    expiresAt: string;
    id: string;
    origin: string;
    originLat: number;
    originLon: number;
    pickupAt: string;
    price: number;
    source: string;
    status: "active" | "expired" | "negotiating";
    updatedAt: string;
    weightT: number;
  }

  interface TIngestSummary {
    expired: number;
    inserted: number;
    merged: number;
    perSource: Record<string, number>;
  }

  type TNormalizedLoad = z.infer<typeof schema>;
}

export {};
