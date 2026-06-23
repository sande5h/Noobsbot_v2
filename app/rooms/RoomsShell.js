"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Avatar from "./Avatar";
import styles from "./rooms.module.css";

// Square-crop + downscale a chosen image to a small JPEG data URL on the client.
function resizeToDataUrl(file, size = 160) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function RoomsShell({ user, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const m = pathname.match(/^\/rooms\/(\d+)/);
  const activeId = m ? Number(m[1]) : null;

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(null); // room awaiting a password
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [meAvatar, setMeAvatar] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/rooms");
    if (res.ok) setRooms((await res.json()).rooms);
    setLoading(false);
  }, []);

  // Reload on mount and whenever the active room changes (keeps lock state fresh).
  useEffect(() => {
    load();
  }, [load, pathname]);

  // Load the current user's avatar once.
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setMeAvatar(d.user.avatar))
      .catch(() => {});
  }, []);

  async function onPickAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await resizeToDataUrl(file, 160);
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (res.ok) setMeAvatar((await res.json()).avatar);
    } catch {
      /* ignore bad images */
    }
  }

  async function toggleFav(room, e) {
    e.stopPropagation();
    const res = await fetch(`/api/rooms/${room.id}/favorite`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setRooms((rs) =>
        rs.map((r) => (r.id === room.id ? { ...r, isFavorite: d.isFavorite } : r))
      );
    }
  }

  function openRoom(room) {
    if (room.id === activeId) return;
    if (room.isUnlocked) {
      router.push(`/rooms/${room.id}`);
      return;
    }
    setUnlocking(room);
    setPw("");
    setErr("");
  }

  async function submitUnlock(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch(`/api/rooms/${unlocking.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      const target = unlocking.id;
      setUnlocking(null);
      router.push(`/rooms/${target}`);
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Failed to unlock");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <span className={styles.brand}>
            Noobs<span className={styles.brandAccent}>Bot</span> Chat
          </span>
          {user.isAdmin && (
            <a className={styles.editBtn} href="/admin">
              Edit
            </a>
          )}
        </div>
        <div className={styles.topRight}>
          <label className={styles.avatarBtn} title="Change profile picture">
            <Avatar src={meAvatar} name={user.username} size={34} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPickAvatar}
            />
          </label>
          <span className={styles.who}>@{user.username}</span>
          <button className={styles.logout} onClick={logout}>
            Log out
          </button>
          <button className={styles.exitBtn} onClick={() => router.push("/")}>
            Exit
          </button>
        </div>
      </header>

      <div className={`${styles.body} ${activeId ? styles.hasActive : ""}`}>
        <aside className={styles.sidebar}>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : rooms.length === 0 ? (
            <p className={styles.muted}>
              No rooms yet.{user.isAdmin ? " Create one from Admin." : ""}
            </p>
          ) : (
            <ul className={styles.list}>
              {rooms.map((room) => (
                <li key={room.id}>
                  <button
                    className={`${styles.room} ${room.id === activeId ? styles.active : ""}`}
                    onClick={() => openRoom(room)}
                  >
                    <span
                      className={`${styles.star} ${room.isFavorite ? styles.starOn : ""}`}
                      onClick={(e) => toggleFav(room, e)}
                      role="button"
                      aria-label={room.isFavorite ? "Unfavourite" : "Favourite"}
                    >
                      {room.isFavorite ? "★" : "☆"}
                    </span>
                    <span className={styles.name}>{room.name}</span>
                    {room.isDeleted && <span className={styles.delTag}>deleted</span>}
                    {!room.isUnlocked && <span className={styles.lock}>🔒</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className={styles.main}>{children}</main>
      </div>

      {unlocking && (
        <div className={styles.modalBg} onClick={() => setUnlocking(null)}>
          <form
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitUnlock}
          >
            <h2 className={styles.modalTitle}>Enter password for “{unlocking.name}”</h2>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              required
            />
            {err && <p className={styles.error}>{err}</p>}
            <div className={styles.modalRow}>
              <button type="button" className={styles.cancel} onClick={() => setUnlocking(null)}>
                Cancel
              </button>
              <button type="submit" className={styles.enter}>
                Enter
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
