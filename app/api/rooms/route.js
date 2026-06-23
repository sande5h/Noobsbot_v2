import { query } from "@/lib/db";
import { hashPassword, isRoomUnlocked } from "@/lib/auth";
import { json, requireUser, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

// List every room. Each row tells the client if it's favourited and already unlocked.
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  // Members only see active rooms; admins see deleted ones too (flagged).
  const rows = await query(
    `SELECT r.id, r.name, r.created_at, r.deleted_at,
            (f.user_id IS NOT NULL) AS is_favorite
       FROM rooms r
       LEFT JOIN favorites f ON f.room_id = r.id AND f.user_id = ?
      ${user.isAdmin ? "" : "WHERE r.deleted_at IS NULL"}
      ORDER BY is_favorite DESC, r.name ASC`,
    [user.id]
  );

  const rooms = [];
  for (const r of rows) {
    rooms.push({
      id: r.id,
      name: r.name,
      isFavorite: !!r.is_favorite,
      isUnlocked: await isRoomUnlocked(r.id),
      isDeleted: !!r.deleted_at,
    });
  }
  return json({ rooms });
}

// Admin-only: create a room with its own password.
export async function POST(req) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const { name, password } = await req.json().catch(() => ({}));
  if (!name?.trim() || !password) {
    return json({ error: "Room name and password required" }, 400);
  }

  try {
    const res = await query(
      "INSERT INTO rooms (name, password_hash, created_by) VALUES (?, ?, ?)",
      [name.trim(), await hashPassword(password), user.id]
    );
    return json({ id: res.insertId, name: name.trim() }, 201);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return json({ error: "A room with that name already exists" }, 409);
    throw e;
  }
}
