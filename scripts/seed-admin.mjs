// Creates the first admin user from ADMIN_USER / ADMIN_PASS env vars.
// Idempotent: if the username already exists it just ensures is_admin = 1.
// Run: npm run seed:admin   (loads .env.local)
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const username = process.env.ADMIN_USER;
const password = process.env.ADMIN_PASS;
if (!username || !password) {
  console.error("Set ADMIN_USER and ADMIN_PASS env vars.");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [existing] = await conn.execute("SELECT id FROM users WHERE username = ?", [username]);
if (existing.length > 0) {
  await conn.execute("UPDATE users SET is_admin = 1 WHERE id = ?", [existing[0].id]);
  console.log(`User "${username}" already exists — ensured admin.`);
} else {
  const hash = await bcrypt.hash(password, 10);
  await conn.execute(
    "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)",
    [username, hash]
  );
  console.log(`Admin "${username}" created.`);
}

await conn.end();
