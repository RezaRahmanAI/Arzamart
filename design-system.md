# Design System — Bold Streetwear

> Single source of truth. Every color, size, spacing, animation defined here.
> No hardcoding anywhere. No duplicate styles. No exceptions.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0D0D0D` | Page background |
| `--color-surface` | `#2B2B2B` | Cards, inputs, dropdowns |
| `--color-card` | `#1A1A1A` | Elevated card bg |
| `--color-border` | `#3A3A3A` | All borders |
| `--color-primary` | `#FF3B3B` | Primary buttons, active states, errors |
| `--color-primary-hover` | `#E02E2E` | Primary button hover |
| `--color-accent` | `#FFCE00` | CTA, highlights, badges, icons |
| `--color-accent-hover` | `#E6B800` | Accent hover |
| `--color-text` | `#F5F5F5` | Primary text |
| `--color-muted` | `#9A9A9A` | Secondary text, placeholders, muted icons |
| `--color-inverse` | `#0D0D0D` | Text on primary/accent buttons |

### Rules
- Never use raw hex anywhere outside this file and `tailwind.config.js`
- One `primary` action per view max
- `accent` for CTA only — subscribe, buy, get started
- `--color-muted` for all placeholder and helper text

---

## Typography Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 1.4 | 400 | Captions, tags, helper text |
| `text-sm` | 13px | 1.5 | 400 | Secondary labels, table data |
| `text-base` | 14px | 1.6 | 400 | Body, form labels — **default** |
| `text-md` | 16px | 1.6 | 400 | Comfortable reading, card body |
| `text-lg` | 18px | 1.5 | 500 | Section intro, lead text |
| `text-xl` | 22px | 1.3 | 500 | Card headings, modal titles |
| `text-2xl` | 28px | 1.2 | 500 | Page headings |
| `text-3xl` | 36px | 1.1 | 500 | Hero subheadings |
| `text-4xl` | 48px | 1.0 | 500 | Hero headlines |

### Rules
- Default body: **14px / 400 / line-height 1.6**
- Max heading weight: **500** — never 600 or 700
- Minimum size anywhere: **12px**
- Sentence case always — no ALL CAPS, no Title Case in UI labels
- Muted text: use `--color-muted`, never opacity hack

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Micro gaps, icon padding |
| `space-2` | 8px | Tight spacing, badge padding |
| `space-3` | 12px | Inner card padding (compact) |
| `space-4` | 16px | Standard gap, list items |
| `space-5` | 20px | Section padding (mobile) |
| `space-6` | 24px | Card padding default |
| `space-8` | 32px | Section gap |
| `space-10` | 40px | Large section padding |
| `space-12` | 48px | Page section gap |
| `space-16` | 64px | Hero padding |
| `space-20` | 80px | Max section spacing |

### Rules
- Never use arbitrary px values — always use scale tokens
- Card inner padding: **24px**
- Between sections: **48px minimum**
- Mobile section padding: **20px horizontal**

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 6px | XS, SM inputs and buttons |
| `--radius-md` | 8px | MD inputs, buttons, cards (default) |
| `--radius-lg` | 10px | LG inputs, buttons |
| `--radius-xl` | 12px | XL inputs, large cards |
| `--radius-pill` | 999px | Badges, tags, pills |

---

## Input Fields

| Size | Height | Padding | Font | Radius |
|------|--------|---------|------|--------|
| `xs` | 28px | 0 8px | 12px | 6px |
| `sm` | 32px | 0 10px | 13px | 6px |
| `md` | 40px | 0 14px | 14px | 8px — **default** |
| `lg` | 48px | 0 16px | 16px | 10px |
| `xl` | 56px | 0 20px | 18px | 12px |

### Textarea
- Padding: `12px 14px`
- Font: `14px`
- Min-height: `96px`
- `resize: vertical` always

### States

| State | Border | Shadow |
|-------|--------|--------|
| Default | `1px solid #3A3A3A` | none |
| Hover | `1px solid #555` | none |
| Focus | `1px solid #FF3B3B` | `0 0 0 3px rgba(255,59,59,0.15)` |
| Error | `1px solid #FF3B3B` | `0 0 0 3px rgba(255,59,59,0.2)` |
| Disabled | `1px solid #3A3A3A` | none — `opacity: 0.45` |

