"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <>
      <style>{`
        .theme-switch-container {
          display: inline-flex;
          align-items: center;
          /* Use font-size to safely scale the button without inflating layout height */
          font-size: 4.5px;
          margin-left: 12px;
        }

        .theme-switch-label {
          height: 6em;
          width: 12em;
          background-color: #e2e8f0;
          border-radius: 3em;
          box-shadow: inset 0 0.2em 0.8em rgba(0, 0, 0, 0.15), 
                      inset 0 0 0 0.2em rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          transition: transform 0.4s, background-color 0.4s, box-shadow 0.4s;
          border: 1px solid rgba(0,0,0,0.08);
        }

        /* Dark mode track adaptation */
        .dark .theme-switch-label {
          background-color: #1e293b;
          border-color: rgba(255,255,255,0.05);
          box-shadow: inset 0 0 0.5em 0.4em rgba(15, 17, 21, 1),
            inset 0 0 2em 0.1em rgba(0, 0, 0, 0.6), 0 0.4em 1em rgba(0, 0, 0, 0.3),
            inset 0 0 0 0.3em rgba(255, 255, 255, 0.1);
        }

        .theme-switch-label:hover {
          transform: perspective(10em) rotateX(5deg) rotateY(-5deg);
        }

        .theme-switch-checkbox:checked ~ .theme-switch-label:hover {
          transform: perspective(10em) rotateX(-5deg) rotateY(5deg);
        }

        .theme-switch-checkbox {
          display: none;
        }

        /* Dark mode ball */
        .theme-switch-checkbox:checked ~ .theme-switch-label::before {
          left: 7em;
          background-color: #ffffff;
          background-image: linear-gradient(315deg, #A8B1BD 0%, #ffffff 70%);
          box-shadow: 0 0.2em 0.1em rgba(0, 0, 0, 0.5), 1em 1em 1em rgba(0, 0, 0, 0.5);
          transition: 0.4s;
        }

        /* Light mode ball */
        .theme-switch-label::before {
          position: absolute;
          content: "";
          height: 4em;
          width: 4em;
          border-radius: 50%;
          background-color: #000000;
          background-image: linear-gradient(
            130deg,
            #757272 10%,
            #ffffff 11%,
            #726f6f 62%
          );
          left: 1em;
          box-shadow: 0 0.2em 0.1em rgba(0, 0, 0, 0.3), 1em 1em 1em rgba(0, 0, 0, 0.3);
          transition: 0.4s;
        }
      `}</style>
      <div className="theme-switch-container relative group">
        <input 
          type="checkbox" 
          className="theme-switch-checkbox" 
          id="theme-switch-checkbox" 
          checked={isDark}
          onChange={() => setTheme(isDark ? 'light' : 'dark')}
        />
        <label htmlFor="theme-switch-checkbox" className="theme-switch-label"> </label>

        {/* Theme Toggle Popup */}
        <div className="absolute top-full right-1/2 translate-x-1/2 mt-5 w-[180px] p-3.5 bg-slate-900 dark:bg-slate-800 rounded-xl shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-[60] border border-slate-700">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-slate-800 border-l border-t border-slate-700 rotate-45 rounded-sm" />
          <div className="relative z-10 flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-bold text-[#58c1ae] uppercase tracking-wider">Appearance</span>
          </div>
          <p className="relative z-10 text-[12px] text-slate-300 dark:text-slate-200 leading-[1.4] m-0">
            Switch between light and dark themes.
          </p>
        </div>
      </div>
    </>
  );
}
