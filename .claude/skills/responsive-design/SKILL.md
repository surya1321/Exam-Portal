---
name: responsive-design
description: Implement modern responsive layouts using Tailwind CSS v4's CSS-first configuration, container queries, fluid typography, and a Mobile-first breakpoint strategy with priority order Mobile > Tablet > Laptop > Desktop > Large Desktop. Laptop is the primary design target (web app). Uses the @theme directive for custom properties and built-in responsive utilities.
---

# Responsive Design with Tailwind CSS v4 — Mobile-First (Laptop Primary)

Build interfaces using Tailwind's native mobile-first (min-width) approach, progressively enhancing from mobile up through tablet, laptop, desktop, and large desktop. **Laptop is the primary design target** since this is a web app — design for laptop first in your head, then implement mobile-first in code. This skill uses Tailwind CSS v4's CSS-first configuration with `@theme`, built-in container queries, and fluid typography.

---

## Design Priority Order

> **Mobile (base/sm) → Tablet (md) → Laptop (lg) ★ → Desktop (xl) → Large Desktop (2xl/3xl)**

1. **Mobile (base: <640px / sm: 640px)** — Start here in code. Single-column, hamburger nav, full-width cards, minimum 44px touch targets. Unprefixed base styles target mobile.
2. **Tablet (md: 768px)** — 2-column grids, collapsible sidebars, increased touch targets.
3. **Laptop (lg: 1024px)** — ★ **Primary design target.** This is the screen most users will see. Design here first, then work outward. Sidebar + content side by side, full navigation, comfortable spacing.
4. **Desktop (xl: 1280px)** — Add breathing room, larger grids, expanded sidebars.
5. **Large Desktop (2xl: 1536px / 3xl: 1920px)** — Ultra-wide layouts, extra columns, larger typography, max-width containers.

**All screens MUST be covered.** Never ship a layout that only works on one tier.

> **Workflow**: Design for laptop in your head → Implement mobile-first in code → Progressively enhance up through `md:`, `lg:`, `xl:`, `2xl:`, `3xl:`.

---

## When to Use This Skill

- Implementing responsive layouts for any page or component
- Using container queries for component-level responsiveness
- Creating fluid typography and spacing scales
- Building complex layouts with CSS Grid and Flexbox
- Designing breakpoint strategies for a design system
- Implementing responsive images and media
- Creating adaptive navigation patterns
- Building responsive tables and data displays
- Setting up a comprehensive typography system

---

## Core Capabilities

### 1. Mobile-First Breakpoint Strategy (CSS-First)

- Base (unprefixed) classes target mobile — Tailwind's native min-width approach
- Scale **up** progressively: `sm:` → `md:` → `lg:` → `xl:` → `2xl:` → `3xl:`
- **Laptop (`lg:`) is the primary design target** — most users see this size
- Design for laptop first mentally, then implement mobile-first in code
- Custom breakpoints with `--breakpoint-*` variables in `@theme`
- No JavaScript config file needed

### 2. Container Queries (Built-in v4)

- Component-level responsiveness independent of viewport
- Native `@container` class and `@3xs`–`@7xl` variants (no plugin needed — built into v4)
- Named containers with `@container/name` for scoped queries
- Max-width container queries with `@max-*` variants (`@max-md:grid-cols-1`)
- Container query ranges by stacking variants (`@sm:@max-md:flex-col`)
- Custom container sizes with `--container-*` variables
- Arbitrary container values like `@min-[475px]`

### 3. Fluid Typography & Spacing

- `clamp()` in arbitrary values for smooth scaling between breakpoints
- CSS custom properties via `@theme` directive: `--text-*`, `--text-*--line-height`, `--text-*--letter-spacing`, `--text-*--font-weight`
- Font-size/line-height shorthand: `text-lg/7`
- `text-balance` for headings, `text-pretty` for body paragraphs
- `--spacing-*` variables for fluid padding/margins
- `--spacing()` function for theme-based spacing in arbitrary values: `py-[calc(--spacing(4)-1px)]`
- Dynamic spacing — any number works out of the box (e.g., `w-17`, `pr-29`, `gap-13`)

### 4. Layout Patterns

- CSS Grid utilities for 2D layouts (`grid`, `grid-cols-*`, `auto-fit`, `auto-fill`)
- Flexbox utilities for 1D distribution
- All Tailwind responsive modifiers: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `3xl:`
- Breakpoint range queries: `md:max-lg:flex` (applies only between md and lg)

### 5. Custom Variants & Directives

- `@custom-variant` directive for project-specific variants: `@custom-variant dark (&:where(.dark, .dark *))`
- `forced-colors` variant for Windows High Contrast Mode accessibility
- `@tailwindcss/postcss` and `@tailwindcss/cli` are separate packages in v4

---

## Quick Reference

### Breakpoint Hierarchy & Device Categories

