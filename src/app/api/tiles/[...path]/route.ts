import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TILE_BASE = "https://tiles.openfreemap.org";

const TileSourceSchema = z.object({
  tiles: z.array(z.string()).optional(),
  url: z.string().optional(),
}).passthrough();
const TileStyleSchema = z.object({
  glyphs: z.string().optional(),
  layers: z.array(
    z.object({
      layout: z.record(z.string(), z.unknown()).optional(),
    }).passthrough()
  ).optional(),
  sources: z.record(z.string(), TileSourceSchema).optional(),
  sprite: z.string().optional(),
}).passthrough();

const normalizeSpriteIcon = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeSpriteIcon);
  }

  return value === "circle-11" ? "circle_11" : value;
};

const proxyUrl = (url: string, requestOrigin: string): string => {
  const resolvedUrl: URL = new URL(url, `${TILE_BASE}/`);

  if (resolvedUrl.origin !== TILE_BASE) {
    return url;
  }
  const path: string = `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;

  return new URL(`/api/tiles${path}`, requestOrigin).toString();
};

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> => {
  const { path } = await params;
  const joined = path.join("/");
  const url = `${TILE_BASE}/${joined}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!response.ok) {
    return new NextResponse(null, { status: response.status });
  }

  const contentType = response.headers.get("Content-Type") ?? "";

  if (joined.startsWith("styles/") && contentType.includes("json")) {
    const parsed = TileStyleSchema.safeParse(await response.json());

    if (!parsed.success) {
      return new NextResponse("Invalid tile style response.", { status: 502 });
    }
    const style = parsed.data;

    for (const layer of style.layers ?? []) {
      const layout = layer.layout;

      if (layout?.["icon-image"] !== undefined) {
        layout["icon-image"] = normalizeSpriteIcon(layout["icon-image"]);
      }
    }

    if (style.glyphs) {
      style.glyphs = proxyUrl(style.glyphs, request.nextUrl.origin);
    }
    if (style.sprite) {
      style.sprite = proxyUrl(style.sprite, request.nextUrl.origin);
    }
    for (const source of Object.values(style.sources ?? {})) {
      if (source.url) {
        source.url = proxyUrl(source.url, request.nextUrl.origin);
      }

      if (source.tiles) {
        source.tiles = source.tiles.map((tileUrl) => proxyUrl(tileUrl, request.nextUrl.origin));
      }
    }

    return NextResponse.json(style, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": contentType || "application/octet-stream",
    },
  });
};