---

## Buttons

| Size | Height | Padding | Font | Radius |
|------|--------|---------|------|--------|
| `xs` | 28px | 0 10px | 12px | 6px |
| `sm` | 32px | 0 12px | 13px | 6px |
| `md` | 40px | 0 18px | 14px | 8px — **default** |
| `lg` | 48px | 0 22px | 16px | 10px |
| `xl` | 56px | 0 28px | 18px | 12px |

> Padding rule: horizontal padding ≈ height × 0.45

### Variants

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| `primary` | `#FF3B3B` | `#0D0D0D` | none | Main action — save, submit |
| `accent` | `#FFCE00` | `#0D0D0D` | none | CTA — buy, subscribe |
| `secondary` | transparent | `#F5F5F5` | `1px solid #3A3A3A` | Cancel, back |
| `ghost` | transparent | `#9A9A9A` | none | Low priority |
| `danger` | `#FF3B3B` | `#fff` | none | Delete, remove — confirm modal required |

### States

| State | Effect |
|-------|--------|
| Hover | Darker bg via hover token |
| Active | `transform: scale(0.97)` |
| Focus | `box-shadow: 0 0 0 2px #FF3B3B` |
| Disabled | `opacity: 0.45` + `cursor: not-allowed` |
| Loading | Spinner replaces label — same width locked |

### Rules
- One `primary` or `accent` per view
- `danger` always behind a confirm modal — never direct
- `ghost` never standalone — always paired

---

## Icons

| State | Color | Hex |
|-------|-------|-----|
| Default | Muted | `#9A9A9A` |
| Active / selected | Text | `#F5F5F5` |
| Accent / badge / notification | Accent | `#FFCE00` |
| Danger / error / delete | Primary | `#FF3B3B` |

- Size: `16–20px` inline, `24px` max decorative
- Never hardcode icon color inline — always via CSS class or variable

---

## Input + Button Pairing Rule

Always match sizes in the same row. Never mix.

| Input | Button | Context |
|-------|--------|---------|
| `xs` | `xs` | Table inline |
| `sm` | `sm` | Filter bar, toolbar |
| `md` | `md` | Standard forms |
| `lg` | `lg` | Login, auth |
| `xl` | `xl` | Hero search |

---

## Animations

### Timing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | `100ms` | Button press, toggle |
| `--duration-base` | `150ms` | Hover states, focus |
| `--duration-moderate` | `250ms` | Dropdowns, tooltips |
| `--duration-slow` | `350ms` | Modals, drawers, panels |
| `--duration-page` | `500ms` | Page transitions |

### Easing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General — smooth in/out |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving screen |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering screen |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful pop — badges, likes |
| `--ease-sharp` | `cubic-bezier(0.4, 0, 0.6, 1)` | Snappy, urgent — alerts |

### Standard Transitions

```css
/* Hover states (buttons, links, cards) */
transition: background var(--duration-base) var(--ease-default),
            color var(--duration-base) var(--ease-default),
            border-color var(--duration-base) var(--ease-default);

/* Focus ring */
transition: box-shadow var(--duration-fast) var(--ease-out);

/* Button press */
transition: transform var(--duration-fast) var(--ease-sharp);

/* Dropdown / tooltip appear */
transition: opacity var(--duration-moderate) var(--ease-out),
            transform var(--duration-moderate) var(--ease-out);

/* Modal / drawer */
transition: opacity var(--duration-slow) var(--ease-out),
            transform var(--duration-slow) var(--ease-out);
```

### Keyframe Animations

