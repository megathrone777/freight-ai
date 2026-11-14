import { randomUUID } from "node:crypto";

import { db } from "./db";
import { domainEvents, traces } from "./db/schema";

type DomainEventName =
  | "Accept"
  | "CounterOffer"
  | "LoadExpired"
  | "LoadIngested"
  | "NegotiationExpired"
  | "Offer"
  | "Reject";

const emitEvent = async (name: DomainEventName, payload: Record<string, unknown>, id: string = randomUUID()): Promise<void> => {
  const startedAt: number = Date.now();

  await db.transaction(async (transaction) => {
    await transaction.insert(domainEvents).values({ id, name, payload }).onConflictDoNothing();
    await transaction.insert(traces).values({
      id: `event:${id}`,
      input: payload,
      latencyMs: Date.now() - startedAt,
      name: `event:${name}`,
      output: { stored: true },
    }).onConflictDoNothing();
  });
};

export { emitEvent };
export type { DomainEventName };
