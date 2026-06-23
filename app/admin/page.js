import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/rooms");
  return <AdminClient meId={user.id} />;
}
