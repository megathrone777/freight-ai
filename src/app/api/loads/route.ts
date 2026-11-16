import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, schema } from "@/db";

export const GET = async (): Promise<NextResponse> => {
  const result = await db
    .select()
    .from(schema.loads)
    .where(eq(schema.loads.status, "active"))
    .orderBy(desc(schema.loads.createdAt))
    .limit(200);

  return NextResponse.json(result);
};
