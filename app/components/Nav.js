"use client";

import { useState } from "react";
import LottieIcon from "./LottieIcon";
import buildAnim from "./lottie/build.json";
import roomsAnim from "./lottie/rooms.json";
import styles from "./nav.module.css";

const LINKS = [
  { label: "Home", href: "/", desc: "Back to the home page." },
  { label: "Tools", href: "/tools", desc: "Electronics & PCB calculator suite." },
  { label: "Land Calc", href: "/land", desc: "Nepali land-unit converter." },
  { label: "Projects", href: "/projects", desc: "Hardware & firmware we've built." },
];

const SERVICES = [
  "Brand Strategy",
  "Brand Identity",
  "User Experience Design",
  "Visual Content",
  "Web Development",
  "eCommerce",
  "Web & Mobile Applications",
  "Embedded & Hardware",
];

const SOCIALS = ["Instagram", "Dribbble", "LinkedIn"];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState(false);

  return (
    <>
      {/* logo + separator + MENU, grouped top-left like robbowen.digital */}
      <header className={styles.nav}>
        <a href="/" className={styles.logo} aria-label="Noobsbot home">
          <span className={styles.wordmark}>
            Noobs<span className={styles.wordmarkAccent}>Bot</span>
          </span>
        </a>
        <span className={styles.sep} aria-hidden="true" />
        <button
          id="menu-toggle"
          className={styles.menuBtn}
          onClick={() => {
            setContact(false);
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className={`${styles.menuMask} ${open ? styles.open : ""}`}>
            <span className={`${styles.label} ${styles.labelMenu}`} aria-hidden="true">
              Menu
            </span>
            <span className={`${styles.label} ${styles.labelClose}`} aria-hidden="true">
              Close
            </span>
          </span>
        </button>
      </header>

      {/* top-right actions: Build (contact flyout) + Rooms (chat) */}
      <div className={styles.topRight}>
        <button
          className={styles.tagline}
          onClick={() => {
            setOpen(false);
            setContact((v) => !v);
          }}
          aria-expanded={contact}
          aria-controls="contact-panel"
          aria-label={contact ? "Close contact form" : "Open contact form"}
        >
          <LottieIcon data={buildAnim} size={46} className={styles.taglineIcon} />
          <span className={`${styles.menuMask} ${contact ? styles.open : ""}`}>
            <span className={`${styles.label} ${styles.labelMenu}`} aria-hidden="true">
              Build
            </span>
            <span className={`${styles.label} ${styles.labelClose}`} aria-hidden="true">
              Close
            </span>
          </span>
        </button>

        <a className={styles.tagline} href="/rooms" aria-label="Open chat rooms">
          <LottieIcon data={roomsAnim} size={46} className={styles.taglineIcon} />
          <span className={styles.menuMask}>
            <span className={`${styles.label} ${styles.labelMenu}`} aria-hidden="true">
              Rooms
            </span>
            <span className={`${styles.label} ${styles.labelClose}`} aria-hidden="true">
              Rooms
            </span>
          </span>
        </a>
      </div>

      {/* primary navigation flyout */}
      <div
        id="main-menu"
        className={`${styles.flyout} ${open ? styles.open : ""}`}
        aria-hidden={!open}
      >
        <div className={styles.mask} />
        <div className={styles.flyoutInner}>
          <ul className={styles.primary}>
            {LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
                <span className={styles.summary}>{l.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* contact / quote-request flyout */}
      <div
        id="contact-panel"
        className={`${styles.flyout} ${contact ? styles.open : ""}`}
        aria-hidden={!contact}
      >
        <div className={`${styles.mask} ${styles.maskContact}`} />
        <div className={`${styles.flyoutInner} ${styles.contactInner}`}>
          <div className={styles.contactGrid}>
            {/* left column: Get in Touch */}
            <aside className={styles.contactInfo}>
              <h2 className={styles.contactTitle}>Get in Touch</h2>
              <a href="mailto:sandesh@evonelectric.com" className={styles.contactEmail}>
                sandesh@evonelectric.com
              </a>
              <ul className={styles.contactSocials}>
                {SOCIALS.map((s) => (
                  <li key={s}>
                    <a href="#">{s}</a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* right column: quote request form */}
            <form
              className={styles.contactForm}
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: wire to backend / email service
              }}
            >
              <p className={styles.formIntro}>Fill the form to request a quote:</p>

              <label className={styles.field}>
                <span>Your Name *</span>
                <input type="text" name="name" required />
              </label>

              <label className={styles.field}>
                <span>Email *</span>
                <input type="email" name="email" required />
              </label>

              <label className={styles.field}>
                <span>Phone (Optional)</span>
                <input type="tel" name="phone" />
              </label>

              <label className={styles.field}>
                <span>Tell us about your project *</span>
                <textarea name="project" rows={4} required />
              </label>

              <fieldset className={styles.services}>
                <legend>Services are interested in</legend>
                <div className={styles.servicesGrid}>
                  {SERVICES.map((s) => (
                    <label key={s} className={styles.checkbox}>
                      <input type="checkbox" name="services" value={s} />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button type="submit" className={styles.submit}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
