import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RoomsShell from "./RoomsShell";

export const dynamic = "force-dynamic";

// Persistent shell: top bar + rooms sidebar stay mounted while the right
// pane ({children}) swaps between the empty state and a chat room.
export default async function RoomsLayout({ children }) {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <RoomsShell user={{ id: user.id, username: user.username, isAdmin: user.isAdmin }}>
      {children}
    </RoomsShell>
  );
}
