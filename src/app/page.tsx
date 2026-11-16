import { desc, eq } from "drizzle-orm";

import "maplibre-gl/dist/maplibre-gl.css";

import { Agent, Map, Sidebar } from "@/components";
import { db, schema } from "@/db";

import { contentClass, wrapperClass } from "./page.css";

const Page: React.FC<PageProps<"/">> = async () => {
  const loadRows = await db
    .select({
      createdAt: schema.loads.createdAt,
      description: schema.loads.description,
      destination: schema.loads.destination,
      destinationLat: schema.loads.destinationLat,
      destinationLon: schema.loads.destinationLon,
      expiresAt: schema.loads.expiresAt,
      id: schema.loads.id,
      origin: schema.loads.origin,
      originLat: schema.loads.originLat,
      originLon: schema.loads.originLon,
      pickupAt: schema.loads.pickupAt,
      price: schema.loads.price,
      source: schema.loads.source,
      status: schema.loads.status,
      updatedAt: schema.loads.updatedAt,
      weightT: schema.loads.weightT,
    })
    .from(schema.loads)
    .where(eq(schema.loads.status, "active"))
    .orderBy(desc(schema.loads.createdAt))
    .limit(200);
  const loads: TLoadRecord[] = loadRows.map<TLoadRecord>(
    ({ createdAt, expiresAt, pickupAt, updatedAt, ...restLoad }) => ({
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      pickupAt: pickupAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      ...restLoad,
    })
  );

  return (
    <div className={wrapperClass}>
      <Sidebar {...{ loads }} />

      <div className={contentClass}>
        <Map {...{ loads }} />
        <Agent />
      </div>
    </div>
  );
};

export default Page;
