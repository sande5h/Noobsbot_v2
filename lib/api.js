import { NextResponse } from "next/server";
import { getSession } from "./auth";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Returns { user } or { error: <Response> }. Use: const { user, error } = await requireUser(); if (error) return error;
export async function requireUser() {
  const user = await getSession();
  if (!user) return { error: json({ error: "Not authenticated" }, 401) };
  return { user };
}

export async function requireAdmin() {
  const user = await getSession();
  if (!user) return { error: json({ error: "Not authenticated" }, 401) };
  if (!user.isAdmin) return { error: json({ error: "Admins only" }, 403) };
  return { user };
}
