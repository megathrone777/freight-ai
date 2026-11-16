import { z } from "zod";

export const offerEventSchema = z.object({
  expiresAt: z.iso.datetime(),
  loadId: z.string().min(1),
  negotiationId: z.string().min(1),
  price: z.number().positive(),
});

export const decisionEventSchema = z.object({
  decision: z.enum(["accept", "reject"]),
  negotiationId: z.string().min(1),
});

export const workflowStepEventSchema = z.object({
  negotiationId: z.string().min(1),
  step: z.enum(["counter_offer", "accept", "reject", "expired"]),
});
