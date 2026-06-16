"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

// ─── Animation variant ─────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 },
  }),
};

// ─── Navigation data ───────────────────────────────────────────────────────
// Product-oriented naming — complements the navbar, does not duplicate it.
const NAV_COLS = [
  {
    heading: "Platform",
    links: [
      { label: "Exam Prep",          href: "#", highlight: true },
      { label: "MBS Billing",        href: "#" },
      { label: "Clinical Templates", href: "#" },
      { label: "Medical Directory",  href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "About",   href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy",    href: "#" },
      { label: "Terms",      href: "#" },
      { label: "Disclaimer", href: "#" },
    ],
  },
];

// ─── Social links ──────────────────────────────────────────────────────────
const SOCIALS = [
  {
    name: "X (Twitter)",
    href: "#",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "LinkedIn",
    href: "#",
    path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
  },
];

// ──────────────────────────────────────────────────────────────────────────
export default function Footer() {
  const [email, setEmail]           = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) { setSubscribed(true); setEmail(""); }
  };

  return (
    <footer className="relative overflow-hidden footer-themed">
      <style>{`
        .footer-themed {
          background: linear-gradient(180deg, #f8fcfb 0%, #eef9f6 55%, #e3f6f1 100%);
        }
        .dark .footer-themed {
          background: linear-gradient(180deg, #0F1115 0%, #0D1018 60%, #0B0E12 100%) !important;
        }
        .dark .footer-heading {
          color: #8c98a8;
        }
        .dark .footer-brand-text {
          color: #b7c0cc;
        }
        .dark .footer-muted {
          color: #8c98a8;
        }
        .dark .footer-divider {
          border-color: rgba(255,255,255,0.08);
        }
        .dark .footer-copyright {
          color: #8c98a8;
        }
        .dark .footer-social-btn {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #8c98a8 !important;
        }
        .dark .footer-social-btn:hover {
          background: rgba(88,193,174,0.1) !important;
          border-color: rgba(88,193,174,0.2) !important;
          color: #58c1ae !important;
        }
        .dark .footer-email-input {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #f3f4f6 !important;
        }
        .dark .footer-email-input::placeholder {
          color: #8c98a8 !important;
        }
        .dark .footer-email-input:focus {
          border-color: #58c1ae !important;
          box-shadow: 0 0 0 3px rgba(88,193,174,0.12) !important;
        }
        .dark .footer-subscribe-btn {
          background: #58c1ae !important;
          box-shadow: 0 4px 12px rgba(88,193,174,0.25) !important;
        }
        .dark .footer-subscribe-btn:hover {
          background: #4db3a0 !important;
        }
      `}</style>
      {/* ── Dot-grid background pattern (matches Hero) ── */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none dark:hidden"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(203,213,225) 1px, transparent 0)",
          backgroundSize:  "28px 28px",
        }}
      />

      {/* ── Ambient orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-48 right-0 w-[560px] h-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.09) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Strong visual separator from landing page content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN FOOTER BODY
      ══════════════════════════════════════════════════════════ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <style>{`
          .footer-link {
            display: inline-flex;
            align-items: center;
            background-color: transparent;
            color: #64748b;
            cursor: pointer;
            font-size: 13.5px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s;
          }
          .dark .footer-link {
            color: #8c98a8;
          }
          .footer-link:before {
            background-color: #14b8a6;
            content: "";
            display: inline-block;
            height: 1.5px;
            margin-right: 0px;
            transition: all .42s cubic-bezier(.25,.8,.25,1);
            width: 0;
          }
          .footer-link:hover {
            color: #0d9488;
          }
          .dark .footer-link:hover {
            color: #58c1ae;
          }
          .dark .footer-link:before {
            background-color: #58c1ae;
          }
          .footer-link:hover:before {
            margin-right: 8px;
            width: 1.25rem;
          }
        `}</style>

        {/*
         * 5-Column grid:
         *  [Brand 2.4fr] [Platform 1fr] [Resources 1fr] [Legal 1fr] [Newsletter 1.6fr]
         */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2.4fr,1fr,1fr,1fr,1.6fr] gap-12 lg:gap-10">

          {/* ── Col 1: Brand ─────────────────────────────────────── */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
          >
            {/* Logo wordmark */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image
                  src="/assets/logo.jpeg"
                  alt="The GP Edge"
                  fill
                  sizes="40px"
                  className="rounded-2xl object-contain shadow-sm ring-1 ring-black/5"
                />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="font-light text-slate-400 dark:text-[#8c98a8] text-[18px]">The</span>
                <span className="font-extrabold text-slate-900 dark:text-[#f3f4f6] tracking-tight text-[18px] ml-1">GP</span>
                <span className="font-medium text-slate-700 dark:text-[#b7c0cc] text-[18px] ml-1">Edge</span>
              </div>
            </div>

            {/* Brand description — professional, no marketing fluff */}
            <p className="text-[14px] text-slate-600 dark:text-[#b7c0cc] leading-[1.7] max-w-[240px] mb-2">
              Australia&apos;s modern preparation platform for GP registrars.
            </p>
            <p className="text-[13px] text-slate-400 dark:text-[#8c98a8] leading-[1.65] max-w-[230px] mb-8">
              Built to support AKT, KFP, clinical learning, medical references, and MBS billing workflows.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="footer-social-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 active:scale-[0.95] transition-all duration-200 shadow-sm"
                >
                  <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </motion.div>

          {/* ── Cols 2–4: Navigation ─────────────────────────────── */}
          {NAV_COLS.map((col, ci) => (
            <motion.div
              key={col.heading}
              custom={ci + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
            >
              <h4 className="footer-heading text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-5">
                {col.heading}
              </h4>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"highlight" in link && link.highlight ? (
                      /* ── "Exam Prep" — animated gradient text with new line effect ── */
                      <a
                        href={link.href}
                        className="footer-link group"
                      >
                        <span className="text-[13.5px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-300 to-teal-600 bg-[length:200%_auto] animate-gradient-x group-hover:scale-105 transition-transform duration-300">
                          {link.label}
                        </span>
                      </a>
                    ) : (
                      /* ── Normal footer link with new line effect ── */
                      <a
                        href={link.href}
                        className="footer-link"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* ── Col 5: Newsletter ─────────────────────────────────── */}
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
          >
            <h4 className="footer-heading text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-5">
              Stay Updated
            </h4>
            <p className="text-[13px] text-slate-500 dark:text-[#b7c0cc] leading-relaxed mb-5">
              Exam prep resources, platform updates, and clinical insights — delivered to your inbox.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 text-[13px] font-medium">
                <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You&apos;re on the list!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="footer-email-input w-full px-4 py-3 text-[13px] bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400 placeholder:text-slate-400 transition-all duration-200 shadow-sm"
                />
                <button
                  type="submit"
                  className="subscribe-animated-btn relative flex items-center justify-center gap-2.5 w-full px-4 py-3 bg-teal-600 dark:bg-[#58c1ae] text-white dark:text-[#0F1115] text-[14px] font-bold rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_10px_20px_rgba(20,184,166,0.2)] hover:scale-[1.03] active:scale-[0.98] group"
                >
                  Subscribe
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1">
                    <path clipRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" fillRule="evenodd" />
                  </svg>
                </button>

                <style>{`
                  .subscribe-animated-btn::before {
                    content: "";
                    position: absolute;
                    width: 100px;
                    height: 100%;
                    background-image: linear-gradient(
                      120deg,
                      rgba(255, 255, 255, 0) 30%,
                      rgba(255, 255, 255, 0.8),
                      rgba(255, 255, 255, 0) 70%
                    );
                    top: 0;
                    left: -100px;
                    opacity: 0.6;
                  }
                  .subscribe-animated-btn:hover::before {
                    animation: shine 1.5s ease-out infinite;
                  }
                  @keyframes shine {
                    0% { left: -100px; }
                    60% { left: 100%; }
                    to { left: 100%; }
                  }
                `}</style>
              </form>
            )}
          </motion.div>

        </div>

        {/* ══════════════════════════════════════════════════════════
            BOTTOM BAR — dedicated section with divider
        ══════════════════════════════════════════════════════════ */}
        <div className="footer-divider mt-10 pt-6 border-t border-slate-200/70">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Left: copyright + tagline */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-5">
              <p className="footer-copyright text-[12.5px] text-slate-400">
                © 2026 The GP Edge. All rights reserved.
              </p>
              <span className="hidden sm:block w-px h-3.5 bg-slate-300 dark:bg-[rgba(255,255,255,0.08)]" />
              <p className="footer-copyright text-[12px] text-slate-400/80">
                Built for Australian GP Registrars
              </p>
            </div>

            {/* Right: legal links */}
            <div className="flex items-center gap-5">
              {[
                { label: "Privacy",  href: "#" },
                { label: "Terms",    href: "#" },
                { label: "Contact",  href: "#" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="footer-copyright text-[12.5px] text-slate-400 hover:text-teal-600 dark:hover:text-[#58c1ae] transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}
