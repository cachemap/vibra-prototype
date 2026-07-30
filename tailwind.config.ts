import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          25: "#FDFDFD",
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E9EAEB",
          300: "#D5D7DA",
          400: "#A4A7AE",
          500: "#717680",
          600: "#535862",
          700: "#414651",
          800: "#252B37",
          900: "#181D27"
        },
        purple: {
          500: "#7A5AF8",
          600: "#6938EF",
          700: "#5925DC"
        }
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "Figtree", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
