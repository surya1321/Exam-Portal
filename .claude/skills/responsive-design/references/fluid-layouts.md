# Fluid Layouts with Tailwind CSS v4

## Table of Contents

1. [Overview](#overview)
2. [Fluid Spacing](#fluid-spacing)
   - [Custom Fluid Spacing Scale](#custom-fluid-spacing-scale)
   - [Fluid Container Widths](#fluid-container-widths)
3. [CSS Grid Fluid Layouts](#css-grid-fluid-layouts)
   - [Auto-fit Grid (Most Flexible)](#auto-fit-grid-most-flexible)
   - [Full-Bleed Page Grid](#full-bleed-page-grid)
   - [Content with Sidebar](#content-with-sidebar)
4. [Flexbox Fluid Patterns](#flexbox-fluid-patterns)
   - [Flexible Sidebar Layout](#flexible-sidebar-layout)
   - [Cluster Layout (Tags, Badges)](#cluster-layout-tags-badges)
   - [Switcher (Auto Stack/Row)](#switcher-auto-stackrow)
5. [Fluid Aspect Ratios](#fluid-aspect-ratios)
6. [Intrinsic Sizing](#intrinsic-sizing)
7. [Dynamic Viewport Units](#dynamic-viewport-units)
   - [Safe Area Insets (Notched Devices)](#safe-area-insets-notched-devices)
8. [Practical Examples](#practical-examples)
   - [Fluid Hero](#fluid-hero)
   - [Fluid Card Grid](#fluid-card-grid)
9. [Resources](#resources)

---

## Overview

Fluid design creates smooth scaling by using relative units and CSS math functions (`clamp()`, `min()`, `max()`) instead of hard breakpoints. In Tailwind CSS v4, achieve this with arbitrary values, `@theme` custom properties, the `--spacing()` function, and responsive utilities.

> **v4 Note**: Spacing utilities now accept any integer out of the box (e.g., `gap-13`, `w-17`, `mt-29`). Values are computed as `calc(var(--spacing) * n)` with a default `--spacing: 0.25rem`.

---

## Fluid Spacing

### Custom Fluid Spacing Scale

```css
@import "tailwindcss";

@theme {
  --spacing-fluid-xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --spacing-fluid-sm: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --spacing-fluid-md: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --spacing-fluid-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);
  --spacing-fluid-xl: clamp(2rem, 1.5rem + 2.5vw, 4rem);
  --spacing-fluid-2xl: clamp(3rem, 2rem + 5vw, 6rem);
}
```

```tsx
function Section({ children }) {
  return (
    <section className="py-fluid-xl px-fluid-md">
      {children}
    </section>
  );
}

function Card({ children }) {
  return (
    <div className="p-fluid-md gap-fluid-sm flex flex-col">
      {children}
    </div>
  );
}
```

### v4 `--spacing()` Function

Use `--spacing()` in arbitrary values for theme-aware computed spacing:

```tsx
// Computed spacing with calc
<div className="py-[calc(--spacing(4)-1px)]">
  {/* 16px - 1px = 15px (0.25rem × 4 = 1rem = 16px, minus 1px) */}
</div>

// Negative spacing via calc
<div className="mt-[calc(--spacing(2)*-1)]">
  {/* -0.5rem (-8px) */}
</div>
```

```css
/* How v4 generates dynamic spacing utilities */
@layer theme {
  :root {
    --spacing: 0.25rem;
  }
}

@layer utilities {
  .mt-8 { margin-top: calc(var(--spacing) * 8); }   /* 2rem */
  .w-17 { width: calc(var(--spacing) * 17); }        /* 4.25rem */
  .gap-13 { gap: calc(var(--spacing) * 13); }        /* 3.25rem */
}
```

### Fluid Container Widths

```css
@import "tailwindcss";

@theme {
  --max-width-container-sm: min(100% - 2rem, 30rem);
  --max-width-container-md: min(100% - 2rem, 45rem);
  --max-width-container-lg: min(100% - 2rem, 65rem);
  --max-width-container-xl: min(100% - 3rem, 80rem);
  --max-width-container-2xl: min(100% - 4rem, 96rem);
}
```

```tsx
function ProseContainer({ children }) {
  return (
    <div className="max-w-container-md mx-auto px-4">
      {children}
    </div>
  );
}

function WideContainer({ children }) {
  return (
    <div className="max-w-container-2xl mx-auto px-4">
      {children}
    </div>
  );
}
```

---

## CSS Grid Fluid Layouts

### Auto-fit Grid (Most Flexible)

```tsx
// Items wrap automatically — no breakpoints needed
function AutoFitGrid({ children }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-6">
      {children}
    </div>
  );
}

// With maximum column count preserved
function AutoFitMaxCols({ children }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,max(200px,calc((100%-3*1.5rem)/4))),1fr))] gap-6">
      {children}
    </div>
  );
}
```

### Full-Bleed Page Grid

```tsx
// Content centered with full-bleed capability
function PageGrid({ children }) {
  return (
    <div className="grid grid-cols-[1fr_min(65rem,100%)_1fr]">
      <div className="col-start-2">{children}</div>
    </div>
  );
}

function FullBleedImage({ src, alt }) {
  return (
    <div className="col-span-full">
      <img src={src} alt={alt} className="w-full h-auto" />
    </div>
  );
}
```

### Content with Sidebar

```tsx
function ContentWithSidebar({ main, sidebar }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_min(300px,30%)]">
      <main>{main}</main>
      <aside>{sidebar}</aside>
    </div>
  );
}
```

---

## Flexbox Fluid Patterns

### Flexible Sidebar Layout

```tsx
function SidebarLayout({ children, sidebar }) {
  return (
    <div className="flex flex-wrap gap-8">
      <aside className="w-72 grow">{sidebar}</aside>
      <main className="flex-1 min-w-[60%]">{children}</main>
    </div>
  );
}
```

### Cluster Layout (Tags, Badges)

```tsx
function TagList({ tags }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="px-3 py-1 bg-muted rounded-full text-sm">
          {tag}
        </span>
      ))}
    </div>
  );
}
```

### Switcher (Auto Stack/Row)

```tsx
function ResponsiveSwitcher({ children }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {children}
    </div>
  );
}
```

---

## Fluid Aspect Ratios

```tsx
function ResponsiveMedia() {
  return (
    <div className="space-y-8">
      <div className="aspect-video bg-muted rounded-lg" />
      <div className="aspect-square bg-muted rounded-lg" />
      <div className="aspect-4/3 bg-muted rounded-lg" />

      {/* Responsive aspect ratio */}
      <div className="aspect-square sm:aspect-4/3 lg:aspect-video bg-muted rounded-lg" />
    </div>
  );
}
```

---

## Intrinsic Sizing

```tsx
// Content-based widths using min(), max(), fit-content
function FluidContainer({ children }) {
  return <div className="w-[min(90%,1200px)] mx-auto">{children}</div>;
}

function Modal({ children }) {
  return (
    <div className="w-[min(90vw,600px)] max-h-[min(90vh,800px)] overflow-auto">
      {children}
    </div>
  );
}

function FluidSidebar({ children }) {
  return <aside className="w-[max(200px,min(300px,25%))]">{children}</aside>;
}
```

---

## Dynamic Viewport Units

```tsx
// min-h-dvh: dynamic viewport height — accounts for mobile browser chrome
function FullHeightSection({ children }) {
  return (
    <section className="min-h-dvh flex items-center justify-center">
      {children}
    </section>
  );
}
```

```css
@theme {
  --min-height-screen-small: 100svh;
  --min-height-screen-large: 100lvh;
  --min-height-screen-dynamic: 100dvh;
}
```

### Safe Area Insets (Notched Devices)

```tsx
function SafeAreaContainer({ children }) {
  return (
    <div className="pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {children}
    </div>
  );
}
```

---

## Practical Examples

### Fluid Hero

```tsx
function FluidHero({ title, subtitle, cta }) {
  return (
    <section className="min-h-[40vh] flex items-center py-8 px-3 md:min-h-[50vh] md:px-4 lg:min-h-[70vh] lg:py-fluid-xl lg:px-fluid-md xl:min-h-[80vh]">
      <div className="max-w-full lg:max-w-[min(100%,50rem)]">
        <h1 className="text-fluid-4xl font-bold leading-tight tracking-tight text-balance">{title}</h1>
        <p className="mt-fluid-sm text-fluid-lg text-muted-foreground text-pretty">{subtitle}</p>
        <Button size="lg" className="mt-fluid-md">{cta}</Button>
      </div>
    </section>
  );
}
```

### Fluid Card Grid

```tsx
function FluidCardGrid({ cards }) {
  return (
    <section className="py-fluid-xl px-fluid-md">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-fluid-md">
        {cards.map((card) => (
          <article key={card.id} className="p-fluid-md border rounded-lg">
            <h3 className="text-fluid-xl font-semibold">{card.title}</h3>
            <p className="mt-fluid-sm text-fluid-base text-muted-foreground">{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

---

## v4 Notes for Fluid Layouts

- **`border` defaults to `currentColor`** in v4. For visible borders on cards/containers, use `border border-border`.
- **Any spacing integer works** — `p-7`, `gap-13`, `mt-22` all generate valid CSS without theme extension.
- **`--spacing()` function** integrates with `calc()` for fine-tuned arbitrary spacing.
- **Container queries** (`@container`, `@3xs`–`@7xl`) work alongside fluid layouts for component-level responsiveness.

---

## Resources

- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Functions & Directives](https://tailwindcss.com/docs/functions-and-directives)
- [Utopia Fluid Space Calculator](https://utopia.fyi/space/calculator/)
- [CSS min(), max(), and clamp()](https://web.dev/min-max-clamp/)
- [Every Layout](https://every-layout.dev/)
