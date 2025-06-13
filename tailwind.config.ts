/** @type {import('tailwindcss').Config} */

// tailwind.config.ts
import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class", // manual toggle
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
export default config;
