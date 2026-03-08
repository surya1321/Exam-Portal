---
name: frontend-optimization-review
description: "Perform deep, production-grade frontend optimization reviews using a multi-agent architecture where specialized sub-agents independently explore their domain in parallel and report findings back to a master orchestrator agent that synthesizes a unified, authoritative optimization report. Primarily focused on React and Next.js applications. Use this skill whenever reviewing frontend code for performance, rendering efficiency, bundle size, accessibility, UX quality, or production readiness. Trigger on: frontend code reviews, React/Next.js optimization, performance audits, Core Web Vitals improvement, bundle analysis, useEffect audit, server component migration, TanStack Query adoption, accessibility review, SEO review, design system consistency checks, or any task where deep frontend analysis is needed — even if the user doesn't explicitly say 'frontend review'. Apply this skill even when the user asks to 'check my components', 'review this page', 'optimize performance', 'why is this slow', or 'is this production ready'."
---

# Multi-Agent Frontend Optimization Review — A Full Performance Review Board

## Why This Matters

A single reviewer scanning frontend code sequentially faces an impossible trade-off: dive deep into rendering patterns and miss bundle bloat, or audit accessibility and miss data fetching anti-patterns. Real frontend performance teams don't work this way — they assign specialists. A rendering expert profiles re-render cascades while a performance engineer analyzes bundle impact while an accessibility specialist audits WCAG compliance — all simultaneously, all deeply, all independently.

This skill replicates that model. Instead of one agent juggling six cognitive domains, it deploys **six dedicated specialist sub-agents** — each with deep focus on their domain — running in parallel and reporting back to a **Master Orchestrator Agent** that consolidates, cross-correlates, and delivers a unified optimization verdict.

> **The most impactful frontend optimizations span multiple domains simultaneously — a `useEffect` that causes a re-render cascade AND inflates bundle size AND could be eliminated entirely with a server component. Only cross-correlation catches these compound wins.**

---

## Non-Negotiable Frontend Standards

These are not suggestions. Every agent enforces these as absolute rules:

| Standard | Rule |
|---|---|
| `useEffect` for data fetching | 🚫 **Never** — replace with TanStack Query or server components |
| `useEffect` for derived state | 🚫 **Never** — use `useMemo` or computed values |
| Client components as default | 🚫 **Never** — server components are the default, client is opt-in |
| Raw `fetch` in components | 🚫 **Never** — TanStack Query on client, native `async/await` on server |
| `<img>` tags in Next.js | 🚫 **Never** — use `next/image` |
| Fonts via `<link>` in Next.js | 🚫 **Never** — use `next/font` |
| Third-party `<script>` in Next.js | 🚫 **Never** — use `next/script` with correct strategy |
| Server state in Redux/Zustand | 🚫 **Never** — TanStack Query owns server state |
| Form submissions without Server Actions | 🚫 **Never** in App Router — use Server Actions with `useActionState` for form mutations |
| Unvalidated Server Action inputs | 🚫 **Never** — validate every input with Zod at the action boundary |
| API responses without type contracts | 🚫 **Never** — validate with Zod schemas at every external data boundary |

---

## Multi-Agent Architecture

```
                        ┌──────────────────────────────────┐
                        │       MASTER ORCHESTRATOR         │
                        │             AGENT                 │
                        │                                   │
                        │  - Receives the frontend code     │
                        │  - Dispatches to sub-agents       │
                        │  - Collects all findings          │
                        │  - Cross-correlates issues        │
                        │  - Synthesizes final report       │
                        └───────────────┬──────────────────┘
                                        │
     ┌──────────────┬───────────────┬───┴───────────┬──────────────┬──────────────┐
     │              │               │               │              │              │
     ▼              ▼               ▼               ▼              ▼              ▼
┌─────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐
│ RENDER  │  │   DATA    │  │  BUNDLE &  │  │  DESIGN  │  │   UX &   │  │PRODUCTION  │
│  AGENT  │  │  AGENT    │  │  ASSETS    │  │ SYSTEM   │  │ACCESSIB- │  │READINESS   │
│         │  │           │  │   AGENT    │  │  AGENT   │  │ILITY     │  │  AGENT     │
└─────────┘  └───────────┘  └────────────┘  └──────────┘  └──────────┘  └────────────┘
```