| Priority | Category | Width | Tailwind Prefix | Common Devices | Design Action |
|----------|----------|-------|-----------------|----------------|---------------|
| **1** | **Mobile Portrait** | <640px | (base — no prefix) | iPhone, Android phones | Single column, hamburger nav, touch-first |
| **2** | **Mobile Landscape** | 640px–767px | `sm:` | Phones in landscape | Simplified 2-col, stacked |
| **3** | **Tablet** | 768px–1023px | `md:` | iPad, Surface, Galaxy Tab | 2-col grids, collapsible sidebars |
| **4** | **Laptop** ★ | 1024px–1279px | `lg:` | MacBook Air 13", ThinkPad | ★ Primary design target — full layout |
| **5** | **Desktop** | 1280px–1535px | `xl:` | MacBook Pro 16", iMac, external monitors | Expand grids, widen sidebars |
| **6** | **Large Desktop** | 1536px–1919px | `2xl:` | 1440p monitors, ultrawide | Extra columns, max-width containers |
| **7** | **Wide Desktop** | 1920px+ | `3xl:` (custom) | 1080p+ fullscreen, 4K | Full-bleed layouts, 6-col grids |

### Popular Device Resolutions

| Device | Resolution | Category |
|--------|------------|----------|
| iPhone SE | 375 × 667 | Mobile |
| iPhone 15 | 393 × 852 | Mobile |
| iPhone 15 Pro Max | 430 × 932 | Mobile |
| Samsung Galaxy S24 | 360 × 780 | Mobile |
| iPad Mini | 768 × 1024 | Tablet |
| iPad Air | 820 × 1180 | Tablet |
| iPad Pro 12.9" | 1024 × 1366 | Tablet/Laptop |
| MacBook Air 13" | 1440 × 900 | Laptop |
| MacBook Pro 16" | 1728 × 1117 | Desktop |
| Dell 27" QHD | 2560 × 1440 | Large Desktop |
| 1080p Monitor | 1920 × 1080 | Wide Desktop |
| 4K Monitor | 3840 × 2160 | Wide Desktop |

### Tailwind CSS v4 Breakpoint Configuration

```css
/* Tailwind CSS v4 default breakpoints (min-width, mobile-first engine) */
/* Base: < 640px  (no prefix) — Mobile phones (START HERE in code)      */
/* sm:  >= 640px  — Landscape phones, small tablets                     */
/* md:  >= 768px  — Tablets in portrait                                 */
/* lg:  >= 1024px — Laptop screens ★ PRIMARY DESIGN TARGET             */
/* xl:  >= 1280px — Desktop monitors                                    */
/* 2xl: >= 1536px — Large desktop monitors                              */

/* Extended breakpoints in globals.css */
@import "tailwindcss";

@theme {
  /* Default + custom breakpoints */
  --breakpoint-sm: 40rem;    /* 640px  — Mobile landscape          */
  --breakpoint-md: 48rem;    /* 768px  — Tablet                    */
  --breakpoint-lg: 64rem;    /* 1024px — Laptop ★ PRIMARY TARGET   */
  --breakpoint-xl: 80rem;    /* 1280px — Desktop                   */
  --breakpoint-2xl: 96rem;   /* 1536px — Large desktop             */
  --breakpoint-3xl: 120rem;  /* 1920px — Wide desktop / Full HD    */
}
```

> **Mobile-First Pattern (Laptop Primary)**: Write base classes for mobile (no prefix), then progressively enhance with `sm:` → `md:` → `lg:` (★ primary target) → `xl:` → `2xl:` → `3xl:`. Design for laptop first in your head, implement mobile-first in code.

### Tailwind CSS v4 Default Font Sizes

| Class | Size | Line Height |
|-------|------|-------------|
| `text-xs` | 0.75rem (12px) | calc(1 / 0.75) |
| `text-sm` | 0.875rem (14px) | calc(1.25 / 0.875) |
| `text-base` | 1rem (16px) | calc(1.5 / 1) |
| `text-lg` | 1.125rem (18px) | calc(1.75 / 1.125) |
| `text-xl` | 1.25rem (20px) | calc(1.75 / 1.25) |
| `text-2xl` | 1.5rem (24px) | calc(2 / 1.5) |
| `text-3xl` | 1.875rem (30px) | calc(2.25 / 1.875) |
| `text-4xl` | 2.25rem (36px) | calc(2.5 / 2.25) |
| `text-5xl` | 3rem (48px) | 1 |
| `text-6xl` | 3.75rem (60px) | 1 |
| `text-7xl` | 4.5rem (72px) | 1 |
| `text-8xl` | 6rem (96px) | 1 |
| `text-9xl` | 8rem (128px) | 1 |

### Tailwind CSS v4 Container Query Breakpoints

| Variant | Min-width |
|---------|-----------|
| `@xs` | 20rem (320px) |
| `@sm` | 24rem (384px) |
| `@md` | 28rem (448px) |
| `@lg` | 32rem (512px) |
| `@xl` | 36rem (576px) |
| `@2xl` | 42rem (672px) |
| `@3xl` | 48rem (768px) |
| `@4xl` | 56rem (896px) |
| `@5xl` | 64rem (1024px) |
| `@6xl` | 72rem (1152px) |
| `@7xl` | 80rem (1280px) |

