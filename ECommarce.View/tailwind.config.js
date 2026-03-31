/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        "primary-light": "var(--color-primary-light)",
        accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",
        "accent-light": "var(--color-accent-light)",
        secondary: "var(--color-secondary)",
        supporting: "rgb(var(--color-supporting-rgb) / <alpha-value>)",
        "background-light": "var(--color-background-light)",
        "background-dark": "var(--color-background-dark)",
        "text-main": "var(--color-text-main)",
        "text-sub": "var(--color-text-sub)",
        "border-color": "var(--color-border)",
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
        display: ["Montserrat", "sans-serif"],
        serif: ["Montserrat", "serif"],
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
