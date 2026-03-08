# ♿ UX, Accessibility & SEO Agent — Deep-Dive Reference

## Domain
User experience quality, accessibility compliance (WCAG 2.1 AA), and search engine optimization.

---

## Accessibility — WCAG 2.1 AA Baseline

### Images & Media (WCAG 1.1.1)

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing `alt` text | `<img>` or `<Image>` without `alt` attribute | Add descriptive alt text |
| Empty alt on informational images | Meaningful image with `alt=""` | Provide descriptive alt text |
| Non-empty alt on decorative images | Purely decorative image with descriptive alt | Use `alt=""` and `role="presentation"` |
| Icon buttons without labels | `<button><Icon /></button>` with no accessible name | Add `aria-label` or visually hidden text |
| SVG without title | Informational SVG without `<title>` or `aria-label` | Add `<title>` element or `aria-label` |

### Color Contrast (WCAG 1.4.3)

| Minimum Ratio | Applies To |
|---------------|-----------|
| 4.5:1 | Normal text (< 18px regular, < 14px bold) |
| 3:1 | Large text (≥ 18px regular, ≥ 14px bold) |
| 3:1 | UI components and graphical objects |

Flag combinations that likely fail:
- Light gray text on white backgrounds
- Placeholder text with insufficient contrast
- Disabled state text that's too faded to read
- Colored text on colored backgrounds without testing

### Keyboard Navigation (WCAG 2.1.1, 2.4.3, 2.4.7)

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Non-interactive elements with `onClick` | `<div onClick={...}>` — not keyboard accessible | Use `<button>` or add `role="button"`, `tabIndex={0}`, `onKeyDown` |
| Missing focus management | Modal opens but focus stays behind it | Move focus to modal on open, return on close |
| No visible focus indicator | Interactive elements with `outline: none` and no replacement | Provide visible focus ring (`:focus-visible` styles) |
| Skip navigation missing | No way to skip past repeated header/nav | Add `<a href="#main-content">Skip to content</a>` |
| Tab order broken | Elements focusable in wrong order | Fix DOM order or use `tabIndex` appropriately |
| Focus trap missing | Modal/drawer allows tab to escape behind overlay | Implement focus trap within modal |

### ARIA Usage (WCAG 4.1.2)

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing landmark roles | No `<main>`, `<nav>`, `<aside>` elements | Use semantic HTML5 landmarks |
| `aria-hidden` on focusable elements | Focusable element hidden from AT but visible | Remove `aria-hidden` or make non-focusable |
| Missing `aria-live` for dynamic content | Content updates without screen reader announcement | Add `aria-live="polite"` on dynamic regions |
| Misused ARIA roles | `role="button"` on a link, `role="link"` on a button | Use the correct semantic element instead |
| Missing `aria-expanded` | Accordion/dropdown without expansion state | Add `aria-expanded={isOpen}` |
| Missing `aria-describedby` | Form errors not associated with their inputs | Link error messages with `aria-describedby` |

### WCAG 2.2 New Success Criteria

| Criterion | Level | What To Check | Fix |
|-----------|-------|--------------|-----|
| **2.4.11 Focus Not Obscured (Minimum)** | AA | Focused element not fully hidden by sticky headers, modals, or footers | Add scroll margin: `scroll-margin-top: 80px` on focusable elements |
| **2.4.12 Focus Not Obscured (Enhanced)** | AAA | Focused element not even partially hidden | Ensure nothing overlaps focused elements |
| **2.4.13 Focus Appearance** | AAA | Focus indicator has sufficient size and contrast | Minimum 2px solid outline with 3:1 contrast |
| **2.5.7 Dragging Movements** | AA | Drag-only interactions have alternatives | Provide click/tap alternative for drag-and-drop |
| **2.5.8 Target Size (Minimum)** | AA | Interactive targets at least 24×24px | Add padding to small targets, use min 44×44px for touch |
| **3.2.6 Consistent Help** | A | Help mechanisms in same relative location across pages | Keep help link/chat in consistent position |
| **3.3.7 Redundant Entry** | A | Previously entered info not required again | Auto-fill from session, don't re-ask for address/name |
| **3.3.8 Accessible Authentication (Minimum)** | AA | Auth doesn't require cognitive function test | Support password managers, no CAPTCHAs without alternative |

