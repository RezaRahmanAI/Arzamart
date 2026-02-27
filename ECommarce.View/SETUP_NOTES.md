# Angular + Tailwind Setup Notes

- Tailwind configuration lives in `tailwind.config.js` with the provided theme colors and fonts.
- Ensure your Angular build includes `src/styles.css` so Tailwind directives compile:
  - `@tailwind base;`
  - `@tailwind components;`
  - `@tailwind utilities;`
- Fonts and Material Symbols are imported in `src/styles.css`.
- Routing is defined in `src/app/app.routes.ts` and bootstrapped in `src/main.ts` using `provideRouter`.

If you generate a new Angular 18 project, make sure the builder includes `tailwindcss` and `postcss` configuration.
