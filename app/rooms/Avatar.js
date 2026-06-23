"use client";

import styles from "./avatar.module.css";

// Shows the profile picture, or a coloured circle with the first initial.
export default function Avatar({ src, name, size = 36 }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (src) {
    return (
      <img
        className={styles.img}
        src={src}
        alt={name || ""}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={styles.fallback}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
