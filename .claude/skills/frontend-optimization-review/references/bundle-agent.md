# 📦 Bundle, Assets & Performance Agent — Deep-Dive Reference

## Domain
JavaScript bundle size, asset optimization, loading performance, and Core Web Vitals.

## Table of Contents
- [Bundle Size Analysis](#bundle-size) — heavy imports, tree shaking, dynamic imports
- [Route Groups & Bundle Analysis Tooling](#route-groups-tooling) — parallel routes, `@next/bundle-analyzer`, CSS optimization
- [Image Optimization](#image-optimization) — `next/image`, formats, sizing, priority
- [Font Optimization](#font-optimization) — `next/font`, FOUT/FOIT, `font-display`
- [Core Web Vitals](#core-web-vitals) — LCP, CLS, INP, TBT
- [PPR & Streaming Architecture](#ppr-streaming) — Partial Prerendering, Suspense granularity
- [Performance Budgets in CI](#performance-budgets-ci) — Lighthouse CI, size-limit, regression gates
- [Script & Resource Loading](#script-loading) — `next/script` strategies, resource hints
- [Scaling Code Splitting](#scaling-code-splitting) — route-level strategy, third-party script governance

---

## Bundle Size Analysis

### Heavy Client-Side Imports

Flag large libraries imported in client components that could be:
- **Replaced** with lighter alternatives
- **Moved** to server components (where bundle size doesn't matter)
- **Dynamically imported** so they only load when needed

| Known Offender | Size | Lighter Alternative |
|----------------|------|-------------------|
| `moment.js` | ~300KB | `date-fns` (~10KB tree-shaken) or `dayjs` (~2KB) |
| `lodash` (full) | ~70KB | `lodash-es` (tree-shakeable) or native JS methods |
| `chart.js` | ~200KB | Load via `next/dynamic` — below-the-fold |
| `marked` / `markdown-it` | ~50-100KB | `next/dynamic` or server-side rendering |
| `highlight.js` (full) | ~900KB | Import only needed languages |

### Dynamic Import Opportunities

Flag components that should use `next/dynamic` or `React.lazy`:

| Component Type | Why Dynamic |
|---------------|------------|
| Modals and drawers | Not visible on initial load |
| Below-the-fold content | Defer until viewport approaches |
| Admin-only features | Not needed for regular users |
| Rich text editors | Heavy and conditionally rendered |
| Chart/graph components | Below fold, heavy dependencies |
| Syntax highlighters | Conditionally rendered, heavy |

```tsx
// ❌ Before: Entire library loaded eagerly
import { Chart } from 'chart.js';

// ✅ After: Loaded only when needed
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('./Chart'), {
    loading: () => <ChartSkeleton />,
    ssr: false,
});
```

### Barrel File Anti-Pattern

Flag `index.ts` barrel files that re-export everything:

```tsx
// ❌ utils/index.ts re-exports everything
export * from './formatting';
export * from './validation';
export * from './analytics';   // includes heavy chart library

// ❌ Consumer imports one function but bundles everything
import { formatDate } from '@/utils';

// ✅ Import directly from the specific module
import { formatDate } from '@/utils/formatting';
```

### Tree-Shaking Issues

- Flag `"use client"` components importing server-only utilities
- Flag `require()` calls (not tree-shakeable — use ES `import`)
- Flag side-effectful imports that prevent dead code elimination
- Flag `import *` (namespace imports) that prevent tree-shaking of unused exports

### Route Groups & Parallel Routes Bundle Impact

Flag routes that share large dependencies but are in separate route groups, causing duplicate bundling:

| Pattern | Problem | Fix |
|---------|---------|-----|
| Same library in multiple route groups | Each group gets its own copy in its bundle | Move shared dependency to root layout or shared module |
| Parallel route with heavy dependency | `@modal` slot loads 200KB chart library | Dynamic import inside the parallel route |
| Route group without `loading.tsx` | No code splitting benefit at the route level | Add `loading.tsx` to enable automatic code splitting |

### Bundle Analysis Tooling

Flag projects without bundle visibility. Recommend:

```tsx
// next.config.js — Enable bundle analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);

// Run: ANALYZE=true npm run build
```

| Tool | Purpose | When To Use |
|------|---------|-------------|
| `@next/bundle-analyzer` | Visualize all chunks and their sizes | Before every major release |
| `source-map-explorer` | Trace bundle contents to source files | When a specific chunk is unexpectedly large |
| `bundlesize` / `size-limit` | CI enforcement of size budgets | Every PR — prevents regressions |
| `import-cost` (VS Code) | Show import size inline while coding | During development |

### CSS Optimization

| Issue | What To Flag | Fix |
|-------|-------------|-----|
| Unused CSS | Large CSS files with unused rules | PurgeCSS or Tailwind's built-in purging |
| CSS-in-JS runtime overhead | styled-components / Emotion runtime (6-12KB) | Consider CSS Modules or Tailwind (zero runtime) |
| CSS import order issues | Styles applied in wrong order due to import sequence | Use CSS Layers (`@layer`) for explicit ordering |
| Duplicate CSS | Same styles defined in multiple CSS files | Centralize in design system tokens |
| Global CSS in component files | `import './global.css'` inside components | Keep global CSS in `app/globals.css` only |

---

## Image & Media Optimization

### Every `<img>` Must Be `next/image`

| Check | What To Flag | Fix |
|-------|-------------|-----|
| `<img>` tag usage | Any `<img>` in Next.js project | Replace with `<Image>` from `next/image` |
| Missing `priority` | Above-the-fold hero/banner images without `priority` | Add `priority` prop — critical for LCP |
| Missing dimensions | Images without `width`/`height` or `fill` | Add explicit dimensions — prevents CLS |
| Missing `sizes` | Responsive images without `sizes` attribute | Add `sizes` to prevent serving oversized images |
| No format optimization | PNG/JPG served without WebP/AVIF conversion | `next/image` handles this automatically |
| Oversized source | 4000px image displayed at 400px | Provide appropriately sized source or let `next/image` resize |

### Video & Media

- Flag auto-playing videos without `poster` image (causes LCP delay)
- Flag video embeds (YouTube, Vimeo) without lazy loading
- Flag large GIFs that should be `<video>` (MP4/WebM = 90% smaller)

---

## Font Optimization

| Check | What To Flag | Fix |
|-------|-------------|-----|
| `<link>` font loading | Google Fonts or custom fonts via `<link>` tag | Use `next/font/google` or `next/font/local` |
| Missing `font-display` | No `font-display: swap` causing FOIT | `next/font` handles this automatically |
| Too many variants | Loading 5+ font weights when 2 are used | Load only `400` and `700` (or what's actually used) |
| Flash of unstyled text | Layout shift when fonts swap in | `next/font` with `variable` option eliminates shift |

```tsx
// ❌ Before: External network request, layout shift
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900" rel="stylesheet" />

// ✅ After: Self-hosted, zero layout shift, only needed weights
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
```

---

## Core Web Vitals Assessment

### LCP (Largest Contentful Paint) — Target: < 2.5s

Identify the LCP element (usually the hero image, banner, or main heading) and flag:

| Delay Source | What To Look For | Fix |
|-------------|-----------------|-----|
| Render-blocking resources | CSS/JS blocking first paint | Use `async`/`defer`, inline critical CSS |
| Missing preload | LCP image not preloaded | `priority` prop on `next/image` or `<link rel="preload">` |
| Client-side rendering | LCP content rendered only after hydration | Move to server component |
| Server response time | Slow TTFB delaying everything | ISR, caching, edge rendering |
| Font loading delay | Text not visible until font loads | `next/font` with `display: swap` |

### CLS (Cumulative Layout Shift) — Target: < 0.1

| Shift Source | What To Look For | Fix |
|-------------|-----------------|-----|
| Images without dimensions | `<img>` without width/height | Use `next/image` with explicit dimensions |
| Dynamic content injection | Content inserted above existing content | Reserve space with skeleton placeholders |
| Font swap | Layout shift when web font replaces fallback | `next/font` with `adjustFontFallback` |
| Late-loading ads/embeds | Third-party content pushing layout | Reserve fixed-size containers |

### INP (Interaction to Next Paint) — Target: < 200ms

| Bottleneck | What To Look For | Fix |
|-----------|-----------------|-----|
| Long event handlers | Synchronous computation in `onClick`/`onChange` | Break into microtasks or use Web Workers |
| Missing `useTransition` | Non-urgent state updates blocking the main thread | Wrap with `startTransition` for lower priority |
| Heavy re-renders on interaction | Click triggers cascade of re-renders | Optimize component structure, use `React.memo` |
| Synchronous state updates | Large list filtering on every keystroke | Debounce or use `useDeferredValue` |

### TBT (Total Blocking Time)

- Flag long tasks (>50ms) blocking the main thread
- Flag large hydration payloads — too much JS executing on page load
- Flag synchronous third-party scripts blocking interactivity

### PPR & Streaming Architecture

For Next.js projects with PPR (Partial Prerendering) support:

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Full SSR for mixed static/dynamic pages | TTFB delayed by dynamic data | PPR: static shell served from CDN, dynamic sections stream in |
| Client-side data fetching for personalized content | Extra round trip after initial load | PPR: server-streamed personalized sections |
| Missing Suspense boundaries in dynamic sections | Can't stream — entire page blocks | Add `<Suspense>` around each dynamic section |
| `loading.tsx` covering entire page | No granular streaming | Move to inline `<Suspense>` boundaries for each section |

PPR enables a single page to be:
- **Static parts** → served instantly from CDN (prerendered at build time)
- **Dynamic parts** → streamed from the server in real-time (wrapped in Suspense)

This eliminates the "static vs dynamic" trade-off entirely.

### Performance Budgets in CI

Flag projects without automated performance regression detection:

```json
// .lighthouserc.js — Lighthouse CI budget
assertions: {
    'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
    'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
    'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
    'total-blocking-time': ['error', { maxNumericValue: 300 }],
    'resource-summary:script:size': ['error', { maxNumericValue: 300000 }],
}
```

| Budget Type | Tool | What It Prevents |
|-------------|------|------------------|
| Bundle size per route | `bundlesize` / `size-limit` | 50KB dependency added in a "small PR" |
| Lighthouse scores | Lighthouse CI | Performance regression from new features |
| Image payload | `next/image` audit | Unoptimized 4MB hero image |
| Third-party script count | Manual audit | Script bloat from marketing/analytics tags |

Without budgets, performance degrades gradually and invisibly.

---

## Script & Resource Loading

### Resource Hints

| Hint | When To Use | Example |
|------|------------|---------|
| `preconnect` | Critical third-party origins | `<link rel="preconnect" href="https://api.example.com">` |
| `preload` | Critical assets needed immediately | `<link rel="preload" href="/hero.webp" as="image">` |
| `prefetch` | Resources needed for likely next navigation | `<link rel="prefetch" href="/about">` |
| `dns-prefetch` | Third-party origins (less critical than preconnect) | `<link rel="dns-prefetch" href="https://analytics.example.com">` |

### Third-Party Scripts

```tsx
// ❌ Before: Render-blocking, no strategy
<script src="https://analytics.example.com/tracker.js"></script>

// ✅ After: Non-blocking with correct strategy
import Script from 'next/script';
<Script src="https://analytics.example.com/tracker.js" strategy="lazyOnload" />
```

| Strategy | When To Use |
|----------|------------|
| `beforeInteractive` | Scripts that must load before page is interactive (rare) |
| `afterInteractive` | Analytics, chat widgets — after hydration |
| `lazyOnload` | Non-critical tracking, social widgets — when idle |
| `worker` | Heavy scripts that can run in a web worker (experimental) |

---

## Scaling Code Splitting

Flag applications with a growing route count and no strategy for managing bundle growth:

### Route-Level Splitting Strategy

| App Size | Strategy | Why |
|----------|----------|-----|
| < 10 routes | Default Next.js automatic splitting | Built-in per-page code splitting is sufficient |
| 10-50 routes | Route groups with shared layouts | Group related routes to share dependencies |
| 50-200 routes | Route groups + aggressive `next/dynamic` | Below-fold and conditional content must be lazy-loaded |
| 200+ routes | Micro-frontend or modular architecture | Single build can't scale — split by team/domain |

### Granular Suspense Boundaries at Scale

```tsx
// ❌ Before: One loading state for the entire page
// app/dashboard/loading.tsx — shows single spinner for everything

// ✅ After: Granular boundaries — each section loads independently
export default async function Dashboard() {
    return (
        <main>
            <Suspense fallback={<MetricsSkeleton />}>
                <DashboardMetrics />      {/* Loads first — small data */}
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
                <RevenueChart />          {/* Loads second — medium data */}
            </Suspense>
            <Suspense fallback={<TableSkeleton />}>
                <RecentTransactions />    {/* Loads third — large data */}
            </Suspense>
        </main>
    );
}
```

Benefits at scale:
- Each section streams independently — fast sections appear instantly
- Slow sections don't block fast sections
- Error in one section doesn't crash others (with `error.tsx` per section)

### Third-Party Script Governance

Flag uncontrolled third-party script accumulation — the #1 cause of bundle bloat in mature apps:

| Check | What To Flag | Fix |
|-------|-------------|-----|
| No script inventory | Unknown how many third-party scripts are loaded | Create a manifest of all third-party scripts with owners |
| Marketing tag sprawl | 10+ analytics/marketing tags (GTM, FB Pixel, Hotjar, Intercom, etc.) | Consolidate via GTM, limit to 3-4 essential scripts |
| No loading strategy per script | All scripts load with same priority | Assign `afterInteractive` or `lazyOnload` per script |
| No size budget for third-party | Third-party JS exceeds first-party JS | Set a budget: third-party < first-party |
| Orphaned scripts | Scripts for deprecated features still loading | Quarterly audit and cleanup |

---

## Return Format

For each finding, return:
```
Location: <file:line or component name>
Issue Type: Bundle Size | Image | Font | Web Vital | Script Loading
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Recommended Fix: <optimization with code example>
Estimated Impact: <size reduction in KB, affected Web Vital, estimated improvement>
```
