import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { loads } from "@/lib/db/schema";

const GET = async (): Promise<NextResponse> => {
  const result = await db.select().from(loads).where(eq(loads.status, "active"))
    .orderBy(desc(loads.createdAt)).limit(200);

  return NextResponse.json(result);
};

export { GET };
