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
