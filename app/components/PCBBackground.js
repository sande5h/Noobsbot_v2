"use client";

import { useEffect, useRef } from "react";
import styles from "./pcb.module.css";

/**
 * Full-screen procedural motherboard. Traces are generated in code, radiating
 * from a central chip with Manhattan + 45deg routing and extending past the
 * screen edges. Glowing cyan "data packets" continuously flow outward along the
 * traces from the chip. Static board is rendered once to an offscreen canvas;
 * only the pulses + chip are redrawn each frame.
 */
const COLORS = { bg: "#ffffff", via: "#9aa6a0" };

// 8 octilinear unit directions (45deg increments). Traces only ever turn by
// +/-45deg (one step around this table), so corners are never perpendicular.
const S = Math.SQRT1_2;
const DIRS = [
  [1, 0],
  [S, S],
  [0, 1],
  [-S, S],
  [-1, 0],
  [-S, -S],
  [0, -1],
  [S, -S],
];

// copper layers (deep -> surface). Each trace lives on one layer; upper traces
// are drawn over lower ones with a bg-colored casing, so crossings read as one
// trace bridging over another rather than intersecting.
const LAYERS = [
  { c: "#c9d2cd", w: 1.6 }, // deep (faintest grey)
  { c: "#aeb8b3", w: 2.0 }, // mid
  { c: "#8f9b95", w: 2.2 }, // surface (darkest grey)
];

// Detail factor: mimics the "zoomed out" look at default zoom. Higher = more
// traces, thinner lines, shorter segments, smaller packets (finer + denser).
const DETAIL = 2;

// data-packet colors (rgb); each pulse picks one at spawn
const PACKETS = [
  [0, 150, 200], // blue
  [210, 0, 120], // magenta
  [0, 160, 70], // green
  [230, 120, 0], // orange
  [120, 40, 220], // violet
  [210, 30, 50], // red
];

export default function PCBBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const board = document.createElement("canvas");
    const bctx = board.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0,
      H = 0,
      dpr = 1;
    let traces = [];
    let pulses = [];
    let raf = 0;

    function genTrace() {
      let x = Math.random() * W,
        y = Math.random() * H;
      const pts = [{ x, y }];
      let k = (Math.random() * 8) | 0; // initial heading (45deg increment)
      const steps = 10 + ((Math.random() * 16) | 0);
      const seg = () => (40 + Math.random() * 140) / DETAIL;
      for (let s = 0; s < steps; s++) {
        const r = Math.random();
        if (r > 0.62) k = (k + (r > 0.81 ? 1 : 7)) & 7; // turn only +/-45deg, never 90
        const L = seg();
        x += DIRS[k][0] * L;
        y += DIRS[k][1] * L;
        pts.push({ x, y });
        if (x < -80 || x > W + 80 || y < -80 || y > H + 80) break; // run off-screen
      }
      const cum = [0];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        cum.push(total);
      }
      return { pts, cum, total };
    }

    function pointAt(tr, d) {
      const { pts, cum, total } = tr;
      if (d <= 0) return pts[0];
      if (d >= total) return pts[pts.length - 1];
      let i = 1;
      while (i < cum.length && cum[i] < d) i++;
      const a = pts[i - 1],
        b = pts[i];
      const segLen = cum[i] - cum[i - 1] || 1;
      const f = (d - cum[i - 1]) / segLen;
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }

    function tracePath(c, tr) {
      c.beginPath();
      c.moveTo(tr.pts[0].x, tr.pts[0].y);
      for (let i = 1; i < tr.pts.length; i++) c.lineTo(tr.pts[i].x, tr.pts[i].y);
    }

    function buildBoard() {
      traces = [];
      const count = Math.round(
        Math.max(100, Math.min(1100, (W * H * DETAIL * DETAIL) / 11000)),
      );
      for (let i = 0; i < count; i++) {
        const t = genTrace();
        if (t.total > 90 / DETAIL) {
          t.layer = (Math.random() * LAYERS.length) | 0;
          traces.push(t);
        }
      }
      // draw deepest layers first so upper layers can bridge over them
      traces.sort((a, b) => a.layer - b.layer);

      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.fillStyle = COLORS.bg;
      bctx.fillRect(0, 0, W, H);
      bctx.lineJoin = "round";
      bctx.lineCap = "round";

      for (const tr of traces) {
        const cfg = LAYERS[tr.layer];
        // casing: knocks out whatever is beneath so this trace passes over it
        bctx.strokeStyle = COLORS.bg;
        bctx.lineWidth = (cfg.w + 3.5) / DETAIL;
        tracePath(bctx, tr);
        bctx.stroke();
        // copper core
        bctx.strokeStyle = cfg.c;
        bctx.lineWidth = cfg.w / DETAIL;
        tracePath(bctx, tr);
        bctx.stroke();
      }

      // vias at trace endpoints (where a trace would drop to another layer)
      bctx.fillStyle = COLORS.via;
      for (const tr of traces) {
        const p = tr.pts[tr.pts.length - 1];
        if (p.x > 0 && p.x < W && p.y > 0 && p.y < H) {
          bctx.beginPath();
          bctx.arc(p.x, p.y, 3 / DETAIL, 0, Math.PI * 2);
          bctx.fill();
        }
      }
    }

    function initPulses() {
      const n = Math.max(120, Math.min(650, Math.round(traces.length * 0.7)));
      pulses = [];
      for (let i = 0; i < n; i++) pulses.push(spawn(true));
    }

    function spawn(initial) {
      const ti = (Math.random() * traces.length) | 0;
      const dir = Math.random() < 0.5 ? 1 : -1; // +1 outward, -1 inward
      const total = traces[ti].total;
      return {
        ti,
        ci: (Math.random() * PACKETS.length) | 0,
        dir,
        d: initial ? Math.random() * total : dir > 0 ? 0 : total,
        speed: 1.6 + Math.random() * 2.65,
        len: (46 + Math.random() * 70) / DETAIL,
      };
    }

    function frame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(board, 0, 0, W, H);

      for (const p of pulses) {
        const tr = traces[p.ti];
        p.d += p.speed * p.dir;
        if (p.d > tr.total || p.d < 0) {
          Object.assign(p, spawn(false));
          continue;
        }
        const [r, g, b] = PACKETS[p.ci];
        const depth = 0.6 + 0.2 * tr.layer; // deeper layers slightly dimmer
        const N = 6,
          step = p.len / N;
        for (let k = 0; k < N; k++) {
          const a = pointAt(tr, p.d - p.dir * k * step);
          const b2 = pointAt(tr, p.d - p.dir * (k + 1) * step);
          ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - k / N) * 0.55 * depth})`;
          ctx.lineWidth = (2.4 * (1 - k / N) + 0.6) / DETAIL;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b2.x, b2.y);
          ctx.stroke();
        }
        const head = pointAt(tr, p.d);
        ctx.fillStyle = `rgba(${r},${g},${b},${depth})`;
        ctx.beginPath();
        ctx.arc(head.x, head.y, (2.6 + tr.layer * 0.4) / DETAIL, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function renderStatic() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(board, 0, 0, W, H);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      board.width = W * dpr;
      board.height = H * dpr;
      buildBoard();
      initPulses();
      if (reduce) renderStatic();
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
