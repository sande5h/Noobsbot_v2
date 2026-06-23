import mysql from "mysql2/promise";

// Single shared pool. Shared-hosting MySQL caps connections, so keep it small.
// Cached on globalThis so Next's dev hot-reload reuses one pool instead of
// leaking a new one (and its connections) on every reload.
export function getPool() {
  if (!globalThis.__nbPool) {
    globalThis.__nbPool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 5),
      queueLimit: 0,
      charset: "utf8mb4_general_ci",
      dateStrings: true,
    });
  }
  return globalThis.__nbPool;
}

// Thin helper: returns rows for SELECT, or the result header for writes.
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

// Convenience: first row or null.
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}
