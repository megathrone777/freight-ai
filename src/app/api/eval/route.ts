import { NextResponse } from "next/server";

import { runFreightEval } from "@/lib/eval/run";

export const maxDuration = 60;

const POST = async (): Promise<NextResponse> => NextResponse.json(await runFreightEval());

export { POST };
