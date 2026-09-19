import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#b3d1ff",
          300: "#80b3ff",
          400: "#4d8fff",
          500: "#1f66f2",
          600: "#154fc2",
          700: "#123f99",
          800: "#0f3277",
          900: "#0c2860",
        },
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b8b9c1",
          400: "#8f909c",
          500: "#6b6c78",
          600: "#4f505c",
          700: "#3a3b45",
          800: "#26272e",
          900: "#17171c",
          950: "#0c0c0f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
