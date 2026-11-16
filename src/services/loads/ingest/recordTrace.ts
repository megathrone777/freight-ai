import { randomUUID } from "node:crypto";

import { db, schema } from "@/db";

const recordTrace = async (
  name: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  latencyMs: number
): Promise<void> => {
  await db.insert(schema.traces).values({
    id: randomUUID(),
    input,
    latencyMs,
    name,
    output,
  });
};

export { recordTrace };
