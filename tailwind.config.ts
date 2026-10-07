import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { iris: "#6d5ef5", coral: "#ff8a6b", mint: "#2ec4a0", ink: "#1d1b3a" } } }, plugins: [] } satisfies Config;
