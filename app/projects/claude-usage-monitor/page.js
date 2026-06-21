import Image from 'next/image';
import Link from 'next/link';
import s from './project.module.css';

export const metadata = {
  title: 'Claude Usage Monitor — Projects · Noobsbot',
  description: 'A physical ESP32-C3 device that shows real-time Claude AI usage on an OLED display. Built by Sandesh, Ramu, and Nishan.',
};

const TEAM = [
  {
    name: 'Sandesh',
    role: 'Embedded Software',
    color: 'teal',
    contributions: [
      'Rust firmware for ESP32-C3',
      'SSD1306 OLED driver over I²C',
      'Piezo buzzer PWM control via LEDC',
      'Python proxy server on the PC side',
      'Dual-limit usage polling & threshold logic',
      'Hardware bring-up & end-to-end testing',
    ],
    href: '/sandesh',
  },
  {
    name: 'Ramu',
    role: 'Hardware Architecture',
    color: 'gold',
    contributions: [
      'System-level hardware design',
      'Component selection — ESP32-C3, SSD1306, TP4056',
      'Power path design: LiPo → TP4056 → AMS1117-3.3V',
      'EasyEDA schematic authoring',
      'I²C & GPIO pinout planning',
    ],
    href: '/ramu',
  },
  {
    name: 'Nishan',
    role: 'PCB & Validation',
    color: 'muted',
    contributions: [
      'Physical component wiring & assembly',
      'PCB connection validation against schematic',
      'Hardware fault finding & rework',
      'Enclosure fit & screw-mount verification',
      'Final device sign-off',
    ],
    href: '/nishan',
  },
];

const STACK = [
  'ESP32-C3', 'Rust', 'Python', 'SSD1306 OLED',
  'I²C', 'LEDC PWM', 'TP4056', 'AMS1117-3.3V',
  'LiPo Battery', 'HTTP / LAN', 'EasyEDA',
];

const FEATURES = [
  { icon: '📊', title: 'Real-time Usage', desc: 'Polls Claude API every 20 seconds and updates the OLED display live.' },
  { icon: '⏱️', title: 'Dual-limit Tracking', desc: 'Shows both 5-hour rolling usage and 7-day weekly percentage at the same time.' },
  { icon: '🔊', title: 'Audio Alerts', desc: 'Piezo buzzer beeps at every 10% usage increment so you never miss a spike.' },
  { icon: '🔋', title: 'Battery Powered', desc: 'LiPo cell with TP4056 charging and AMS1117 regulation — fully portable, no USB tether.' },
  { icon: '📡', title: 'Offline Resilient', desc: 'Caches the last known values and shows a "stale" indicator when the API is unreachable.' },
  { icon: '📦', title: 'Encased', desc: 'White 3D-printed enclosure with corner screws and a friction-fit display cutout.' },
];

const HARDWARE = [
  { part: 'ESP32-C3 Dev Board', role: 'Microcontroller', desc: 'RISC-V core, Wi-Fi, runs the Rust firmware. Handles I²C, PWM, and HTTP client.' },
  { part: 'SSD1306 128×64 OLED', role: 'Display', desc: 'Monochrome OLED connected via I²C. Shows usage percentages, time remaining, and progress bars.' },
  { part: 'Passive Piezo Buzzer', role: 'Audio', desc: 'Driven by ESP32-C3 LEDC PWM. Beeps once per 10% usage threshold crossed.' },
  { part: 'TP4056 Module', role: 'Battery Charger', desc: 'Li-ion / LiPo single-cell charger. Charges from USB, outputs to the battery.' },
  { part: 'AMS1117-3.3V LDO', role: 'Voltage Regulator', desc: 'Steps down the 3.7V battery to a stable 3.3V rail for the ESP32-C3 and OLED.' },
  { part: '3.7V LiPo Cell', role: 'Power Source', desc: 'Rechargeable lithium polymer battery. Powers the entire device when unplugged.' },
];

const FLOW = [
  { label: 'Claude Account', sub: 'Any paid Claude subscription. OAuth login is completed once on the PC — the token is then cached by the proxy server for all future requests.', side: 'cloud' },
  { label: 'Python Proxy', sub: 'ccusage_server.py — runs on your PC, caches OAuth token, serves data over LAN via HTTP, 60 s response cache', side: 'pc' },
  { label: 'ESP32-C3 Firmware', sub: 'Rust — polls proxy every 20 s, parses JSON, drives OLED and buzzer', side: 'device' },
  { label: 'SSD1306 OLED', sub: 'Displays DAILY % + time remaining, WEEKLY % + days remaining, progress bars', side: 'device' },
];