Each sub-agent has a **deep-dive reference file** in the `references/` directory. Read only the relevant agent file(s) when you need the full checklist.

---

## Core Workflow

### Phase 1: Intake & Context Parsing

Before dispatching, the Orchestrator must understand the frontend stack:

1. **Framework & version** — Next.js (App Router or Pages Router)? Vite + React? Remix? This determines which patterns and APIs apply.
2. **React version** — React 18 or 19? React 19 introduces `use()`, `useActionState`, `useFormStatus`, `useOptimistic`, and Server Actions as first-class patterns. If React 19+ → the review must flag any code that ignores these primitives.
3. **Rendering strategy** — SSR, SSG, ISR, PPR (Partial Prerendering), CSR, or mixed? Determines the server/client boundary analysis.
4. **Data fetching approach** — TanStack Query? SWR? Raw fetch? Redux Toolkit Query? Server components + Server Actions?
5. **Styling system** — Tailwind CSS (v3 or v4)? CSS Modules? styled-components? Emotion?
6. **State management** — Zustand? Redux? Context? URL state?
7. **Type safety approach** — Zod validation? TypeScript strict mode? tRPC?
8. **Testing infrastructure** — Unit tests? Integration tests? E2E? Visual regression?
9. **Create a shared context snapshot** — A brief summary sent to all sub-agents.

### Phase 2: Parallel Dispatch

Dispatch the code simultaneously to all six specialist sub-agents. Each receives:
- The code to review
- The shared context snapshot from Phase 1
- Their domain-specific deep-dive reference file
- Instructions to return structured findings

### Phase 3: Independent Deep-Dive

Each sub-agent explores exclusively within its domain. Read the agent's reference file in `references/` for the full exploration checklist:

| Agent | Reference File | Domain |
|-------|---------------|--------|
| ⚛️ Render Agent | `references/render-agent.md` | Component architecture, re-renders, server vs. client boundary, `useEffect` audit |
| 🗄️ Data Agent | `references/data-agent.md` | TanStack Query, server-side fetching, client state, caching strategy |
| 📦 Bundle Agent | `references/bundle-agent.md` | Bundle size, images, fonts, Core Web Vitals, script loading |
| 🎨 Design Agent | `references/design-agent.md` | Design system consistency, styling architecture, animations, responsive design |
| ♿ UX/A11y Agent | `references/ux-a11y-agent.md` | Accessibility (WCAG 2.2 AA), UX bottlenecks, SEO, metadata |
| 🚀 Production Agent | `references/production-agent.md` | Error boundaries, hydration, environment config, monitoring, security, deployment |

### Phase 4: Results Collection

Wait for all sub-agents to return structured findings. Each returns a categorized list with: severity, category, component/file location, description, current pattern, and recommended fix with code.

### Phase 5: Cross-Correlation

This is where the Orchestrator earns its role. Look for:

