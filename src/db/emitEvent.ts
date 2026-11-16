import { randomUUID } from "node:crypto";

import { schema } from "./schema";

import { db } from "./";

type TDomainEventName =
  | "Accept"
  | "CounterOffer"
  | "LoadExpired"
  | "LoadIngested"
  | "NegotiationExpired"
  | "Offer"
  | "Reject";

const emitEvent = async (
  name: TDomainEventName,
  payload: Record<string, unknown>,
  id: string = randomUUID()
): Promise<void> => {
  const startedAt: number = Date.now();

  await db.transaction(async (transaction) => {
    await transaction
      .insert(schema.domainEvents)
      .values({ id, name, payload })
      .onConflictDoNothing();
    await transaction

      .insert(schema.traces)
      .values({
        id: `event:${id}`,
        input: payload,
        latencyMs: Date.now() - startedAt,
        name: `event:${name}`,
        output: { stored: true },
      })
      .onConflictDoNothing();
  });
};

export { emitEvent, type TDomainEventName };
