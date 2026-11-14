import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const require = createRequire(resolve(process.cwd(), "package.json"));
const workerPath: string = require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs");

const GET = async (): Promise<NextResponse> => {
  const worker: Uint8Array<ArrayBuffer> = Uint8Array.from(await readFile(workerPath));

  return new NextResponse(worker, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/javascript; charset=utf-8",
    },
  });
};

export { GET };
