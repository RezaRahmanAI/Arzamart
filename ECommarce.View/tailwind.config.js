/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
       
        /* ── Design system tokens (new) ── */
        "ds-bg":           "var(--color-bg)",
        "ds-surface":      "var(--color-surface)",
        "ds-surface-2":    "var(--color-surface-2)",
        "ds-border":       "var(--color-border-ds)",
        "ds-text":         "var(--color-text-primary)",
        "ds-text-sec":     "var(--color-text-secondary)",
        "ds-text-muted":   "var(--color-text-muted)",
        "ds-accent":       "var(--color-accent-ds)",
        "ds-accent-hover": "var(--color-accent-hover)",
        "ds-hero-bg":      "var(--color-hero-bg)",
        "ds-hero-text":    "var(--color-hero-text)",
        "ds-danger":       "var(--color-danger)",
        "ds-success":      "var(--color-success)",
        /* ── Semantic aliases used in admin components ── */
        "text-main-light":      "var(--color-text-primary)",
        "text-main-dark":       "var(--color-hero-text)",
        "text-secondary-light": "var(--color-text-secondary)",
        "border-light":         "var(--color-border-ds)",
        "border-dark":          "#333333",
      },
      fontFamily: {
        sans:    ["Outfit", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      fontSize: {
        "ds-xs":   ["0.75rem",  { lineHeight: "1.5" }],
        "ds-sm":   ["0.875rem", { lineHeight: "1.5" }],
        "ds-base": ["1rem",     { lineHeight: "1.6" }],
        "ds-lg":   ["1.125rem", { lineHeight: "1.6" }],
        "ds-xl":   ["1.25rem",  { lineHeight: "1.4" }],
        "ds-2xl":  ["1.5rem",   { lineHeight: "1.3" }],
        "ds-3xl":  ["1.875rem", { lineHeight: "1.2" }],
        "ds-4xl":  ["2.25rem",  { lineHeight: "1.1" }],
        "ds-5xl":  ["3rem",     { lineHeight: "1.1" }],
      },
      spacing: {
        "ds-1":  "0.25rem",
        "ds-2":  "0.5rem",
        "ds-3":  "0.75rem",
        "ds-4":  "1rem",
        "ds-5":  "1.25rem",
        "ds-6":  "1.5rem",
        "ds-8":  "2rem",
        "ds-10": "2.5rem",
        "ds-12": "3rem",
        "ds-16": "4rem",
        "ds-20": "5rem",
        "ds-24": "6rem",
      },
      borderRadius: {
        DEFAULT: "var(--radius-md)",
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
        fast: "150ms",
        base: "200ms",
      },
      maxWidth: {
        "site":    "1600px",
        "content": "1280px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
