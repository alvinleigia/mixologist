import fs from "node:fs";
import postgres from "postgres";

const DEFAULT_RESTAURANT_ORGANIZATION_ID =
  "00000000-0000-0000-0000-000000000002";
const DEFAULT_LOCATION_ID = "00000000-0000-0000-0000-000000000003";

function readDatabaseUrl() {
  const envLine = fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((line) => line.startsWith("DATABASE_URL="));

  if (!envLine) {
    throw new Error("DATABASE_URL is missing from .env.local.");
  }

  return envLine
    .slice("DATABASE_URL=".length)
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

const sql = postgres(readDatabaseUrl(), { prepare: false });

try {
  const [organization] = await sql`
    select id, name
    from organizations
    where id = ${DEFAULT_RESTAURANT_ORGANIZATION_ID}
  `;
  const [location] = await sql`
    select id, name
    from locations
    where id = ${DEFAULT_LOCATION_ID}
      and organization_id = ${DEFAULT_RESTAURANT_ORGANIZATION_ID}
  `;

  if (!organization || !location) {
    throw new Error("Default restaurant organization or location is missing.");
  }

  const tables = [
    "menu_categories",
    "menu_items",
    "orders",
    "order_items",
  ];

  for (const table of tables) {
    const [result] = await sql.unsafe(`
      select count(*)::int as missing_count
      from ${table}
      where organization_id is null
        or ${table === "menu_categories" || table === "menu_items" ? "false" : "location_id is null"}
    `);

    if (result.missing_count > 0) {
      throw new Error(`${table} has ${result.missing_count} rows missing tenant scope.`);
    }
  }

  console.log("Tenant foundation verified.");
  console.log(`Default organization: ${organization.name}`);
  console.log(`Default location: ${location.name}`);
} finally {
  await sql.end();
}
