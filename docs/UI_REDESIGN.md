# Exam Portal — UI Redesign Documentation

> Complete reference for the UI/UX redesign of the psychometric & aptitude assessment platform.
> Updated: 2026-03-08

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens & Foundation](#2-design-tokens--foundation)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Grid](#5-spacing--grid)
6. [Shadow System](#6-shadow-system)
7. [Border Radius](#7-border-radius)
8. [Component Patterns](#8-component-patterns)
9. [Layout Architecture](#9-layout-architecture)
10. [Route-by-Route Breakdown](#10-route-by-route-breakdown)
11. [Design Psychology Applied](#11-design-psychology-applied)
12. [Dark Mode Strategy](#12-dark-mode-strategy)
13. [Responsive Strategy](#13-responsive-strategy)
14. [File Reference](#14-file-reference)

---

## 1. Design Philosophy

### Who are the users?

**Admin (HR teams):** Corporate professionals managing psychometric and aptitude assessments. They need to create exams, manage candidates, and interpret results. They work during business hours, often managing multiple assessments simultaneously. They value clarity, efficiency, and data they can act on.

**Candidates (corporate employees):** People taking assessments in a professional context — often with some anxiety about the outcome. They need a focused, distraction-free environment that feels official and structured (like a real assessment center), not like a casual quiz app.

### Core Principles

| Principle | What it means | How it shows up |
|-----------|--------------|-----------------|
| **Kill the Default** | Every design decision is authored, not defaulted. If you can swap it for the most common alternative and nobody notices, it hasn't been designed. | Custom color palette on oklch, intentional radius (0.625rem not default 0.5rem), real shadows instead of invisible 0-opacity ones |
| **Calm & Data-Forward (Admin)** | Spacious layouts that let data breathe. Information hierarchy guides the eye. Nothing screams. | Generous `p-6 lg:p-8` padding, `space-y-8` vertical rhythm, stat cards with large `text-3xl` values, muted labels |
| **Structured & Official (Candidate)** | Feels like sitting in a real assessment center. Professional branding, clear progress, focused environment. | Branded headers on every candidate page, progress bar with percentage, clean question cards, proper score visualization |
| **Consistent Token Usage** | Every color traces to a design token. No hardcoded `slate-*` or raw hex values in components. | All pages use `bg-card`, `text-foreground`, `border-border`, `text-muted-foreground` — zero hardcoded color classes |

### What Changed from the Previous Design

| Before | After | Why |
|--------|-------|-----|
| Border radius 1.3rem (bubbly, casual) | 0.625rem (professional, sharp) | Corporate assessment tool, not a consumer app |
| Shadows all 0-opacity (invisible) | Real subtle shadows at every tier | Cards and surfaces need depth to establish hierarchy |
| Auth: bare Card centered on blank screen | Split layout with blue brand panel + form | First impression matters — auth should establish product identity |
| Sidebar: no active state, no user info | Active nav highlighting + avatar + name/email | Users must always know where they are (wayfinding — cognitive load reduction) |
| Exam pages: no sub-navigation | Tab bar: Overview / Candidates / Results / Analytics | Exam detail has 4 sub-pages — tabs eliminate blind navigation |
| Dashboard: generic stat cards | Colored icons, `text-3xl` values, uppercase labels | Data-forward means the numbers dominate, not the labels |
| Exam client: hardcoded `slate-*` colors | Design tokens throughout | Dark mode and theme consistency require token discipline |
| Landing: centered cards, no brand | Two-column with brand messaging + "Psychometric & Aptitude Testing" headline | Establishes product identity immediately |

---

## 2. Design Tokens & Foundation

All tokens are defined in `app/globals.css` using CSS custom properties inside `:root` and `.dark` selectors.

### Token Architecture

```
Primitives (CSS variables)
  ├── --background       → Page/app canvas
  ├── --foreground       → Primary text color
  ├── --card             → Card/elevated surface color
  ├── --card-foreground  → Text on cards
  ├── --popover          → Dropdown/popover surfaces
  ├── --primary          → Brand accent color
  ├── --secondary        → Secondary surfaces
  ├── --muted            → Subdued backgrounds
  ├── --muted-foreground → Secondary/meta text
  ├── --accent           → Hover/active backgrounds
  ├── --destructive      → Error/danger color
  ├── --border           → Default border color
  ├── --input            → Input border color
  └── --ring             → Focus ring color
```

### Tailwind Usage Mapping

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--background` | `bg-background` | Page canvas, main content area |
| `--foreground` | `text-foreground` | Primary body text, headings |
| `--card` | `bg-card` | Cards, sidebar, header, elevated surfaces |
| `--muted` | `bg-muted` | Subdued backgrounds, progress bar tracks, avatar backgrounds |
| `--muted-foreground` | `text-muted-foreground` | Secondary text, labels, metadata, timestamps |
| `--primary` | `bg-primary`, `text-primary` | Brand color, CTAs, active states, accent icons |
| `--border` | `border-border` | All structural borders (cards, dividers, inputs) |
| `--accent` | `bg-accent`, `hover:bg-accent` | Hover states on nav items, interactive surfaces |
| `--destructive` | `bg-destructive`, `text-destructive` | Errors, delete actions |

---

## 3. Color System

### OKLCH Color Space

All colors use the OKLCH perceptual color space. This ensures:
- Consistent perceived brightness across different hues
- Smoother gradients and transitions
- Better accessibility contrast ratios

### Light Mode Palette

| Role | OKLCH Value | Approximate Hex | Description |
|------|------------|-----------------|-------------|
| Background | `oklch(0.985 0.002 250)` | `#f8f9fc` | Near-white with cool undertone |
| Foreground | `oklch(0.145 0.015 250)` | `#0f1729` | Near-black, rich dark |
| Card | `oklch(1.0 0 0)` | `#ffffff` | Pure white for elevated surfaces |
| Primary | `oklch(0.546 0.182 249)` | `#135bec` | Trust blue — professional, corporate |
| Muted | `oklch(0.96 0.003 250)` | `#f1f3f8` | Light gray for secondary surfaces |
| Muted FG | `oklch(0.46 0.015 250)` | `#5c6578` | Mid-gray for secondary text |
| Border | `oklch(0.922 0.006 250)` | `#e2e5ec` | Subtle border, barely visible |
| Destructive | `oklch(0.577 0.245 27.33)` | `#dc2626` | Red for errors and destructive actions |

### Dark Mode Palette

| Role | OKLCH Value | Description |
|------|------------|-------------|
| Background | `oklch(0.13 0.01 250)` | Very dark blue-gray |
| Card | `oklch(0.17 0.01 250)` | Slightly elevated dark surface |
| Primary | `oklch(0.61 0.168 249)` | Brighter blue for dark backgrounds |
| Muted FG | `oklch(0.556 0.01 250)` | Gray for secondary text on dark |
| Border | `oklch(0.26 0.01 250)` | Subtle dark border |

### Semantic Status Colors

These are NOT defined as CSS tokens — they use Tailwind's built-in color palette because they carry fixed semantic meaning:

| Status | Light Mode | Dark Mode | Usage |
|--------|-----------|-----------|-------|
| Success/Pass | `bg-emerald-100 text-emerald-700` | `bg-emerald-900/40 text-emerald-400` | Published badge, correct answers, passed status |
| Error/Fail | `bg-red-100 text-red-700` | `bg-red-900/40 text-red-400` | Failed status, wrong answers, errors |
| Warning | `bg-amber-100 text-amber-700` | `bg-amber-900/40 text-amber-400` | Timed out, caution states |
| Info/Progress | `bg-blue-100 text-blue-700` | `bg-blue-900/40 text-blue-400` | In-progress status |
| Accent | `text-violet-600` | `text-violet-400` | Dashboard stat accent |

### Color Psychology Rationale

- **Primary Blue (#135bec):** Trust, stability, professionalism. Standard for corporate/enterprise tools. Banking, finance, and assessment platforms consistently use blue because it reduces anxiety and conveys reliability.
- **Emerald for Success:** Green universally signals "go/correct/positive." More sophisticated than raw green — emerald feels premium.
- **Red for Errors/Failure:** Universal danger/stop signal. Used sparingly — only for destructive actions, incorrect answers, and failed status.
- **Amber for Warnings:** Caution without severity. Used for timed-out exams and attention-needed states.

---

## 4. Typography

### Font Stack

```css
--font-display: "Inter", sans-serif;     /* UI text, headings, body */
--font-sans: "Inter", system-ui, sans-serif; /* System fallback */
--font-mono: "JetBrains Mono", Menlo, monospace; /* Code, data, IDs */
--font-serif: Georgia, serif;            /* Not actively used */
```

**Why Inter?** It was designed specifically for screen interfaces. It has:
- Excellent legibility at small sizes (labels, metadata)
- Clean numerals with `tabular-nums` support for data alignment
- Wide weight range (400–700 used in this project)

### Type Hierarchy

| Level | Tailwind Classes | Usage |
|-------|-----------------|-------|
| Page Title (H1) | `text-2xl font-bold tracking-tight` | Page headings: "Dashboard", "Exams", exam titles |
| Hero Title | `text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]` | Landing page headline only |
| Section Title | `text-base font-semibold` | Card headers, section labels |
| Stat Value | `text-3xl font-bold tracking-tight` | Dashboard stat numbers |
| Body | `text-sm` (default) | Standard body text, descriptions |
| Label | `text-xs font-medium text-muted-foreground uppercase tracking-wider` | Stat card labels, section headers in nav, metadata labels |
| Caption/Meta | `text-xs text-muted-foreground` | Timestamps, access codes, footer text |
| Code/Data | `font-mono text-sm` | Access links, usernames, attempt IDs |

### Type Rules

1. **Size alone doesn't create hierarchy.** Every level combines size + weight + color (often + letter-spacing).
2. **Labels are uppercase with wider tracking.** This separates them from body text and makes them scannable.
3. **Monospace for data.** Usernames, access codes, attempt IDs, and numerical data use `font-mono` with `tabular-nums` for alignment.
4. **Tracking-tight on headings.** Tighter letter-spacing gives headings visual density and presence.

---

## 5. Spacing & Grid

### 8-Point Grid

All spacing values are multiples of 4px (Tailwind's 0.25rem base unit), with 8px as the primary unit:

| Tailwind | Pixels | Usage |
|----------|--------|-------|
| `gap-1` / `p-1` | 4px | Micro spacing — icon gaps, tight element pairs |
| `gap-2` / `p-2` | 8px | Minimum component spacing — between icon and text |
| `gap-3` / `p-3` | 12px | Nav padding, sidebar section padding |
| `gap-4` / `p-4` | 16px | Standard card content padding, grid gaps |
| `p-5` | 20px | Spacious card content padding (stat cards) |
| `p-6` | 24px | Page padding on mobile |
| `space-y-6` | 24px | Vertical rhythm between page sections |
| `space-y-8` | 32px | Major section separation (dashboard) |
| `lg:p-8` | 32px | Page padding on desktop |
| `py-16 lg:py-24` | 64/96px | Hero section breathing room |

### Vertical Rhythm

Pages use consistent vertical rhythm via Tailwind's `space-y-*` utilities:

```
Page Structure:
├── p-6 lg:p-8           (page padding)
├── space-y-6 or -8      (section gaps)
│   ├── Header section    (h1 + description)
│   ├── Sub-navigation    (tabs, if applicable)
│   ├── Stat cards grid   (grid with gap-3 or gap-4)
│   ├── Content section   (table, chart, form)
│   └── Footer/actions
```

### Grid Patterns

| Pattern | Classes | Usage |
|---------|---------|-------|
| Stat cards (4-col) | `grid grid-cols-2 lg:grid-cols-4 gap-4` | Dashboard stats |
| Stat cards (3-col) | `grid grid-cols-1 gap-3 sm:grid-cols-3` | Results summary |
| Metadata cards (5-col) | `grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5` | Exam detail metadata |
| Landing 2-col | `grid lg:grid-cols-2 gap-16 lg:gap-24` | Landing page hero |
| Info cards (2-col) | `grid grid-cols-2 gap-3` | Exam access info |

---

## 6. Shadow System

Shadows were previously all 0-opacity (invisible). The redesign introduces a 7-tier system:

### Light Mode

```css
--shadow-2xs: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
--shadow-xs:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm:  0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
--shadow:     0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08);
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07);
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.07);
--shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.07);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
```

### Dark Mode

Dark mode shadows use higher opacity because they need more contrast against dark backgrounds:

```css
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px -1px rgba(0, 0, 0, 0.2);
/* ... progressively stronger */
```

### Usage Pattern

| Shadow | Usage |
|--------|-------|
| `shadow-sm` | Cards (via shadcn Card component), headers |
| `shadow-md` | Hover state on cards (`hover:shadow-md`) |
| `shadow-lg` | Dropdowns, popovers |
| No shadow | Borders are preferred for most structural separation |

### Depth Strategy

This design uses a **borders-first** approach with shadows as enhancement:
- **Structural separation** = borders (`border-border`)
- **Interactive elevation** = shadows on hover (`hover:shadow-md`)
- **Overlay elevation** = shadows on dropdowns, dialogs

---

## 7. Border Radius

### Scale

```css
--radius: 0.625rem;  /* 10px — base unit */

--radius-sm:  6px    /* calc(0.625rem - 4px) — inputs, small buttons */
--radius-md:  8px    /* calc(0.625rem - 2px) — medium components */
--radius-lg:  10px   /* var(--radius) — cards, standard containers */
--radius-xl:  14px   /* calc(0.625rem + 4px) — larger cards */
--radius-2xl: 18px   /* calc(0.625rem + 8px) — modals */
```

### Usage

| Element | Radius | Why |
|---------|--------|-----|
| Inputs, small buttons | `rounded-md` (8px) | Compact, functional feel |
| Cards, containers | `rounded-xl` (14px) | Visible softness without being bubbly |
| Nav links, badges | `rounded-md` (8px) | Matches input radius for consistency |
| Avatar circles | `rounded-full` | Circular for identity elements |
| Brand icon containers | `rounded-lg` (10px) | Standard container radius |
| Large hero icons | `rounded-2xl` (18px) | Premium feel for featured elements |

### Design Decision

**0.625rem (10px) was chosen over the previous 1.3rem (21px) because:**
- 1.3rem made everything look like a toy — too soft for a corporate assessment tool
- 0.625rem is sharp enough to feel professional but soft enough to avoid harshness
- It's between Vercel's sharp corners and Notion's softer ones

---

## 8. Component Patterns

### Stat Card

The most-used pattern across dashboard, results, and analytics pages:

```tsx
<Card>
  <CardContent className="p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <p className="text-3xl font-bold tracking-tight">{value}</p>
  </CardContent>
</Card>
```

**Psychology:** The large number dominates because data-forward means the number is the primary information. The label is uppercase + tracking-wider + muted to stay scannable without competing with the value. The icon is in the top-right — Fitts's Law says the eye lands on the top-left number first, then notices the icon for category context.

### Sub-Navigation Tabs

Used on all exam detail pages (Overview, Candidates, Results, Analytics):

```tsx
<nav className="flex items-center gap-1 border-b">
  <Link
    href={activeRoute}
    className="border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary"
  >
    Active Tab
  </Link>
  <Link
    href={inactiveRoute}
    className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
  >
    Inactive Tab
  </Link>
</nav>
```

**Psychology:** Jakob's Law — users expect tabs from every other SaaS tool. The active tab uses `border-primary` (underline) + `text-primary` (color) — double signaling for the current location. This is wayfinding — users always know where they are.

### Status Badge

Semantic badges with light/dark mode awareness:

```tsx
// Published/Success
className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"

// In Progress
className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"

// Warning/Timed Out
className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
```

**Pattern:** Light mode uses `color-100` background + `color-700` text. Dark mode uses `color-900/40` (transparent) background + `color-400` text. This keeps badges readable on both backgrounds.

### Error Display

```tsx
<div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
  {errorMessage}
</div>
```

**Why not raw text?** A contained error message (with background + padding + border-radius) is more noticeable and less jarring than a naked red text line. The `bg-destructive/10` (10% opacity) creates a soft red container that signals "error" without screaming.

### Empty State

```tsx
<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
  <Icon className="text-muted-foreground mb-4 h-12 w-12" />
  <h3 className="mb-1 text-lg font-semibold">No items yet</h3>
  <p className="text-muted-foreground mb-4 text-sm">
    Description of what to do next.
  </p>
  <Button>Primary Action</Button>
</div>
```

**Psychology:** The dashed border signals "this space is waiting to be filled" (Closure — Gestalt). The centered layout with generous padding makes it feel intentional, not broken.

### Avatar Initial

```tsx
<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
  {name.charAt(0).toUpperCase()}
</div>
```

Used in sidebar (user info) and activity feed (candidate avatars). The `bg-primary/10` keeps it visually connected to the brand without being heavy.

---

## 9. Layout Architecture

### Root Layout (`app/layout.tsx`)

```
<html>
  <body className="font-display antialiased">
    <Providers>
      {children}
      <Toaster />
    </Providers>
  </body>
</html>
```

**Key decision:** The body no longer has `h-screen overflow-hidden`. That was breaking scroll on content-heavy pages. Now each route controls its own scroll behavior.

### Auth Layout (`app/admin/(auth)/layout.tsx`)

```
┌─────────────────────────────────────────────┐
│ ┌──────────────┐ ┌────────────────────────┐ │
│ │              │ │                        │ │
│ │  Brand Panel │ │     Form Content       │ │
│ │  bg-primary  │ │     bg-background      │ │
│ │  480-560px   │ │     flex-1             │ │
│ │              │ │     max-w-[420px]       │ │
│ │  Hidden <lg  │ │                        │ │
│ └──────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Psychology:** The split layout creates visual weight on the left (brand identity) and functional space on the right (the form). On mobile, only the form shows with a small brand header — Hick's Law says minimize what's on screen to speed up the decision (sign in).

### Dashboard Layout (`app/admin/(dashboard)/layout.tsx`)

```
┌──────────┬──────────────────────────────────┐
│ Sidebar  │                                  │
│ w-60     │  Main Content                    │
│ fixed    │  lg:pl-60                        │
│          │                                  │
│ ┌──────┐ │  ┌────────────────────────────┐  │
│ │ Logo │ │  │ Page content               │  │
│ ├──────┤ │  │ p-6 lg:p-8                 │  │
│ │ Nav  │ │  │                            │  │
│ │ Link │ │  │                            │  │
│ │ Link │ │  └────────────────────────────┘  │
│ ├──────┤ │                                  │
│ │ User │ │                                  │
│ │ Info │ │                                  │
│ └──────┘ │                                  │
└──────────┴──────────────────────────────────┘
```

**Sidebar decisions:**
- **Width 240px (w-60):** Narrower than the previous 256px (w-64). Gives content more room — the admin side is data-forward, so content area matters more than nav width.
- **Same background as content (`bg-card`):** Following the principle that sidebar and content are one visual system, not two competing ones. A subtle `border-r` is all the separation needed.
- **User section at bottom:** Users expect their identity at the bottom-left (Jakob's Law — matches Slack, Discord, VS Code).

### Exam Sub-page Layout

```
┌─────────────────────────────────────────────┐
│ ← Back to Exams                             │
│                                             │
│ Exam Title                    [Published]   │
│                                             │
│ ┌─────────┬────────────┬─────────┬────────┐ │
│ │Overview │ Candidates │ Results │Analytics│ │
│ └─────────┴────────────┴─────────┴────────┘ │
│ ──────────────────────────────────────────── │
│                                             │
│ [Page-specific content]                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Why tabs?** The exam detail view has 4 distinct sub-pages. Without tabs, users had to navigate back to the exam detail and then to a different sub-page. With tabs, switching between Candidates → Results → Analytics is one click. This reduces navigation steps by 50% (Hick's Law) and provides constant wayfinding (the user always sees all available sections).

---

## 10. Route-by-Route Breakdown

### Landing Page (`/`)

| Element | Design Decision | Psychology Principle |
|---------|----------------|---------------------|
| Sticky header with `backdrop-blur-sm` | Persistent branding and admin access | Wayfinding — always accessible |
| "Assessment Platform" pill badge | Signals product category immediately | Recognition over recall |
| `text-4xl lg:text-5xl` headline | Hero presence, visual hierarchy dominance | Von Restorff — the biggest element gets attention |
| Two-column on desktop | Brand left, actions right | Z-pattern reading — eye flows from message to action |
| Access code input with "Go" button | Single clear action per card | Hick's Law — one choice, fast decision |

### Admin Login (`/admin/login`)

| Element | Design Decision | Psychology Principle |
|---------|----------------|---------------------|
| Blue brand panel (left) | Establishes identity before the user interacts | Visceral reaction — first impression in 50ms |
| `space-y-5` form spacing | Comfortable field separation | Proximity — clear field grouping |
| `w-full` submit button | Dominant action target | Fitts's Law — large target, easy to click |
| Error in colored container | Visible but not aggressive | Aesthetic-usability effect |

### Admin Dashboard (`/admin/dashboard`)

| Element | Design Decision | Psychology Principle |
|---------|----------------|---------------------|
| "Welcome back, {firstName}" | Personal greeting, not generic | Emotional design — human connection |
| 4 stat cards with colored icons | Each stat has a distinct color identity | Similarity + Differentiation — same card shape, different color = different data |
| `text-3xl` stat values | Numbers dominate, labels recede | Visual hierarchy — what matters most is biggest |
| Activity feed with avatars | Human presence in data | Social proof — the system is alive and active |
| Status badges with semantic colors | Instant status recognition without reading | Color psychology — green=done, blue=active, amber=attention |

### Exam Detail (`/admin/exams/[examId]`)

| Element | Design Decision | Psychology Principle |
|---------|----------------|---------------------|
| Sub-navigation tabs | 4 sections always visible | Miller's Law — 4 items, well within 7±2 |
| Active tab: border + color | Double signaling for current location | Figure/Ground — active tab "lifts" forward |
| 5 metadata cards in a row | Quick scan of exam configuration | Chunking — 5 related data points grouped |
| Back button (ghost variant) | Escape hatch without visual weight | Jakob's Law — back navigation is expected |

### Exam Access (`/exam/[accessLink]`)

| Element | Design Decision | Psychology Principle |
|---------|----------------|---------------------|
| Branded header | Official feel from the first screen | Visceral reaction + trust |
| Large icon + centered layout | Assessment center entrance feeling | Psychology of space — spacious = calm |
| "Secure" and "Timed" info cards | Set expectations before login | Progressive disclosure — just enough info |
| Full-width "Continue to Login" button | Single clear path forward | Hick's Law — one choice |

### Exam Taking (`/exam/[accessLink]/attempt/[attemptId]`)

| Element | Design Decision | Psychology Principle |
|---------|----------------|---------------------|
| Fixed header with timer | Time awareness without scrolling | Zeigarnik Effect — incomplete task stays in mind |
| Progress bar with percentage | Completion motivation | Zeigarnik Effect + Peak-End Rule |
| `max-w-3xl` question container | Focused reading width | Cognitive load — reduce visual noise |
| Skip + Next buttons separated | Clear distinct actions | Proximity — related actions grouped, but different |
| "All Questions Answered" celebration | Green checkmark, large heading | Peak-End Rule — positive peak moment |

### Exam Result (`/exam/[accessLink]/result/[attemptId]`)

| Element | Design Decision | Psychology Principle |
|---------|----------------|---------------------|
| Color bar at top (emerald/red) | Instant pass/fail signal | Von Restorff — color strip stands out |
| Score circle with colored border | Visual focal point for the key number | Visual hierarchy — isolated, large, colored |
| 4 stat cards (Score, Correct, Wrong, Unanswered) | Complete picture at a glance | Miller's Law — 4 items, easy to hold |
| Question-by-question review | Detailed breakdown for learning | Progressive disclosure — summary first, detail below |
| Explanation with HelpCircle icon | Educational value from incorrect answers | Peak-End Rule — ending with learning feels constructive |

---

## 11. Design Psychology Applied

### Laws Used and Where

| Law | Where Applied | How |
|-----|--------------|-----|
| **Hick's Law** | Navigation (2 items), exam tabs (4 items), form fields (2-3 per page) | Options kept minimal at every decision point |
| **Fitts's Law** | Full-width buttons on forms, large stat card hit targets, primary CTA placement | Important targets are large and accessible |
| **Miller's Law** | Stat cards (4 max per row), tab navigation (4 tabs), form chunking | Never more than 7 items in any group |
| **Jakob's Law** | Sidebar layout, tab navigation, form patterns, icon conventions | All conventions match standard SaaS patterns |
| **Von Restorff Effect** | Primary blue CTAs against neutral backgrounds, colored status badges | The different thing gets remembered |
| **Gestalt: Proximity** | Form field grouping, stat card grids, activity feed rows | Related items closer together |
| **Gestalt: Similarity** | All stat cards share shape, all nav links share style, all badges share pattern | Same appearance = same function |
| **Zeigarnik Effect** | Exam progress bar, step counter, "X of Y questions" | Incomplete tasks create tension to finish |
| **Peak-End Rule** | "All Questions Answered" celebration, score circle on results | Key moments are designed to feel good |
| **Serial Position Effect** | Dashboard and Results in first/last nav positions, primary actions at start/end of button groups | First and last items are most remembered |
| **Aesthetic-Usability Effect** | Consistent tokens, real shadows, professional radius, polished interactions | Polish earns trust and patience |

---

## 12. Dark Mode Strategy

### Approach: Borders Over Shadows

In dark mode, shadows are less visible against dark backgrounds. The design compensates:
- Higher shadow opacity in dark mode (0.25 vs 0.06 for `shadow-sm`)
- Border definitions remain the same (borders work equally well in both modes)
- Card surfaces are slightly lighter than background (0.17 vs 0.13 lightness) for subtle elevation

### Color Adjustments

- **Primary blue:** Slightly lighter in dark mode (oklch 0.61 vs 0.546) for readability
- **Semantic colors:** Use `/40` opacity backgrounds (`bg-emerald-900/40`) instead of solid dark backgrounds
- **Text contrast:** Muted foreground lightened to oklch 0.556 to maintain readability

### Token Consistency

Every component uses design tokens, so dark mode is automatic. No component uses hardcoded light-only or dark-only colors. The only dark-mode-specific classes appear in semantic status badges (e.g., `dark:bg-emerald-900/40 dark:text-emerald-400`).

---

## 13. Responsive Strategy

### Breakpoint Usage

| Breakpoint | Pixels | What Changes |
|-----------|--------|-------------|
| Default (mobile) | 0-639px | Single column, `p-6` padding, sidebar hidden |
| `sm:` | 640px+ | 2-column grids for stat cards, wider form layout |
| `md:` | 768px+ | 3-column grids, wider metadata cards |
| `lg:` | 1024px+ | Sidebar visible, 4-column stat grids, `p-8` padding, two-column landing |
| `xl:` | 1280px+ | Wider auth brand panel (560px) |

### Mobile-Specific Patterns

- **Sidebar → Mobile header:** Fixed sidebar on desktop, sticky header with hamburger on mobile
- **Auth brand panel:** Hidden on mobile, replaced by small brand header in form
- **Stat cards:** 2-column on mobile, 4-column on desktop
- **Exam header info:** Hidden on `sm:` (exam title + candidate name)

---

## 14. File Reference

### Foundation Files

| File | Purpose |
|------|---------|
| `app/globals.css` | Design tokens, color system, shadow system, custom scrollbar |
| `app/layout.tsx` | Root layout, font loading, providers, metadata |

### Admin Auth Routes

| File | Route | Type |
|------|-------|------|
| `app/admin/(auth)/layout.tsx` | — | Layout: split-screen auth |
| `app/admin/(auth)/login/page.tsx` | `/admin/login` | Admin sign-in form |
| `app/admin/(auth)/signup/page.tsx` | `/admin/signup` | Admin registration form |
| `app/admin/(auth)/actions.ts` | — | Server actions: signInAdmin, signUpAdmin, signOut |

### Admin Dashboard Routes

| File | Route | Type |
|------|-------|------|
| `app/admin/(dashboard)/layout.tsx` | — | Layout: sidebar + main |
| `app/admin/(dashboard)/components/nav-link.tsx` | — | Client component: active nav link |
| `app/admin/(dashboard)/dashboard/page.tsx` | `/admin/dashboard` | Dashboard overview |
| `app/admin/(dashboard)/exams/page.tsx` | `/admin/exams` | Exam list |
| `app/admin/(dashboard)/exams/exam-list-client.tsx` | — | Client component: exam cards grid |
| `app/admin/(dashboard)/exams/[examId]/page.tsx` | `/admin/exams/:id` | Exam detail + sections |
| `app/admin/(dashboard)/exams/[examId]/candidates/page.tsx` | `/admin/exams/:id/candidates` | Candidate management |
| `app/admin/(dashboard)/exams/[examId]/candidates/candidates-client.tsx` | — | Client component: candidate table |
| `app/admin/(dashboard)/exams/[examId]/results/page.tsx` | `/admin/exams/:id/results` | Results overview + table |
| `app/admin/(dashboard)/exams/[examId]/results/results-table.tsx` | — | Client component: sortable results |
| `app/admin/(dashboard)/exams/[examId]/results/[attemptId]/page.tsx` | `/admin/exams/:id/results/:attemptId` | Individual attempt detail |
| `app/admin/(dashboard)/exams/[examId]/analytics/page.tsx` | `/admin/exams/:id/analytics` | Analytics with charts |
| `app/admin/(dashboard)/exams/[examId]/analytics/charts.tsx` | — | Client component: Recharts |

### Candidate Routes

| File | Route | Type |
|------|-------|------|
| `app/exam/[accessLink]/page.tsx` | `/exam/:code` | Exam access/info page |
| `app/exam/[accessLink]/login/page.tsx` | `/exam/:code/login` | Candidate login |
| `app/exam/[accessLink]/attempt/[attemptId]/page.tsx` | `/exam/:code/attempt/:id` | Server wrapper for exam |
| `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx` | — | Client component: exam taking UI |
| `app/exam/[accessLink]/result/[attemptId]/page.tsx` | `/exam/:code/result/:id` | Candidate result view |

### Public Route

| File | Route | Type |
|------|-------|------|
| `app/page.tsx` | `/` | Landing page |
