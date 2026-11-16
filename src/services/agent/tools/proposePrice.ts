import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { db, schema } from "@/db";
import { loads } from "@/services";

const inputSchema = z.object({
  loadId: z.string().min(1),
  targetPrice: z.number().positive(),
});

const outputSchema = z.object({
  accepted: z.boolean(),
  allowedRange: z.object({ maximum: z.number(), minimum: z.number() }),
  loadId: z.string(),
  proposedPrice: z.number(),
});

const proposePrice = tool({
  description:
    "Calculate a carrier counter-price; negotiation is limited to ten percent above or below the listing.",

  execute: async (input: {
    loadId: string;
    targetPrice: number;
  }): Promise<z.infer<typeof outputSchema>> => {
    const startedAt: number = Date.now();
    const [load] = await db
      .select({ id: schema.loads.id, price: schema.loads.price })
      .from(schema.loads)
      .where(eq(schema.loads.id, input.loadId))
      .limit(1);

    if (!load) {
      throw new Error(`Load ${input.loadId} was not found.`);
    }

    const minimum: number = +(load.price * 0.9).toFixed(2);
    const maximum: number = +(load.price * 1.1).toFixed(2);

    const output = outputSchema.parse({
      accepted: input.targetPrice >= minimum && input.targetPrice <= maximum,
      allowedRange: { maximum, minimum },
      loadId: load.id,
      proposedPrice: Math.min(maximum, Math.max(minimum, input.targetPrice)),
    });

    await loads.ingest.recordTrace("propose_price", input, output, Date.now() - startedAt);

    return output;
  },

  inputSchema,
  outputSchema,
});

export { proposePrice };
