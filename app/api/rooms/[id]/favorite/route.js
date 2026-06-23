import { query, queryOne } from "@/lib/db";
import { json, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

// Toggle favourite for the current user. Returns the new state.
export async function POST(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const room = await queryOne("SELECT id FROM rooms WHERE id = ?", [id]);
  if (!room) return json({ error: "Room not found" }, 404);

  const existing = await queryOne(
    "SELECT 1 AS x FROM favorites WHERE user_id = ? AND room_id = ?",
    [user.id, id]
  );

  if (existing) {
    await query("DELETE FROM favorites WHERE user_id = ? AND room_id = ?", [user.id, id]);
    return json({ isFavorite: false });
  }
  await query("INSERT INTO favorites (user_id, room_id) VALUES (?, ?)", [user.id, id]);
  return json({ isFavorite: true });
}
