# Container Queries with Tailwind CSS v4

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
   - [Custom Container Sizes](#custom-container-sizes)
3. [Default Container Query Breakpoints](#default-container-query-breakpoints)
4. [Basic Container Query](#basic-container-query)
5. [Named Containers](#named-containers)
6. [Practical Patterns](#practical-patterns)
   - [Dashboard Widget](#dashboard-widget)
   - [Collapsible Sidebar Navigation](#collapsible-sidebar-navigation)
   - [Adaptive Card](#adaptive-card)
7. [Arbitrary Container Values](#arbitrary-container-values)
8. [Container-Aware Typography](#container-aware-typography)
9. [Fallback Strategies](#fallback-strategies)
10. [Performance Tips](#performance-tips)
11. [Resources](#resources)

---

## Overview

Container queries enable component-based responsive design — elements respond to their **container's size** rather than the viewport. Tailwind CSS v4 includes native support with no plugins required.

---

## Setup

Container queries work **out of the box** in Tailwind CSS v4.

```tsx
// Mark parent as container, use @ variants on children
<div className="@container">
  <div className="flex flex-col @md:flex-row">
    {/* Responds to container width, not viewport */}
  </div>
</div>
```

### Custom Container Sizes

```css
@import "tailwindcss";

@theme {
  --container-8xl: 96rem;   /* 1536px */
  --container-4k: 160rem;   /* 2560px */
}
```

---

## Default Container Query Breakpoints

| Variant | Min-width | Pixels |
|---------|-----------|--------|
| `@3xs` | 16rem | 256px |
| `@2xs` | 18rem | 288px |
| `@xs` | 20rem | 320px |
| `@sm` | 24rem | 384px |
| `@md` | 28rem | 448px |
| `@lg` | 32rem | 512px |
| `@xl` | 36rem | 576px |
| `@2xl` | 42rem | 672px |
| `@3xl` | 48rem | 768px |
| `@4xl` | 56rem | 896px |
| `@5xl` | 64rem | 1024px |
| `@6xl` | 72rem | 1152px |
| `@7xl` | 80rem | 1280px |

---

## Basic Container Query

```tsx
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
          <h2 className="text-lg font-semibold @md:text-xl @lg:text-2xl">{title}</h2>
          <p className="mt-2 text-muted-foreground @lg:text-lg">{description}</p>
        </div>
      </article>
    </div>
  );
}
```

---

## Named Containers

Use named containers to scope queries to a specific parent.

```tsx
function Dashboard() {
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

---

## Practical Patterns

### Dashboard Widget

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

### Collapsible Sidebar Navigation

```tsx
function SidebarNav({ items }) {
  return (
    <div className="@container/nav">
      <nav className="flex flex-col gap-1 @[200px]/nav:gap-2">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
            <span className="h-5 w-5 shrink-0">{item.icon}</span>
            <span className="hidden @[200px]/nav:block truncate">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
```

### Adaptive Card

```tsx
function AdaptiveCard({ title, description, image, actions }) {
  return (
    <div className="@container">
      <article className="flex flex-col gap-4 p-4 bg-card rounded-lg border @md:flex-row @lg:p-6">
        <img src={image} alt="" className="w-full aspect-video rounded-lg object-cover @md:w-40 @lg:w-56" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg @md:text-xl @lg:text-2xl">{title}</h3>
          <p className="mt-2 text-muted-foreground text-sm @md:text-base">{description}</p>
          {actions && <div className="hidden @md:flex gap-2 mt-4">{actions}</div>}
        </div>
      </article>
    </div>
  );
}
```

---

## Max-Width Container Queries

Tailwind CSS v4 includes `@max-*` variants for max-width container queries — style elements when the container is **below** a certain size.

```tsx
// Apply styles when container is narrower than md (448px)
function CompactWidget({ children }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-3 @max-md:grid-cols-1">
        {children}
      </div>
    </div>
  );
}
```

### Container Query Ranges

Stack `@min-*` and `@max-*` variants (or regular `@sm`/`@md` with `@max-*`) to target specific container size ranges:

```tsx
// Only apply styles between sm and md container sizes
function RangeExample() {
  return (
    <div className="@container">
      <div className="flex flex-row @sm:@max-md:flex-col">
        {/* Switches to column only for sm–md container range */}
      </div>
    </div>
  );
}

// Using @min-* and @max-* for precise ranges
function PreciseRange() {
  return (
    <div className="@container">
      <div className="flex @min-md:@max-xl:hidden">
        {/* Hidden only when container is between md and xl */}
      </div>
    </div>
  );
}
```

---

## Arbitrary Container Values

```tsx
// One-off breakpoint without theme configuration
function PreciseContainerQuery() {
  return (
    <div className="@container">
      <div className="flex flex-col @min-[475px]:flex-row @min-[600px]:gap-8">
        {/* Custom breakpoints at 475px and 600px container width */}
      </div>
    </div>
  );
}
```

---

## Container-Aware Typography

```tsx
// Heading that scales with container, not viewport
function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container">
      <h3 className="text-[clamp(1rem,3cqi,1.375rem)] leading-snug text-balance font-semibold">
        {children}
      </h3>
    </div>
  );
}
```

> `cqi` = container query inline-size unit — scales relative to container width.

---

## Fallback Strategies

Combine viewport media queries with container queries for progressive enhancement:

```tsx
function CardWithFallback({ title, image, description }) {
  return (
    <div className="@container">
      <article className="flex flex-col gap-4 md:flex-row @md:flex-col @lg:flex-row">
        {/* md: = viewport-based fallback, @md/@lg = container query override */}
        <img src={image} alt="" className="w-full aspect-video md:w-48 @md:w-full @lg:w-48" />
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
      </article>
    </div>
  );
}
```

---

## Performance Tips

```tsx
// ✅ Good: Single container wrapping a layout
function Optimized({ items }) {
  return (
    <div className="@container">
      <div className="grid @md:grid-cols-2 @xl:grid-cols-3 gap-4">
        {items.map((item) => <Card key={item.id} item={item} />)}
      </div>
    </div>
  );
}

// ❌ Avoid: Deeply nested containers (performance + complexity hit)
function OverlyNested() {
  return (
    <div className="@container">
      <div className="@container">
        <div className="@container">{/* Too deep — flatten the hierarchy */}</div>
      </div>
    </div>
  );
}
```

---

## Key v4 Behavioral Notes

- **`@container` is built-in** — no `@tailwindcss/container-queries` plugin needed (that was v3 only).
- **`border` defaults to `currentColor`** in v4 (not `gray-200`). Add explicit border color: `border border-border`.
- **`ring` defaults to 1px** with `currentColor` (not 3px blue). Use `ring-2 ring-ring` for v3-like behavior.
- Container query variants (`@sm`, `@md`, etc.) are **mobile-first** (min-width), just like viewport variants.
- `@max-*` variants enable **max-width** container queries for targeting smaller containers.

---

## Resources

- [Tailwind CSS v4 Container Queries](https://tailwindcss.com/docs/responsive-design#container-queries)
- [MDN Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [web.dev Container Queries](https://web.dev/cq-stable/)
