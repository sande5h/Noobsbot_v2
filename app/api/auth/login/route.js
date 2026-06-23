import { queryOne } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return json({ error: "Username and password required" }, 400);
  }

  const user = await queryOne(
    "SELECT id, username, password_hash, is_admin FROM users WHERE username = ? AND deleted_at IS NULL",
    [username]
  );
  // Same message whether the user is missing or the password is wrong.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return json({ error: "Invalid username or password" }, 401);
  }

  await createSession(user);
  return json({ id: user.id, username: user.username, isAdmin: !!user.is_admin });
}
