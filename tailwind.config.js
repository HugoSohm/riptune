/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pure dark surfaces — no color tint
        surface: {
          bg:      "#0d0f14",   // main background
          sidebar: "#0b0d12",   // sidebar (slightly darker)
          card:    "#161a22",   // card surfaces
          hover:   "#1c2130",   // card hover state
          border:  "rgba(255,255,255,0.07)",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
