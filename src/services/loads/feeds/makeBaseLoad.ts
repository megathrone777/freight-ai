import { cities } from "@/globals";

import { schema } from "../schema";

import { haversineKm } from "./haversineKm";
import { makeChoice } from "./makeChoice";

const cargoTypes: string[] = [
  "pallets",
  "steel coils",
  "food",
  "building materials",
  "machinery",
  "parcels",
];

const descriptions: string[] = [
  "Full truckload of {cargo}, ready for pickup.",
  "Transport {cargo} from {origin} to {destination}; loading assistance available.",
  "A reliable carrier needed for {cargo}. Flexible loading window.",
  "{cargo} shipment, secured and prepared for road transport.",
];

const requirements: string[] = [
  "",
  " Tail lift required.",
  " ADR certified vehicle required.",
  " Refrigerated trailer required.",
];

const weightedCities: TCity[] = [...cities, ...cities.slice(0, 4), ...cities.slice(0, 4)];

const makeDescription = (random: TRandom, origin: TCity, destination: TCity): string => {
  const text: string = makeChoice(random, descriptions)
    .replace("{cargo}", makeChoice(random, cargoTypes))
    .replace("{origin}", origin.name)
    .replace("{destination}", destination.name);

  return `${text}${random() < 0.25 ? makeChoice(random, requirements.slice(1)) : ""}`;
};

const makeBaseLoad = (random: TRandom, source: TRawSource, id: string): TNormalizedLoad => {
  const origin: TCity = makeChoice(random, weightedCities);
  let destination: TCity = makeChoice(random, weightedCities);

  while (destination.name === origin.name) {
    destination = makeChoice(random, weightedCities);
  }
  const weightT: number = +(1 + random() * 23).toFixed(1);
  const distance: number = haversineKm(origin, destination);
  const pickupAt: Date = new Date(Date.now() + (1 + Math.floor(random() * 7)) * 86400000);
  const expiresAt: Date = new Date();

  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);

  return schema.parse({
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
    status: "active",
    weightT,
  });
};

export { makeBaseLoad };
