import { redirect } from "next/navigation";
import { getSession, isRoomUnlocked } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  if (!(await isRoomUnlocked(id))) redirect("/rooms");

  const room = await queryOne("SELECT id, name FROM rooms WHERE id = ?", [id]);
  if (!room) redirect("/rooms");

  const me = await queryOne("SELECT avatar FROM users WHERE id = ?", [user.id]);

  return (
    <ChatClient
      room={{ id: room.id, name: room.name }}
      user={{ id: user.id, username: user.username, avatar: me?.avatar ?? null }}
    />
  );
}
