"use server";

import { randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { db, emitEvent, schema } from "@/db";
import { inngest } from "@/services";

const retryNegotiation = async (inputNegotiationId: string): Promise<void> => {
  const negotiationId: string = z.string().min(1).parse(inputNegotiationId);
  const [negotiation] = await db
    .select({
      currentPrice: schema.negotiations.currentPrice,
      expiresAt: schema.negotiations.expiresAt,
      id: schema.negotiations.id,
      loadId: schema.negotiations.loadId,
      status: schema.negotiations.status,
    })
    .from(schema.negotiations)
    .where(
      and(
        eq(schema.negotiations.id, negotiationId),
        eq(schema.negotiations.status, "pending"),
        gt(schema.negotiations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!negotiation) {
    throw new Error("This negotiation is no longer available to retry.");
  }

  const [counterOffer] = await db
    .select({ id: schema.negotiationMessages.id })
    .from(schema.negotiationMessages)
    .where(
      and(
        eq(schema.negotiationMessages.negotiationId, negotiationId),
        eq(schema.negotiationMessages.kind, "CounterOffer")
      )
    )
    .limit(1);

  if (counterOffer) {
    throw new Error("The agent has already returned a counteroffer.");
  }

  const offer = inngest.schemas.offerEventSchema.parse({
    expiresAt: negotiation.expiresAt.toISOString(),
    loadId: negotiation.loadId,
    negotiationId: negotiation.id,
    price: negotiation.currentPrice,
  });
  const eventId: string = `${negotiationId}:retry:${randomUUID()}`;

  await emitEvent("Offer", offer, eventId);
  await inngest.client.send({
    data: offer,
    id: eventId,
    name: "freight/negotiation.offer",
  });
};

export { retryNegotiation };