---

## Key Patterns

### Pattern 1: Mobile-First Responsive Component

```tsx
// ✅ Mobile-first: base classes target mobile, progressively enhance up
function DashboardLayout({ children, sidebar }) {
  return (
    <div
      className={cn(
        // MOBILE (base <640px) — single column, tight spacing
        "grid grid-cols-1 gap-3 p-3 min-h-dvh",

        // MOBILE LANDSCAPE (sm 640px+) — slightly more padding
        "sm:gap-4 sm:p-4",

        // TABLET (md 768px+) — still single column but more room
        "md:gap-4 md:p-4",

        // ★ LAPTOP (lg 1024px+) — sidebar + content side by side (primary target)
        "lg:grid-cols-[260px_1fr] lg:gap-6 lg:p-6",

        // DESKTOP (xl 1280px+) — wider sidebar, more padding
        "xl:grid-cols-[300px_1fr] xl:gap-8 xl:p-8",

        // LARGE DESKTOP (2xl 1536px+) — max-width container, centered
        "2xl:max-w-[1600px] 2xl:mx-auto 2xl:gap-10 2xl:p-10",

        // WIDE DESKTOP (3xl 1920px+) — even more room
        "3xl:max-w-[1800px] 3xl:p-12"
      )}
    >
      {/* Sidebar: hidden on mobile/tablet, visible on laptop+ */}
      <aside className="hidden lg:block">
        {sidebar}
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

### Pattern 2: Container Queries (Built-in v4)

```tsx
// Container queries respond to parent size, NOT viewport
// Works out of the box in Tailwind CSS v4 — no plugin needed

function ResponsiveCard({ title, image, description }) {
  return (
    <div className="@container">
      <article className="flex flex-col gap-4 p-4 @md:flex-row @md:gap-6 @lg:p-6">
        <img
          src={image}
          alt=""
          className="w-full aspect-video object-cover rounded-lg @md:w-48 @md:aspect-square @lg:w-64"
        />
        <div className="flex-1">
          <h2 className="text-lg font-semibold @md:text-xl @lg:text-2xl">
            {title}
          </h2>
          <p className="mt-2 text-muted-foreground @lg:text-lg">
            {description}
          </p>
        </div>
      </article>
    </div>
  );
}

// Named containers for scoped queries
function AnalyticsDashboard() {
  return (
    <div className="@container/main grid grid-cols-12 gap-4">
      <aside className="@container/sidebar col-span-12 lg:col-span-3">
        <nav className="flex flex-col gap-2 @lg/sidebar:flex-row">
          <NavItem icon={<Home />} label="Home" />
          <NavItem icon={<Chart />} label="Analytics" />
        </nav>
      </aside>
      <main className="col-span-12 lg:col-span-9 @2xl/main:grid @2xl/main:grid-cols-2 gap-4">
        <Widget title="Revenue" />
        <Widget title="Users" />
      </main>
    </div>
  );
}
```

```css
/* Custom container sizes in globals.css (v4) */
@import "tailwindcss";

@theme {
  /* Extend default container query breakpoints */
  --container-8xl: 96rem;  /* 1536px */
  --container-4k: 160rem;  /* 2560px */
}
```

```tsx
// Arbitrary container values — one-off sizes without theme config
function AdHocContainer() {
  return (
    <div className="@container">
      <div className="flex flex-col @min-[475px]:flex-row">
        {/* Switches to row at container width 475px */}
      </div>
    </div>
  );
}
```

### Pattern 3: Responsive Grid Layout

```tsx
// Auto-fit grid — items wrap automatically based on available space
function AutoFitGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
      {children}
    </div>
  );
}

