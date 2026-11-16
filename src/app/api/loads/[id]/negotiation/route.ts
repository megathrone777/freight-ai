import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, schema } from "@/db";

interface TRouteContext {
  params: Promise<{ id: string }>;
}

export const GET = async (_request: Request, context: TRouteContext): Promise<NextResponse> => {
  const { id: loadId } = await context.params;
  const [negotiation] = await db
    .select()
    .from(schema.negotiations)
    .where(eq(schema.negotiations.loadId, loadId))
    .orderBy(desc(schema.negotiations.createdAt))
    .limit(1);

  if (!negotiation) {
    return NextResponse.json({ messages: [], negotiation: null, traces: [] });
  }

  const messages = await db
    .select()
    .from(schema.negotiationMessages)
    .where(eq(schema.negotiationMessages.negotiationId, negotiation.id))
    .orderBy(schema.negotiationMessages.createdAt);

  const recentTraces = await db
    .select({
      createdAt: schema.traces.createdAt,
      id: schema.traces.id,
      latencyMs: schema.traces.latencyMs,
      name: schema.traces.name,
      output: schema.traces.output,
    })
    .from(schema.traces)
    .orderBy(desc(schema.traces.createdAt))
    .limit(100);

  const relatedTraces = recentTraces.filter((trace) =>
    JSON.stringify(trace.output).includes(loadId)
  );

  return NextResponse.json({ messages, negotiation, traces: relatedTraces });
};
