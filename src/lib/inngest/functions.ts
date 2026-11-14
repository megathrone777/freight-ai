import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { loads, negotiationMessages, negotiations } from "@/lib/db/schema";
import { emitEvent } from "@/lib/events";
import { expireLoads } from "@/lib/loads/ingest";
import { DecisionEventSchema, OfferEventSchema, WorkflowStepEventSchema } from "@/lib/negotiations/schemas";

import { inngest } from "./client";

const negotiationWorkflow = inngest.createFunction(
  { id: "freight-negotiation-workflow", retries: 5, triggers: { event: "freight/negotiation.offer" } },
  async ({ event, step }) => {
    const offer = OfferEventSchema.parse(event.data);

    await step.run("record-counter-offer", async (): Promise<void> => {
      const [negotiation] = await db.select().from(negotiations)
        .where(eq(negotiations.id, offer.negotiationId)).limit(1);

      if (!negotiation) {
        throw new Error(`Negotiation ${offer.negotiationId} was not found.`);
      }
      const [load] = await db.select({ price: loads.price }).from(loads).where(eq(loads.id, offer.loadId)).limit(1);

      if (!load) {
        throw new Error(`Load ${offer.loadId} was not found.`);
      }
      const counterPrice: number = +load.price.toFixed(2);
      const payload = WorkflowStepEventSchema.parse({ negotiationId: offer.negotiationId, step: "counter_offer" });

      await db.transaction(async (transaction) => {
        await transaction.update(negotiations).set({ currentPrice: counterPrice, updatedAt: new Date() })
          .where(eq(negotiations.id, offer.negotiationId));
        await transaction.insert(negotiationMessages).values({
          createdAt: new Date(),
          details: {},
          id: `${offer.negotiationId}:counter`,
          kind: "CounterOffer",
          negotiationId: offer.negotiationId,
          price: counterPrice,
          status: "pending",
        }).onConflictDoNothing();
      });
      await emitEvent("CounterOffer", { ...payload, price: counterPrice }, `${offer.negotiationId}:counter`);
      await inngest.send({
        data: { ...payload, price: counterPrice },
        id: `${offer.negotiationId}:counter`,
        name: "freight/negotiation.counter-offer",
      });
    });

    const decisionEvent = await step.waitForEvent("wait-for-carrier-decision", {
      event: "freight/negotiation.decision",
      if: "async.data.negotiationId == event.data.negotiationId",
      timeout: new Date(offer.expiresAt),
    });

    if (!decisionEvent) {
      await step.run("expire-negotiation", async (): Promise<void> => {
        const [expired] = await db.update(negotiations).set({ status: "expired", updatedAt: new Date() })
          .where(and(
            eq(negotiations.id, offer.negotiationId),
            eq(negotiations.status, "pending")
          )).returning({ id: negotiations.id });

        if (expired) {
          await db.update(loads).set({ status: "active", updatedAt: new Date() })
            .where(and(eq(loads.id, offer.loadId), gt(loads.expiresAt, new Date())));
          await db.insert(negotiationMessages).values({
            details: {},
            id: `${offer.negotiationId}:expired`,
            kind: "Expired",
            negotiationId: offer.negotiationId,
            price: offer.price,
            status: "expired",
          }).onConflictDoNothing();
          const payload = WorkflowStepEventSchema.parse({ negotiationId: offer.negotiationId, step: "expired" });

          await emitEvent("NegotiationExpired", payload, `${offer.negotiationId}:expired`);
          await inngest.send({ data: payload, id: `${offer.negotiationId}:expired`, name: "freight/negotiation.step" });
        }
      });

      return { status: "expired" };
    }

    const decision = DecisionEventSchema.parse(decisionEvent.data);

    await step.run("persist-carrier-decision", async (): Promise<void> => {
      const status = decision.decision === "accept" ? "accepted" : "rejected";
      const [updated] = await db.update(negotiations).set({ status, updatedAt: new Date() })
        .where(and(
          eq(negotiations.id, decision.negotiationId),
          eq(negotiations.status, "pending"),
          gt(negotiations.expiresAt, new Date())
        )).returning({ currentPrice: negotiations.currentPrice });

      if (!updated) {
        return;
      }
      await db.insert(negotiationMessages).values({
        details: {},
        id: `${decision.negotiationId}:${decision.decision}`,
        kind: decision.decision === "accept" ? "Accept" : "Reject",
        negotiationId: decision.negotiationId,
        price: updated.currentPrice,
        status,
      }).onConflictDoNothing();
      if (decision.decision === "reject") {
        await db.update(loads).set({ status: "active", updatedAt: new Date() })
          .where(and(eq(loads.id, offer.loadId), gt(loads.expiresAt, new Date())));
      }
      const payload = WorkflowStepEventSchema.parse({
        negotiationId: decision.negotiationId,
        step: decision.decision,
      });

      await emitEvent(decision.decision === "accept" ? "Accept" : "Reject", payload, `${decision.negotiationId}:${decision.decision}`);
      await inngest.send({
        data: payload,
        id: `${decision.negotiationId}:${decision.decision}`,
        name: "freight/negotiation.step",
      });
    });

    return { status: decision.decision === "accept" ? "accepted" : "rejected" };
  }
);

const loadExpiryWorkflow = inngest.createFunction(
  { id: "expire-freight-loads", triggers: { cron: "*/5 * * * *" } },
  ({ step }) => step.run("expire-loads", () => expireLoads().then((expired) => ({ expired })))
);

const inngestFunctions = [negotiationWorkflow, loadExpiryWorkflow];

export { inngestFunctions };
