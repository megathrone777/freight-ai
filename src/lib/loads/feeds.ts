import { randomUUID } from "node:crypto";

import { z } from "zod";

import { cities, type City } from "./cities";
import { LoadSchema, type NormalizedLoad } from "./schema";

type RawSource = "CargoHub" | "RoadLink" | "TransBoard";
type Random = () => number;

const sources: RawSource[] = ["TransBoard", "CargoHub", "RoadLink"];
const cargoTypes: string[] = ["pallets", "steel coils", "food", "building materials", "machinery", "parcels"];
const descriptions: string[] = [
  "Full truckload of {cargo}, ready for pickup.",
  "Transport {cargo} from {origin} to {destination}; loading assistance available.",
  "A reliable carrier needed for {cargo}. Flexible loading window.",
  "{cargo} shipment, secured and prepared for road transport.",
];
const requirements: string[] = ["", " Tail lift required.", " ADR certified vehicle required.", " Refrigerated trailer required."];
const duplicatePhrases: string[] = ["Available freight: ", "Urgent carrier request: ", "Matching shipment: "];
const weightedCities: City[] = [...cities, ...cities.slice(0, 4), ...cities.slice(0, 4)];

const seededRandom = (seed: number): Random => {
  let state: number = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 4294967296;
  };
};

const choice = <T>(random: Random, items: readonly T[]): T => {
  const result: T | undefined = items[Math.floor(random() * items.length)];

  if (result === undefined) {
    throw new Error("Cannot choose from an empty collection.");
  }

  return result;
};

const makeDescription = (random: Random, origin: City, destination: City): string => {
  const text: string = choice(random, descriptions)
    .replace("{cargo}", choice(random, cargoTypes))
    .replace("{origin}", origin.name)
    .replace("{destination}", destination.name);

  return `${text}${random() < 0.25 ? choice(random, requirements.slice(1)) : ""}`;
};

const makeBaseLoad = (random: Random, source: RawSource, id: string, expired: boolean): NormalizedLoad => {
  const origin: City = choice(random, weightedCities);
  let destination: City = choice(random, weightedCities);

  while (destination.name === origin.name) {
    destination = choice(random, weightedCities);
  }
  const weightT: number = +((1 + random() * 23).toFixed(1));
  const distance: number = haversineKm(origin, destination);
  const pickupAt: Date = new Date(Date.now() + (1 + Math.floor(random() * 7)) * 86400000);
  const expiresAt: Date = new Date(Date.now() + (expired ? -1 : 1) * (3600000 + random() * 47 * 3600000));

  return LoadSchema.parse({
    description: makeDescription(random, origin, destination),
    destination: destination.name,
    destinationLat: destination.lat,
    destinationLon: destination.lon,
    expiresAt,
    id,
    origin: origin.name,
    originLat: origin.lat,
    originLon: origin.lon,
    pickupAt,
    price: Math.max(0.01, +(distance * (1.1 + random() * 0.7) * (0.9 + random() * 0.2)).toFixed(2)),
    source,
    status: expired ? "expired" : "active",
    weightT,
  });
};

