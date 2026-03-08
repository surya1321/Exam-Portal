# Responsive Typography Systems with Tailwind CSS v4

## Table of Contents

1. [Design Principles](#design-principles)
2. [Type Tokens in @theme](#type-tokens-in-theme)
3. [Tailwind CSS v4 Default Font Sizes](#tailwind-css-v4-default-font-sizes)
   - [Custom Font Size with Properties](#custom-font-size-with-properties)
4. [Font-Size/Line-Height Shorthand](#font-sizeline-height-shorthand)
5. [Typography by Screen Tier](#typography-by-screen-tier)
6. [Component Patterns](#component-patterns)
   - [Hero Title](#hero-title)
   - [Page Title](#page-title)
   - [Section Heading](#section-heading)
   - [Article Body](#article-body)
   - [UI Label (Data-Dense)](#ui-label-data-dense)
   - [Container-Aware Heading](#container-aware-heading)
   - [Complete Typography Showcase](#complete-typography-showcase)
7. [Readability & Text Wrapping](#readability--text-wrapping)
8. [Inline Clamp() Patterns](#inline-clamp-patterns)
9. [Type Scale Generator Utility](#type-scale-generator-utility)
10. [Accessibility Checklist](#accessibility-checklist)
11. [Performance Checklist](#performance-checklist)
12. [Resources](#resources)

---

## Design Principles

1. **Body text ≥ 16px** on all screens — non-negotiable for readability
2. **Line length 45–75 characters** — use `max-w-prose` or `max-w-[65ch]`
3. **Line height**: 1.5–1.75 for body, 1.1–1.3 for headings
4. **`text-balance`** for headings — prevents orphan words
5. **`text-pretty`** for paragraphs — better line-break decisions
6. **`hyphens-auto`** with `lang` attribute for narrow containers
7. **Negative letter-spacing** on large headings (`tracking-tight`, `tracking-tighter`)
8. **Fluid scaling** with `clamp()` — smooth transitions instead of abrupt jumps
9. **Variable fonts** — fewer network requests, weight interpolation, reduced layout shift

---

## Type Tokens in `@theme`

```css
@import "tailwindcss";

@theme {
  /* ─── Font Families ─── */
  --font-sans: "Inter Variable", "Inter", system-ui, sans-serif;
  --font-display: "Sora", "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;

  /* ─── Font Feature Settings ─── */
  --font-sans--font-feature-settings: "cv02", "cv03", "cv04", "cv11";

  /* ─── Fluid Type Scale ─── */
  --text-fluid-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-fluid-xs--line-height: 1.5;

  --text-fluid-sm: clamp(0.875rem, 0.84rem + 0.18vw, 1rem);
  --text-fluid-sm--line-height: 1.5;

  --text-fluid-base: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --text-fluid-base--line-height: 1.65;

  --text-fluid-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-fluid-lg--line-height: 1.5;

  --text-fluid-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-fluid-xl--line-height: 1.4;

  --text-fluid-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --text-fluid-2xl--line-height: 1.3;

  --text-fluid-3xl: clamp(1.875rem, 1.4rem + 2.375vw, 2.5rem);
  --text-fluid-3xl--line-height: 1.2;
  --text-fluid-3xl--letter-spacing: -0.01em;

  --text-fluid-4xl: clamp(2.25rem, 1.5rem + 3.75vw, 3.5rem);
  --text-fluid-4xl--line-height: 1.15;
  --text-fluid-4xl--letter-spacing: -0.015em;

  --text-fluid-5xl: clamp(3rem, 1.8rem + 6vw, 5rem);
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
}
```

---

## Tailwind CSS v4 Default Font Sizes

| Class | Size | Default Line Height |
|-------|------|---------------------|
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

### Custom Font Size with Properties

```css
@theme {
  --text-tiny: 0.625rem;
  --text-tiny--line-height: 1.5rem;
  --text-tiny--letter-spacing: 0.125rem;
  --text-tiny--font-weight: 500;
}
```

```html
<div class="text-tiny">Uses all defined properties</div>
```

---

## Font-Size/Line-Height Shorthand

Tailwind CSS v4 supports `text-lg/7` shorthand — font-size and line-height in one utility class. The line-height is computed as `calc(var(--spacing) * n)` (e.g., `/7` = `1.75rem`):

```tsx
<p className="text-base/6">Compact (line-height: 1.5rem)</p>
<p className="text-base/7">Relaxed (line-height: 1.75rem)</p>
<h1 className="text-4xl/10">Heading with explicit leading</h1>
<small className="text-sm/5">Tight small text</small>
```

> **v4 behavior**: When you use just `text-xl` without a `/n` suffix, the default line-height from that font-size token is applied automatically. You only need the shorthand when overriding the default.

---

## Typography by Screen Tier

| Element | Mobile (<640) | Tablet (768) | Laptop (1024) | Desktop (1280) | Large (1536+) |
|---------|--------------|--------------|---------------|----------------|---------------|
| Hero h1 | 2rem | 2.5rem | 3rem | 3.5rem | 4rem |
| Page h1 | 1.5rem | 1.75rem | 2rem | 2.25rem | 2.5rem |
| Section h2 | 1.25rem | 1.375rem | 1.5rem | 1.75rem | 2rem |
| Subsection h3 | 1.125rem | 1.125rem | 1.25rem | 1.375rem | 1.5rem |
| Body | 1rem | 1rem | 1rem | 1.0625rem | 1.125rem |
| UI/Label | 0.875rem | 0.875rem | 0.875rem | 0.9375rem | 1rem |
| Caption | 0.75rem | 0.75rem | 0.75rem | 0.8125rem | 0.875rem |
| Body line-height | 1.65 | 1.65 | 1.65 | 1.6 | 1.55 |
| Heading line-height | 1.2 | 1.2 | 1.15 | 1.15 | 1.1 |
| Max line width | 100% | 65ch | 65ch | 72ch | 75ch |

---

## Component Patterns

### Hero Title

```tsx
function HeroTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-hero leading-tight tracking-tight text-balance">
      {children}
    </h1>
  );
}
```

### Page Title

```tsx
function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-title font-bold leading-tight tracking-tight text-balance">
      {children}
    </h1>
  );
}
```

### Section Heading

```tsx
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-fluid-2xl font-semibold leading-snug text-balance">
      {children}
    </h2>
  );
}
```

### Article Body

```tsx
function ArticleBody({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-[65ch] font-sans text-body leading-relaxed text-pretty hyphens-auto">
      {children}
    </article>
  );
}
```

### UI Label (Data-Dense)

```tsx
function UILabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-ui leading-snug tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
```

### Container-Aware Heading

```tsx
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

### Complete Typography Showcase

```tsx
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
        Body text at comfortable reading width. Long paragraphs stay between
        45–75 characters per line for optimal readability.
      </p>
      <h3 className="mt-6 text-fluid-xl font-semibold leading-snug">
        Subsection Heading
      </h3>
      <p className="mt-3 text-fluid-base leading-relaxed text-pretty max-w-[65ch]">
        More content using the same fluid scaling system.
      </p>
      <small className="block mt-4 text-fluid-xs text-muted-foreground">
        Caption or metadata text
      </small>
    </article>
  );
}
```

---

## Readability & Text Wrapping

```tsx
// text-balance: prevents orphan words in headings
<h1 className="text-title text-balance">Heading balances its lines automatically</h1>

// text-pretty: better line breaks in paragraphs
<p className="text-body text-pretty max-w-[65ch]">
  Long prose with improved line-breaking decisions. No more awkward short last lines.
</p>

// hyphens-auto: auto-hyphenation in narrow containers (requires lang attribute)
<article lang="en" className="text-body hyphens-auto max-w-[45ch]">
  Long words automatically hyphenate when the container gets narrow.
</article>
```

---

## Inline Clamp() Patterns

```tsx
// Hero with inline fluid sizing
<h1 className="text-[clamp(2rem,5vw+1rem,4rem)] font-bold leading-[1.1] tracking-tight">
  Hero Title
</h1>

// Subtitle
<p className="text-[clamp(1rem,2vw+0.5rem,1.5rem)] text-muted-foreground leading-relaxed">
  Subtitle text
</p>

// Container query fluid text using cqi units
<div className="@container">
  <h3 className="text-[clamp(1rem,3cqi,1.375rem)] font-semibold">
    Card Heading
  </h3>
</div>
```

---

## Type Scale Generator Utility

```tsx
function fluidValue(
  minSize: number,
  maxSize: number,
  minWidth = 320,
  maxWidth = 1200
): string {
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  const yAxisIntersection = -minWidth * slope + minSize;
  return `clamp(${minSize}rem, ${yAxisIntersection.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxSize}rem)`;
}

// Generate fluid type values
const typeScale = {
  sm: fluidValue(0.875, 1),
  base: fluidValue(1, 1.125),
  lg: fluidValue(1.25, 1.5),
  xl: fluidValue(1.5, 2),
  "2xl": fluidValue(2, 3),
};
```

---

## Accessibility Checklist

- [ ] Body text at roughly 16px minimum on small screens
- [ ] Text contrast passes WCAG AA for normal and large text
- [ ] Typography at 200% zoom without clipping or overlap
- [ ] No reliance on color only for typographic emphasis
- [ ] Focus styles visible near headings, links, and text controls
- [ ] Variable font fallback stacks to prevent layout shift
- [ ] `font-display: swap` in font loading strategy
- [ ] Use `forced-colors:` variant for text legibility in Windows High Contrast Mode

## Performance Checklist

- [ ] Use `font-display: swap` or equivalent
- [ ] Subset webfonts — ship only required weights/scripts
- [ ] Prefer variable fonts to reduce total payload
- [ ] Robust fallback stacks to avoid layout shifts
- [ ] Preload critical fonts with `<link rel="preload">`

---

## Resources

- [Tailwind CSS v4 Font Size](https://tailwindcss.com/docs/font-size)
- [Tailwind CSS v4 Line Height](https://tailwindcss.com/docs/line-height)
- [Tailwind CSS v4 Text Wrap](https://tailwindcss.com/docs/text-wrap)
- [Tailwind CSS v4 Theme](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Functions & Directives](https://tailwindcss.com/docs/functions-and-directives)
- [MDN CSS hyphens](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)
- [MDN line-height](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height)
- [Utopia Fluid Type Calculator](https://utopia.fyi/type/calculator/)
