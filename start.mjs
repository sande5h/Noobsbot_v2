// Startup wrapper for hosts that don't inject panel env vars into the process.
// The Next standalone server reads only process.env, so we load .env.production
// (placed next to this file in the app root) before starting it.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
try {
  const text = readFileSync(path.join(dir, ".env.production"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const eq = s.indexOf("=");
    if (eq === -1) continue;
    const key = s.slice(0, eq).trim();
    let val = s.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    // Don't override anything the host already set.
    if (process.env[key] === undefined) process.env[key] = val;
  }
} catch (e) {
  console.error("start.mjs: could not read .env.production —", e.message);
}

await import("./server.js");
