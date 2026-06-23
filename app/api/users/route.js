import { query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { json, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

// Admin-only: list users (no hashes).
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const users = await query(
    "SELECT id, username, is_admin, deleted_at FROM users ORDER BY deleted_at IS NOT NULL, username ASC"
  );
  return json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      isAdmin: !!u.is_admin,
      isDeleted: !!u.deleted_at,
    })),
  });
}

// Admin-only: add a new user.
export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { username, password, isAdmin } = await req.json().catch(() => ({}));
  if (!username?.trim() || !password) {
    return json({ error: "Username and password required" }, 400);
  }

  try {
    const res = await query(
      "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)",
      [username.trim(), await hashPassword(password), isAdmin ? 1 : 0]
    );
    return json({ id: res.insertId, username: username.trim(), isAdmin: !!isAdmin }, 201);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return json({ error: "That username is taken" }, 409);
    throw e;
  }
}
