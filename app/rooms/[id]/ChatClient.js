"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "../Avatar";
import styles from "./chat.module.css";

const POLL_MS = 1500;

export default function ChatClient({ room, user }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const lastId = useRef(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function poll() {
      const res = await fetch(`/api/rooms/${room.id}/messages?after=${lastId.current}`);
      if (!alive) return;
      if (res.status === 403) {
        router.push("/rooms"); // unlock expired (logged out elsewhere)
        return;
      }
      if (res.ok) {
        const d = await res.json();
        if (d.messages.length) {
          lastId.current = d.messages[d.messages.length - 1].id;
          setMessages((m) => [...m, ...d.messages]);
        }
      }
    }

    poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [room.id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const res = await fetch(`/api/rooms/${room.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const d = await res.json();
      // Show immediately; advance lastId so the poller won't re-add it.
      if (d.id > lastId.current) {
        lastId.current = d.id;
        setMessages((m) => [
          ...m,
          { id: d.id, body: d.body, username: user.username, avatar: user.avatar, mine: true },
        ]);
      }
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        <a className={styles.back} href="/rooms" aria-label="Back to rooms">
          ←
        </a>
        <h1 className={styles.name}>{room.name}</h1>
      </header>

      <div className={styles.feed}>
        {messages.map((m) => (
          <div key={m.id} className={`${styles.msg} ${m.mine ? styles.mine : ""}`}>
            {!m.mine && <Avatar src={m.avatar} name={m.username} size={38} />}
            <div className={styles.bubble}>
              {!m.mine && <span className={styles.author}>{m.username}</span>}
              <span className={styles.text}>{m.body}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className={styles.composer} onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${room.name}…`}
          autoFocus
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
