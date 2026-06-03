/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1D9E75", dark: "#0F6E56", light: "#5DCAA5" },
        surface: { DEFAULT: "#111110", card: "#1a1a18", border: "#2a2a27" },
        muted: { DEFAULT: "#73726c", light: "#9c9a92" },
      },
    },
  },
  plugins: [],
};
