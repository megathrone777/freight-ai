"use server";
import { randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { db, emitEvent, schema } from "@/db";
import { inngest } from "@/services";

const loadIdSchema = z.string().min(1);

const startNegotiation = async (inputLoadId: string): Promise<string> => {
  const loadId: string = loadIdSchema.parse(inputLoadId);
  const negotiationId: string = randomUUID();
  const expiresAt: Date = new Date(Date.now() + 15 * 60 * 1000);

  const offer = await db.transaction(async (transaction) => {
    const [load] = await transaction
      .update(schema.loads)
      .set({ status: "negotiating", updatedAt: new Date() })
      .where(
        and(
          eq(schema.loads.id, loadId),
          eq(schema.loads.status, "active"),
          gt(schema.loads.expiresAt, new Date())
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
      updatedAt: new Date(),
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
