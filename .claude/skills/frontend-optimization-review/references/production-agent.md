# 🚀 Production Readiness Agent — Deep-Dive Reference

## Domain
Operational fitness, error resilience, monitoring, and deployment safety for frontend systems.

## Table of Contents
- [Error Boundaries & Resilience](#error-boundaries) — React error boundaries, granular placement, recovery patterns
- [Server Actions Security](#server-actions-security) — auth, input validation, rate limiting, CSRF
- [Hydration Health](#hydration-health) — hydration errors, mismatch fix patterns
- [Environment & Configuration](#environment-config) — secret exposure, type-safe env vars with Zod
- [Monitoring & Observability](#monitoring) — Web Vitals, error tracking, session replay, alerting
- [Frontend Security](#frontend-security) — XSS, CSP, client-side secret exposure
- [Error Taxonomy](#error-taxonomy) — expected vs unexpected, Next.js error file hierarchy
- [Testing Strategy Coverage](#testing-strategy) — testing pyramid, MSW, axe-core, visual regression
- [Performance Budgets & CI](#performance-budgets-ci) — Lighthouse CI, bundlesize, regression prevention
- [Frontend Scalability](#frontend-scalability) — infrastructure scaling, micro-frontends, graceful degradation
- [Next.js Deployment Optimization](#nextjs-deployment) — ISR, middleware, edge vs Node runtime

---

## Error Boundaries & Resilience

### React Error Boundaries

| Check | What To Flag | Fix |
|-------|-------------|-----|
| No error boundary at app level | Unhandled render error crashes entire app | Add `<ErrorBoundary>` at root layout |
| No error boundary at route level | One route error crashes the whole app | Add `error.tsx` in each route segment |
| No error boundary around risky components | Third-party components, dynamic imports without boundary | Wrap with `<ErrorBoundary>` with fallback UI |
| Missing `reset` in error UI | Error state with no recovery option | Provide "Try again" button using `reset()` |

### Fallback UI

| Context | What To Check | Impact When Missing |
|---------|--------------|-------------------|
| Suspense boundaries | `<Suspense>` without `fallback` prop | Flash of empty content or no loading state |
| TanStack Query errors | Missing error state rendering on `useQuery` | Silent failure — user sees loading forever |
| TanStack Query loading | Missing loading state rendering | Blank screen while data fetches |
| Dynamic imports | `next/dynamic` without `loading` component | Content pops in with no transition |
| Image loading | `next/image` without `placeholder="blur"` | Image jumps in, causing CLS |

### Promise Rejection Handling

Flag unhandled promise rejections in:
- Event handlers (`onClick`, `onSubmit`) with async operations and no try/catch
- TanStack Query `mutationFn` without `onError` callback
- `Promise.all` without error handling for partial failures

### TanStack Query Retry Configuration

```tsx
// ❌ Default retry — 3 retries for all queries (may not be appropriate)
useQuery({ queryKey: ['data'], queryFn: fetchData })

// ✅ Configured retry strategy
useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})

// ✅ No retry for 4xx errors (they won't succeed on retry)
useQuery({
    queryKey: ['user', id],
    queryFn: fetchUser,
    retry: (failureCount, error) => {
        if (error.status >= 400 && error.status < 500) return false;
        return failureCount < 3;
    },
})
```

### Server Actions Security

Server Actions are public HTTP endpoints — they can be called by **anyone**, not just your UI. Flag every Server Action without these protections:

| Check | What To Flag | Fix |
|-------|-------------|-----|
| **No input validation** | `formData.get('name')` used directly | Validate with Zod: `schema.safeParse(Object.fromEntries(formData))` |
| **No authorization check** | Action doesn't verify user permissions | Check session/JWT before any data access |
| **No rate limiting** | Action can be called unlimited times | Add rate limiting middleware or per-user throttle |
| **Sensitive data in response** | Action returns internal IDs, tokens, or PII | Return only what the client needs |
| **No CSRF protection** | Missing origin header validation | Next.js handles this by default — verify it's not disabled |
| **Missing `revalidatePath`/`revalidateTag`** | Data mutated but cache not invalidated | Call revalidation after every write operation |

```tsx
// ❌ Before: Unsafe Server Action
'use server';
export async function deleteUser(formData: FormData) {
    const id = formData.get('id') as string;
    await db.delete(users).where(eq(users.id, id)); // No auth! No validation!
}

// ✅ After: Production-safe Server Action
'use server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const DeleteUserSchema = z.object({ id: z.string().uuid() });

export async function deleteUser(prevState: State, formData: FormData) {
    // 1. Authenticate
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    // 2. Validate input
    const result = DeleteUserSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { error: 'Invalid input' };

    // 3. Authorize (check permissions)
    if (session.user.role !== 'admin') return { error: 'Forbidden' };

    // 4. Execute
    await db.delete(users).where(eq(users.id, result.data.id));

    // 5. Revalidate cache
    revalidatePath('/admin/users');
    return { success: true };
}
```

---

## Hydration Health

### Common Hydration Mismatch Sources

| Source | What To Flag | Fix |
|-------|-------------|-----|
| Date/time rendering | `new Date().toLocaleDateString()` in server component | Use `suppressHydrationWarning` or render in client component |
| Random values | `Math.random()` generating IDs during render | Use stable IDs (UUID generated once, stored in state) |
| Browser-only APIs | `window.innerWidth`, `navigator.userAgent` in render | Guard with `typeof window !== 'undefined'` or use client component |
| Locale differences | Number/date formatting with server locale ≠ client locale | Consistent locale or client-only formatting |
| Conditional rendering by environment | `if (typeof window !== 'undefined')` showing different content | Use `useEffect` for client-only content or `suppressHydrationWarning` |

### Unnecessary `"use client"` = Hydration Overhead

Every `"use client"` component must be hydrated — its JavaScript is shipped to the client, parsed, and the component tree reconciled. Flag client components that:
- Have no event handlers
- Use no React hooks
- Perform no browser API access
- Could be server components with zero behavior change

---

## Environment & Configuration

### Exposed Secrets

| Check | What To Flag | Fix |
|-------|-------------|-----|
| `NEXT_PUBLIC_` secrets | API keys, database URLs with `NEXT_PUBLIC_` prefix | Remove prefix — use server-only env vars |
| Hardcoded API URLs | `fetch("https://api.production.com/...")` in code | Use `process.env.API_BASE_URL` |
| Hardcoded feature flags | `if (SHOW_BETA_FEATURE)` as constant | Use env vars or feature flag service |
| `.env` in git | `.env` files committed to repository | Add to `.gitignore`, use `.env.example` |

### Environment Variable Validation

```tsx
// ❌ Before: Crashes at runtime with unclear error
const apiUrl = process.env.API_URL; // undefined if missing

// ✅ After: Fails fast with clear message
function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const apiUrl = getRequiredEnv('API_URL');
```

### Type-Safe Environment Variables with Zod

Flag projects with unvalidated environment access. A missing env var should fail at startup, not at midnight when a user hits the code path:

```tsx
// ✅ env.ts — Validated at import time, fails fast
import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    API_SECRET: z.string().min(32),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    RATE_LIMIT_RPM: z.coerce.number().int().positive().default(60),
});

export const env = envSchema.parse(process.env);

// Usage: import { env } from '@/lib/env';
// env.DATABASE_URL — fully typed, guaranteed to exist
```

Benefits:
- Fails at build/startup, not at runtime
- Full TypeScript inference — no more `process.env.MAYBE_EXISTS!`
- Default values for optional configuration
- Coercion for numeric env vars (they're always strings)

---

## Monitoring & Observability

### What Must Be Instrumented

| Category | What To Check | Why |
|----------|--------------|-----|
| **Error tracking** | Sentry, Datadog RUM, or equivalent | See production errors before users report them |
| **Web Vitals reporting** | LCP, CLS, INP sent to analytics | Monitor real-user performance over time |
| **API error logging** | TanStack Query `onError` reporting failures | Detect API degradation from the client's perspective |
| **Feature flag observability** | Which features are active for which users | Debug issues tied to flag combinations |
| **User session context** | User ID, org ID in error reports | Triage and reproduce issues faster |

### Web Vitals Reporting in Next.js

```tsx
// app/components/WebVitals.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
    useReportWebVitals((metric) => {
        // Send to your analytics
        analyticsClient.track('web-vitals', {
            name: metric.name,        // CLS, FID, LCP, etc.
            value: metric.value,
            id: metric.id,
            rating: metric.rating,    // 'good', 'needs-improvement', 'poor'
        });
    });
    return null;
}
```

---

## Security (Frontend-Specific)

### XSS Vectors

| Check | What To Flag | Fix |
|-------|-------------|-----|
| `dangerouslySetInnerHTML` | Any usage without explicit sanitization | Sanitize with DOMPurify or remove entirely |
| Dynamic `href` | `<a href={userInput}>` accepting `javascript:` URIs | Validate URL scheme — only allow `http:`, `https:`, `mailto:` |
| User content in attributes | Template literals building HTML attributes | Use React's built-in escaping, avoid string concatenation |

### Client-Side Secrets

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Tokens in state | JWT/API tokens in Redux, Zustand, or Context | Use HTTP-only cookies for auth tokens |
| PII in client stores | User emails, SSN, or credit cards in client state | Fetch on demand, don't persist in client stores |
| Secrets in source maps | Production builds with source maps exposing code | Disable source maps or use Sentry source map uploads |

### Content Security Policy

Flag missing CSP header, especially for apps loading:
- Third-party scripts (analytics, chat widgets)
- Inline styles (styled-components, Emotion require `style-src 'unsafe-inline'` or nonce)
- External fonts and images

---

## Error Taxonomy

Not all errors are the same. Flag projects without a structured error handling strategy:

### Expected vs. Unexpected Errors

| Type | Example | Handling | UI |
|------|---------|----------|----|
| **Expected** | Form validation failure, 404, auth expired | Caught and handled gracefully | User-friendly message with recovery action |
| **Unexpected** | Null reference, network timeout, 500 | Caught by error boundary | "Something went wrong" + retry button |
| **Infrastructure** | DB down, third-party API outage | Circuit breaker + fallback | Degraded mode with explanation |

### Next.js Error File Hierarchy

Flag missing error handling at appropriate route levels:

```
app/
├── error.tsx              ← Catches all unhandled errors in the app
├── global-error.tsx       ← Catches root layout errors (full page)
├── not-found.tsx          ← Custom 404 page
├── dashboard/
│   ├── error.tsx          ← Dashboard-specific error UI
│   ├── loading.tsx        ← Dashboard loading skeleton
│   └── page.tsx
└── settings/
    ├── error.tsx          ← Settings-specific error UI
    └── page.tsx
```

Flag:
- Missing `error.tsx` at route segment level — one route crash takes down entire app
- Missing `global-error.tsx` — root layout crash = blank page
- Missing `not-found.tsx` — generic 404 loses users
- Error UI without `reset()` function — user stuck with no recovery

---

## Testing Strategy Coverage

Flag inadequate testing across the frontend testing pyramid:

### Testing Pyramid for Frontend

| Layer | Tool | What To Test | Coverage Goal |
|-------|------|-------------|---------------|
| **Unit** | Vitest / Jest | Utility functions, Zod schemas, data transformers | High — fast, cheap, catch logic bugs |
| **Component** | Testing Library | Component rendering, state transitions, user interactions | Medium — catch UI behavior bugs |
| **Integration** | Testing Library + MSW | Component + data fetching, form submission flows | Medium — catch data flow bugs |
| **E2E** | Playwright / Cypress | Critical user journeys (auth, checkout, onboarding) | Low count, high value — catch deployment bugs |
| **Visual Regression** | Chromatic / Percy | Screenshot comparison for UI changes | Catch unintended visual changes |
| **Accessibility** | axe-core / Testing Library | a11y audit on every component | Catch accessibility regressions |

### What To Flag

| Gap | Risk | Recommendation |
|-----|------|----------------|
| No tests at all | Every change is a gamble | Start with E2E for critical flows |
| Only unit tests | UI regressions undetected | Add component tests with Testing Library |
| No MSW for API mocking | Tests hit real APIs or skip data flows | Mock with MSW for deterministic testing |
| No accessibility testing | a11y violations ship undetected | Add `jest-axe` or `@axe-core/playwright` |
| No visual regression | UI breaks silently | Add Chromatic or Percy for key pages |
| Tests coupled to implementation | Refactoring breaks all tests | Test behavior, not implementation details |

```tsx
// ✅ Testing Library best practice — test user behavior
test('submits the form with valid data', async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
});
```

---

## Performance Budgets & CI Regression Prevention

Flag projects without automated gates that prevent performance degradation:

### Budget Configuration

```json
// bundlesize config in package.json
"bundlesize": [
    { "path": ".next/static/chunks/pages/*.js", "maxSize": "200 kB" },
    { "path": ".next/static/css/*.css", "maxSize": "50 kB" },
    { "path": ".next/static/chunks/framework*.js", "maxSize": "80 kB" }
]
```

### CI Pipeline Integration

| Gate | Tool | What It Catches |
|------|------|----------------|
| Bundle size check | `size-limit` / `bundlesize` | "Innocent" dependency adding 100KB |
| Lighthouse CI | `@lhci/cli` | Core Web Vitals regression |
| Type check | `tsc --noEmit` | Type errors that slip past IDE |
| Lint | `eslint` + `@next/eslint-plugin-next` | Next.js-specific anti-patterns |
| a11y check | `axe-core` in Playwright | Accessibility regressions |
| Visual regression | Chromatic / Percy | Unintended UI changes |

Every metric that matters must have a CI gate. If it's not automated, it will regress.

---

## Next.js Deployment Optimization

### Build & Rendering Strategy

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Missing `output: 'standalone'` | Docker/container deployment without standalone output | Add `output: 'standalone'` to `next.config.js` |
| Missing ISR | Pages fetching data on every request that could be static | Add `revalidate` to page data fetching |
| Missing `generateStaticParams` | Dynamic routes not pre-rendered at build time | Add `generateStaticParams` for known paths |
| Missing caching headers | API routes returning static data without cache headers | Add `Cache-Control` headers to API route responses |

### Middleware Optimization

```tsx
// ❌ Before: Middleware runs on every request including static assets
export function middleware(request: NextRequest) { ... }

// ✅ After: Scoped to only the routes that need it
export function middleware(request: NextRequest) { ... }
export const config = {
    matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

### Edge vs. Node Runtime

| Factor | Edge Runtime | Node Runtime |
|--------|-------------|-------------|
| Cold start | Fast (~1ms) | Slower (~250ms) |
| APIs available | Limited (Web APIs only) | Full Node.js |
| Database access | Limited (no native drivers) | Full access |
| Bundle size limit | 1MB (Edge), 4MB (Edge + middleware) | No limit |
| Best for | Auth, redirects, headers, geo-routing | Data-heavy pages, complex SSR |

---

## Frontend Scalability

Flag architectural decisions that will collapse under growth. Scalability issues are invisible at launch and catastrophic at scale.

### Infrastructure Scaling

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Single-region deployment | All users routed to one origin regardless of geography | Deploy to multiple regions or use edge rendering |
| No CDN for static assets | Static files served from origin server | CDN (Vercel Edge, CloudFront, Cloudflare) for all static assets |
| Missing ISR at scale | Every page request hits the origin | ISR with `revalidate` for pages with predictable staleness |
| No edge caching strategy | Dynamic pages without `Cache-Control` headers | Set `s-maxage` + `stale-while-revalidate` for cacheable responses |
| Unbounded SSR | Every route server-rendered on demand | Identify static vs. dynamic routes — pre-render what you can |

### Scaling the Codebase

| Scale Problem | Symptom | Solution |
|--------------|---------|----------|
| **Monolithic app, 100+ routes** | Build times exceeding 10+ minutes | Route groups with independent builds, or micro-frontend architecture |
| **Shared component library growing** | Changes to shared components break multiple teams' features | Versioned component library (npm package) with semver |
| **Single data layer** | Every query goes through one API gateway | Domain-specific API layers with BFF (Backend for Frontend) pattern |
| **Global state sprawl** | Zustand/Redux store with 50+ keys used everywhere | Colocate state, split stores by domain, use URL state + TanStack Query |
| **Team contention on same files** | Merge conflicts on shared layouts, utils, config | Modular architecture with clear ownership boundaries |

### Micro-Frontend Considerations

For large-scale applications with multiple teams, flag:

| Pattern | When It's Needed | How To Implement |
|---------|-----------------|-----------------|
| **Module Federation** | Multiple teams deploy independently | Webpack Module Federation or Vite Federation |
| **Route-based splitting** | Teams own entire route segments | Next.js route groups with independent deployments |
| **Shared design system** | UI consistency across micro-frontends | Published npm package with versioned components |
| **Shared auth/session** | SSO across micro-frontends | Shared middleware or edge-based auth |

### Scaling Performance Patterns

| Pattern | What It Solves | When To Flag Missing |
|---------|---------------|-------------------|
| **Virtualization** | Rendering 10,000+ list items without DOM explosion | `react-window` / `react-virtuoso` for any list > 100 visible items |
| **Pagination** | Loading entire dataset when user sees one page | Server-side pagination with `useInfiniteQuery` or offset/cursor |
| **Image CDN** | Serving full-resolution images to mobile devices | `next/image` with `sizes` + image CDN (Cloudinary, imgproxy) |
| **Edge rendering** | Slow TTFB for geographically distant users | Move personalization logic to Edge Middleware |
| **Incremental adoption** | Rewriting entire app to adopt new patterns | Feature flags, parallel routes, gradual migration per route |

### Graceful Degradation Under Load

```tsx
// Pattern: Fallback content when real-time data is slow
export default async function Dashboard() {
    const [metrics, notifications] = await Promise.allSettled([
        fetchMetrics(),           // Critical — show fallback if fails
        fetchNotifications(),     // Non-critical — hide if fails
    ]);

    return (
        <main>
            {metrics.status === 'fulfilled'
                ? <MetricsPanel data={metrics.value} />
                : <MetricsFallback />  /* Graceful degradation */
            }
            {notifications.status === 'fulfilled' &&
                <NotificationBadge data={notifications.value} />
                /* Non-critical: simply don't render if unavailable */
            }
        </main>
    );
}
```

---

## Return Format

For each finding, return:
```
Location: <file:line or component name>
Issue Type: Error Boundary | Hydration | Environment | Monitoring | Security | Deployment
Severity: 🔴 | 🟠 | 🟡 | 🔵
Failure Scenario: <what goes wrong in production when this isn't fixed>
Risk Level: <likelihood × impact assessment>
Remediation: <fix with code example>
```
