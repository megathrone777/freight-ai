import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { negotiationMessages, negotiations, traces } from "@/lib/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

const GET = async (_request: Request, context: RouteContext): Promise<NextResponse> => {
  const { id: loadId } = await context.params;
  const [negotiation] = await db.select().from(negotiations)
    .where(eq(negotiations.loadId, loadId)).orderBy(desc(negotiations.createdAt)).limit(1);

  if (!negotiation) {
    return NextResponse.json({ messages: [], negotiation: null, traces: [] });
  }
  const messages = await db.select().from(negotiationMessages)
    .where(eq(negotiationMessages.negotiationId, negotiation.id)).orderBy(negotiationMessages.createdAt);
  const recentTraces = await db.select({
    createdAt: traces.createdAt,
    id: traces.id,
    latencyMs: traces.latencyMs,
    name: traces.name,
    output: traces.output,
  }).from(traces).orderBy(desc(traces.createdAt)).limit(100);
  const relatedTraces = recentTraces.filter((trace) => JSON.stringify(trace.output).includes(loadId));

  return NextResponse.json({ messages, negotiation, traces: relatedTraces });
};

export { GET };
