import { query, queryOne } from "@/lib/db";
import { isRoomUnlocked } from "@/lib/auth";
import { json, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const MAX_BODY = 4000;

// GET ?after=<lastId> — incremental fetch the client polls.
export async function GET(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (!(await isRoomUnlocked(id))) {
    return json({ error: "Room locked" }, 403);
  }
  const roomGet = await queryOne("SELECT deleted_at FROM rooms WHERE id = ?", [id]);
  if (roomGet?.deleted_at && !user.isAdmin) return json({ error: "Room not found" }, 404);

  const after = Number(new URL(req.url).searchParams.get("after") || 0);
  const rows = await query(
    `SELECT m.id, m.body, m.created_at, m.user_id, u.username, u.avatar
       FROM messages m
       LEFT JOIN users u ON u.id = m.user_id
      WHERE m.room_id = ? AND m.id > ?
      ORDER BY m.id ASC
      LIMIT 200`,
    [id, after]
  );

  const messages = rows.map((m) => ({
    id: m.id,
    body: m.body,
    username: m.username ?? "unknown",
    avatar: m.avatar ?? null,
    mine: m.user_id === user.id,
    createdAt: m.created_at,
  }));
  return json({ messages });
}

// POST { body } — send a message.
export async function POST(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (!(await isRoomUnlocked(id))) {
    return json({ error: "Room locked" }, 403);
  }

  const room = await queryOne("SELECT id, deleted_at FROM rooms WHERE id = ?", [id]);
  if (!room) return json({ error: "Room not found" }, 404);
  if (room.deleted_at && !user.isAdmin) return json({ error: "Room not found" }, 404);

  const { body } = await req.json().catch(() => ({}));
  const text = (body ?? "").toString().trim();
  if (!text) return json({ error: "Message is empty" }, 400);
  if (text.length > MAX_BODY) return json({ error: "Message too long" }, 400);

  const res = await query(
    "INSERT INTO messages (room_id, user_id, body) VALUES (?, ?, ?)",
    [id, user.id, text]
  );
  return json(
    { id: res.insertId, body: text, username: user.username, mine: true },
    201
  );
}
