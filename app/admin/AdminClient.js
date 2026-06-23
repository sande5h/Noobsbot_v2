"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export default function AdminClient({ meId }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);

  // new-user form
  const [uName, setUName] = useState("");
  const [uPass, setUPass] = useState("");
  const [uAdmin, setUAdmin] = useState(false);
  const [uMsg, setUMsg] = useState("");

  // new-room form
  const [rName, setRName] = useState("");
  const [rPass, setRPass] = useState("");
  const [rMsg, setRMsg] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers((await res.json()).users);
  }
  async function loadRooms() {
    const res = await fetch("/api/rooms");
    if (res.ok) setRooms((await res.json()).rooms);
  }
  useEffect(() => {
    loadUsers();
    loadRooms();
  }, []);

  async function addUser(e) {
    e.preventDefault();
    setUMsg("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: uName, password: uPass, isAdmin: uAdmin }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setUName("");
      setUPass("");
      setUAdmin(false);
      setUMsg(`Added @${d.username}`);
      loadUsers();
    } else {
      setUMsg(d.error || "Failed");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function setRoomDeleted(id, deleted) {
    await fetch(`/api/rooms/${id}`, { method: deleted ? "DELETE" : "PATCH" });
    loadRooms();
  }
  async function setUserDeleted(id, deleted) {
    await fetch(`/api/users/${id}`, { method: deleted ? "DELETE" : "PATCH" });
    loadUsers();
  }

  async function addRoom(e) {
    e.preventDefault();
    setRMsg("");
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rName, password: rPass }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setRName("");
      setRPass("");
      setRMsg(`Created “${d.name}”`);
      loadRooms();
    } else {
      setRMsg(d.error || "Failed");
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <span className={styles.brand}>
          Noobs<span className={styles.brandAccent}>Bot</span> Chat
        </span>
        <div className={styles.topRight}>
          <button className={styles.logout} onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.wrap}>
          <button
            className={styles.back}
            onClick={() => router.push("/rooms")}
            aria-label="Back to chat"
          >
            Back
          </button>
          <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.h2}>Add user</h2>
          <form onSubmit={addUser} className={styles.form}>
            <input
              placeholder="Username"
              value={uName}
              onChange={(e) => setUName(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={uPass}
              onChange={(e) => setUPass(e.target.value)}
              required
            />
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={uAdmin}
                onChange={(e) => setUAdmin(e.target.checked)}
              />
              <span>Make admin</span>
            </label>
            <button type="submit">Add user</button>
            {uMsg && <p className={styles.msg}>{uMsg}</p>}
          </form>

          <ul className={styles.itemList}>
            {users.map((u) => (
              <li key={u.id} className={u.isDeleted ? styles.deleted : ""}>
                <span className={styles.itemName}>
                  @{u.username} {u.isAdmin && <span className={styles.tag}>admin</span>}
                  {u.isDeleted && <span className={styles.tagDel}>deleted</span>}
                </span>
                {u.id !== meId &&
                  (u.isDeleted ? (
                    <button className={styles.restore} onClick={() => setUserDeleted(u.id, false)}>
                      Restore
                    </button>
                  ) : (
                    <button className={styles.del} onClick={() => setUserDeleted(u.id, true)}>
                      Delete
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.h2}>Create room</h2>
          <form onSubmit={addRoom} className={styles.form}>
            <input
              placeholder="Room name"
              value={rName}
              onChange={(e) => setRName(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Room password"
              value={rPass}
              onChange={(e) => setRPass(e.target.value)}
              required
            />
            <button type="submit">Create room</button>
            {rMsg && <p className={styles.msg}>{rMsg}</p>}
          </form>

          <ul className={styles.itemList}>
            {rooms.map((r) => (
              <li key={r.id} className={r.isDeleted ? styles.deleted : ""}>
                <span className={styles.itemName}>
                  {r.name}
                  {r.isDeleted && <span className={styles.tagDel}>deleted</span>}
                </span>
                {r.isDeleted ? (
                  <button className={styles.restore} onClick={() => setRoomDeleted(r.id, false)}>
                    Restore
                  </button>
                ) : (
                  <button className={styles.del} onClick={() => setRoomDeleted(r.id, true)}>
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}
