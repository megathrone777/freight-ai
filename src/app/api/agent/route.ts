import { convertToModelMessages, safeValidateUIMessages, stepCountIs, streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getGeminiModel } from "@/lib/agent/model";
import { tools } from "@/lib/agent/tools";

export const maxDuration = 60;

const RequestSchema = z.object({ messages: z.array(z.unknown()) });

const POST = async (request: Request): Promise<Response> => {
  const parsed = RequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Expected a messages array." }, { status: 400 });
  }
  const validated = await safeValidateUIMessages({ messages: parsed.data.messages });

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid chat messages." }, { status: 400 });
  }
  const result = streamText({
    messages: await convertToModelMessages(validated.data),
    model: getGeminiModel(),
    stopWhen: stepCountIs(6),
    system: [
      "You are Freight AI, a helpful freight matching agent for Czech carriers.",
      "Extract the carrier's origin, destination, maximum truck capacity in tonnes, and requested pickup date from their message.",
      "Treat a short two-city route such as 'Praha Zlin' as origin Praha and destination Zlín.",
      "Do not block on missing capacity or date; leave those filters unset and search with the information provided.",
      "Call search_loads with the extracted values and a concise query. Use check_route when route coverage is unclear.",
      "Rank the matching loads and return a short, specific reason for each. Never claim a tool returned a load it did not return.",
      "Use propose_price only when the carrier asks about negotiating an identified load.",
    ].join(" "),
    tools,
  });

  return result.toUIMessageStreamResponse();
};

export { POST };