| Compound Pattern | Agents Involved | Why It's Critical |
|-----------------|----------------|-------------------|
| `useEffect` fetch + unnecessary client component | Render + Data | Eliminating the `useEffect` AND moving to server component removes two problems at once |
| Client component + large library import | Render + Bundle | Moving to server component also removes the library from client bundle |
| Missing loading state + no TanStack Query | UX/A11y + Data | TanStack Query provides loading/error states automatically |
| Missing error boundary + unhandled fetch error | Production + Data | Missing `onError` callback AND missing boundary = silent crash |
| Hardcoded colors + dark mode gaps + contrast failure | Design + UX/A11y | Design token system fixes all three simultaneously |
| Missing `next/image` + no LCP optimization + missing alt text | Bundle + UX/A11y | `next/image` fixes performance, requires alt text, and optimizes LCP |
| No ISR + client-side fetch for static data + missing SEO metadata | Production + Data + UX/A11y | Server-rendered static page eliminates fetch, enables SEO, and improves TTFB |
| Missing Suspense + sequential data fetching + no streaming | Render + Data + Bundle | Parallel fetch with Suspense streaming solves all three |
| Form `useEffect` + manual fetch POST + no loading state | Render + Data + UX/A11y | Server Action + `useActionState` eliminates all three with built-in pending state |
| Unvalidated API response + displayed to user + missing error state | Data + Production + UX/A11y | Zod schema validation at boundary catches malformed data before it causes runtime crash |
| `useTransition` missing + heavy filter re-render + janky interaction | Render + Bundle + UX/A11y | Concurrent rendering keeps UI responsive during expensive state transitions |
| PPR candidate page + full SSR + client-side fetch for personalization | Render + Bundle + Production | PPR serves static shell instantly, streams dynamic parts — best of static + dynamic |

**Severity elevation rules:**
- A finding rated Minor by one agent becomes Major if it appears in two agent domains
- A finding in three or more domains is auto-elevated to Blocker
- Agents disagree on severity → the higher-impact assessment wins

### Phase 6: Report Synthesis

Assemble the Unified Final Report using the format below. Prioritize findings by cross-domain impact, then by severity.

### Phase 7: Verdict

Issue the final assessment and prioritized optimization roadmap.

---

## Unified Final Report Format

### 1. Executive Summary
- **Overall Health Score** across all six dimensions: 🔴 Critical | 🟠 Needs Work | 🟡 Acceptable | 🟢 Healthy
- **Top 3 Critical Findings** — the most impactful cross-domain issues
- **Dimension Scores** — individual rating per agent domain

### 2. Non-Negotiables Violations Table
Every `useEffect`, unnecessary client component, and non-TanStack Query fetch — listed explicitly with replacements. This section is mandatory even if the list is empty (which would be a pass).

### 3. Agent Findings Table

| # | Severity | Agent | Category | Location | Description |
|---|----------|-------|----------|----------|-------------|
| 1 | 🔴 Blocker | Render | useEffect | `UserProfile.tsx:23` | Data fetching in useEffect — replace with useSuspenseQuery |
| 2 | 🔴 Blocker | Data | Raw fetch | `Dashboard.tsx:45` | Raw fetch in client component — migrate to TanStack Query |
| 3 | 🟠 Major | Bundle | Image | `Hero.tsx:12` | Using `<img>` instead of `next/image` — LCP impact |
| ... | | | | | |

### 4. Compound Issues
Issues flagged by **multiple agents**, elevated with cross-domain impact analysis and a single unified fix recommendation.

### 5. Detailed Findings per Agent
For each agent, provide:
- Full explanation of each finding
- **Before** code (the current pattern)
- **After** code (the production-ready optimization)
- Impact description: what metric improves and by how much (estimated)

### 6. Current Design Assessment
Visual and structural assessment of the existing UI:
- Spacing consistency, typographic hierarchy, color usage
- Visual bottlenecks and cognitive load issues
- Component layout risks at different viewport sizes
- Dark mode and theme implementation quality

### 7. Performance Scorecard
Estimated impact on key metrics for top findings:

| Finding | LCP | CLS | INP | Bundle Size | TTFB |
|---------|-----|-----|-----|-------------|------|
| Server component migration | ⬇️ -200ms | — | — | ⬇️ -15KB | ⬇️ -50ms |
| TanStack Query adoption | — | — | ⬇️ -80ms | — | — |
| ... | | | | | |

### 8. Passed Checks ✅
Explicitly list what the frontend does **well**. Good engineering deserves recognition.

### 9. Performance Budget Assessment
Evaluate whether the project enforces measurable performance constraints:

