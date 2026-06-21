"use client";

import { useState, Fragment } from "react";
import s from "./tools.module.css";

/* ── Helpers ── */
function fmtNum(n, d = 4) {
  if (n == null || !isFinite(n) || isNaN(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(3);
  return parseFloat(n.toPrecision(d)).toString();
}
function fmtUnit(v, u) {
  if (v == null || !isFinite(v) || isNaN(v)) return "—";
  const a = Math.abs(v);
  if (u === "Ω") {
    if (a >= 1e6) return fmtNum(v / 1e6) + " MΩ";
    if (a >= 1e3) return fmtNum(v / 1e3) + " kΩ";
    return fmtNum(v) + " Ω";
  }
  if (u === "A") {
    if (a < 1e-3) return fmtNum(v * 1e6) + " µA";
    if (a < 1)    return fmtNum(v * 1e3) + " mA";
    return fmtNum(v) + " A";
  }
  if (u === "V") return fmtNum(v) + " V";
  if (u === "W") {
    if (a < 1e-3) return fmtNum(v * 1e6) + " µW";
    if (a < 1)    return fmtNum(v * 1e3) + " mW";
    return fmtNum(v) + " W";
  }
  return fmtNum(v) + " " + u;
}

/* ── Resistor color data (tcr = temperature coefficient, ppm/K) ── */
const COLORS = [
  { name: "Black",  hex: "#111",    digit: 0,    mult: 1,     tol: null, tcr: 250  },
  { name: "Brown",  hex: "#7c3a18", digit: 1,    mult: 10,    tol: 1,    tcr: 100  },
  { name: "Red",    hex: "#c0392b", digit: 2,    mult: 100,   tol: 2,    tcr: 50   },
  { name: "Orange", hex: "#e67e22", digit: 3,    mult: 1e3,   tol: null, tcr: 15   },
  { name: "Yellow", hex: "#f1c40f", digit: 4,    mult: 1e4,   tol: null, tcr: 25   },
  { name: "Green",  hex: "#27ae60", digit: 5,    mult: 1e5,   tol: 0.5,  tcr: 20   },
  { name: "Blue",   hex: "#2980b9", digit: 6,    mult: 1e6,   tol: 0.25, tcr: 10   },
  { name: "Violet", hex: "#8e44ad", digit: 7,    mult: 1e7,   tol: 0.1,  tcr: 5    },
  { name: "Gray",   hex: "#7f8c8d", digit: 8,    mult: 1e8,   tol: 0.05, tcr: 1    },
  { name: "White",  hex: "#ddd",    digit: 9,    mult: 1e9,   tol: null, tcr: null },
  { name: "Gold",   hex: "#d4a017", digit: null, mult: 0.1,   tol: 5,    tcr: null },
  { name: "Silver", hex: "#aaa",    digit: null, mult: 0.01,  tol: 10,   tcr: null },
];

const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
function nearestE12(val) {
  if (val <= 0) return null;
  const exp = Math.floor(Math.log10(val));
  const base = val / Math.pow(10, exp);
  let best = E12[E12.length - 1];
  for (const v of E12) { if (v >= base) { best = v; break; } }
  return best * Math.pow(10, exp);
}

const TOL_MAP = {
  B: "±0.1 pF", C: "±0.25 pF", D: "±0.5 pF",
  F: "±1%", G: "±2%", J: "±5%", K: "±10%", M: "±20%", Z: "+80% / -20%",
};

const TABS = [
  { id: "ohm",       label: "Ohm's Law" },
  { id: "resistor",  label: "Resistor Color" },
  { id: "led",       label: "LED Resistor" },
  { id: "divider",   label: "Voltage Divider" },
  { id: "trace",     label: "PCB Trace Width" },
  { id: "impedance", label: "Trace Impedance" },
  { id: "capcode",   label: "Cap Code" },
];

/* ════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════ */
export default function ToolsClient() {
  const [tab, setTab] = useState("ohm");

  return (
    <div className={s.page}>
      <div className={s.container}>

        <header className={s.header}>
          <div className={s.logoBlock}>
            <h1 className={s.logoTitle}>Tools</h1>
          </div>
        </header>

        <nav className={s.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${s.tab} ${tab === t.id ? s.tabActive : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "ohm"       && <OhmCalc />}
        {tab === "resistor"  && <ResistorCalc />}
        {tab === "led"       && <LedCalc />}
        {tab === "divider"   && <DividerCalc />}
        {tab === "trace"     && <TraceCalc />}
        {tab === "impedance" && <ImpedanceCalc />}
        {tab === "capcode"   && <CapCodeCalc />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   1. OHM'S LAW
═════════════════════════════════════════ */
function OhmCalc() {
  const [v, setV] = useState(""); const [vU, setVU] = useState(1);
  const [iV, setIV] = useState(""); const [iU, setIU] = useState(1);
  const [r, setR] = useState(""); const [rU, setRU] = useState(1);
  const [p, setP] = useState(""); const [pU, setPU] = useState(1);

  // Ohm's law is fully defined by ANY TWO of the four quantities. Entering a
  // third over-determines the system and can conflict, so we require exactly
  // two inputs (like ohmslawcalculator.com) and solve for the other two.
  const NAME = { v: "Voltage", i: "Current", r: "Resistance", p: "Power" };
  const fields = {
    v: v !== "" ? parseFloat(v) * vU : NaN,
    i: iV !== "" ? parseFloat(iV) * iU : NaN,
    r: r !== "" ? parseFloat(r) * rU : NaN,
    p: p !== "" ? parseFloat(p) * pU : NaN,
  };
  const given = ["v", "i", "r", "p"].filter((k) => isFinite(fields[k]));

  let rv = null, ri = null, rr = null, rp = null;
  let note = "";
  let computed = [];

  if (given.length === 2) {
    let V = isFinite(fields.v) ? fields.v : null;
    let I = isFinite(fields.i) ? fields.i : null;
    let R = isFinite(fields.r) ? fields.r : null;
    let P = isFinite(fields.p) ? fields.p : null;
    switch (given.join("")) {
      case "vi": R = V / I; P = V * I; break;
      case "vr": I = V / R; P = (V * V) / R; break;
      case "vp": I = P / V; R = (V * V) / P; break;
      case "ir": V = I * R; P = I * I * R; break;
      case "ip": V = P / I; R = P / (I * I); break;
      case "rp": V = Math.sqrt(P * R); I = Math.sqrt(P / R); break;
      default: break;
    }
    rv = V; ri = I; rr = R; rp = P;
    computed = ["v", "i", "r", "p"].filter((k) => !given.includes(k));
    note = "";
  } else if (given.length > 2) {
    const extra = given.length - 2;
    note = `Too many values — Ohm's law needs exactly two. Clear ${extra} field${extra > 1 ? "s" : ""}.`;
  }

  // once two values are entered, lock the remaining fields
  const locked = given.length === 2;
  const dis = (k) => locked && !given.includes(k);
  const lockTitle = "Only two inputs allowed";

  return (
    <section>
      <div className={s.calcHeader}>
        <div className={s.calcTitle}>Ohm&apos;s Law Calculator</div>
        <div className={s.calcDesc}>
          Voltage (V) = Current (I) × Resistance (R)
          <br />
          Power (P) = Voltage (V) × Current (I)
        </div>
      </div>
      <div className={s.grid}>
        <div className={s.panel}>
          <div className={s.panelLabel}>Inputs</div>
          <Field label="Voltage (V)">
            <div className={s.inputRow} title={dis("v") ? lockTitle : undefined}>
              <NumInput value={v} onValue={setV} placeholder="Voltage" disabled={dis("v")} locked={dis("v")} />
              <select className={s.unitSelect} value={vU} onChange={e => setVU(parseFloat(e.target.value))} disabled={dis("v")}>
                <option value={0.001}>mV</option><option value={1}>V</option><option value={1000}>kV</option>
              </select>
            </div>
          </Field>
          <Field label="Current (I)">
            <div className={s.inputRow} title={dis("i") ? lockTitle : undefined}>
              <NumInput value={iV} onValue={setIV} placeholder="Current" disabled={dis("i")} locked={dis("i")} />
              <select className={s.unitSelect} value={iU} onChange={e => setIU(parseFloat(e.target.value))} disabled={dis("i")}>
                <option value={1}>A</option><option value={0.001}>mA</option><option value={0.000001}>µA</option>
              </select>
            </div>
          </Field>
          <Field label="Resistance (R)">
            <div className={s.inputRow} title={dis("r") ? lockTitle : undefined}>
              <NumInput value={r} onValue={setR} placeholder="Resistance" disabled={dis("r")} locked={dis("r")} />
              <select className={s.unitSelect} value={rU} onChange={e => setRU(parseFloat(e.target.value))} disabled={dis("r")}>
                <option value={1}>Ω</option><option value={1000}>kΩ</option><option value={1000000}>MΩ</option>
              </select>
            </div>
          </Field>
          <Field label="Power (P)">
            <div className={s.inputRow} title={dis("p") ? lockTitle : undefined}>
              <NumInput value={p} onValue={setP} placeholder="Power" disabled={dis("p")} locked={dis("p")} />
              <select className={s.unitSelect} value={pU} onChange={e => setPU(parseFloat(e.target.value))} disabled={dis("p")}>
                <option value={1}>W</option><option value={0.001}>mW</option><option value={1000}>kW</option>
              </select>
            </div>
          </Field>
          <button className={s.btn} onClick={() => { setV(""); setIV(""); setR(""); setP(""); }}>Clear All</button>
        </div>
        <div className={s.panel}>
          <div className={s.panelLabel}>Results</div>
          <OutputRow k="Voltage"    v={fmtUnit(rv, "V")} hot={computed.includes("v")} />
          <OutputRow k="Current"    v={fmtUnit(ri, "A")} hot={computed.includes("i")} />
          <OutputRow k="Resistance" v={fmtUnit(rr, "Ω")} hot={computed.includes("r")} />
          <OutputRow k="Power"      v={fmtUnit(rp, "W")} hot={computed.includes("p")} />
          {note && <div className={s.note}>{note}</div>}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   2. RESISTOR COLOR CODE
═════════════════════════════════════════ */
// default band selections (color indices) per band count
const RES_DEFAULTS = {
  3: [2, 2, 1],          // 220 Ω
  4: [2, 2, 1, 10],      // 220 Ω ±5%
  5: [1, 0, 0, 1, 1],    // 1.00 kΩ ±1%
  6: [1, 0, 0, 1, 1, 1], // 1.00 kΩ ±1% · 100 ppm/K
};

// column layout per band count
const RES_COLS = {
  3: [{ type: "digit", label: "1st" }, { type: "digit", label: "2nd" }, { type: "mult", label: "Multiplier" }],
  4: [{ type: "digit", label: "1st" }, { type: "digit", label: "2nd" }, { type: "mult", label: "Multiplier" }, { type: "tol", label: "Tolerance" }],
  5: [{ type: "digit", label: "1st" }, { type: "digit", label: "2nd" }, { type: "digit", label: "3rd" }, { type: "mult", label: "Multiplier" }, { type: "tol", label: "Tolerance" }],
  6: [{ type: "digit", label: "1st" }, { type: "digit", label: "2nd" }, { type: "digit", label: "3rd" }, { type: "mult", label: "Multiplier" }, { type: "tol", label: "Tolerance" }, { type: "tcr", label: "Temp. Coeff." }],
};

const RES_POSITIONS = {
  3: [80, 110, 140],
  4: [70, 100, 130, 200],
  5: [65, 90, 115, 140, 200],
  6: [58, 80, 102, 124, 148, 205],
};

// compact multiplier label, e.g. ×10, ×1K, ×1M, ×0.1
function fmtMult(m) {
  if (m >= 1e9) return "×" + m / 1e9 + "G";
  if (m >= 1e6) return "×" + m / 1e6 + "M";
  if (m >= 1e3) return "×" + m / 1e3 + "K";
  return "×" + m;
}

// pick black or white text for readability over a swatch colour
function textOn(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1a1a14" : "#ffffff";
}

// the value a colour contributes in a given column
function cellText(type, c) {
  if (type === "digit") return c.digit;
  if (type === "mult") return fmtMult(c.mult);
  if (type === "tol") return `±${c.tol}%`;
  if (type === "tcr") return c.tcr;
  return "";
}

function ResistorCalc() {
  const [count, setCount] = useState(4);
  const [bands, setBands] = useState(RES_DEFAULTS[4]);

  const handleCountChange = (n) => {
    setCount(n);
    setBands(RES_DEFAULTS[n]);
  };
  const setBand = (i, ci) => {
    const next = [...bands]; next[i] = ci; setBands(next);
  };

  const isDigit = (ci) => COLORS[ci]?.digit !== null;
  const cols = RES_COLS[count];

  const validFor = (type, ci) =>
    type === "digit" ? COLORS[ci].digit !== null
    : type === "tol" ? COLORS[ci].tol !== null
    : type === "tcr" ? COLORS[ci].tcr !== null
    : true; // multiplier: any color

  let value = 0, tol = null, tcr = null;
  const digitCount = count <= 4 ? 2 : 3;
  const digitsOk = bands.slice(0, digitCount).every(isDigit);
  if (digitsOk) {
    const sig = bands.slice(0, digitCount).reduce((acc, b) => acc * 10 + COLORS[b].digit, 0);
    value = sig * COLORS[bands[digitCount]].mult;
    if (count === 3) tol = 20;                       // no tolerance band ⇒ ±20%
    else tol = COLORS[bands[digitCount + 1]]?.tol;
    if (count === 6) tcr = COLORS[bands[5]]?.tcr;
  }

  const bandPositions = RES_POSITIONS[count];
  const bandColors = bands.map(b => COLORS[b]?.hex || "#555");

  return (
    <section>
      <div className={s.calcHeader}>
        <div className={s.calcTitle}>Resistor Color Code Decoder ( IEC 60062 )</div>
      </div>

      <div className={s.panel}>
        <div className={s.resistorTop}>
          <div className={s.resistorWrap}>
            <svg width="280" height="100" viewBox="0 0 280 100">
              <line x1="10" y1="50" x2="50" y2="50" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="230" y1="50" x2="270" y2="50" stroke="#0f1b61" strokeWidth="2"/>
              <rect x="50" y="32" width="180" height="36" fill="#c8a96e" stroke="#9a7a4a" strokeWidth="1" rx="14"/>
              {bandPositions.map((x, i) => (
                <rect key={i} x={x} y="32" width="10" height="36" fill={bandColors[i] || "#555"} stroke="#000" strokeWidth="0.5"/>
              ))}
            </svg>
          </div>
          <div className={s.resistorOut}>
            <div className={s.output}>
              <div className={s.outputLabel}>Resistance</div>
              <div className={s.outputValue}>{fmtUnit(value, "Ω")}</div>
            </div>
            <div className={s.output}>
              <div className={s.outputLabel}>Tolerance</div>
              <div className={s.outputValue}>{tol !== null ? `±${tol}%` : "—"}</div>
            </div>
            {count === 6 && (
              <div className={s.output}>
                <div className={s.outputLabel}>Temp. Coeff.</div>
                <div className={s.outputValue}>{tcr !== null ? `${tcr} ppm/K` : "—"}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={s.panel} style={{ marginTop: 20 }}>
        <div className={s.matrixHeader}>
          <div className={s.panelLabel} style={{ marginBottom: 0 }}>Color bands</div>
          <div className={s.bandCount}>
            {[3, 4, 5, 6].map(n => (
              <button
                key={n}
                className={`${s.countBtn} ${count === n ? s.countBtnActive : ""}`}
                onClick={() => handleCountChange(n)}
              >
                {n} Bands
              </button>
            ))}
          </div>
        </div>
        <div
          className={s.matrix}
          style={{ gridTemplateColumns: `minmax(108px, 1.2fr) repeat(${cols.length}, 1fr)` }}
        >
          <div className={s.matrixCorner} />
          {cols.map((c, ci) => (
            <div key={ci} className={s.matrixHead}>{c.label}</div>
          ))}
          {COLORS.map((color, i) => (
            <Fragment key={i}>
              <div className={s.colorLabel}>
                <span className={s.swatchDot} style={{ background: color.hex }} />
                {color.name}
              </div>
              {cols.map((c, ci) =>
                validFor(c.type, i) ? (
                  <button
                    key={ci}
                    type="button"
                    className={`${s.cellBtn} ${bands[ci] === i ? s.cellSelected : ""}`}
                    style={{ background: color.hex, color: textOn(color.hex) }}
                    onClick={() => setBand(ci, i)}
                    aria-label={`${color.name} — ${c.label}`}
                    title={color.name}
                  >
                    {cellText(c.type, color)}
                  </button>
                ) : (
                  <div key={ci} className={s.cellEmpty} />
                )
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   3. LED RESISTOR
═════════════════════════════════════════ */
const LED_PRESETS = [
  { name: "Red", vf: 1.8 },
  { name: "Orange", vf: 2.0 },
  { name: "Yellow", vf: 2.1 },
  { name: "Green", vf: 2.2 },
  { name: "Blue", vf: 3.2 },
  { name: "White", vf: 3.2 },
  { name: "Infrared", vf: 1.4 },
  { name: "UV", vf: 3.4 },
];

function LedCalc() {
  const [vs, setVs]   = useState("5");
  const [vf, setVf]   = useState("2.0");
  const [ifv, setIfv] = useState("20"); const [ifU, setIfU] = useState(0.001);
  const [rv, setRv]   = useState("");   const [rU, setRU] = useState(1);
  const [n, setN]     = useState("1");

  const vsN = parseFloat(vs), vfN = parseFloat(vf);
  const ifN = parseFloat(ifv) * ifU;
  const rGiven = parseFloat(rv) * rU;
  const nN = parseInt(n) || 1;

  const drop = vsN - vfN * nN;                 // voltage across the resistor
  const dropOk = isFinite(vsN) && isFinite(vfN) && drop > 0;
  const haveR = isFinite(rGiven) && rGiven > 0;
  // a resistor entered ⇒ solve for the resulting LED current; otherwise size R from the target current
  const mode = haveR ? "current" : "resistor";

  let reqR = null, stdR = null, ifAtStd = null, ledIf = null, power = null;
  if (dropOk) {
    if (mode === "current") {
      ledIf = drop / rGiven;
      power = drop * ledIf;
    } else if (isFinite(ifN) && ifN > 0) {
      reqR = drop / ifN;
      stdR = nearestE12(reqR);
      ifAtStd = drop / stdR;
      power = drop * ifN;
    }
  }
  const rating = power != null ? (power < 0.125 ? "1/8 W" : power < 0.25 ? "1/4 W" : power < 0.5 ? "1/2 W" : power < 1 ? "1 W" : (Math.ceil(power * 2) / 2) + " W") : null;

  const presetVf = LED_PRESETS.find(p => String(p.vf) === vf)?.vf ?? "";

  return (
    <section>
      <div className={s.calcHeader}>
        <div className={s.calcTitle}>LED Series Resistor</div>
      </div>
      <div className={s.grid}>
        <div className={s.panel}>
          <div className={s.panelLabel}>LED Parameters</div>
          <Field label="LED color (sets Vf)">
            <select className={s.input} value={presetVf} onChange={e => e.target.value && setVf(e.target.value)}>
              <option value="">Custom…</option>
              {LED_PRESETS.map(p => <option key={p.name} value={p.vf}>{p.name} — {p.vf} V</option>)}
            </select>
          </Field>
          <Field label="Supply Voltage (Vs)"><NumInput value={vs} onValue={setVs} /></Field>
          <Field label="LED Forward Voltage (Vf)"><NumInput value={vf} onValue={setVf} /></Field>
          <Field label="LED Forward Current (If)">
            <div className={s.inputRow} title={haveR ? "Clear the resistor to set a target current" : undefined}>
              <NumInput value={ifv} onValue={setIfv} disabled={haveR} locked={haveR} />
              <select className={s.unitSelect} value={ifU} onChange={e => setIfU(parseFloat(e.target.value))} disabled={haveR}>
                <option value={0.001}>mA</option><option value={1}>A</option>
              </select>
            </div>
          </Field>
          <Field label="Resistor (optional — solves for current)">
            <div className={s.inputRow}>
              <NumInput value={rv} onValue={setRv} placeholder="leave blank to size a resistor" />
              <select className={s.unitSelect} value={rU} onChange={e => setRU(parseFloat(e.target.value))}>
                <option value={1}>Ω</option><option value={1000}>kΩ</option><option value={1000000}>MΩ</option>
              </select>
            </div>
          </Field>
          <Field label="LEDs in Series"><NumInput value={n} onValue={setN} min="1" /></Field>
        </div>
        <div className={s.panel}>
          <div className={s.panelLabel}>Output</div>
          <div className={s.diagram}>
            <svg width="260" height="120" viewBox="0 0 260 120">
              <line x1="10" y1="60" x2="60" y2="60" stroke="#0f1b61" strokeWidth="2"/>
              <text x="10" y="50" fill="#7a82a8" fontFamily="monospace" fontSize="11">Vs+</text>
              <rect x="60" y="50" width="50" height="20" fill="none" stroke="#0f1b61" strokeWidth="2"/>
              <text x="68" y="44" fill="#0f1b61" fontFamily="monospace" fontSize="10">R</text>
              <line x1="110" y1="60" x2="140" y2="60" stroke="#0f1b61" strokeWidth="2"/>
              <polygon points="140,50 140,70 160,60" fill="#0f1b61" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="160" y1="48" x2="160" y2="72" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="155" y1="42" x2="160" y2="48" stroke="#0f1b61" strokeWidth="1"/>
              <line x1="160" y1="42" x2="165" y2="48" stroke="#0f1b61" strokeWidth="1"/>
              <text x="138" y="92" fill="#7a82a8" fontFamily="monospace" fontSize="11">LED</text>
              <line x1="160" y1="60" x2="220" y2="60" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="220" y1="55" x2="220" y2="65" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="215" y1="68" x2="225" y2="68" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="217" y1="71" x2="223" y2="71" stroke="#0f1b61" strokeWidth="2"/>
              <text x="210" y="50" fill="#7a82a8" fontFamily="monospace" fontSize="11">GND</text>
            </svg>
          </div>
          {!dropOk && isFinite(vsN) && isFinite(vfN) && <div className={s.note}>Supply voltage too low for {nN} LED(s) in series — needs more than {fmtNum(vfN * nN)} V.</div>}
          {mode === "resistor" ? (
            <>
              <OutputRow k="Required R"     v={reqR ? fmtUnit(reqR, "Ω") : "—"} />
              <OutputRow k="Nearest E12"    v={stdR ? fmtUnit(stdR, "Ω") : "—"} hot />
              <OutputRow k="Current at E12" v={ifAtStd ? fmtUnit(ifAtStd, "A") : "—"} />
            </>
          ) : (
            <OutputRow k="LED Current" v={ledIf ? fmtUnit(ledIf, "A") : "—"} hot />
          )}
          <OutputRow k="Power in Resistor"   v={power ? fmtUnit(power, "W") : "—"} />
          <OutputRow k="Min Resistor Rating" v={rating || "—"} />
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   4. VOLTAGE DIVIDER
═════════════════════════════════════════ */
function DividerCalc() {
  const [vin, setVin]   = useState("12");
  const [r1, setR1]     = useState("10"); const [r1u, setR1u] = useState(1000);
  const [r2, setR2]     = useState("10"); const [r2u, setR2u] = useState(1000);
  const [vout, setVout] = useState("");

  // Vout = Vin·R2/(R1+R2): four quantities, three independent — enter any three.
  const DKEYS = ["vin", "r1", "r2", "vout"];
  const fields = {
    vin:  vin  !== "" ? parseFloat(vin)      : NaN,
    r1:   r1   !== "" ? parseFloat(r1) * r1u : NaN,
    r2:   r2   !== "" ? parseFloat(r2) * r2u : NaN,
    vout: vout !== "" ? parseFloat(vout)     : NaN,
  };
  const given = DKEYS.filter((k) => isFinite(fields[k]));
  const locked = given.length === 3;
  const dis = (k) => locked && !given.includes(k);
  const lockTitle = "Only three inputs allowed";
  const missing = locked ? DKEYS.find((k) => !given.includes(k)) : null;

  let sVin = fields.vin, sR1 = fields.r1, sR2 = fields.r2, sVout = fields.vout;
  if (locked) {
    if (missing === "vout")    sVout = sVin * sR2 / (sR1 + sR2);
    else if (missing === "r2") sR2 = sVout * sR1 / (sVin - sVout);
    else if (missing === "r1") sR1 = sR2 * (sVin - sVout) / sVout;
    else if (missing === "vin") sVin = sVout * (sR1 + sR2) / sR2;
  }
  const allOk = isFinite(sVin) && isFinite(sR1) && isFinite(sR2) && (sR1 + sR2) > 0;
  const i  = allOk ? sVin / (sR1 + sR2) : null;
  const p1 = i != null && isFinite(sR1) ? i * i * sR1 : null;
  const p2 = i != null && isFinite(sR2) ? i * i * sR2 : null;

  // the solved field shows its computed value in its own (locked) input box
  const fmtField = (n) => (isFinite(n) ? String(+n.toPrecision(6)) : "");
  const dVin  = missing === "vin"  ? fmtField(sVin)      : vin;
  const dR1   = missing === "r1"   ? fmtField(sR1 / r1u) : r1;
  const dR2   = missing === "r2"   ? fmtField(sR2 / r2u) : r2;
  const dVout = missing === "vout" ? fmtField(sVout)     : vout;

  return (
    <section>
      <div className={s.calcHeader}>
        <div className={s.calcTitle}>Voltage Divider</div>
      </div>
      <div className={s.grid}>
        <div className={s.panel}>
          <Field label="Input Voltage (Vin)">
            <div title={dis("vin") ? lockTitle : undefined}>
              <NumInput value={dVin} onValue={setVin} disabled={dis("vin")} locked={dis("vin")} placeholder="Vin" />
            </div>
          </Field>
          <Field label="R1">
            <div className={s.inputRow} title={dis("r1") ? lockTitle : undefined}>
              <NumInput value={dR1} onValue={setR1} disabled={dis("r1")} locked={dis("r1")} placeholder="R1" />
              <select className={s.unitSelect} value={r1u} onChange={e => setR1u(parseFloat(e.target.value))} disabled={dis("r1")}>
                <option value={1}>Ω</option><option value={1000}>kΩ</option><option value={1000000}>MΩ</option>
              </select>
            </div>
          </Field>
          <Field label="R2">
            <div className={s.inputRow} title={dis("r2") ? lockTitle : undefined}>
              <NumInput value={dR2} onValue={setR2} disabled={dis("r2")} locked={dis("r2")} placeholder="R2" />
              <select className={s.unitSelect} value={r2u} onChange={e => setR2u(parseFloat(e.target.value))} disabled={dis("r2")}>
                <option value={1}>Ω</option><option value={1000}>kΩ</option><option value={1000000}>MΩ</option>
              </select>
            </div>
          </Field>
          <Field label="Output Voltage (Vout)">
            <div title={dis("vout") ? lockTitle : undefined}>
              <NumInput value={dVout} onValue={setVout} disabled={dis("vout")} locked={dis("vout")} placeholder="Vout" />
            </div>
          </Field>
        </div>
        <div className={s.panel}>
          <div className={s.diagram}>
            <svg width="200" height="180" viewBox="0 0 200 180">
              <line x1="100" y1="10" x2="100" y2="40" stroke="#0f1b61" strokeWidth="2"/>
              <text x="110" y="25" fill="#7a82a8" fontFamily="monospace" fontSize="11">Vin</text>
              <rect x="85" y="40" width="30" height="40" fill="none" stroke="#0f1b61" strokeWidth="2"/>
              <text x="125" y="65" fill="#0f1b61" fontFamily="monospace" fontSize="11">R1</text>
              <line x1="100" y1="80" x2="100" y2="90" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="100" y1="90" x2="160" y2="90" stroke="#0f1b61" strokeWidth="2"/>
              <text x="165" y="94" fill="#2e9bf6" fontFamily="monospace" fontSize="11">Vout</text>
              <line x1="100" y1="90" x2="100" y2="100" stroke="#0f1b61" strokeWidth="2"/>
              <rect x="85" y="100" width="30" height="40" fill="none" stroke="#0f1b61" strokeWidth="2"/>
              <text x="125" y="125" fill="#0f1b61" fontFamily="monospace" fontSize="11">R2</text>
              <line x1="100" y1="140" x2="100" y2="155" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="90" y1="155" x2="110" y2="155" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="93" y1="160" x2="107" y2="160" stroke="#0f1b61" strokeWidth="2"/>
              <line x1="96" y1="165" x2="104" y2="165" stroke="#0f1b61" strokeWidth="2"/>
            </svg>
          </div>
          <OutputRow k="Current Draw" v={fmtUnit(i, "A")} />
          <OutputRow k="Power in R1"  v={fmtUnit(p1, "W")} />
          <OutputRow k="Power in R2"  v={fmtUnit(p2, "W")} />
          <OutputRow k="Total Power"  v={fmtUnit(p1 != null && p2 != null ? p1 + p2 : null, "W")} />
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   5. PCB TRACE WIDTH
═════════════════════════════════════════ */
function TraceCalc() {
  const [i, setI]         = useState("1");
  const [trise, setTrise] = useState("10");
  const [tamb, setTamb]   = useState("25");
  const [len, setLen]     = useState("100");
  const [cu, setCu]       = useState(1);
  const [layer, setLayer] = useState("external");

  const iN = parseFloat(i), trN = parseFloat(trise), taN = parseFloat(tamb);
  const lenN = parseFloat(len), cuN = parseFloat(cu);

  let widthMm = null, widthMils = null, areaMils2 = null, resistance = null, vdrop = null, ploss = null;

  if (isFinite(iN) && isFinite(trN) && trN > 0 && isFinite(cuN)) {
    const k = layer === "external" ? 0.048 : 0.024;
    areaMils2  = Math.pow(iN / (k * Math.pow(trN, 0.44)), 1 / 0.725);
    const thk  = cuN * 1.378;
    widthMils  = areaMils2 / thk;
    widthMm    = widthMils * 0.0254;
    if (isFinite(lenN) && lenN > 0) {
      const rho  = 1.68e-8 * (1 + 0.00393 * (taN + trN - 20));
      const aM2  = areaMils2 * 6.4516e-10;
      const lenM = lenN / 1000;
      resistance = rho * lenM / aM2;
      vdrop = iN * resistance;
      ploss = iN * vdrop;
    }
  }

  return (
    <section>
      <div className={s.calcHeader}>
        <div className={s.calcTitle}>PCB Trace Width Calculator ( IPC-2221 )</div>
      </div>
      <div className={s.grid}>
        <div className={s.panel}>
          <div className={s.panelLabel}>Parameters</div>
          <Field label="Current (A)"><NumInput value={i} onValue={setI} /></Field>
          <Field label="Temperature Rise (°C)"><NumInput value={trise} onValue={setTrise} /></Field>
          <Field label="Ambient Temperature (°C)"><NumInput value={tamb} onValue={setTamb} /></Field>
          <Field label="Trace Length (mm)"><NumInput value={len} onValue={setLen} /></Field>
          <Field label="Copper Weight (oz/ft²)">
            <select className={s.input} value={cu} onChange={e => setCu(parseFloat(e.target.value))}>
              <option value={0.5}>0.5 oz</option><option value={1}>1 oz</option>
              <option value={2}>2 oz</option><option value={3}>3 oz</option>
            </select>
          </Field>
          <Field label="Layer">
            <select className={s.input} value={layer} onChange={e => setLayer(e.target.value)}>
              <option value="external">External (outer layer)</option>
              <option value="internal">Internal (inner layer)</option>
            </select>
          </Field>
        </div>
        <div className={s.panel}>
          <div className={s.panelLabel}>Required Width &amp; Properties</div>
          <OutputRow k="Min Trace Width"       v={widthMm   ? fmtNum(widthMm) + " mm"    : "—"} />
          <OutputRow k="Width (mils)"          v={widthMils ? fmtNum(widthMils) + " mils" : "—"} />
          <OutputRow k="Cross-Sectional Area"  v={areaMils2 ? fmtNum(areaMils2) + " mils²" : "—"} />
          <OutputRow k="Resistance"            v={fmtUnit(resistance, "Ω")} />
          <OutputRow k="Voltage Drop"          v={fmtUnit(vdrop, "V")} />
          <OutputRow k="Power Loss"            v={fmtUnit(ploss, "W")} />
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   6. MICROSTRIP IMPEDANCE
═════════════════════════════════════════ */
function ImpedanceCalc() {
  const [w, setW]   = useState("0.3");
  const [t, setT]   = useState("0.035");
  const [h, setH]   = useState("0.2");
  const [er, setEr] = useState("4.3");

  const wN = parseFloat(w), tN = parseFloat(t), hN = parseFloat(h), erN = parseFloat(er);
  let z0 = null, eeff = null, propDelay = null, wavelen = null;

  if (isFinite(wN) && wN > 0 && isFinite(hN) && hN > 0 && isFinite(erN) && erN > 0) {
    const u = wN / hN;
    const a = 1 + (1/49) * Math.log((Math.pow(u,4) + Math.pow(u/52,2)) / (Math.pow(u,4) + 0.432)) +
              (1/18.7) * Math.log(1 + Math.pow(u/18.1, 3));
    const b = 0.564 * Math.pow((erN - 0.9) / (erN + 3), 0.053);
    eeff = (erN+1)/2 + ((erN-1)/2) * Math.pow(1 + 10/u, -a*b);
    const f = 6 + (2*Math.PI - 6) * Math.exp(-Math.pow(30.666/u, 0.7528));
    z0 = (60 / Math.sqrt(eeff)) * Math.log(f/u + Math.sqrt(1 + Math.pow(2/u, 2)));
    propDelay = Math.sqrt(eeff) / 3e8 * 1e9;
    wavelen   = 3e8 / (1e9 * Math.sqrt(eeff)) * 1000;
  }

  return (
    <section>
      <div className={s.calcHeader}>
        <div className={s.calcTitle}>Microstrip Impedance Calculator</div>
      </div>
      <div className={s.grid}>
        <div className={s.panel}>
          <div className={s.panelLabel}>Geometry</div>
          <Field label="Trace Width W (mm)"><NumInput value={w} onValue={setW} /></Field>
          <Field label="Trace Thickness T (mm)"><NumInput value={t} onValue={setT} /></Field>
          <Field label="Substrate Height H (mm)"><NumInput value={h} onValue={setH} /></Field>
          <Field label="Dielectric Constant εr">
            <NumInput value={er} onValue={setEr} />
            <div className={`${s.note} ${s.noteSmall}`}>FR-4 ≈ 4.3 · Rogers RO4350 ≈ 3.66 · PTFE ≈ 2.1</div>
          </Field>
          <div className={s.diagram}>
            <svg width="240" height="120" viewBox="0 0 240 120">
              <rect x="20" y="60" width="200" height="40" fill="none" stroke="#8f9b95" strokeWidth="1.5"/>
              <text x="22" y="116" fill="#8f9b95" fontFamily="monospace" fontSize="10">Substrate (εr)</text>
              <rect x="20" y="100" width="200" height="6" fill="#0f1b61" opacity="0.6"/>
              <text x="170" y="116" fill="#0f1b61" fontFamily="monospace" fontSize="10">GND</text>
              <rect x="100" y="48" width="40" height="12" fill="#2e9bf6" opacity="0.8"/>
              <text x="106" y="42" fill="#2e9bf6" fontFamily="monospace" fontSize="10">W</text>
              <line x1="160" y1="48" x2="170" y2="48" stroke="#8f9b95" strokeWidth="1"/>
              <line x1="160" y1="60" x2="170" y2="60" stroke="#8f9b95" strokeWidth="1"/>
              <line x1="165" y1="48" x2="165" y2="60" stroke="#8f9b95" strokeWidth="1"/>
              <text x="173" y="58" fill="#8f9b95" fontFamily="monospace" fontSize="9">T</text>
              <line x1="180" y1="60" x2="195" y2="60" stroke="#8f9b95" strokeWidth="1"/>
              <line x1="180" y1="100" x2="195" y2="100" stroke="#8f9b95" strokeWidth="1"/>
              <line x1="187" y1="60" x2="187" y2="100" stroke="#8f9b95" strokeWidth="1"/>
              <text x="198" y="84" fill="#8f9b95" fontFamily="monospace" fontSize="9">H</text>
            </svg>
          </div>
        </div>
        <div className={s.panel}>
          <div className={s.panelLabel}>Output</div>
          <div className={s.output}>
            <div className={s.outputLabel}>Characteristic Impedance Z₀</div>
            <div className={s.outputValue}>{z0 ? fmtNum(z0) + " Ω" : "—"}</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <OutputRow k="Effective εr"       v={eeff     ? fmtNum(eeff)     : "—"} />
            <OutputRow k="Propagation Delay"  v={propDelay ? fmtNum(propDelay) + " ns/m" : "—"} />
            <OutputRow k="Wavelength @ 1GHz"  v={wavelen   ? fmtNum(wavelen)  + " mm"  : "—"} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   7. CAPACITOR CODE DECODER
═════════════════════════════════════════ */
function CapCodeCalc() {
  const [code, setCode] = useState("104");
  const [tol, setTol]   = useState("K");

  let pf = NaN;
  const trimmed = code.trim();
  if (/^\d{3}$/.test(trimmed)) {
    pf = parseInt(trimmed.slice(0, 2)) * Math.pow(10, parseInt(trimmed.charAt(2)));
  } else if (/^\d{2}$/.test(trimmed)) {
    pf = parseInt(trimmed);
  }

  const nf  = isFinite(pf) ? pf / 1000   : null;
  const uf  = isFinite(pf) ? pf / 1e6    : null;
  const pretty = uf != null ? (uf >= 1 ? fmtNum(uf) + " µF" : nf >= 1 ? fmtNum(nf) + " nF" : fmtNum(pf) + " pF") : "—";

  return (
    <section>
      <div className={s.calcHeader}>
        <div className={s.calcTitle}>Capacitor Code Decoder</div>
      </div>
      <div className={s.grid}>
        <div className={s.panel}>
          <div className={s.panelLabel}>Input</div>
          <Field label="3-Digit Code">
            <NumInput type="text" value={code} onValue={setCode} maxLength={4} placeholder="e.g. 104" />
          </Field>
          <Field label="Tolerance Letter (optional)">
            <select className={s.input} value={tol} onChange={e => setTol(e.target.value)}>
              <option value="">—</option>
              <option value="B">B (±0.1pF)</option><option value="C">C (±0.25pF)</option>
              <option value="D">D (±0.5pF)</option><option value="F">F (±1%)</option>
              <option value="G">G (±2%)</option><option value="J">J (±5%)</option>
              <option value="K">K (±10%)</option><option value="M">M (±20%)</option>
              <option value="Z">Z (+80%/-20%)</option>
            </select>
          </Field>
        </div>
        <div className={s.panel}>
          <div className={s.panelLabel}>Decoded Value</div>
          <div className={s.output}>
            <div className={s.outputLabel}>Capacitance</div>
            <div className={s.outputValue}>{pretty}</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <OutputRow k="Picofarads"  v={isFinite(pf) ? fmtNum(pf) + " pF"  : "—"} />
            <OutputRow k="Nanofarads" v={nf != null    ? fmtNum(nf) + " nF"  : "—"} />
            <OutputRow k="Microfarads" v={uf != null   ? fmtNum(uf) + " µF"  : "—"} />
            <OutputRow k="Tolerance"   v={TOL_MAP[tol] || "—"} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Shared sub-components ── */
function Field({ label, children }) {
  return (
    <div className={s.field}>
      <label className={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

// value box with the native spinner hidden and an × button to clear it
function NumInput({ value, onValue, type = "number", disabled, locked, placeholder, min, maxLength }) {
  const hasValue = value !== "" && value != null;
  return (
    <span className={s.numWrap}>
      <input
        className={`${s.input} ${locked ? s.inputLocked : ""}`}
        type={type}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
        min={min}
        maxLength={maxLength}
        disabled={disabled}
      />
      {hasValue && !disabled && (
        <button
          type="button"
          className={s.clearX}
          onClick={() => onValue("")}
          aria-label="Clear field"
          title="Clear"
          tabIndex={-1}
        >
          ×
        </button>
      )}
    </span>
  );
}

function OutputRow({ k, v, hot }) {
  return (
    <div className={s.outputRow}>
      <span className={s.rowKey}>{k}</span>
      <span className={`${s.rowVal} ${hot ? s.rowHot : ""}`}>{v}</span>
    </div>
  );
}
