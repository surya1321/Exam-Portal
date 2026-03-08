# 🎨 Design System & UI Architecture Agent — Deep-Dive Reference

## Domain
Visual consistency, component design system health, styling architecture, and UI correctness.

---

## Design System Consistency

### Design Token Violations

Flag any hardcoded visual values that should use design tokens:

| Category | What To Flag | Why |
|----------|-------------|-----|
| Colors | `color: #3b82f6`, `background: rgb(34, 197, 94)` | Should use `var(--color-primary)` or Tailwind `text-primary` |
| Spacing | `margin: 24px`, `padding: 16px` (without system) | Should use spacing scale (`space-4`, `p-4`, `var(--space-md)`) |
| Font sizes | `font-size: 14px`, `font-size: 1.2rem` (ad-hoc) | Should use typographic scale tokens |
| Shadows | `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` | Should use shadow tokens (`shadow-md`, `var(--shadow-card)`) |
| Border radius | `border-radius: 8px` (inconsistent across components) | Should use radius tokens for consistency |
| Breakpoints | `@media (max-width: 768px)` (magic number) | Should use named breakpoints from the design system |
| Z-index | `z-index: 999`, `z-index: 50` (arbitrary) | Should use a defined z-index scale/map |

### Inconsistent Component Variants

Flag the same UI pattern implemented differently across the codebase:

```tsx
// ❌ Before: Same button styled three different ways
// in Header.tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Save</button>
// in Sidebar.tsx
<button style={{ background: '#3b82f6', color: 'white', padding: '8px 16px' }}>Save</button>
// in Modal.tsx
<button className="btn-primary">Save</button>

// ✅ After: Single component, consistent across app
<Button variant="primary">Save</Button>
```

### Missing Component Abstractions

Flag repeated JSX patterns (3+ occurrences) that should be a shared component:
- Card layouts with similar header + body + footer structure
- Avatar + name + role combinations
- Status badges with icon + text + color mapping
- Empty state illustrations with message + CTA

### Design System Bypassing

Flag inline styles and one-off className overrides that circumvent the design system:
- `style={{ marginTop: '12px' }}` — should use spacing util
- `className="!text-red-500"` — forced override with `!important`
- CSS module with values that duplicate existing tokens

---

## Styling Architecture

### Consistency Assessment

Determine the project's styling approach and flag inconsistencies:

| Approach | Healthy Pattern | Red Flag |
|----------|----------------|----------|
| Tailwind CSS | Consistent utility usage, custom theme config | Arbitrary values `[#hexcode]`, mixing with inline styles |
| CSS Modules | One module per component, BEM-like naming | Global styles leaking, deeply nested selectors |
| styled-components | Theme provider, consistent token usage | Hardcoded values, no theme integration |
| Vanilla CSS | Well-organized custom properties, clear naming | Specificity conflicts, `!important` proliferation |

### Mixed Paradigms

Flag projects using multiple styling approaches without clear boundaries:
- Tailwind AND CSS Modules AND inline styles in the same component
- No documented rule for which approach to use where

### Specificity Issues

| Issue | What To Flag | Fix |
|-------|-------------|-----|
| `!important` usage | Any `!important` in production CSS | Restructure specificity or use CSS `@layer` for explicit ordering |
| Deep nesting | `.header .nav .list .item .link a` | Flatten selectors, use direct class targeting |
| Utility conflicts | Conflicting Tailwind classes: `text-red-500 text-blue-500` | Remove conflicting class, clarify intent |

### CSS `@layer` for Cascade Management

Flag specificity wars and recommend CSS layers for explicit cascade ordering:

```css
/* ✅ Explicit cascade order — no more specificity battles */
@layer reset, base, tokens, components, utilities, overrides;

@layer reset {
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
}

@layer tokens {
    :root { --color-primary: oklch(60% 0.15 250); }
}

@layer components {
    .btn { background: var(--color-primary); }
}

@layer utilities {
    .text-center { text-align: center; }  /* always beats components */
}
```

Benefits:
- Eliminates `!important` entirely — layers win over specificity
- Third-party CSS can be isolated in its own layer
- Design system styles never accidentally overridden by component styles

### CSS Container Queries

Flag responsive designs that rely solely on viewport-based media queries when component-level responsiveness is needed:

```css
/* ❌ Before: Card layout depends on viewport width */
@media (max-width: 768px) {
    .card { flex-direction: column; }
}

/* ✅ After: Card layout depends on its own container width */
.card-container {
    container-type: inline-size;
    container-name: card;
}

@container card (max-width: 400px) {
    .card { flex-direction: column; }
}
```

Container Queries are critical for:
- **Reusable components** that render in different-sized containers (sidebar vs. main content vs. modal)
- **Design system components** that must adapt to their parent, not the viewport
- **Micro-frontends** or widget-based architectures

### CSS Logical Properties for i18n/RTL

Flag physical directional properties in projects that support (or may support) RTL languages:

