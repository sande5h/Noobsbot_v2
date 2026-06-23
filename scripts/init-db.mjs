// Applies db/schema.sql to the configured database.
// Run: npm run init-db   (loads .env.local)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = await readFile(path.join(root, "db", "schema.sql"), "utf8");

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

await conn.query(sql);
await conn.end();
console.log("Schema applied to", process.env.DB_NAME);
