import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "nb_session";
const UNLOCK_COOKIE = "nb_unlocked";
const BCRYPT_ROUNDS = 10;
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

// ── passwords ──
export function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}
export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── login session ──
export async function createSession(user) {
  const token = await new SignJWT({
    uid: user.id,
    username: user.username,
    admin: !!user.is_admin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOpts());
  // fresh login starts with no unlocked rooms
  jar.delete(UNLOCK_COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.uid, username: payload.username, isAdmin: !!payload.admin };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(UNLOCK_COOKIE);
}

// ── per-room unlock (lives until logout) ──
async function readUnlocked() {
  const jar = await cookies();
  const token = jar.get(UNLOCK_COOKIE)?.value;
  if (!token) return [];
  try {
    const { payload } = await jwtVerify(token, secret());
    return Array.isArray(payload.rooms) ? payload.rooms.map(Number) : [];
  } catch {
    return [];
  }
}

export async function unlockRoom(roomId) {
  const rooms = await readUnlocked();
  if (!rooms.includes(Number(roomId))) rooms.push(Number(roomId));
  const token = await new SignJWT({ rooms })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secret());
  const jar = await cookies();
  jar.set(UNLOCK_COOKIE, token, cookieOpts());
}

export async function isRoomUnlocked(roomId) {
  const rooms = await readUnlocked();
  return rooms.includes(Number(roomId));
}
