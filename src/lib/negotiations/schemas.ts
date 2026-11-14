import { z } from "zod";

const OfferEventSchema = z.object({
  expiresAt: z.string().datetime(),
  loadId: z.string().min(1),
  negotiationId: z.string().min(1),
  price: z.number().positive(),
});
const DecisionEventSchema = z.object({
  decision: z.enum(["accept", "reject"]),
  negotiationId: z.string().min(1),
});
const WorkflowStepEventSchema = z.object({
  negotiationId: z.string().min(1),
  step: z.enum(["counter_offer", "accept", "reject", "expired"]),
});

export { DecisionEventSchema, OfferEventSchema, WorkflowStepEventSchema };
