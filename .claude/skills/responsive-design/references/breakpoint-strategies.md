# Breakpoint Strategies — Mobile-First with Tailwind CSS v4 (Laptop Primary)

## Table of Contents

1. [Priority Order](#priority-order)
2. [Tailwind CSS v4 Default Breakpoints](#tailwind-css-v4-default-breakpoints)
   - [Extended Breakpoints in @theme](#extended-breakpoints-in-theme)
   - [Custom Named Breakpoints](#custom-named-breakpoints-reset-all-defaults)
3. [Laptop-First Approach](#laptop-first-approach)
   - [Core Philosophy](#core-philosophy)
   - [Class Order Convention](#class-order-convention)
   - [Benefits](#benefits)
4. [Content-Based Breakpoints](#content-based-breakpoints)
5. [Responsive Patterns by Component](#responsive-patterns-by-component)
   - [Navigation](#navigation)
   - [Cards Grid](#cards-grid)
   - [Hero Section](#hero-section)
   - [Tables](#tables)
6. [useBreakpoint Hook](#usebreakpoint-hook)
7. [Preference Queries](#preference-queries)
8. [Print Styles](#print-styles)
9. [Debug: Breakpoint Indicator](#debug-breakpoint-indicator)
10. [Resources](#resources)

---

## Priority Order

> **Mobile (base/sm) → Tablet (md) → Laptop (lg) ★ → Desktop (xl) → Large Desktop (2xl/3xl)**

All responsive work follows this order in code. **Laptop is the primary design target** — design for laptop first in your head, then implement mobile-first in code. Every component **must** work at all tiers.

---

## Tailwind CSS v4 Default Breakpoints

```css
/* min-width based (mobile-first engine) */
/* Base: < 640px  — Mobile phones (no prefix, START HERE) */
/* sm:  >= 640px  — Landscape phones               */
/* md:  >= 768px  — Tablets                         */
/* lg:  >= 1024px — Laptops ★ PRIMARY DESIGN TARGET */
/* xl:  >= 1280px — Desktop monitors                */
/* 2xl: >= 1536px — Large desktops                  */
```

### Extended Breakpoints in `@theme`

```css
@import "tailwindcss";

@theme {
  --breakpoint-sm: 40rem;    /* 640px  */
  --breakpoint-md: 48rem;    /* 768px  */
  --breakpoint-lg: 64rem;    /* 1024px — ★ PRIMARY */
  --breakpoint-xl: 80rem;    /* 1280px */
  --breakpoint-2xl: 96rem;   /* 1536px */
  --breakpoint-3xl: 120rem;  /* 1920px */
}
```

### Custom Named Breakpoints (Reset All Defaults)

```css
@import "tailwindcss";

@theme {
  --breakpoint-*: initial;
  --breakpoint-tablet: 40rem;   /* 640px  */
  --breakpoint-laptop: 64rem;   /* 1024px */
  --breakpoint-desktop: 80rem;  /* 1280px */
  --breakpoint-wide: 96rem;     /* 1536px */
}
```

---

## Mobile-First Approach (Laptop Primary)

### Core Philosophy

Write base (unprefixed) classes for **mobile** — Tailwind's native min-width approach. Then progressively enhance up through each breakpoint. **Laptop (`lg:`) is the primary design target** — this is the screen most users see.

1. **Design for laptop first** in your head — sketch, plan, and verify at 1024px
2. **Implement mobile-first** in code — base classes are mobile, progressively add `sm:` → `md:` → `lg:` → `xl:` → `2xl:` → `3xl:`
3. **Test all tiers** — ensure every breakpoint delivers a good experience

### Class Order Convention

Apply Tailwind classes in mobile-first progression:

```tsx
<div
  className={cn(
    // 1. MOBILE (base <640px) — single column, minimal spacing
    "grid grid-cols-1 gap-3 p-3",

    // 2. MOBILE LANDSCAPE (sm 640px+)
    "sm:gap-4 sm:p-4",

    // 3. TABLET (md 768px+) — 2 columns
    "md:grid-cols-2 md:gap-4 md:p-4",

    // 4. ★ LAPTOP (lg 1024px+) — full layout (primary target)
    "lg:grid-cols-3 lg:gap-6 lg:p-6",

    // 5. DESKTOP (xl 1280px+) — wider grids, more padding
    "xl:grid-cols-4 xl:gap-8 xl:p-8",

    // 6. LARGE DESKTOP (2xl 1536px+)
    "2xl:grid-cols-5 2xl:gap-10",

    // 7. WIDE DESKTOP (3xl 1920px+)
    "3xl:grid-cols-6 3xl:max-w-[1800px] 3xl:mx-auto"
  )}
/>
```

### Benefits

1. **Aligns with Tailwind's engine** — min-width breakpoints are native; no `max-*` workarounds
2. **Mobile coverage guaranteed** — base classes always handle the smallest screens
3. **Laptop is the star** — `lg:` breakpoint gets the most polished experience
4. **Progressive enhancement** — each breakpoint adds capabilities, never removes
5. **Performance** — mobile devices load clean base styles; larger screens layer on more

---

## Content-Based Breakpoints

Instead of only device sizes, identify where your content naturally needs to change.

```css
@import "tailwindcss";

@theme {
  /* Where sidebar fits next to main content */
  --breakpoint-with-sidebar: 50rem;  /* 800px */

  /* Where 3 cards fit comfortably in a row */
  --breakpoint-cards-3: 65rem;       /* 1040px */
}
```

```tsx
function PageWithSidebar({ main, sidebar }) {
  return (
    <div className="flex flex-col with-sidebar:flex-row with-sidebar:gap-8">
      <main className="flex-1">{main}</main>
      <aside className="w-full with-sidebar:w-72">{sidebar}</aside>
    </div>
  );
}
```

---

## Responsive Patterns by Component

### Navigation

```tsx
function ResponsiveNav({ items }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative">
      {/* Hamburger — hidden on laptop+ */}
      <button
        className="p-2 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <ul
        className={cn(
          // Mobile/Tablet: vertical, toggleable
          "flex flex-col absolute top-full left-0 right-0 bg-background border-b",
          isOpen ? "flex" : "hidden",
          // Laptop+: horizontal, always visible
          "lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:bg-transparent lg:gap-1",
          // Desktop+: more spacing
          "xl:gap-2"
        )}
      >
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block px-4 py-3 min-h-11 lg:px-3 lg:py-2 lg:rounded-md xl:px-4 hover:bg-muted lg:hover:bg-muted/50 transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### Cards Grid

```tsx
// Auto-fit grid (preferred for unknown item counts)
function AutoFitCardGrid({ cards }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-6">
      {cards.map((card) => (
        <Card key={card.id} {...card} />
      ))}
    </div>
  );
}

// Explicit breakpoint columns (when exact layout matters)
function ExplicitCardGrid({ cards }) {
  return (
    <div
      className={cn(
        // Mobile: 1 column
        "grid grid-cols-1 gap-3",
        // Tablet: 2 columns
        "md:grid-cols-2 md:gap-4",
        // ★ Laptop: 3 columns (primary target)
        "lg:grid-cols-3 lg:gap-6",
        // Desktop: 4 columns
        "xl:grid-cols-4 xl:gap-8",
        // Large Desktop: 5 columns
        "2xl:grid-cols-5"
      )}
    >
      {cards.map((card) => (
        <Card key={card.id} {...card} />
      ))}
    </div>
  );
}
```

### Hero Section

```tsx
function Hero({ title, subtitle, cta }) {
  return (
    <section
      className={cn(
        // Mobile: minimal height, centered text
        "min-h-[40vh] flex items-center py-8 px-3 text-center",
        // Mobile landscape: slightly taller
        "sm:px-4",
        // Tablet: more height
        "md:min-h-[50vh] md:px-4",
        // ★ Laptop: primary layout (left-aligned text)
        "lg:min-h-[70vh] lg:py-12 lg:px-6 lg:text-left",
        // Desktop+: taller, more padding
        "xl:min-h-[80vh] xl:px-8",
        "2xl:px-12"
      )}
    >
      <div className="max-w-full lg:max-w-[50%] xl:max-w-[45%]">
        <h1 className="text-[clamp(2rem,5vw+1rem,4rem)] font-bold leading-tight tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-4 text-[clamp(1rem,2vw+0.5rem,1.5rem)] text-muted-foreground text-pretty">
          {subtitle}
        </p>
        <Button size="lg" className="mt-8">{cta}</Button>
      </div>
    </section>
  );
}
```

### Tables

```tsx
function ResponsiveTable({ data, columns }) {
  return (
    <>
      {/* Laptop+: full table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left p-3 font-medium text-sm xl:text-base">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t hover:bg-muted/50">
                {columns.map((col) => (
                  <td key={col.key} className="p-3 text-sm xl:text-base">{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet: condensed table */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr>{columns.map((col) => <th key={col.key} className="text-left p-2 font-medium">{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((col) => <td key={col.key} className="p-2">{row[col.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card stack */}
      <div className="md:hidden space-y-3">
        {data.map((row, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-2">
                <span className="font-medium text-muted-foreground text-sm">{col.label}</span>
                <span className="text-right text-sm">{row[col.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
```

---

## useBreakpoint Hook

```tsx
import { useState, useEffect } from "react";

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
} as const;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints["2xl"]}px)`);
  const is3xl = useMediaQuery(`(min-width: ${breakpoints["3xl"]}px)`);

  return {
    isMobile: !isSm,
    isTablet: isMd && !isLg,
    isLaptop: isLg && !isXl,
    isDesktop: isXl && !is2xl,
    isLargeDesktop: is2xl,
    isWideDesktop: is3xl,
    current: is3xl ? "3xl" : is2xl ? "2xl" : isXl ? "xl" : isLg ? "lg" : isMd ? "md" : isSm ? "sm" : "base",
  };
}
```

---

## Preference Queries

```tsx
// Reduced motion
<div className="transition-transform duration-300 motion-reduce:transition-none motion-reduce:transform-none" />

// High contrast
<button className="bg-primary text-primary-foreground border border-transparent contrast-more:border-current contrast-more:border-2" />

// Forced colors (Windows High Contrast Mode)
<label>
  <input type="checkbox" className="appearance-none forced-colors:appearance-auto" />
  <span className="hidden forced-colors:block">Option</span>
</label>

// Dark mode (system preference by default in v4)
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />

// Custom dark mode selector (v4 @custom-variant)
// In app.css: @custom-variant dark (&:where(.dark, .dark *));
```

---

## Breakpoint Ranges

Target specific viewport ranges by stacking a responsive variant with a `max-*` variant:

```tsx
// Apply styles only between md and lg
<div className="md:max-lg:flex">
  {/* Flex only from 768px to 1023px */}
</div>

// Arbitrary range values
<div className="min-[712px]:max-[877px]:right-16">
  {/* Applies only between 712px and 877px */}
</div>

// Screen-reader only between md and xl
<div className="md:max-xl:sr-only">
  {/* Hidden accessibly between md and xl */}
</div>
```

---

## Print Styles

```tsx
function PrintableContent({ children }) {
  return (
    <>
      <nav className="print:hidden">Navigation</nav>
      <aside className="print:hidden">Sidebar</aside>
      <main className="print:max-w-full print:p-0 print:text-black">
        <article className="print:break-inside-avoid">{children}</article>
      </main>
      <footer className="print:hidden">Footer</footer>
    </>
  );
}
```

---

## Debug: Breakpoint Indicator

```tsx
function BreakpointIndicator() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white px-2 py-1 rounded text-xs z-50 font-mono">
      <span className="sm:hidden">base (&lt;640)</span>
      <span className="hidden sm:inline md:hidden">sm (640+)</span>
      <span className="hidden md:inline lg:hidden">md (768+)</span>
      <span className="hidden lg:inline xl:hidden">lg (1024+) ★</span>
      <span className="hidden xl:inline 2xl:hidden">xl (1280+)</span>
      <span className="hidden 2xl:inline 3xl:hidden">2xl (1536+)</span>
      <span className="hidden 3xl:inline">3xl (1920+)</span>
    </div>
  );
}
```

---

## v4 Behavioral Notes

- **`border` defaults to `currentColor`** in v4 (not `gray-200`). Always specify: `border border-border`.
- **`ring` defaults to 1px** with `currentColor` (not 3px blue). Use `ring-2 ring-ring` for visible focus.
- **Dynamic spacing** — any integer works: `mt-17`, `gap-13`, `w-29`. No theme extension needed.
- **`--spacing()` function** — use in arbitrary values: `py-[calc(--spacing(4)-1px)]`.
- **PostCSS plugin** is now `@tailwindcss/postcss` (separate package).
- **CLI** is now `@tailwindcss/cli` (separate package).

---

## Resources

- [Tailwind CSS v4 Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme)
- [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
