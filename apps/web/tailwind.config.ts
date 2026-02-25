import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        sky: "#0ea5e9",
        mint: "#10b981",
        ember: "#f97316"
      }
    }
  },
  plugins: []
};

export default config;
