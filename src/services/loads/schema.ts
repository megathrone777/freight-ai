import { z } from "zod";

const schema = z.object({
  description: z.string().min(1),
  destination: z.string().min(1),
  destinationLat: z.number().min(-90).max(90),
  destinationLon: z.number().min(-180).max(180),
  expiresAt: z.coerce.date(),
  id: z.string().min(1),
  origin: z.string().min(1),
  originLat: z.number().min(-90).max(90),
  originLon: z.number().min(-180).max(180),
  pickupAt: z.coerce.date(),
  price: z.number().positive(),
  source: z.enum(["TransBoard", "CargoHub", "RoadLink"]),
  status: z.enum(["active", "negotiating", "expired"]),
  weightT: z.number().positive().max(100),
});

export { schema };
