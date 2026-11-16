import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { agent } from "@/services";

export const maxDuration: number = 60;

const requestSchema = z.object({ messages: z.array(z.unknown()) });

export const POST = async (request: Request): Promise<Response> => {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Expected a messages array." }, { status: 400 });
  }

  const validated = await safeValidateUIMessages({ messages: parsed.data.messages });

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid chat messages." }, { status: 400 });
  }

  const result = streamText({
    ...agent,

    instructions: [
      "You are Freight AI, a helpful freight matching agent for Czech carriers.",
      "Extract the carrier's origin, destination, maximum truck capacity in tonnes, and requested pickup date from their message.",
      "Treat a short two-city route such as 'Praha Zlin' as origin Praha and destination Zlín.",
      "Do not block on missing capacity or date; leave those filters unset and search with the information provided.",
      "Call search_loads with the extracted values and a concise query. Use check_route when route coverage is unclear.",
      "Rank the matching loads and return a short, specific reason for each. Never claim a tool returned a load it did not return.",
      "Use propose_price only when the carrier asks about negotiating an identified load.",
    ].join(" "),

    messages: await convertToModelMessages(validated.data),
    stopWhen: stepCountIs(6),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
};
