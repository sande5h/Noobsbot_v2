import Link from 'next/link';
import Image from 'next/image';
import s from './project.module.css';

export const metadata = {
  title: 'ESP-Rust Statusbar — Projects · Noobsbot',
  description: 'A VS Code workflow tool for ESP-RS Rust development on Windows. Auto-detects COM ports, picks MCU variants, and flashes with one click from the status bar.',
};

const FEATURES = [
  { icon: '🔌', title: 'Port Selector', desc: 'Auto-detects all connected COM ports and presents them as a dropdown in the VS Code status bar. No manual typing of port names.' },
  { icon: '🎛️', title: 'MCU Picker', desc: 'Supports esp32, s2, s3, c2, c3, c6, and h2. Selecting a variant automatically rewrites .cargo/config.toml to match.' },
  { icon: '⚡', title: 'Build / Flash / Monitor', desc: 'One-click commands in the status bar run silently using the cached port and MCU selection. No terminal wrangling.' },
  { icon: '⚙️', title: 'Auto Configuration', desc: 'On MCU change, the tool regenerates .cargo/config.toml with the correct target and toolchain settings automatically.' },
];

const FLOW = [
  { label: 'Install', sub: 'Run the PowerShell one-liner from your project root. Validates espup, espflash, and path lengths. Optionally installs required VS Code extensions.' },
  { label: 'Pick Your MCU', sub: 'Click the MCU button in the VS Code status bar. Select your ESP32 variant — config.toml is rewritten automatically.' },
  { label: 'Select COM Port', sub: 'Click the port button. The tool scans connected devices and shows a live list. Selection is cached in port.txt.' },
  { label: 'Build, Flash & Monitor', sub: 'Hit the Build, Flash, or Monitor status-bar buttons. Commands run using the cached MCU and port — no manual input needed.' },
];

const PREREQS = [
  { name: 'espup', desc: 'ESP-RS toolchain installer' },
  { name: 'espflash', desc: 'Flashing and monitoring tool' },
  { name: 'VS Code', desc: 'With CLI access (code command in PATH)' },
  { name: 'actboy168.tasks', desc: 'VS Code extension — task visualization in status bar' },
  { name: 'augustocdias.tasks-shell-input', desc: 'VS Code extension — dynamic dropdown inputs' },
  { name: 'Windows', desc: 'PowerShell-based — Windows only' },
];

const STACK = ['PowerShell', 'Rust', 'ESP-RS', 'espflash', 'espup', 'VS Code Tasks', 'COM Port API'];

export default function EspRustStatusbarPage() {
  return (
    <div className={s.page}>

      <header className={s.header}>
        <h1 className={s.heading}>ESP-Rust <span className={s.accent}>Statusbar</span></h1>
        <p className={s.sub}>
          A VS Code workflow tool for ESP-RS Rust development on Windows.
          Auto-detects COM ports, lets you pick your MCU variant from a dropdown,
          and flashes your board with a single status-bar click — no terminal commands needed.
        </p>
        <div className={s.actions}>
          <a
            href="https://github.com/sande5h/esp-rust-statusbar"
            target="_blank"
            rel="noopener noreferrer"
            className={`${s.btn} ${s.btnPrimary}`}
          >
            GitHub ↗
          </a>
        </div>
      </header>

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
        <div className={s.screenshot}>
          <Image
            src="/projects/esp-rust-statusbar/bar_image.jpeg"
            alt="VS Code status bar showing Port, MCU, Build, Flash, Flash+Mon, Monitor and Clean buttons"
            width={519}
            height={21}
            className={s.screenshotImg}
          />
          <p className={s.screenshotCaption}>The status bar buttons added to VS Code after installation</p>
        </div>
      </section>

      {/* How it works */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>How It Works</h2>
        <p className={s.bodyText}>
          The tool installs a set of VS Code tasks and PowerShell scripts into your project.
          The tasks surface as clickable buttons in the VS Code status bar via the <code className={s.code}>actboy168.tasks</code> extension.
          Port and MCU selections are written to plain text files and read back by the flash/build scripts — keeping state simple and transparent.
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

      {/* Installation */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Installation</h2>
        <p className={s.bodyText}>
          From the root of your ESP-RS Rust project, run this one-liner in PowerShell.
          The installer validates your environment, sets up <code className={s.code}>.vscode/</code> task files,
          and optionally installs the required VS Code extensions.
        </p>
        <div className={s.codeBlock}>
          <span className={s.codeBlockLabel}>PowerShell</span>
          <pre className={s.codeBlockPre}><code>iwr https://raw.githubusercontent.com/sande5h/esp-rust-statusbar/main/install.ps1 | iex</code></pre>
        </div>
        <p className={s.bodyText} style={{marginTop: '16px', marginBottom: 0}}>
          After the installer completes, reload VS Code with <code className={s.code}>Ctrl+Shift+P</code> → <code className={s.code}>Developer: Reload Window</code>.
          Your status bar will show the Port, MCU, Build, Flash, and Monitor buttons immediately.
        </p>
        <div className={s.screenshot}>
          <Image
            src="/projects/esp-rust-statusbar/files.jpeg"
            alt=".vscode directory showing flash.ps1, mcu.txt, port.txt, set-mcu.ps1, settings.json and tasks.json"
            width={512}
            height={157}
            className={s.screenshotImg}
            style={{maxWidth: '320px'}}
          />
          <p className={s.screenshotCaption}>Files dropped into <code className={s.code}>.vscode/</code> by the installer</p>
        </div>
      </section>

      {/* Prerequisites */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Prerequisites</h2>
        <div className={s.screenshot} style={{marginBottom: '16px'}}>
          <Image
            src="/projects/esp-rust-statusbar/extension.jpeg"
            alt="actboy168 Tasks extension in VS Code — Load VSCode Tasks into Status Bar"
            width={694}
            height={150}
            className={s.screenshotImg}
          />
          <p className={s.screenshotCaption}>The <code className={s.code}>actboy168.tasks</code> extension that surfaces tasks as status bar buttons</p>
        </div>
        <div className={s.hwTable}>
          {PREREQS.map((p) => (
            <div key={p.name} className={s.hwRow}>
              <div className={s.hwLeft}>
                <div className={s.hwPart}><code className={s.code}>{p.name}</code></div>
              </div>
              <div className={s.hwDesc}>{p.desc}</div>
            </div>
          ))}
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

      {/* Built by */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Built By</h2>
        <div className={s.teamList}>
          <div className={`${s.memberRow} ${s.member_teal}`}>
            <div className={s.memberLeft}>
              <Link href="/sandesh" className={s.memberName}>Sandesh</Link>
              <span className={s.memberRole}>Everything</span>
            </div>
            <div className={s.memberRight}>
              <ul className={s.contributions}>
                <li>Concept & design</li>
                <li>PowerShell scripting</li>
                <li>VS Code task configuration</li>
                <li>COM port detection</li>
                <li>MCU config generation</li>
                <li>Installation workflow</li>
                <li>Testing across ESP32 variants</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