export default function ProjectsPage() {
  return (
    <div className={s.page}>

      <header className={s.header}>
        <h1 className={s.heading}>Claude Usage <span className={s.accent}>Monitor</span></h1>
        <p className={s.sub}>
          A physical ESP32-C3 device that streams real-time Claude AI usage to an OLED display over your local network.
          Rust firmware on the microcontroller, Python proxy on the PC, battery powered and fully encased.
          Built end-to-end by a team of three.
        </p>
        <div className={s.actions}>
          <a
            href="https://github.com/sande5h/cluade_usage_desktop"
            target="_blank"
            rel="noopener noreferrer"
            className={`${s.btn} ${s.btnPrimary}`}
          >
            GitHub ↗
          </a>
          <a href="/projects/schematic.pdf" download className={`${s.btn} ${s.btnSecondary}`}>
            Schematic PDF ↓
          </a>
        </div>
      </header>

      {/* Device photo */}
      <div className={s.photoWrap}>
        <Image
          src="/projects/device.png"
          alt="Claude Usage Monitor device showing DAILY 29% and WEEKLY 5% on OLED"
          width={1448}
          height={1086}
          className={s.photo}
          priority
        />
        <p className={s.photoCaption}>The finished device — OLED showing daily &amp; weekly Claude usage with progress bars</p>
      </div>

      {/* Features */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Features</h2>
        <div className={s.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={s.featureCard}>
              <span className={s.featureIcon}>{f.icon}</span>
              <div>
                <div className={s.featureTitle}>{f.title}</div>
                <div className={s.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>How It Works</h2>
        <p className={s.bodyText}>
          The system has two halves. A lightweight Python server runs on your PC, authenticates with Anthropic using your OAuth token,
          and polls the usage API every 20 seconds with a 60-second response cache. The ESP32-C3 device connects to the same local
          network, queries the Python server over plain HTTP, and renders the result to the OLED — all in real time.
        </p>
        <div className={s.flowList}>
          {FLOW.map((step, i) => (
            <div key={step.label} className={s.flowStep}>
              <div className={s.flowIndex}>{i + 1}</div>
              <div className={s.flowBody}>
                <div className={s.flowLabel}>{step.label}</div>
                <div className={s.flowSub}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hardware */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Hardware Components</h2>
        <div className={s.hwTable}>
          {HARDWARE.map((h) => (
            <div key={h.part} className={s.hwRow}>
              <div className={s.hwLeft}>
                <div className={s.hwPart}>{h.part}</div>
                <div className={s.hwRole}>{h.role}</div>
              </div>
              <div className={s.hwDesc}>{h.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Software architecture */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Software Architecture</h2>
        <div className={s.swGrid}>
          <div className={s.swCard}>
            <div className={s.swCardTitle}>PC — Python Proxy</div>
            <div className={s.swCardFile}>ccusage_server.py</div>
            <ul className={s.swList}>
              <li>Authenticates with Anthropic using a cached OAuth token</li>
              <li>Fetches <code className={s.code}>/api/oauth/usage</code> from Anthropic</li>
              <li>Caches the API response for 60 seconds to avoid rate-limiting</li>
              <li>Exposes a simple HTTP endpoint on the local network</li>
              <li>ESP32-C3 polls this endpoint every 20 seconds</li>
            </ul>
          </div>
          <div className={s.swCard}>
            <div className={s.swCardTitle}>Device — Rust Firmware</div>
            <div className={s.swCardFile}>ESP32-C3 · no_std Rust</div>
            <ul className={s.swList}>
              <li>Connects to Wi-Fi and polls the Python proxy over HTTP</li>
              <li>Parses the JSON response for daily and weekly usage values</li>
              <li>Renders usage %, time remaining, and progress bars to OLED via I²C</li>
              <li>Triggers buzzer via LEDC PWM at each 10% threshold</li>
              <li>Shows a "stale" indicator if the server is unreachable</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Tech Stack</h2>
        <div className={s.tagList}>
          {STACK.map((t) => (
            <span key={t} className={s.tag}>{t}</span>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Team</h2>
        <div className={s.teamList}>
          {TEAM.map((m) => (
            <div key={m.name} className={`${s.memberRow} ${s[`member_${m.color}`]}`}>
              <div className={s.memberLeft}>
                <Link href={m.href} className={s.memberName}>{m.name}</Link>
                <span className={s.memberRole}>{m.role}</span>
              </div>
              <div className={s.memberRight}>
                <ul className={s.contributions}>
                  {m.contributions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Schematic */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Schematic</h2>
        <p className={s.schematicNote}>
          Designed in EasyEDA. Power path: USB → TP4056 → 3.7V LiPo → AMS1117-3.3V → ESP32-C3 &amp; OLED.
          The OLED is wired to GPIO via I²C (SDA/SCL) and the buzzer is driven by a dedicated GPIO with LEDC PWM.
        </p>
        <div className={s.schematicWrap}>
          <Image
            src="/projects/schematic-1.png"
            alt="Hardware schematic — ESP32-C3, SSD1306 OLED, Buzzer, TP4056, AMS1117"
            width={1767}
            height={1250}
            className={s.schematicImg}
          />
          <a href="/projects/schematic.pdf" download className={`${s.btn} ${s.btnSecondary} ${s.schematicDl}`}>
            Download Schematic PDF ↓
          </a>
        </div>
      </section>

    </div>
  );
}
