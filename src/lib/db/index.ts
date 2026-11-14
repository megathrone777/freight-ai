import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString: string | undefined = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL is required.");
}

const client = postgres(connectionString, { max: 10, prepare: false });
const db = drizzle(client, { schema });

export { client, db };
