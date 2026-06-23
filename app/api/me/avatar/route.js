import { query } from "@/lib/db";
import { json, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

// ~256 KB of base64 is plenty for a resized avatar; reject anything larger.
const MAX_LEN = 350_000;

export async function POST(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { dataUrl } = await req.json().catch(() => ({}));
  if (dataUrl === null) {
    await query("UPDATE users SET avatar = NULL WHERE id = ?", [user.id]);
    return json({ avatar: null });
  }
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return json({ error: "Expected an image data URL" }, 400);
  }
  if (dataUrl.length > MAX_LEN) {
    return json({ error: "Image too large" }, 400);
  }

  await query("UPDATE users SET avatar = ? WHERE id = ?", [dataUrl, user.id]);
  return json({ avatar: dataUrl });
}
