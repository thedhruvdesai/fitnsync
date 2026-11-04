import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0A0A0B", 2: "#121214", 3: "#1A1A1D", 4: "#26262A" },
        blood: { DEFAULT: "#E11D2E", 600: "#C81526", 400: "#FF3B4C" },
        bone: { DEFAULT: "#F4F1EC", dim: "#A8A49D", mute: "#6B6862" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
