import { gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";

export const GET = async (request: Request): Promise<NextResponse> => {
  const rawSince: null | string = new URL(request.url).searchParams.get("since");
  const parsed = z.iso.datetime({ offset: true }).safeParse(rawSince);

  if (!parsed.success) {
    return NextResponse.json({ error: "since must be an ISO timestamp." }, { status: 400 });
  }
  const cursor: Date = new Date();
  const changed = await db
    .select()
    .from(schema.loads)
    .where(gt(schema.loads.updatedAt, new Date(parsed.data)))
    .orderBy(schema.loads.updatedAt);

  return NextResponse.json({ loads: changed, since: cursor.toISOString() });
};