```css
/* Fix focus obscured by sticky header */
:target,
*:focus {
    scroll-margin-top: 80px; /* height of sticky header */
    scroll-margin-bottom: 60px; /* height of sticky footer */
}
```

### Form Accessibility (WCAG 1.3.1, 3.3.1, 3.3.2)

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing `<label>` associations | Input without `<label htmlFor={id}>` | Add explicit label association |
| Missing required indicators | Required fields without visual + programmatic indication | Add `required` attribute and visual asterisk |
| Error announcements | Validation errors not announced to screen readers | Use `aria-invalid`, `aria-describedby`, and `role="alert"` |
| Missing autocomplete | Common fields without `autocomplete` attribute | Add `autocomplete="email"`, `autocomplete="name"`, etc. |

---

## UX Bottlenecks & Risk Areas

### Missing States

Every async operation and data display must handle these states:

| State | What To Check | Impact When Missing |
|-------|--------------|-------------------|
| **Loading** | Skeleton, spinner, or optimistic UI during fetch | User thinks page is broken |
| **Error** | Error message with retry option on failure | Silent failure, user stuck |
| **Empty** | Meaningful empty state with CTA when no data exists | Blank screen, user confused |
| **Partial failure** | Graceful degradation when one section fails | Entire page crashes for one failed query |
| **Offline** | Behavior when network is unavailable | Uncaught errors, blank screens |

### Interaction Feedback

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Buttons without loading state | Submit button stays idle during async action | Show spinner/disable during submission |
| No success confirmation | Action completes silently | Toast notification or inline confirmation |
| Missing hover/active states | Interactive elements with no visual feedback | Add `:hover` and `:active` styles |
| Double-submit possible | Form can be submitted multiple times | Disable button during submission, use `isPending` |
| No optimistic UI | User waits for round trip on every action | Update UI immediately, rollback on error |

### Form UX

| Check | What To Flag | Fix |
|-------|-------------|-----|
| All errors on submit only | No inline validation as user types | Validate on blur and show inline errors |
| No auto-focus on first field | User must click to start form | `autoFocus` on first input |
| Tab order wrong | Fields don't tab in visual order | Fix DOM order |
| No error focus | Errors shown but focus stays at submit button | Focus on first errored field after submit |
| Missing field hints | Complex fields without helper text | Add `helperText` below fields |

### Navigation UX

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing active state | Current page not indicated in navigation | Highlight active nav item |
| Missing breadcrumbs | Deep pages without navigation context | Add breadcrumb trail |
| Back navigation broken | Browser back doesn't return to previous state | Preserve state in URL (filters, pagination) |
| No loading indicator on navigation | Page transition shows nothing | Use Next.js `loading.tsx` or NProgress |

### Scroll Restoration

Flag applications that don't preserve or manage scroll position properly:

| Scenario | What To Flag | Fix |
|----------|-------------|-----|
| List → detail → back | User returns to top of list instead of their scroll position | Enable `experimental.scrollRestoration` in Next.js config |
| Tab switching | Tab change resets scroll position in each tab | Preserve scroll per tab with `useRef` or URL state |
| Infinite scroll + back | Returning to infinite list reloads from page 1 | Use TanStack Query's `getNextPageParam` + scroll position in URL |
| Modal open/close | Background content scrolls while modal is open | Use `overflow: hidden` on body when modal opens, restore on close |

### Performance Perception UX

Flag UX patterns that make the app *feel* slower than it is:

