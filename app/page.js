"use client";

import { useEffect, useState } from "react";
import styles from "./home.module.css";

const STATUSES = [
  "Developer is Sleeping 😴",
  "Developer is Gaming 🎮",
  "Developer is Touching Grass 🌱",
  "Developer is Buffering… ⏳",
  "Developer ran out of Coffee ☕",
  "Developer is Compiling Excuses 🔧",
  "Developer is AFK 🚪",
  "Developer is Debugging Real Life 🐛",
  "Developer is on a Snack Break 🍕",
  "Developer is Petting the Cat 🐱",
];

export default function Home() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((v) => (v + 1) % STATUSES.length),
      3000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className={styles.wrap}>
      <h1 key={index} className={styles.title}>
        {STATUSES[index]}
      </h1>
      <button
        type="button"
        className={styles.sub}
        onClick={() => document.getElementById("menu-toggle")?.click()}
      >
        Click Me
      </button>
    </section>
  );
}
