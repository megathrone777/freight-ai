import { desc } from "drizzle-orm";

import "maplibre-gl/dist/maplibre-gl.css";

import { Map } from "@/components";
import { db, schema } from "@/db";

import { wrapperClass, contentClass, sidebarClass } from "./page.css";

const Page: React.FC<PageProps<"/">> = async () => {
  const loads = await db
    .select()
    .from(schema.loads)
    .orderBy(desc(schema.loads.createdAt))
    .limit(200);

  return (
    <div className={wrapperClass}>
      {loads && !!loads.length && <div className={sidebarClass}>Sidebar ({loads.length})</div>}

      <div className={contentClass}>
        <Map />
      </div>
    </div>
  );
};

export default Page;
