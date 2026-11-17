import { z } from "zod";

const negotiationSnapshotSchema = z.object({
  messages: z.array(
    z.object({
      createdAt: z.string(),
      id: z.string(),
      kind: z.string(),
      price: z.number(),
      status: z.string(),
    })
  ),
  negotiation: z
    .object({
      currentPrice: z.number(),
      expiresAt: z.string(),
      id: z.string(),
      initialPrice: z.number(),
      status: z.enum(["pending", "accepted", "rejected", "expired"]),
    })
    .nullable(),
});

export type TNegotiationSnapshot = z.infer<typeof negotiationSnapshotSchema>;
export { negotiationSnapshotSchema };
