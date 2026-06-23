import { query, queryOne } from "@/lib/db";
import { json, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

// Soft-delete (deactivate) a user: blocks login but keeps their messages/name.
export async function DELETE(req, { params }) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (Number(id) === user.id) {
    return json({ error: "You can't delete your own account" }, 400);
  }
  const target = await queryOne("SELECT id FROM users WHERE id = ?", [id]);
  if (!target) return json({ error: "User not found" }, 404);

  await query("UPDATE users SET deleted_at = NOW() WHERE id = ?", [id]);
  return json({ ok: true, isDeleted: true });
}

// Restore a deactivated user.
export async function PATCH(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const target = await queryOne("SELECT id FROM users WHERE id = ?", [id]);
  if (!target) return json({ error: "User not found" }, 404);

  await query("UPDATE users SET deleted_at = NULL WHERE id = ?", [id]);
  return json({ ok: true, isDeleted: false });
}