```css
/* Fade in — page load, lazy sections */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn var(--duration-slow) var(--ease-out) both;
}

/* Slide in from left — drawer, sidebar */
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-left {
  animation: slideInLeft var(--duration-slow) var(--ease-out) both;
}

/* Slide in from right */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-right {
  animation: slideInRight var(--duration-slow) var(--ease-out) both;
}

/* Slide up — modals, bottom sheets */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp var(--duration-slow) var(--ease-out) both;
}

/* Pop — badge, notification dot, like button */
@keyframes pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.25); }
  100% { transform: scale(1); }
}
.animate-pop {
  animation: pop var(--duration-moderate) var(--ease-spring);
}

/* Pulse — skeleton loader */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.animate-pulse {
  animation: pulse 1.5s var(--ease-default) infinite;
}

/* Spin — loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 0.8s linear infinite;
}

/* Shake — form error */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
.animate-shake {
  animation: shake var(--duration-moderate) var(--ease-sharp);
}

/* Stagger children — product grid, list items */
.stagger-children > * {
  animation: fadeIn var(--duration-slow) var(--ease-out) both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 60ms; }
.stagger-children > *:nth-child(3) { animation-delay: 120ms; }
.stagger-children > *:nth-child(4) { animation-delay: 180ms; }
.stagger-children > *:nth-child(5) { animation-delay: 240ms; }
.stagger-children > *:nth-child(6) { animation-delay: 300ms; }
```

### Component-Specific Animation Rules

| Component | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Button hover | bg color change | `150ms` | `ease-default` |
| Button active | `scale(0.97)` | `100ms` | `ease-sharp` |
| Input focus ring | box-shadow appear | `100ms` | `ease-out` |
| Card hover | `translateY(-4px)` + shadow | `150ms` | `ease-out` |
| Dropdown open | `opacity 0→1` + `translateY(-8px→0)` | `250ms` | `ease-out` |
| Modal open | `opacity 0→1` + `translateY(24px→0)` | `350ms` | `ease-out` |
| Drawer open | `translateX(-100%→0)` | `350ms` | `ease-out` |
| Toast appear | `slideInRight` | `350ms` | `ease-out` |
| Toast dismiss | `opacity 1→0` | `250ms` | `ease-in` |
| Page transition | `fadeIn` | `500ms` | `ease-out` |
| Skeleton loader | `pulse` | `1.5s infinite` | `ease-default` |
| Spinner | `spin` | `0.8s infinite` | `linear` |
| Error input | `shake` | `250ms` | `ease-sharp` |
| Badge / like | `pop` | `250ms` | `ease-spring` |
| Product grid | `stagger-children` | `350ms + delay` | `ease-out` |

### Rules
- **Never animate layout properties** (`width`, `height`, `margin`, `padding`) — causes reflow. Use `transform` and `opacity` only.
- **`will-change: transform`** only on elements actively animating — remove after animation ends.
- Always respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- No animation on first contentful paint — defer non-critical animations
- Skeleton loaders instead of spinners for content areas
- Spinner only for button loading states

---

## Cards & Surfaces

```css
.card-base {
  background: var(--color-card);       /* #1A1A1A */
  border: 1px solid var(--color-border); /* #3A3A3A */
  border-radius: var(--radius-lg);      /* 10px */
  padding: 24px;
}

.card-hover {
  transition: transform 150ms var(--ease-out),
              box-shadow 150ms var(--ease-out);
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.5);
}

.surface {
  background: var(--color-surface);    /* #2B2B2B */
  border: 1px solid var(--color-border);
}
```

---

## CSS Custom Properties — Full Reference

```css
:root {
  /* Colors */
  --color-bg:             #0D0D0D;
  --color-surface:        #2B2B2B;
  --color-card:           #1A1A1A;
  --color-border:         #3A3A3A;
  --color-primary:        #FF3B3B;
  --color-primary-hover:  #E02E2E;
  --color-accent:         #FFCE00;
  --color-accent-hover:   #E6B800;
  --color-text:           #F5F5F5;
  --color-muted:          #9A9A9A;
  --color-inverse:        #0D0D0D;

  /* Radius */
  --radius-xs:   6px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   10px;
  --radius-xl:   12px;
  --radius-pill: 999px;

  /* Animation */
  --duration-fast:     100ms;
  --duration-base:     150ms;
  --duration-moderate: 250ms;
  --duration-slow:     350ms;
  --duration-page:     500ms;

  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-sharp:   cubic-bezier(0.4, 0, 0.6, 1);
}
```

---

*Place this file at `docs/design-system.md`. Update here first — never in component files.*
