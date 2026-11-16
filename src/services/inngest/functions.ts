import { and, eq, gt } from "drizzle-orm";

import { db, emitEvent, schema } from "@/db";
import { loads } from "@/services";

import { client } from "./client";
import { decisionEventSchema, offerEventSchema, workflowStepEventSchema } from "./schemas";

const negotiationWorkflow = client.createFunction(
  {
    id: "freight-negotiation-workflow",
    retries: 5,
    triggers: { event: "freight/negotiation.offer" },
  },

  async ({ event, step }) => {
    const offer = offerEventSchema.parse(event.data);

    await step.run("record-counter-offer", async (): Promise<void> => {
      const [negotiation] = await db
        .select()
        .from(schema.negotiations)
        .where(eq(schema.negotiations.id, offer.negotiationId))
        .limit(1);

      if (!negotiation) {
        throw new Error(`Negotiation ${offer.negotiationId} was not found.`);
      }
      const [load] = await db
        .select({ price: schema.loads.price })
        .from(schema.loads)
        .where(eq(schema.loads.id, offer.loadId))
        .limit(1);

      if (!load) {
        throw new Error(`Load ${offer.loadId} was not found.`);
      }
      const counterPrice: number = +load.price.toFixed(2);
      const payload = workflowStepEventSchema.parse({
        negotiationId: offer.negotiationId,
        step: "counter_offer",
      });

      await db.transaction(async (transaction) => {
        await transaction
          .update(schema.negotiations)
          .set({ currentPrice: counterPrice, updatedAt: new Date() })
          .where(eq(schema.negotiations.id, offer.negotiationId));
        await transaction
          .insert(schema.negotiationMessages)
          .values({
            createdAt: new Date(),
            details: {},
            id: `${offer.negotiationId}:counter`,
            kind: "CounterOffer",
            negotiationId: offer.negotiationId,
            price: counterPrice,
            status: "pending",
          })
          .onConflictDoNothing();
      });

      await emitEvent(
        "CounterOffer",
        { ...payload, price: counterPrice },
        `${offer.negotiationId}:counter`
      );

      await client.send({
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
        const [expired] = await db
          .update(schema.negotiations)
          .set({ status: "expired", updatedAt: new Date() })
          .where(
            and(
              eq(schema.negotiations.id, offer.negotiationId),
              eq(schema.negotiations.status, "pending")
            )
          )
          .returning({ id: schema.negotiations.id });

        if (expired) {
          await db
            .update(schema.loads)
            .set({ status: "active", updatedAt: new Date() })
            .where(and(eq(schema.loads.id, offer.loadId), gt(schema.loads.expiresAt, new Date())));
          await db
            .insert(schema.negotiationMessages)
            .values({
              details: {},
              id: `${offer.negotiationId}:expired`,
              kind: "Expired",
              negotiationId: offer.negotiationId,
              price: offer.price,
              status: "expired",
            })
            .onConflictDoNothing();

          const payload = workflowStepEventSchema.parse({
            negotiationId: offer.negotiationId,
            step: "expired",
          });

          await emitEvent("NegotiationExpired", payload, `${offer.negotiationId}:expired`);

          await client.send({
            data: payload,
            id: `${offer.negotiationId}:expired`,
            name: "freight/negotiation.step",
          });
        }
      });

      return { status: "expired" };
    }

    const decision = decisionEventSchema.parse(decisionEvent.data);

    await step.run("persist-carrier-decision", async (): Promise<void> => {
      const status = decision.decision === "accept" ? "accepted" : "rejected";
      const [updated] = await db
        .update(schema.negotiations)
        .set({ status, updatedAt: new Date() })
        .where(
          and(
            eq(schema.negotiations.id, decision.negotiationId),
            eq(schema.negotiations.status, "pending"),
            gt(schema.negotiations.expiresAt, new Date())
          )
        )
        .returning({ currentPrice: schema.negotiations.currentPrice });

      if (!updated) {
        return;
      }
      await db
        .insert(schema.negotiationMessages)
        .values({
          details: {},
          id: `${decision.negotiationId}:${decision.decision}`,
          kind: decision.decision === "accept" ? "Accept" : "Reject",
          negotiationId: decision.negotiationId,
          price: updated.currentPrice,
          status,
        })
        .onConflictDoNothing();

      if (decision.decision === "reject") {
        await db
          .update(schema.loads)
          .set({ status: "active", updatedAt: new Date() })
          .where(and(eq(schema.loads.id, offer.loadId), gt(schema.loads.expiresAt, new Date())));
      }

      const payload = workflowStepEventSchema.parse({
        negotiationId: decision.negotiationId,
        step: decision.decision,
      });

      await emitEvent(
        decision.decision === "accept" ? "Accept" : "Reject",
        payload,
        `${decision.negotiationId}:${decision.decision}`
      );

      await client.send({
        data: payload,
        id: `${decision.negotiationId}:${decision.decision}`,
        name: "freight/negotiation.step",
      });
    });

    return { status: decision.decision === "accept" ? "accepted" : "rejected" };
  }
);

const loadExpiryWorkflow = client.createFunction(
  { id: "expire-freight-loads", triggers: { cron: "*/5 * * * *" } },
  ({ step }) =>
    step.run("expire-loads", () => loads.ingest.expireLoads().then((expired) => ({ expired })))
);

const functions = [negotiationWorkflow, loadExpiryWorkflow];

export { functions };
