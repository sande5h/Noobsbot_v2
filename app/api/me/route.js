import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return json({ user: null });
  const row = await queryOne("SELECT avatar FROM users WHERE id = ?", [session.id]);
  return json({ user: { ...session, avatar: row?.avatar ?? null } });
}
