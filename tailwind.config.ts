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
        coffee: {
          50: "#fdf8f0",
          100: "#faefd9",
          200: "#f3dab3",
          300: "#e9c07e",
          400: "#dda04a",
          500: "#d4852a",
          600: "#c06b1f",
          700: "#9e521b",
          800: "#7f421c",
          900: "#68371a",
          950: "#3a1b0b",
        },
        cream: {
          50: "#fffef7",
          100: "#fefce8",
          200: "#fef9c3",
          300: "#fef08a",
          400: "#fde047",
          500: "#facc15",
          600: "#eab308",
          700: "#ca8a04",
          800: "#a16207",
          900: "#854d0e",
        },
        warm: {
          50: "#faf7f4",
          100: "#f5ede4",
          200: "#ead9c8",
          300: "#dbbfa4",
          400: "#c99e7a",
          500: "#ba8259",
          600: "#ac6e47",
          700: "#8f593c",
          800: "#754a35",
          900: "#5f3e2e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      boxShadow: {
        coffee: "0 4px 14px 0 rgba(192, 107, 31, 0.25)",
        warm: "0 2px 8px 0 rgba(186, 130, 89, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
