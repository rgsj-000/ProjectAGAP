import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        agap: {
          blue: {
            50: "#eff6ff",
            100: "#dbeafe",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
            800: "#1e40af",
            900: "#1e3a8a",
          },
          green: {
            50: "#f0fdf4",
            100: "#dcfce7",
            500: "#22c55e",
            600: "#16a34a",
            700: "#15803d",
            800: "#166534",
          },
          yellow: {
            50: "#fefce8",
            100: "#fef9c3",
            500: "#eab308",
            600: "#ca8a04",
            700: "#a16207",
            800: "#854d0e",
          },
          orange: {
            50: "#fff7ed",
            100: "#ffedd5",
            500: "#f97316",
            600: "#ea580c",
            700: "#c2410c",
            800: "#9a3412",
          },
          red: {
            50: "#fef2f2",
            100: "#fee2e2",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
          },
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
