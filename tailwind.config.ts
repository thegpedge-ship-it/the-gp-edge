import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  safelist: [
    // Dynamic color classes used in components
    "bg-emerald-500/10", "bg-violet-500/10", "bg-cyan-500/10", "bg-amber-500/10",
    "border-emerald-500/20", "border-violet-500/20", "border-cyan-500/20", "border-amber-500/20",
    "text-emerald-400", "text-violet-400", "text-cyan-400", "text-amber-400",
    "text-emerald-500", "text-violet-500", "text-cyan-500", "text-amber-500",
    "bg-emerald-500", "bg-violet-500", "bg-amber-500",
    "bg-violet-400/30", "bg-violet-300/30", "bg-violet-200/30",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-lora)", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        neo: "8px 8px 16px rgba(0, 0, 0, 0.06), -8px -8px 16px rgba(255, 255, 255, 0.8)",
        "neo-dark":
          "8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.05)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.08)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
      },
      animation: {
        "gradient-x": "gradient-x 3s ease infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
