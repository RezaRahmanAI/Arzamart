/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#050505", // Deepest black for ultra-luxury feel
        "primary-light": "#151515",
        accent: "#D4AF37", // Metallic Gold
        "accent-light": "#F0E68C",
        "background-light": "#FFFFFF",
        "background-dark": "#050505",
        "text-main": "#050505",
        "text-sub": "#888888",
        "border-color": "#E5E5E5",
      },
      fontFamily: {
        sans: ["Inter", "'Plus Jakarta Sans'", "sans-serif"],
        display: ["Montserrat", "Outfit", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