| Physical (Fixed) | Logical (Adaptive) | Why |
|-----------------|-------------------|-----|
| `margin-left` | `margin-inline-start` | Flips to right in RTL |
| `margin-right` | `margin-inline-end` | Flips to left in RTL |
| `padding-left` | `padding-inline-start` | Flips automatically |
| `text-align: left` | `text-align: start` | Respects reading direction |
| `float: left` | `float: inline-start` | Adapts to writing mode |
| `border-left` | `border-inline-start` | Flips for RTL |
| `width` | `inline-size` | Respects writing mode |
| `height` | `block-size` | Respects writing mode |

Even if RTL isn't supported now, logical properties are future-proof and the correct default.

---

## Responsive Design

### Patterns to Flag

| Issue | What To Flag | Fix |
|-------|-------------|-----|
| Hardcoded pixel widths | `width: 400px` on content containers | Use `max-width`, percentages, or `clamp()` |
| Missing breakpoint coverage | Desktop-only layout with no mobile adaptation | Add responsive breakpoints for key viewport ranges |
| Fixed positioning issues | Elements that overlap or break on small screens | Use responsive positioning with viewport awareness |
| Text overflow | Long text without `overflow`, `text-overflow`, or `line-clamp` | Add text truncation or wrapping strategies |
| Touch target size | Interactive elements < 44x44px | Ensure minimum 44x44px touch targets (WCAG 2.5.5) |

### Fluid Typography

```css
/* ❌ Fixed sizes — jarring jumps at breakpoints */
h1 { font-size: 24px; }
@media (min-width: 768px) { h1 { font-size: 36px; } }

/* ✅ Fluid — smooth scaling between viewports */
h1 { font-size: clamp(1.5rem, 1rem + 2vw, 2.25rem); }
```

---

## Dark Mode & Theming

### Implementation Gaps

| Issue | What To Flag | Fix |
|-------|-------------|-----|
| Hardcoded light colors | `color: #333`, `background: white` | Use CSS custom properties or Tailwind `dark:` variants |
| Missing `prefers-color-scheme` | No system preference detection | Add media query or theme context |
| Inconsistent dark mode | Some components themed, others not | Audit all components for theme token usage |
| Image backgrounds in dark mode | Light images on dark backgrounds | Provide dark mode image variants or use `mix-blend-mode` |
| Missing theme transition | Jarring switch between light/dark | Add `transition: background-color 200ms, color 200ms` |

---

## View Transitions API

For projects supporting View Transitions, flag:

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Page transitions without animation | Abrupt page change with no visual continuity | Use View Transitions API for smooth cross-page animation |
| Manual transition animations | Complex CSS/JS for page transitions | Replace with native `document.startViewTransition()` or Next.js `unstable_ViewTransition` |
| Missing `view-transition-name` | Elements that should persist across navigations lack identity | Add `view-transition-name` to shared elements (header, hero image) |

```css
/* Shared element transition — image morphs from list to detail view */
.product-image {
    view-transition-name: product-hero;
}

::view-transition-old(product-hero),
::view-transition-new(product-hero) {
    animation-duration: 300ms;
}
```

View Transitions are critical for:
- **E-commerce**: Product image morphing from grid to detail page
- **Navigation**: Header/sidebar persisting as content changes
- **Lists**: Card expanding into full-page detail view
- **Tabs**: Smooth crossfade between tab panels

---

## Animation & Interaction Design

### Performance-Safe Animations

| Property | Safe? | Why |
|----------|-------|-----|
| `transform` | ✅ Compositor | Runs on GPU, no layout recalculation |
| `opacity` | ✅ Compositor | Runs on GPU, no layout recalculation |
| `filter` | ✅ Compositor | Runs on GPU in most browsers |
| `width`, `height` | ❌ Layout | Triggers full layout recalculation — causes jank |
| `top`, `left`, `right`, `bottom` | ❌ Layout | Triggers layout — use `transform: translate()` instead |
| `margin`, `padding` | ❌ Layout | Triggers layout — never animate these |
| `border-radius` | ⚠️ Paint | Triggers paint but not layout — acceptable sparingly |

### Accessibility in Animations

```css
/* Always respect user preferences */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Z-Index Management

Flag arbitrary z-index values. Recommend a defined scale:

```css
:root {
    --z-dropdown: 100;
    --z-sticky: 200;
    --z-overlay: 300;
    --z-modal: 400;
    --z-popover: 500;
    --z-toast: 600;
    --z-tooltip: 700;
}
```

---

## Current Design Assessment

When reviewing the current UI, evaluate:

1. **Spacing consistency** — Are margins/paddings following a system or ad-hoc?
2. **Typographic hierarchy** — Is there a clear visual hierarchy (h1 > h2 > h3 > body)?
3. **Color usage** — Harmonious palette? Consistent semantic colors (success, error, warning)?
4. **Visual rhythm** — Consistent spacing between sections, cards, and list items?
5. **Interactive affordances** — Do clickable elements look clickable? Hover/focus states present?
6. **Cognitive load** — Is the UI overwhelming? Can the user find what they need quickly?

---

## Return Format

For each finding, return:
```
Location: <file:line or component name>
Issue Type: Design Token | Styling | Responsive | Dark Mode | Animation | Visual
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Visual Risk: <what the user sees — layout break, inconsistency, jank>
Recommended Fix: <design system alignment with code example>
```
