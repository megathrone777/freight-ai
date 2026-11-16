import { NextResponse } from "next/server";

import { client } from "@/db";

export const GET = async (): Promise<NextResponse> => {
  await client`select 1`;

  return new NextResponse("ok", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
