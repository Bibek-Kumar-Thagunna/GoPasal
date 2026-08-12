import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gp: {
          navy: "#0b0f19",
          deep: "#0a0b1e",
          panel: "#111827",
          glass: "rgba(15, 23, 42, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          muted: "rgba(255, 255, 255, 0.55)",
          accent: "#0ea5e9",
          cyan: "#38bdf8",
          blue: "#2563eb",
          emerald: "#10b981",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 0 40px rgba(56, 189, 248, 0.12), 0 25px 50px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        shimmer:
          "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, transparent 45%, rgba(99,102,241,0.12) 100%)",
      },
      animation: {
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
