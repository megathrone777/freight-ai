import { NextResponse } from "next/server";

import { runFreightEval } from "@/services";

export const maxDuration = 60;

export const POST = async (): Promise<NextResponse> => NextResponse.json(await runFreightEval());
