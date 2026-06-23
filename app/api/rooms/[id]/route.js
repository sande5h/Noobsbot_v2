import { query, queryOne } from "@/lib/db";
import { json, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

// Soft-delete a room: hidden from members, kept (with all messages) for admins.
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const room = await queryOne("SELECT id FROM rooms WHERE id = ?", [id]);
  if (!room) return json({ error: "Room not found" }, 404);

  await query("UPDATE rooms SET deleted_at = NOW() WHERE id = ?", [id]);
  return json({ ok: true, isDeleted: true });
}

// Restore a soft-deleted room.
export async function PATCH(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const room = await queryOne("SELECT id FROM rooms WHERE id = ?", [id]);
  if (!room) return json({ error: "Room not found" }, 404);

  await query("UPDATE rooms SET deleted_at = NULL WHERE id = ?", [id]);
  return json({ ok: true, isDeleted: false });
}
