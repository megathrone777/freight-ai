"use server";
import { and, eq, gt } from "drizzle-orm";

import { db, emitEvent, schema } from "@/db";
import { inngest } from "@/services";

const decideNegotiation = async (input: {
  decision: "accept" | "reject";
  negotiationId: string;
}): Promise<void> => {
  const decision = inngest.schemas.decisionEventSchema.parse(input);
  const newStatus = decision.decision === "accept" ? "accepted" : "rejected";

  await db.transaction(async (transaction) => {
    const [counter] = await transaction
      .select({ id: schema.negotiationMessages.id })
      .from(schema.negotiationMessages)
      .where(
        and(
          eq(schema.negotiationMessages.negotiationId, decision.negotiationId),
          eq(schema.negotiationMessages.kind, "CounterOffer")
        )
      )
      .limit(1);

    if (!counter) {
      throw new Error("The agent has not returned a counteroffer yet.");
    }

    const [negotiation] = await transaction
      .update(schema.negotiations)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.negotiations.id, decision.negotiationId),
          eq(schema.negotiations.status, "pending"),
          gt(schema.negotiations.expiresAt, new Date())
        )
      )
      .returning({
        currentPrice: schema.negotiations.currentPrice,
        id: schema.negotiations.id,
        loadId: schema.negotiations.loadId,
      });

    if (!negotiation) {
      throw new Error("This negotiation has already finished or expired.");
    }

    await transaction
      .insert(schema.negotiationMessages)
      .values({
        details: {},
        id: `${decision.negotiationId}:${decision.decision}`,
        kind: decision.decision === "accept" ? "Accept" : "Reject",
        negotiationId: decision.negotiationId,
        price: negotiation.currentPrice,
        status: newStatus,
      })
      .onConflictDoNothing();

    if (decision.decision === "reject") {
      await transaction
        .update(schema.loads)
        .set({ status: "active", updatedAt: new Date() })
        .where(
          and(eq(schema.loads.id, negotiation.loadId), gt(schema.loads.expiresAt, new Date()))
        );
    }
  });

  await emitEvent(
    decision.decision === "accept" ? "Accept" : "Reject",
    decision,
    `${decision.negotiationId}:${decision.decision}`
  );

  await inngest.client.send({
    data: decision,
    id: `${decision.negotiationId}:${decision.decision}`,
    name: "freight/negotiation.decision",
  });
};

export { decideNegotiation };
