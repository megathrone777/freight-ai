import { NextResponse } from "next/server";

import { simulateIncomingLoads } from "@/lib/loads/simulate";

const POST = async (request: Request): Promise<NextResponse> => {
  const secret: string | undefined = process.env.SIMULATE_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Simulation endpoint is not configured." }, { status: 503 });
  }
  if (request.headers.get("x-simulate-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(await simulateIncomingLoads());
};

export { POST };
