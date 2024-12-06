import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryDark: "var(--primaryDark)",
        secondaryDark: "var(--secondaryDark)",
        hover: "var(--hover)",
        smoothWhite: "var(--smoothWhite)"
      },
      fontFamily: {
        parkinsans: ["var(--parkinsans)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
