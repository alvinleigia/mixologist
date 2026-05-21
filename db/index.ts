import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

let database:
  | ReturnType<typeof drizzle>
  | undefined;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Add it to .env.local before using the API.");
  }

  if (!database) {
    const client = postgres(databaseUrl, { prepare: false });
    database = drizzle(client, { schema });
  }

  return database;
}
