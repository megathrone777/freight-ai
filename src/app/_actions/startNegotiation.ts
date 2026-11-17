"use server";
import { randomUUID } from "node:crypto";

import { and, eq, gt, lte } from "drizzle-orm";
import { z } from "zod";

import { db, emitEvent, schema } from "@/db";
import { inngest } from "@/services";

const loadIdSchema = z.string().min(1);

const startNegotiation = async (inputLoadId: string): Promise<string> => {
  const loadId: string = loadIdSchema.parse(inputLoadId);
  const negotiationId: string = randomUUID();
  const expiresAt: Date = new Date(Date.now() + 15 * 60 * 1000);

  const offer = await db.transaction(async (transaction) => {
    const now: Date = new Date();
    const [activeNegotiation] = await transaction
      .select({ id: schema.negotiations.id })
      .from(schema.negotiations)
      .where(
        and(
          eq(schema.negotiations.loadId, loadId),
          eq(schema.negotiations.status, "pending"),
          gt(schema.negotiations.expiresAt, now)
        )
      )
      .limit(1);

    if (activeNegotiation) {
      throw new Error("This load already has an active negotiation.");
    }

    const expiredNegotiations = await transaction
      .update(schema.negotiations)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(schema.negotiations.loadId, loadId),
          eq(schema.negotiations.status, "pending"),
          lte(schema.negotiations.expiresAt, now)
        )
      )
      .returning({ currentPrice: schema.negotiations.currentPrice, id: schema.negotiations.id });

    if (expiredNegotiations.length) {
      await transaction
        .insert(schema.negotiationMessages)
        .values(
          expiredNegotiations.map(({ currentPrice, id }) => ({
            details: {},
            id: `${id}:expired`,
            kind: "Expired",
            negotiationId: id,
            price: currentPrice,
            status: "expired",
          }))
        )
        .onConflictDoNothing();

      await transaction
        .update(schema.loads)
        .set({ status: "active", updatedAt: now })
        .where(
          and(
            eq(schema.loads.id, loadId),
            eq(schema.loads.status, "negotiating"),
            gt(schema.loads.expiresAt, now)
          )
        );
    }

    const [load] = await transaction
      .update(schema.loads)
      .set({ status: "negotiating", updatedAt: now })
      .where(
        and(
          eq(schema.loads.id, loadId),
          eq(schema.loads.status, "active"),
          gt(schema.loads.expiresAt, now)
        )
      )
      .returning({ id: schema.loads.id, price: schema.loads.price });

    if (!load) {
      throw new Error("This load is no longer available for negotiation.");
    }

    const price: number = +(load.price * 0.95).toFixed(2);

    await transaction.insert(schema.negotiations).values({
      currentPrice: price,
      expiresAt,
      id: negotiationId,
      initialPrice: load.price,
      loadId: load.id,
      status: "pending",
      updatedAt: now,
    });

    await transaction.insert(schema.negotiationMessages).values({
      details: {},
      id: `${negotiationId}:offer`,
      kind: "Offer",
      negotiationId,
      price,
      status: "submitted",
    });

    return inngest.schemas.offerEventSchema.parse({
      expiresAt: expiresAt.toISOString(),
      loadId: load.id,
      negotiationId,
      price,
    });
  });

  await emitEvent("Offer", offer, `${negotiationId}:offer`);
  await inngest.client.send({
    data: offer,
    id: `${negotiationId}:offer`,
    name: "freight/negotiation.offer",
  });

  return negotiationId;
};

export { startNegotiation };
