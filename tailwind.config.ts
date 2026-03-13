import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        warning: {
          red: "#ef4444",   // 最高警戒
          orange: "#f97316",// 高度警戒
          yellow: "#eab308",// 注意
          green: "#22c55e", // 平常
        }
      },
    },
  },
  plugins: [],
};
export default config;
