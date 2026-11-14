"use server";

import { randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { loads, negotiationMessages, negotiations } from "@/lib/db/schema";
import { emitEvent } from "@/lib/events";
import { inngest } from "@/lib/inngest/client";
import { simulateIncomingLoads } from "@/lib/loads/simulate";
import type { LoadRecord } from "@/lib/loads/types";
import { DecisionEventSchema, OfferEventSchema } from "@/lib/negotiations/schemas";

const LoadIdSchema = z.string().min(1);

const simulateLoadsAction = async (): Promise<LoadRecord[]> => {
  const result = await simulateIncomingLoads();

  return result.loads.map((load) => ({
    ...load,
    createdAt: load.createdAt.toISOString(),
    expiresAt: load.expiresAt.toISOString(),
    pickupAt: load.pickupAt.toISOString(),
    updatedAt: load.updatedAt.toISOString(),
  }));
};

const startNegotiationAction = async (inputLoadId: string): Promise<string> => {
  const loadId: string = LoadIdSchema.parse(inputLoadId);
  const negotiationId: string = randomUUID();
  const expiresAt: Date = new Date(Date.now() + 15 * 60 * 1000);
  const offer = await db.transaction(async (transaction) => {
    const [load] = await transaction.update(loads).set({ status: "negotiating", updatedAt: new Date() })
      .where(and(eq(loads.id, loadId), eq(loads.status, "active"), gt(loads.expiresAt, new Date())))
      .returning({ id: loads.id, price: loads.price });

    if (!load) {
      throw new Error("This load is no longer available for negotiation.");
    }
    const price: number = +(load.price * 0.95).toFixed(2);

    await transaction.insert(negotiations).values({
      currentPrice: price,
      expiresAt,
      id: negotiationId,
      initialPrice: load.price,
      loadId: load.id,
      status: "pending",
      updatedAt: new Date(),
    });
    await transaction.insert(negotiationMessages).values({
      details: {},
      id: `${negotiationId}:offer`,
      kind: "Offer",
      negotiationId,
      price,
      status: "submitted",
    });

    return OfferEventSchema.parse({
      expiresAt: expiresAt.toISOString(),
      loadId: load.id,
      negotiationId,
      price,
    });
  });

  await emitEvent("Offer", offer, `${negotiationId}:offer`);
  await inngest.send({
    data: offer,
    id: `${negotiationId}:offer`,
    name: "freight/negotiation.offer",
  });

  return negotiationId;
};

const retryNegotiationAction = async (inputNegotiationId: string): Promise<void> => {
  const negotiationId: string = LoadIdSchema.parse(inputNegotiationId);
  const [negotiation] = await db.select({
    currentPrice: negotiations.currentPrice,
    expiresAt: negotiations.expiresAt,
    id: negotiations.id,
    loadId: negotiations.loadId,
    status: negotiations.status,
  }).from(negotiations).where(and(
    eq(negotiations.id, negotiationId),
    eq(negotiations.status, "pending"),
    gt(negotiations.expiresAt, new Date())
  )).limit(1);

  if (!negotiation) {
    throw new Error("This negotiation is no longer available to retry.");
  }
  const [counterOffer] = await db.select({ id: negotiationMessages.id }).from(negotiationMessages)
    .where(and(
      eq(negotiationMessages.negotiationId, negotiationId),
      eq(negotiationMessages.kind, "CounterOffer")
    )).limit(1);

  if (counterOffer) {
    throw new Error("The agent has already returned a counteroffer.");
  }
  const offer = OfferEventSchema.parse({
    expiresAt: negotiation.expiresAt.toISOString(),
    loadId: negotiation.loadId,
    negotiationId: negotiation.id,
    price: negotiation.currentPrice,
  });
  const eventId: string = `${negotiationId}:retry:${randomUUID()}`;

  await emitEvent("Offer", offer, eventId);
  await inngest.send({
    data: offer,
    id: eventId,
    name: "freight/negotiation.offer",
  });
};

const decideNegotiationAction = async (
  input: { decision: "accept" | "reject"; negotiationId: string }
): Promise<void> => {
  const decision = DecisionEventSchema.parse(input);
  const newStatus = decision.decision === "accept" ? "accepted" : "rejected";

  await db.transaction(async (transaction) => {
    const [counter] = await transaction.select({ id: negotiationMessages.id }).from(negotiationMessages)
      .where(and(
        eq(negotiationMessages.negotiationId, decision.negotiationId),
        eq(negotiationMessages.kind, "CounterOffer")
      )).limit(1);

    if (!counter) {
      throw new Error("The agent has not returned a counteroffer yet.");
    }
    const [negotiation] = await transaction.update(negotiations).set({
      status: newStatus,
      updatedAt: new Date(),
    }).where(and(
      eq(negotiations.id, decision.negotiationId),
      eq(negotiations.status, "pending"),
      gt(negotiations.expiresAt, new Date())
    )).returning({ currentPrice: negotiations.currentPrice, id: negotiations.id, loadId: negotiations.loadId });

    if (!negotiation) {
      throw new Error("This negotiation has already finished or expired.");
    }
    await transaction.insert(negotiationMessages).values({
      details: {},
      id: `${decision.negotiationId}:${decision.decision}`,
      kind: decision.decision === "accept" ? "Accept" : "Reject",
      negotiationId: decision.negotiationId,
      price: negotiation.currentPrice,
      status: newStatus,
    }).onConflictDoNothing();
    if (decision.decision === "reject") {
      await transaction.update(loads).set({ status: "active", updatedAt: new Date() })
        .where(and(eq(loads.id, negotiation.loadId), gt(loads.expiresAt, new Date())));
    }
  });
  await emitEvent(decision.decision === "accept" ? "Accept" : "Reject", decision, `${decision.negotiationId}:${decision.decision}`);
  await inngest.send({
    data: decision,
    id: `${decision.negotiationId}:${decision.decision}`,
    name: "freight/negotiation.decision",
  });
};

export { decideNegotiationAction, retryNegotiationAction, simulateLoadsAction, startNegotiationAction };