| Pattern | Perception Problem | Better Pattern |
|---------|-------------------|----------------|
| **Spinner** for content loading | User stares at spinning circle — feels slow | **Skeleton screen** — shows content shape, feels faster |
| **Blank screen** while loading | User thinks page is broken | **Instant shell** with progressive content streaming |
| **Loading bar at top** as only indicator | User doesn't know what's loading | **Skeleton per section** — shows which parts are loading |
| **Full-page loading overlay** | Blocks all interaction | **Optimistic UI** — show result immediately, confirm in background |
| **"Loading..."** text | Minimal effort, user feels ignored | **Progressive disclosure** — show what you can immediately |

Research shows:
- Skeleton screens feel **30-40% faster** than spinners for the same load time
- Optimistic updates feel **instant** for mutations under 3 seconds
- Progressive loading with streaming feels faster than waiting for complete data

---

## Next.js SEO Assessment

### Metadata

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing `metadata` export | Pages without title/description | Add `export const metadata = { title, description }` |
| Missing `generateMetadata` | Dynamic pages with static metadata | Generate metadata from page data using `generateMetadata` |
| Missing OG tags | No Open Graph meta tags for social sharing | Add `openGraph: { title, description, images }` |
| Missing Twitter cards | No Twitter card meta tags | Add `twitter: { card, title, description }` |
| Duplicate titles | Multiple pages with same `<title>` | Make each page title unique and descriptive |
| Missing canonical URLs | Parameterized pages without canonical | Add `alternates: { canonical: url }` |

### Crawlability

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing `robots.txt` | No robots configuration | Create `app/robots.ts` or static `robots.txt` |
| Missing `sitemap.xml` | No sitemap for search engines | Create `app/sitemap.ts` with dynamic generation |
| Client-rendered SEO content | Headings, body text rendered only after hydration | Move SEO-critical content to server components |
| Missing `generateStaticParams` | Dynamic routes not pre-rendered | Add `generateStaticParams` for known paths |

### i18n & RTL Support Assessment

Flag internationalization gaps that affect both UX and SEO:

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing `lang` attribute | `<html>` without `lang="en"` (or dynamic lang) | Add `lang` attribute matching content language |
| Missing `dir` attribute | No `dir="ltr"` or `dir="rtl"` for RTL languages | Dynamically set `dir` based on locale |
| Hardcoded strings | UI text embedded in components | Extract to i18n files, use `next-intl` or `react-i18next` |
| Missing `hreflang` tags | Multi-language site without `hreflang` | Add `alternates: { languages }` in metadata |
| Physical CSS properties | `margin-left`, `text-align: left` in i18n app | Use logical properties: `margin-inline-start`, `text-align: start` |
| Number/date/currency formatting | Hardcoded formats (`$`, `MM/DD/YYYY`) | Use `Intl.NumberFormat`, `Intl.DateTimeFormat` |
| Missing locale routing | All locales on same path with no detection | Implement locale-based routing with `next-intl` middleware |

### Structured Data

Flag pages that would benefit from structured data but don't have it:

| Page Type | Schema | Benefit |
|-----------|--------|---------|
| Articles/Blog | `Article` | Rich snippets in search results |
| Products | `Product` | Price, availability, reviews in search |
| FAQs | `FAQPage` | Expandable FAQ in search results |
| How-to guides | `HowTo` | Step-by-step in search results |
| Organization | `Organization` | Knowledge panel |
| Breadcrumbs | `BreadcrumbList` | Breadcrumb trail in search results |

```tsx
// ✅ JSON-LD structured data in Next.js
export default function ArticlePage({ article }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: article.title,
                        datePublished: article.publishedAt,
                        author: { '@type': 'Person', name: article.author },
                    }),
                }}
            />
            {/* Page content */}
        </>
    );
}
```

---

## Return Format

For each finding, return:
```
Location: <file:line or component name>
Issue Type: Accessibility | UX | SEO
Severity: 🔴 | 🟠 | 🟡 | 🔵
WCAG Criterion: <if applicable — e.g., WCAG 1.1.1 Non-text Content>
Affected User Group: <screen reader users, keyboard users, search engines, mobile users, etc.>
Current Pattern: <what the code does now>
Remediation: <fix with code example>
```
