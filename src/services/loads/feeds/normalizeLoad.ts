import { z } from "zod";

import { schema } from "../schema";

const normalizeLoad = (raw: unknown, source: TRawSource): TNormalizedLoad => {
  if (source === "TransBoard") {
    const input = z
      .object({
        destination: z.object({ latitude: z.number(), longitude: z.number(), title: z.string() }),
        expires: z.string(),
        id: z.string(),
        origin: z.object({ latitude: z.number(), longitude: z.number(), title: z.string() }),
        pickup: z.string(),
        price: z.string(),
        requirements: z.string(),
        weight_t: z.number(),
      })
      .parse(raw);

    return schema.parse({
      description: input.requirements,
      destination: input.destination.title,
      destinationLat: input.destination.latitude,
      destinationLon: input.destination.longitude,
      expiresAt: input.expires,
      id: input.id,
      origin: input.origin.title,
      originLat: input.origin.latitude,
      originLon: input.origin.longitude,
      pickupAt: input.pickup,
      price: +input.price.replace(/[^\d.]/gu, ""),
      source,
      status: "active",
      weightT: input.weight_t,
    });
  }

  if (source === "CargoHub") {
    const input = z
      .object({
        cargoDetails: z.string(),
        delivery: z.object({ city: z.string(), lat: z.number(), lng: z.number() }),
        key: z.string(),
        loadWeightKg: z.number(),
        offerEur: z.number(),
        pickupPoint: z.object({ city: z.string(), lat: z.number(), lng: z.number() }),
        publishedUntil: z.number(),
        startDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/u),
      })
      .parse(raw);
    const [day, month, year] = input.startDate.split(".");

    return schema.parse({
      description: input.cargoDetails,
      destination: input.delivery.city,
      destinationLat: input.delivery.lat,
      destinationLon: input.delivery.lng,
      expiresAt: new Date(input.publishedUntil),
      id: input.key,
      origin: input.pickupPoint.city,
      originLat: input.pickupPoint.lat,
      originLon: input.pickupPoint.lng,
      pickupAt: new Date(`${year}-${month}-${day}T08:00:00Z`),
      price: input.offerEur,
      source,
      status: "active",
      weightT: input.loadWeightKg / 1000,
    });
  }

  const input = z
    .object({
      cargo: z.string(),
      destinationCity: z.string(),
      destinationPoint: z.tuple([z.number(), z.number()]),
      expiresAt: z.number(),
      loadId: z.string(),
      pickupCity: z.string(),
      pickupDate: z.iso.date(),
      pickupPoint: z.tuple([z.number(), z.number()]),
      rate: z.number(),
      tonnes: z.number(),
    })
    .parse(raw);

  return schema.parse({
    description: input.cargo,
    destination: input.destinationCity,
    destinationLat: input.destinationPoint[1],
    destinationLon: input.destinationPoint[0],
    expiresAt: new Date(input.expiresAt),
    id: input.loadId,
    origin: input.pickupCity,
    originLat: input.pickupPoint[1],
    originLon: input.pickupPoint[0],
    pickupAt: input.pickupDate,
    price: input.rate,
    source,
    status: "active",
    weightT: input.tonnes,
  });
};

export { normalizeLoad };