const haversineKm = (from: City, to: City): number => {
  const radians: (degrees: number) => number = (degrees) => degrees * Math.PI / 180;
  const latitudeDifference: number = radians(to.lat - from.lat);
  const longitudeDifference: number = radians(to.lon - from.lon);
  const value: number = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDifference / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const toRaw = (load: NormalizedLoad, source: RawSource): unknown => {
  const date: string = load.pickupAt.toISOString();

  if (source === "TransBoard") {
    return {
      destination: { latitude: load.destinationLat, longitude: load.destinationLon, title: load.destination },
      expires: load.expiresAt.toISOString(),
      id: load.id,
      origin: { latitude: load.originLat, longitude: load.originLon, title: load.origin },
      pickup: date.slice(0, 10),
      price: `${load.price.toLocaleString("en-US", { maximumFractionDigits: 2 }).replace(",", " ")} EUR`,
      requirements: load.description,
      weight_t: load.weightT,
    };
  }
  if (source === "CargoHub") {
    return {
      cargoDetails: load.description,
      delivery: { city: load.destination, lat: load.destinationLat, lng: load.destinationLon },
      key: load.id,
      loadWeightKg: Math.round(load.weightT * 1000),
      offerEur: load.price,
      pickupPoint: { city: load.origin, lat: load.originLat, lng: load.originLon },
      publishedUntil: load.expiresAt.getTime(),
      startDate: `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`,
    };
  }

  return {
    cargo: load.description,
    destinationCity: load.destination,
    destinationPoint: [load.destinationLon, load.destinationLat],
    expiresAt: load.expiresAt.getTime(),
    loadId: load.id,
    pickupCity: load.origin,
    pickupDate: date.slice(0, 10),
    pickupPoint: [load.originLon, load.originLat],
    rate: load.price,
    tonnes: load.weightT,
  };
};

const normalize = (raw: unknown, source: RawSource): NormalizedLoad => {
  if (source === "TransBoard") {
    const input = z.object({
      destination: z.object({ latitude: z.number(), longitude: z.number(), title: z.string() }),
      expires: z.string(),
      id: z.string(),
      origin: z.object({ latitude: z.number(), longitude: z.number(), title: z.string() }),
      pickup: z.string(),
      price: z.string(),
      requirements: z.string(),
      weight_t: z.number(),
    }).parse(raw);

    return LoadSchema.parse({
      description: input.requirements, destination: input.destination.title, destinationLat: input.destination.latitude,
      destinationLon: input.destination.longitude, expiresAt: input.expires, id: input.id, origin: input.origin.title,
      originLat: input.origin.latitude, originLon: input.origin.longitude, pickupAt: input.pickup,
      price: +input.price.replace(/[^\d.]/gu, ""), source, status: "active", weightT: input.weight_t,
    });
  }
  if (source === "CargoHub") {
    const input = z.object({
      cargoDetails: z.string(),
      delivery: z.object({ city: z.string(), lat: z.number(), lng: z.number() }),
      key: z.string(),
      loadWeightKg: z.number(),
      offerEur: z.number(),
      pickupPoint: z.object({ city: z.string(), lat: z.number(), lng: z.number() }),
      publishedUntil: z.number(),
      startDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/u),
    }).parse(raw);
    const [day, month, year] = input.startDate.split(".");

    return LoadSchema.parse({
      description: input.cargoDetails, destination: input.delivery.city, destinationLat: input.delivery.lat,
      destinationLon: input.delivery.lng, expiresAt: new Date(input.publishedUntil), id: input.key,
      origin: input.pickupPoint.city, originLat: input.pickupPoint.lat, originLon: input.pickupPoint.lng,
      pickupAt: new Date(`${year}-${month}-${day}T08:00:00Z`), price: input.offerEur, source, status: "active",
      weightT: input.loadWeightKg / 1000,
    });
  }
  const input = z.object({
    cargo: z.string(),
    destinationCity: z.string(),
    destinationPoint: z.tuple([z.number(), z.number()]),
    expiresAt: z.number(),
    loadId: z.string(),
    pickupCity: z.string(),
    pickupDate: z.string().date(),
    pickupPoint: z.tuple([z.number(), z.number()]),
    rate: z.number(),
    tonnes: z.number(),
  }).parse(raw);

  return LoadSchema.parse({
    description: input.cargo, destination: input.destinationCity, destinationLat: input.destinationPoint[1],
    destinationLon: input.destinationPoint[0], expiresAt: new Date(input.expiresAt), id: input.loadId, origin: input.pickupCity,
    originLat: input.pickupPoint[1], originLon: input.pickupPoint[0], pickupAt: input.pickupDate,
    price: input.rate, source, status: "active", weightT: input.tonnes,
  });
};

const generateFeedLoad = (random: Random, source: RawSource, expired = false, id: string = randomUUID()): NormalizedLoad => {
  const base: NormalizedLoad = makeBaseLoad(random, source, id, expired);

  return normalize(toRaw(base, source), source);
};

const generateSeedLoads = (limit = 2000, seed = 19940217): NormalizedLoad[] => {
  const random: Random = seededRandom(seed);
  const loads: NormalizedLoad[] = [];
  const uniqueCount: number = Math.max(1, Math.round(limit * 0.92));

  for (let index: number = 0; index < uniqueCount; index += 1) {
    const source: RawSource = choice(random, sources);

    loads.push(generateFeedLoad(random, source, random() < 0.05, `seed-${`${index}`.padStart(4, "0")}`));
  }
  for (let index: number = uniqueCount; index < limit; index += 1) {
    const original: NormalizedLoad | undefined = loads[Math.floor(random() * uniqueCount)];

    if (!original) {
      throw new Error("Seed duplicate could not be generated.");
    }
    const duplicateSource: RawSource = sources[(sources.indexOf(original.source as RawSource) + 1) % sources.length] ?? sources[0]!;
    const variation: number = 0.97 + random() * 0.06;
    const base: NormalizedLoad = {
      ...original,
      description: `${choice(random, duplicatePhrases)}${original.description}`,
      id: `seed-duplicate-${`${index}`.padStart(4, "0")}`,
      price: +(original.price * variation).toFixed(2),
      source: duplicateSource,
    };

    loads.push(normalize(toRaw(base, duplicateSource), duplicateSource));
  }

  return loads;
};

const generateIncomingLoads = (count: number): NormalizedLoad[] => {
  const random: Random = seededRandom(Date.now());

  return Array.from({ length: count }, () => generateFeedLoad(random, choice(random, sources)));
};

export { generateFeedLoad, generateIncomingLoads, generateSeedLoads, haversineKm, normalize, seededRandom, sources };
export type { RawSource };