| Budget Category | Target | Enforcement |
|----------------|--------|-------------|
| JavaScript bundle (per-route) | < 200KB gzipped | CI check with `@next/bundle-analyzer` or `bundlesize` |
| First-party JS | < 100KB gzipped | Bundle analysis in PR checks |
| Third-party JS | < 100KB gzipped | Subresource budgets |
| LCP | < 2.5s (p75) | Web Vitals CI gate or RUM alerting |
| CLS | < 0.1 (p75) | Web Vitals CI gate or RUM alerting |
| INP | < 200ms (p75) | Web Vitals CI gate or RUM alerting |
| Image payload per page | < 500KB | `next/image` with proper `sizes` |
| Total page weight | < 1MB | Lighthouse CI budget |

Flag projects with **no performance budgets at all** — without budgets, regressions are invisible until users complain.

### 10. Optimization Roadmap
1. **Fix immediately** (blockers) — before merge
2. **Fix before deploy** (majors) — before production
3. **Address next sprint** (minors) — schedule soon
4. **Consider** (suggestions) — discuss in architecture reviews

### 11. Final Verdict

| Verdict | Meaning |
|---------|---------|
| 🔴 **Needs Rework** | Non-negotiable violations or critical UX/production failures |
| 🟠 **Approve with Changes** | Important issues to fix, but core approach is sound |
| 🟢 **Approved** | Meets production standards across all dimensions |

---

## Severity Levels

| Level | Icon | Meaning | Action |
|-------|------|---------|--------|
| **Blocker** | 🔴 | Violates non-negotiable standards or causes critical failure | Stop the merge |
| **Major** | 🟠 | Significant performance, a11y, or maintainability impact | Fix before merge |
| **Minor** | 🟡 | Noticeable improvement opportunity, low immediate risk | Next sprint |
| **Suggestion** | 🔵 | Best practice alignment, future-proofing | Discuss with team |

---

## Guiding Principles

1. **The Orchestrator reviews like a senior frontend architect** responsible for both the user experience and the long-term codebase health.

2. **Each sub-agent reviews like a specialist** who only cares deeply about their domain — thorough, uncompromising, and focused.

3. **Every `useEffect` is guilty until proven innocent** — the burden of proof is on the developer to justify its presence.

4. **Server components are the answer until proven otherwise** — client rendering is a privilege, not a default.

5. **TanStack Query is the contract** for all client-side server state — no exceptions without explicit architectural justification.

6. **Never optimize prematurely** — flag issues by real-world measurable impact on users, not theoretical purity.

7. **Be specific and actionable** — vague findings from any agent are not acceptable. State what's wrong, where, why, and provide the fix.

8. **Always show before vs. after code** — optimization advice without concrete implementation is not sufficient.

9. **The Orchestrator connects findings, not just collects them** — the most impactful improvements span render, data, and bundle simultaneously.

---

## Why Multi-Agent Over Single Agent

| Dimension | Single Agent | Multi-Agent |
|-----------|-------------|-------------|
| **Focus depth** | Shallow across all domains | Deep within each domain |
| **Cognitive load** | High — context switching across 6 domains | Low — each agent owns one domain fully |
| **Coverage** | Risk of missing issues due to breadth | Comprehensive — no domain deprioritized |
| **Speed** | Sequential exploration | Parallel exploration |
| **Cross-domain insight** | Accidental | Deliberate via Orchestrator correlation |
| **Reliability** | Single point of missed analysis | Redundancy through specialization |

---

## Quick Self-Check

Before finalizing the report, the Orchestrator asks:

1. **Did every agent return findings?** If an agent found nothing, explicitly state "No issues found in [domain]" — a clean bill of health is valuable information.
2. **Did I check every `useEffect`?** The non-negotiables audit must be exhaustive, not sampled.
3. **Are there compound issues I missed?** Re-scan findings across agents for overlapping locations or related root causes.
4. **Is every finding specific and actionable?** If a finding says "improve performance" without a component, metric, and fix — rewrite it.
5. **Did I credit what the code does well?** The "Passed Checks" section builds trust.
6. **Is the remediation roadmap prioritized?** A flat list of 30 findings is unhelpful. Group by urgency.
7. **Does the final verdict reflect the actual risk?** A single non-negotiable violation = 🔴 Needs Rework, regardless of everything else.
