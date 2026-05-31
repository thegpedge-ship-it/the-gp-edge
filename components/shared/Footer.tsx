"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Compact Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand - Spans 2 cols */}
          <div className="col-span-2">
            {/* Premium Logo & Wordmark */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative h-9 w-9 flex-shrink-0">
                <Image
                  src="/assets/logo.jpeg"
                  alt="The GP Edge"
                  fill
                  className="rounded-[12px] object-contain shadow-sm ring-1 ring-black/5"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-light text-slate-500">The</span>
                <span className="font-extrabold text-slate-900 tracking-tight ml-1">GP</span>
                <span className="font-medium text-slate-700 ml-1">Edge</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-4">
              Smart exam prep and clinical tools for GP registrars in Australia.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {[
                { name: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { name: "LinkedIn", path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" },
              ].map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-teal-600 hover:bg-teal-50 active:scale-[0.96] transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {["Exam Prep", "Bill Better", "Autofills", "Directory"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About", "Pricing", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {["Privacy", "Terms", "Disclaimer"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter CTA */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Stay updated
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
              />
              <button className="px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 active:scale-[0.98] transition-all shadow-sm">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © 2026 The GP Edge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
