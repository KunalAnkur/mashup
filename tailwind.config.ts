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
        smoothWhite: "var(--smoothWhite)",
        cardBg: "var(--cardBg)",
        // Dashboard redesign tokens — see app/globals.css for definitions.
        dashSurface: "var(--dash-surface)",
        dashSurfaceAlt: "var(--dash-surface-2)",
        dashBorder: "var(--dash-border)",
        dashText: "var(--dash-text)",
        dashTextDim: "var(--dash-text-dim)",
        dashTextMute: "var(--dash-text-mute)",
      },
      // Tailwind's colour opacity modifier only accepts values that exist in `theme.opacity`,
      // and the default scale jumps 5 → 10 → 15 → 20. Everything off that scale — `text-white/42`,
      // `bg-rose-500/12`, `ring-white/8` and the rest written across this codebase — silently
      // compiled to nothing, so secondary text rendered at full white and `ring-1` fell back to
      // Tailwind's default blue. Opening the scale to every integer makes the classes mean
      // what they say. Same fix as spotlight's tailwind.config.ts.
      opacity: Object.fromEntries(
        Array.from({ length: 101 }, (_, value) => [value, `${value / 100}`]),
      ),
      fontFamily: {
        parkinsans: ["var(--parkinsans)", "sans-serif"],
      },
      backgroundImage: {
        secondary: "var(--secondary)", // Define your gradient variable here
        logoColor: "var(--logoColor)",
      },
      borderRadius: {
        dashLg: "var(--dash-radius-lg)",
        dashMd: "var(--dash-radius-md)",
        dashSm: "var(--dash-radius-sm)",
      },
    },
  },
  plugins: [],
} satisfies Config;