// Explicit responsive columns following mobile-first priority (laptop primary)
function ProductGrid({ products }) {
  return (
    <div
      className={cn(
        // Mobile: 1 column (base)
        "grid grid-cols-1 gap-3",
        // Mobile landscape: still 1 column, slightly more gap
        "sm:gap-4",
        // Tablet: 2 columns
        "md:grid-cols-2 md:gap-4",
        // ★ Laptop: 3 columns (primary target)
        "lg:grid-cols-3 lg:gap-6",
        // Desktop: 4 columns
        "xl:grid-cols-4 xl:gap-8",
        // Large Desktop: 5 columns
        "2xl:grid-cols-5",
        // Wide Desktop: 6 columns
        "3xl:grid-cols-6"
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Page layout with grid areas
function PageLayout() {
  return (
    <div
      className={cn(
        // Mobile: single column
        "grid grid-cols-1 gap-3",
        // Tablet: 2-column (content + sidebar)
        "md:grid-cols-[1fr_280px] md:gap-4",
        // ★ Laptop: 3-column layout (primary target)
        "lg:grid-cols-[250px_1fr_300px] lg:gap-4",
        // Desktop: wider columns
        "xl:grid-cols-[280px_1fr_320px] xl:gap-6"
      )}
    >
      <nav className="hidden lg:block">Navigation</nav>
      <main>Main Content</main>
      <aside className="hidden md:block">Sidebar</aside>
    </div>
  );
}

// 12-Column Grid System
function TwelveColumnLayout() {
  return (
    <div className="grid grid-cols-12 gap-3 p-3 md:gap-4 md:p-4 lg:gap-4 lg:p-4 xl:gap-6 xl:p-6 2xl:gap-8 2xl:p-8">
      <header className="col-span-12">Header</header>

      {/* Sidebar — hidden on mobile/tablet, 2 cols on laptop, wider on desktop */}
      <aside className="hidden lg:block col-span-12 lg:col-span-2 xl:col-span-3 2xl:col-span-2 bg-card p-4 rounded-lg border">
        Sidebar
      </aside>

      {/* Main — full width on mobile/tablet, partial on laptop+ */}
      <main className="col-span-12 lg:col-span-8 xl:col-span-6 2xl:col-span-8 bg-card p-4 rounded-lg border">
        Main Content
      </main>

      {/* Secondary sidebar — only visible on desktop+ */}
      <aside className="hidden xl:block col-span-12 xl:col-span-3 2xl:col-span-2 bg-card p-4 rounded-lg border">
        Secondary
      </aside>

      <footer className="col-span-12">Footer</footer>
    </div>
  );
}
```

### Pattern 4: Responsive Navigation

```tsx
function ResponsiveNav({ items }: { items: { href: string; label: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative">
      {/* Hamburger — only visible below laptop breakpoint */}
      <button
        className="lg:hidden p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="nav-menu"
      >
        <span className="sr-only">Toggle navigation</span>
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Navigation links */}
      <ul
        id="nav-menu"
        className={cn(
          // Mobile/Tablet: vertical, slide-down
          "absolute top-full left-0 right-0 bg-background border-b flex flex-col",
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
              className={cn(
                "block px-4 py-3 min-h-11",
                "lg:px-3 lg:py-2 lg:rounded-md",
                "xl:px-4",
                "hover:bg-muted lg:hover:bg-muted/50 lg:hover:text-primary",
                "transition-colors"
              )}
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

### Pattern 5: Responsive Images

```tsx
import Image from "next/image";

// Art direction: serve different crops per screen tier
function ResponsiveHero() {
  return (
    <picture>
      <source media="(min-width: 1536px)" srcSet="/hero-ultrawide.webp" type="image/webp" />
      <source media="(min-width: 1280px)" srcSet="/hero-desktop.webp" type="image/webp" />
      <source media="(min-width: 1024px)" srcSet="/hero-laptop.webp" type="image/webp" />
      <source media="(min-width: 768px)" srcSet="/hero-tablet.webp" type="image/webp" />
      <source srcSet="/hero-mobile.webp" type="image/webp" />
      <img
        src="/hero-mobile.jpg"
        alt="Hero image"
        className="w-full h-auto"
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}

// Next.js Image with responsive sizes matching our priority
function ProductImage({ product }) {
  return (
    <Image
      src={product.image}
      alt={product.name}
      width={800}
      height={600}
      sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
      className="w-full h-auto object-cover rounded-lg"
      loading="lazy"
    />
  );
}
```

### Pattern 6: Responsive Tables

```tsx
// Card-on-mobile, table-on-laptop — following the priority order
function ResponsiveDataTable({ data, columns }) {
  return (
    <>
      {/* Laptop+: full table with horizontal scroll fallback */}
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
                  <td key={col.key} className="p-3 text-sm xl:text-base">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet: simplified horizontal scroll table */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left p-2 font-medium">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((col) => (
                  <td key={col.key} className="p-2">{row[col.key]}</td>
                ))}
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

### Pattern 7: Responsive Cards with Hover Effects

```tsx
interface CardProps {
  image: string;
  title: string;
  description: string;
  href: string;
}

function ResponsiveCardGrid({ cards }: { cards: CardProps[] }) {
  return (
    <div
      className={cn(
        // Mobile: 1 column (base)
        "grid grid-cols-1 gap-3 p-3",
        // Mobile landscape: slightly more room
        "sm:gap-4 sm:p-4",
        // Tablet: 2 columns
        "md:grid-cols-2 md:gap-4 md:p-4",
        // ★ Laptop: 3 columns (primary target)
        "lg:grid-cols-3 lg:gap-6 lg:p-6",
        // Desktop: wider gaps
        "xl:gap-8 xl:p-8",
        // Large Desktop: 4 columns
        "2xl:grid-cols-4",
        // Wide Desktop: maintain 4 cols but wider gaps
        "3xl:gap-10 3xl:p-10"
      )}
    >
      {cards.map((card, i) => (
        <ResponsiveCard key={i} {...card} />
      ))}
    </div>
  );
}

function ResponsiveCard({ image, title, description, href }: CardProps) {
  return (
    <article
      className={cn(
        "group rounded-lg overflow-hidden bg-card border shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
      )}
    >
      <img src={image} alt="" className="w-full aspect-video object-cover" />
      <div className="p-3 sm:p-4 lg:p-4 xl:p-5 2xl:p-6">
        <h3 className="text-lg font-semibold xl:text-xl group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground xl:text-base line-clamp-2">
          {description}
        </p>
        <a
          href={href}
          className="inline-block mt-4 font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2"
        >
          Learn More →
        </a>
      </div>
    </article>
  );
}

// Feature card with icon
function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card lg:p-6 xl:p-7 2xl:p-8",
        "transition-all duration-200",
        "hover:border-primary/50 hover:shadow-md"
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold xl:text-xl">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm xl:text-base">{description}</p>
    </div>
  );
}
```

### Pattern 8: Dashboard Widget (Container Query)

```tsx
function DashboardWidget({ title, value, chart, stats }) {
  return (
    <div className="@container">
      <div className="p-4 border rounded-lg bg-card @md:p-6 @xl:p-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold @md:text-lg">{title}</h3>
          <span className="text-2xl font-bold @md:text-3xl @xl:text-4xl">{value}</span>
        </div>
        <div className="h-32 @md:h-40 @xl:h-56">{chart}</div>
        <div className="mt-4 grid grid-cols-1 gap-2 @sm:grid-cols-2 @xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-sm">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="ml-2 font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Typography System

### Design Principles

1. **Body text ≥ 16px** on all screens — never go below `text-base` for readable content
2. **Line length 45–75 characters** — use `max-w-prose` or `max-w-[65ch]`
3. **Line height**: 1.5–1.75 for body, 1.1–1.3 for headings
4. **`text-balance`** for short headings (prevents orphans)
5. **`text-pretty`** for body paragraphs (better line breaks)
6. **Fluid scaling** with `clamp()` — smooth transitions between breakpoints
7. **Negative letter-spacing** for large headings (improves optical spacing)
8. **`hyphens-auto`** with `lang` attribute for better text wrapping

### Type Tokens in `@theme`

```css
@import "tailwindcss";

@theme {
  /* ─── Font Families ─── */
  --font-sans: "Inter Variable", "Inter", system-ui, sans-serif;
  --font-display: "Sora", "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;

  /* ─── Font Feature & Variation Settings ─── */
  --font-sans--font-feature-settings: "cv02", "cv03", "cv04", "cv11";

  /* ─── Fluid Type Scale ─── */
  --text-fluid-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);      /* 12px → 14px */
  --text-fluid-xs--line-height: 1.5;

  --text-fluid-sm: clamp(0.875rem, 0.84rem + 0.18vw, 1rem);         /* 14px → 16px */
  --text-fluid-sm--line-height: 1.5;

  --text-fluid-base: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);        /* 16px → 18px */
  --text-fluid-base--line-height: 1.65;

  --text-fluid-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);        /* 18px → 20px */
  --text-fluid-lg--line-height: 1.5;

  --text-fluid-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);         /* 20px → 24px */
  --text-fluid-xl--line-height: 1.4;

  --text-fluid-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);            /* 24px → 32px */
  --text-fluid-2xl--line-height: 1.3;

  --text-fluid-3xl: clamp(1.875rem, 1.4rem + 2.375vw, 2.5rem);      /* 30px → 40px */
  --text-fluid-3xl--line-height: 1.2;
  --text-fluid-3xl--letter-spacing: -0.01em;

  --text-fluid-4xl: clamp(2.25rem, 1.5rem + 3.75vw, 3.5rem);        /* 36px → 56px */
  --text-fluid-4xl--line-height: 1.15;
  --text-fluid-4xl--letter-spacing: -0.015em;

  --text-fluid-5xl: clamp(3rem, 1.8rem + 6vw, 5rem);                /* 48px → 80px */
  --text-fluid-5xl--line-height: 1.1;
  --text-fluid-5xl--letter-spacing: -0.02em;

  /* ─── Semantic Type Tokens ─── */
  --text-ui: clamp(0.875rem, 0.84rem + 0.18vw, 1rem);
  --text-ui--line-height: 1.4;
  --text-ui--font-weight: 500;

  --text-body: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --text-body--line-height: 1.65;

  --text-title: clamp(1.5rem, 1.1rem + 1.8vw, 2.5rem);
  --text-title--line-height: 1.2;
  --text-title--letter-spacing: -0.0125em;

  --text-hero: clamp(2rem, 1.4rem + 3vw, 4rem);
  --text-hero--line-height: 1.1;
  --text-hero--letter-spacing: -0.02em;

  /* ─── Fluid Spacing ─── */
  --spacing-fluid-xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --spacing-fluid-sm: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --spacing-fluid-md: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --spacing-fluid-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);
  --spacing-fluid-xl: clamp(2rem, 1.5rem + 2.5vw, 4rem);
  --spacing-fluid-2xl: clamp(3rem, 2rem + 5vw, 6rem);
}
```

### Typography by Screen Tier

| Element | Mobile (<640px) | Tablet (768px) | Laptop (1024px) | Desktop (1280px) | Large (1536px+) |
|---------|----------------|----------------|-----------------|-------------------|-----------------|
| **Hero h1** | 2rem (32px) | 2.5rem (40px) | 3rem (48px) | 3.5rem (56px) | 4rem (64px) |
| **Page h1** | 1.5rem (24px) | 1.75rem (28px) | 2rem (32px) | 2.25rem (36px) | 2.5rem (40px) |
| **Section h2** | 1.25rem (20px) | 1.375rem (22px) | 1.5rem (24px) | 1.75rem (28px) | 2rem (32px) |
| **Subsection h3** | 1.125rem (18px) | 1.125rem (18px) | 1.25rem (20px) | 1.375rem (22px) | 1.5rem (24px) |
| **Body** | 1rem (16px) | 1rem (16px) | 1rem (16px) | 1.0625rem (17px) | 1.125rem (18px) |
| **UI/Label** | 0.875rem (14px) | 0.875rem (14px) | 0.875rem (14px) | 0.9375rem (15px) | 1rem (16px) |
| **Caption** | 0.75rem (12px) | 0.75rem (12px) | 0.75rem (12px) | 0.8125rem (13px) | 0.875rem (14px) |
| **Line height (body)** | 1.65 | 1.65 | 1.65 | 1.6 | 1.55 |
| **Line height (heading)** | 1.2 | 1.2 | 1.15 | 1.15 | 1.1 |
| **Max line width** | 100% | 65ch | 65ch | 72ch | 75ch |

### Typography Component Patterns

```tsx
// Hero heading — fluid, biggest impact
function HeroTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-hero leading-tight tracking-tight text-balance">
      {children}
    </h1>
  );
}

// Page title
function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-title font-bold leading-tight tracking-tight text-balance">
      {children}
    </h1>
  );
}

// Section heading
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-fluid-2xl font-semibold leading-snug text-balance">
      {children}
    </h2>
  );
}

// Subsection heading
function SubsectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-fluid-xl font-semibold leading-snug">
      {children}
    </h3>
  );
}

// Body text with optimal reading width
function ArticleBody({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-[65ch] font-sans text-body leading-relaxed text-pretty hyphens-auto">
      {children}
    </article>
  );
}

// UI/data-dense text (sidebars, tables, labels)
function UILabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-ui leading-snug tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

// Container-aware heading (responds to parent width, not viewport)
function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container">
      <h3 className="text-[clamp(1rem,3cqi,1.375rem)] leading-snug text-balance font-semibold">
        {children}
      </h3>
    </div>
  );
}

// Responsive typography with inline clamp()
function HeroSection({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="py-fluid-xl px-fluid-md">
      <h1 className="text-[clamp(2rem,5vw+1rem,4rem)] font-bold leading-[1.1] tracking-tight text-balance">
        {title}
      </h1>
      <p className="mt-4 text-[clamp(1rem,2vw+0.5rem,1.5rem)] text-muted-foreground leading-relaxed text-pretty max-w-[65ch]">
        {subtitle}
      </p>
    </section>
  );
}

// Complete responsive article
function TypographyShowcase() {
  return (
    <article className="max-w-prose mx-auto px-fluid-md py-fluid-lg">
      <h1 className="text-fluid-4xl font-bold leading-[1.15] tracking-tight text-balance">
        Article Title Goes Here
      </h1>
      <p className="mt-2 text-fluid-sm text-muted-foreground">
        By Author Name · Jan 15, 2026 · 8 min read
      </p>
      <h2 className="mt-8 text-fluid-2xl font-semibold leading-snug text-balance">
        Section Heading
      </h2>
      <p className="mt-4 text-fluid-base leading-relaxed text-pretty max-w-[65ch]">
        Body text with optimal reading width. Long paragraphs stay comfortable
        at 45–75 characters per line on all devices.
      </p>
      <h3 className="mt-6 text-fluid-xl font-semibold leading-snug">
        Subsection Heading
      </h3>
      <p className="mt-3 text-fluid-base leading-relaxed text-pretty max-w-[65ch]">
        More body content continues here with the same fluid scaling.
      </p>
      <small className="block mt-4 text-fluid-xs text-muted-foreground">
        Caption or metadata text
      </small>
    </article>
  );
}
```

### Font-Size/Line-Height Shorthand (v4)

Tailwind CSS v4 supports `text-lg/7` shorthand — font-size and line-height in one utility class:

```tsx
<p className="text-base/6">Compact body text (line-height: 1.5rem)</p>
<p className="text-base/7">Relaxed body text (line-height: 1.75rem)</p>
<h2 className="text-2xl/8">Heading with explicit line-height</h2>
<small className="text-sm/5">Small text with tight leading</small>
```

### Readability & Text Wrapping

```tsx
// text-balance: prevents orphan words in headings
<h1 className="text-title text-balance">This heading will balance its lines</h1>

// text-pretty: improves line breaks in paragraphs (avoids widows)
<p className="text-body text-pretty max-w-[65ch]">
  Long prose text that wraps with better line-breaking decisions.
</p>

// hyphens-auto: better wrapping in narrow containers (needs lang attribute)
<article lang="en" className="text-body hyphens-auto max-w-[45ch]">
  Long words automatically hyphenate when the container is narrow.
</article>
```

---

## Fluid Spacing

```tsx
// Responsive container with fluid padding
function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      "p-[clamp(1rem,3vw,3rem)]",
      "mx-auto w-[min(90%,80rem)]"
    )}>
      {children}
    </div>
  );
}

// Section with fluid vertical rhythm
function ContentSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-fluid-xl px-fluid-md">
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}
```

### v4 `--spacing()` Function

Use the `--spacing()` function for theme-based spacing in arbitrary values:

```tsx
// Computed spacing with the --spacing() function
<div className="py-[calc(--spacing(4)-1px)]">
  {/* 16px - 1px = 15px (based on default 0.25rem × 4) */}
</div>

// Dynamic spacing — any number works out of the box in v4
<div className="mt-8 w-17 pr-29 gap-13">
  {/* All valid: calc(var(--spacing) * n) with default --spacing: 0.25rem */}
</div>
```

```css
/* How v4 generates spacing utilities */
@layer theme {
  :root {
    --spacing: 0.25rem;
  }
}

@layer utilities {
  .mt-8 { margin-top: calc(var(--spacing) * 8); }   /* 2rem */
  .w-17 { width: calc(var(--spacing) * 17); }        /* 4.25rem */
  .pr-29 { padding-right: calc(var(--spacing) * 29); } /* 7.25rem */
}
```

---

## Viewport Units

```tsx
// Use min-h-dvh for dynamic viewport height (accounts for mobile browser chrome)
function FullHeightHero({ title }: { title: string }) {
  return (
    <section className="min-h-dvh flex items-center justify-center">
      <h1 className="text-hero font-display font-bold tracking-tight text-balance">
        {title}
      </h1>
    </section>
  );
}
```

```css
/* Custom viewport utilities in globals.css (v4) */
@theme {
  --min-height-screen-small: 100svh;
  --min-height-screen-large: 100lvh;
  --min-height-screen-dynamic: 100dvh;
}
```

---

## Feature Queries & Preferences

```tsx
// Reduced motion preference
function AnimatedCard({ children }) {
  return (
    <div className={cn(
      "transition-transform duration-300",
      "motion-reduce:transition-none motion-reduce:transform-none"
    )}>
      {children}
    </div>
  );
}

// High contrast mode
function HighContrastButton({ children }) {
  return (
    <button className={cn(
      "bg-primary text-primary-foreground border border-transparent",
      "contrast-more:border-current contrast-more:border-2"
    )}>
      {children}
    </button>
  );
}

// Forced colors mode (Windows High Contrast)
function ForcedColorsControl({ children }) {
  return (
    <label>
      <input type="checkbox" className="appearance-none forced-colors:appearance-auto" />
      <span className="hidden forced-colors:block">{children}</span>
    </label>
  );
}

// CSS Grid feature detection fallback
function GridWithFallback({ children }) {
  return (
    <div className={cn(
      "flex flex-wrap gap-4",
      "supports-[display:grid]:grid",
      "supports-[display:grid]:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]"
    )}>
      {children}
    </div>
  );
}
```

---

## Breakpoint Ranges

```tsx
// Apply styles only between two breakpoints
<div className="md:max-lg:flex">
  {/* Flex only between md and lg — reverts at lg+ */}
</div>

// Arbitrary range values
<div className="min-[712px]:max-[877px]:right-16">
  {/* Applies only between 712px and 877px viewport */}
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

## Best Practices

### Mobile-First Priority Checklist (Laptop Primary)

1. **Design for lg (1024px) first** — Laptop is your primary design canvas. Sketch and plan here.
2. **Implement from base (mobile) up** — Write base classes for mobile (no prefix), then add `sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `3xl:`.
3. **Laptop is key** — Ensure `lg:` styles deliver the best experience. Most of your users see this.
4. **Cover ALL tiers** — Every component must render correctly at every breakpoint.
5. **Test in priority order** — Mobile first, then tablet, then laptop (★), then desktop, then large desktop.

### Typography Rules

6. **Body text ≥ 16px** — Never smaller on any screen.
7. **Line length 45–75 characters** — Use `max-w-prose` or `max-w-[65ch]`.
8. **Use fluid tokens** — Prefer `text-fluid-*` or `text-hero`/`text-title`/`text-body` over fixed sizes.
9. **`text-balance` for headings** — Prevents orphan words.
10. **`text-pretty` for paragraphs** — Better line-breaking.
11. **Negative tracking for large type** — `tracking-tight` on headings 2xl+.
12. **Variable fonts** — Reduce payload and enable fluid weight transitions.

### General Rules

13. **Fluid Over Fixed** — Use `clamp()` for typography and spacing.
14. **Container Queries** — Use `@container` for reusable component responsiveness. v4 includes `@max-*` variants and `@3xs`–`@7xl` sizes.
15. **Touch Targets** — `min-h-11 min-w-11` (44px) on all interactive elements on mobile/tablet (below `lg:`).
16. **Performance** — Next.js `Image`, lazy loading, font subsetting, `font-display: swap`.
17. **Logical Properties** — `ps-`, `pe-`, `ms-`, `me-` for RTL/LTR.
18. **Flexible Units** — `%`, `rem`, `em`, `vw` over fixed `px`.
19. **Accessibility** — 200% zoom without clipping. WCAG AA contrast. Focus styles visible. Use `forced-colors:` variant for Windows High Contrast.

### v4 Behavioral Changes

20. **`border` defaults to `currentColor`** — Not `gray-200`. Always add explicit border color: `border border-border`.
21. **`ring` defaults to 1px** — Uses `currentColor`, not 3px blue. Use `ring-2 ring-ring` for visible focus rings.
22. **Separate packages** — PostCSS plugin is `@tailwindcss/postcss`; CLI is `@tailwindcss/cli`.
23. **Dynamic spacing** — Any integer works for spacing utilities (e.g., `w-17`, `gap-13`). No need to extend theme.
24. **`@custom-variant`** — Create project-specific variants directly in CSS: `@custom-variant dark (&:where(.dark, .dark *))`.

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Horizontal overflow | Fixed widths or unrestrained content | `overflow-x-auto`, use `max-w-*` or `%` |
| Mobile viewport bounce | `100vh` excludes browser chrome | Use `min-h-dvh` |
| Tiny text on mobile | Fixed small font sizes | Minimum `text-base` (16px) for body |
| Unclickable buttons | Touch target < 44px | `min-h-11 min-w-11` on mobile |
| Images squished | No aspect ratio | `aspect-video`, `aspect-square`, `aspect-4/3` |
| Text too wide | No max-width | `max-w-prose` or `max-w-[65ch]` |
| Z-index battles | Arbitrary values | Use `z-10`, `z-20`, `z-50` scale |
| Layout jumps on resize | Abrupt breakpoint changes | Use `clamp()` for fluid values |
| Orphan words in headings | No text wrapping control | `text-balance` |
| Poor paragraph breaks | Default text wrapping | `text-pretty` |
| Font layout shift | Slow font loading | `font-display: swap`, fallback stacks |
| Unexpected border color | v4 `border` = `currentColor` | Add explicit color: `border border-border` |
| Thick/invisible ring | v4 `ring` = 1px currentColor | Use `ring-2 ring-ring` for visible focus |
| Missing spacing value | v3 required theme extension | v4: any number works — `gap-13`, `w-17` |

---

## Debug Utility

```tsx
// Show current breakpoint in development
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

## Reference Files

The following files contain deep-dive documentation for this skill. **Read the relevant reference file(s) before implementing any feature covered by this skill.**

| File | Topic | Key Sections |
|------|-------|--------------|
| [references/breakpoint-strategies.md](references/breakpoint-strategies.md) | Breakpoint strategy, device tiers, responsive patterns | Priority order · Tailwind v4 default & custom breakpoints · laptop-first class ordering · responsive nav / cards / hero / tables · `useBreakpoint` hook · preference queries · print styles |
| [references/container-queries.md](references/container-queries.md) | Component-level container queries (Tailwind v4 built-in) | Setup · default breakpoint table · named containers · dashboard widget · sidebar nav · adaptive card · arbitrary values · container-aware typography · fallback strategies · performance tips |
| [references/fluid-layouts.md](references/fluid-layouts.md) | Fluid spacing, grids, and layout primitives | Custom fluid spacing scale · fluid container widths · auto-fit grid · full-bleed grid · sidebar layout · cluster & switcher patterns · fluid aspect ratios · dynamic viewport units · safe-area insets |
| [references/typography-systems.md](references/typography-systems.md) | Full responsive typography system | Type tokens in `@theme` · font-size/line-height shorthand · typography-by-screen-tier table · hero / page / section / body / label patterns · `clamp()` patterns · accessibility & performance checklists |

> **Agent instruction**: When implementing breakpoints or layouts → read `references/breakpoint-strategies.md`. For component-scoped responsiveness → read `references/container-queries.md`. For fluid spacing or grid primitives → read `references/fluid-layouts.md`. For typography → read `references/typography-systems.md`.

---

## Resources

### Official Documentation
- [Tailwind CSS v4 Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS v4 Container Queries](https://tailwindcss.com/docs/responsive-design#container-queries)
- [Tailwind CSS v4 Font Size](https://tailwindcss.com/docs/font-size)
- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Text Wrap](https://tailwindcss.com/docs/text-wrap)
- [MDN CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [MDN CSS Hyphens](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)
- [MDN CSS Grid Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

### Tools & Calculators
- [Utopia Fluid Type Calculator](https://utopia.fyi/type/calculator/)
- [Utopia Fluid Space Calculator](https://utopia.fyi/space/calculator/)

### Learning Resources
- [Every Layout](https://every-layout.dev/)
- [Modern CSS Solutions](https://moderncss.dev/)
- [web.dev Responsive Images](https://web.dev/responsive-images/)

