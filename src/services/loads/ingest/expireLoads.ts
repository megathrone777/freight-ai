import { sql } from "drizzle-orm";

import { db, emitEvent, schema } from "@/db";

const expireLoads = async (): Promise<number> => {
  const expired = await db
    .update(schema.loads)
    .set({ status: "expired", updatedAt: new Date() })
    .where(sql`${schema.loads.status} <> 'expired' AND ${schema.loads.expiresAt} < now()`)
    .returning({ id: schema.loads.id });

  for (const load of expired) {
    await emitEvent("LoadExpired", { id: load.id });
  }

  return expired.length;
};

export { expireLoads };
