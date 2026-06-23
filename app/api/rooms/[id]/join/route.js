import { queryOne } from "@/lib/db";
import { verifyPassword, unlockRoom } from "@/lib/auth";
import { json, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

// Verify a room's password; on success the room stays unlocked until logout.
export async function POST(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { password } = await req.json().catch(() => ({}));

  const room = await queryOne(
    "SELECT id, password_hash, deleted_at FROM rooms WHERE id = ?",
    [id]
  );
  if (!room) return json({ error: "Room not found" }, 404);
  if (room.deleted_at && !user.isAdmin) return json({ error: "Room not found" }, 404);

  if (!password || !(await verifyPassword(password, room.password_hash))) {
    return json({ error: "Wrong room password" }, 401);
  }

  await unlockRoom(room.id);
  return json({ ok: true });
}
