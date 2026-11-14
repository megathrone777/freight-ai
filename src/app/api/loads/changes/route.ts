import { gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { loads } from "@/lib/db/schema";

const GET = async (request: Request): Promise<NextResponse> => {
  const rawSince: null | string = new URL(request.url).searchParams.get("since");
  const parsed = z.string().datetime({ offset: true }).safeParse(rawSince);

  if (!parsed.success) {
    return NextResponse.json({ error: "since must be an ISO timestamp." }, { status: 400 });
  }
  const cursor: Date = new Date();
  const changed = await db.select().from(loads).where(gt(loads.updatedAt, new Date(parsed.data)))
    .orderBy(loads.updatedAt);

  return NextResponse.json({ loads: changed, since: cursor.toISOString() });
};

export { GET };
