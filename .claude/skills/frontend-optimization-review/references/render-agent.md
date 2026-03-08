# ⚛️ Render & Component Architecture Agent — Deep-Dive Reference

## Domain
Component design, rendering behavior, re-render patterns, and the Server vs. Client component boundary.

## Table of Contents
- [`useEffect` Audit — Zero Tolerance Policy](#useeffect-audit)
- [Server vs. Client Component Boundary](#server-vs-client-boundary)
- [Re-render Optimization](#re-render-optimization)
- [React 19 Modern Patterns](#react-19-modern-patterns) — `use()`, `useActionState`, `useFormStatus`, `useOptimistic`
- [Concurrent Rendering Patterns](#concurrent-rendering) — `useTransition`, `useDeferredValue`, render-as-you-fetch
- [Partial Prerendering (PPR)](#partial-prerendering)
- [Composition Patterns](#composition-patterns) — children-as-props, compound components
- [React Compiler Awareness](#react-compiler)
- [Component Design Quality](#component-design-quality) — God components, prop drilling, custom hooks

---

## `useEffect` Audit — Zero Tolerance Policy

Flag **every single `useEffect`** instance in the codebase without exception. For each instance:

### 1. Diagnose the Root Cause

| Root Cause | What It Looks Like |
|------------|-------------------|
| Data fetching | `useEffect(() => { fetch(...).then(setData) }, [])` |
| Derived state | `useEffect(() => { setFullName(first + ' ' + last) }, [first, last])` |
| Event subscription | `useEffect(() => { window.addEventListener(...) }, [])` |
| DOM manipulation | `useEffect(() => { ref.current.focus() }, [])` |
| One-time initialization | `useEffect(() => { initializeThirdParty() }, [])` |
| Synchronization chains | `useEffect` that triggers state update → triggers another `useEffect` |

### 2. Provide Specific Replacement

| Current Pattern | Replacement | Why |
|----------------|-------------|-----|
| `useEffect` + `fetch` + `useState` | `useQuery` / `useSuspenseQuery` (TanStack Query) | Automatic caching, deduplication, loading/error states, refetch, retry |
| `useEffect` + `setState(derived)` | Compute during render or `useMemo` | Eliminates unnecessary render cycle (state update in effect = extra render) |
| `useEffect` + `addEventListener` | `useSyncExternalStore` or library hooks | Proper teardown, SSR-safe, no stale closure risk |
| `useEffect(() => {...}, [])` (init) | Module-level init, lazy ref, or server component | Initialization doesn't belong in a render cycle |
| `useEffect` + DOM measurement | `useLayoutEffect` (only if truly needed) or ResizeObserver | `useLayoutEffect` runs synchronously before paint |
| `useEffect` chain (A → B → C) | Single derived computation or TanStack Query dependent queries | Chains indicate broken data flow — flatten the dependency |

### 3. Red Flags to Escalate

- **`useEffect` with empty `[]` masking server-side logic** — This often belongs in a server component or route loader, not a client-side effect
- **`useEffect` chains** — Effect A sets state → triggers Effect B → sets more state. This is a broken data flow. Flatten to a single computation
- **`useEffect` that could be an event handler** — If the effect responds to a user action, it should be in the event handler, not watching state changes from that action
- **`useEffect` + `setInterval`** — Often missing cleanup, causing memory leaks and stale closures
- **`useEffect` replacing what should be a Server Action** — Form submission logic in `useEffect` that belongs in a `"use server"` action

---

## React 19 Modern Patterns

If the project uses React 19+, flag any code ignoring these primitives:

### `use()` Hook

The `use()` hook reads resources (Promises, Context) during render. It replaces several `useEffect` + `useState` patterns:

```tsx
// ❌ Before: useEffect + useState for reading a promise
const [data, setData] = useState(null);
useEffect(() => { fetchData().then(setData) }, []);

// ✅ After: use() reads the promise directly (with Suspense boundary)
const data = use(dataPromise);
```

### `useActionState` (replaces `useFormState`)

For Server Action form handling with progressive enhancement:

```tsx
// ❌ Before: Manual form state management
const [error, setError] = useState(null);
const [isPending, setIsPending] = useState(false);

const handleSubmit = async (formData) => {
    setIsPending(true);
    try {
        await submitForm(formData);
    } catch (e) {
        setError(e.message);
    } finally {
        setIsPending(false);
    }
};

// ✅ After: useActionState with Server Action
const [state, formAction, isPending] = useActionState(submitAction, initialState);

return (
    <form action={formAction}>
        {state.error && <p>{state.error}</p>}
        <button disabled={isPending}>Submit</button>
    </form>
);
```

### `useFormStatus`

For child components that need to know if a parent form is pending:

```tsx
function SubmitButton() {
    const { pending } = useFormStatus();
    return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}
```

Flag: Any manual `isPending` state passed as props when `useFormStatus` would eliminate the prop drilling.

### `useOptimistic`

For immediate UI updates before server confirmation:

```tsx
const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { ...newMessage, sending: true }]
);
```

Flag: Any TanStack Query optimistic update pattern that could be simplified with `useOptimistic` for server-action-based mutations.

---

## Concurrent Rendering Patterns

### `useTransition` — Non-Urgent State Updates

Flag expensive state updates that block user interaction:

```tsx
// ❌ Before: Filtering 10,000 items blocks the input
const [query, setQuery] = useState('');
const filtered = items.filter(i => i.name.includes(query)); // runs synchronously

// ✅ After: Transition keeps input responsive
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();
const [deferredQuery, setDeferredQuery] = useState('');

const handleChange = (e) => {
    setQuery(e.target.value);              // urgent: update input immediately
    startTransition(() => {
        setDeferredQuery(e.target.value);  // non-urgent: filter can wait
    });
};
```

### `useDeferredValue` — Deferred Expensive Renders

Flag components that render expensive children on every keystroke:

```tsx
// ✅ Defers the expensive re-render of SearchResults
const deferredQuery = useDeferredValue(searchQuery);
return <SearchResults query={deferredQuery} />;
```

### Render-As-You-Fetch Pattern

Flag waterfall patterns where rendering waits for data instead of starting both simultaneously:

| Pattern | Performance | When To Use |
|---------|------------|-------------|
| **Fetch-on-render** | ❌ Waterfall — render → fetch → wait → render children | Never (legacy pattern) |
| **Fetch-then-render** | ⚠️ Blocks render until all data ready | Only if all data required before any UI |
| **Render-as-you-fetch** | ✅ Start fetch + render simultaneously, stream data in | Default — use Suspense + prefetching |

---

## Partial Prerendering (PPR)

If using Next.js with PPR support, flag pages that are candidates for partial prerendering but use full SSR or full CSR:

**PPR candidates**: Pages with a static shell (nav, sidebar, layout) + dynamic content (user-specific data, real-time updates).

| Current Pattern | Problem | PPR Solution |
|----------------|---------|-------------|
| Full SSR for page with static + dynamic sections | TTFB delayed by dynamic data fetching | Static shell served instantly from CDN, dynamic sections stream in via Suspense |
| Full CSR for page with mostly static content | No SEO, slow LCP, unnecessary client JS | Static parts prerendered, only interactive parts hydrated |
| ISR with frequent revalidation | Stale content between revalidations | Static shell always fresh, only dynamic parts revalidated |

```tsx
// PPR pattern: Suspense boundary marks the dynamic/static split
export default async function ProductPage({ params }) {
    const product = await getProduct(params.id); // static: can be prerendered

    return (
        <main>
            <h1>{product.name}</h1>           {/* Static shell */}
            <p>{product.description}</p>       {/* Static shell */}
            <Suspense fallback={<PriceSkeleton />}>
                <DynamicPricing id={params.id} /> {/* Dynamic: streams in */}
            </Suspense>
            <Suspense fallback={<ReviewsSkeleton />}>
                <UserReviews id={params.id} />    {/* Dynamic: streams in */}
            </Suspense>
        </main>
    );
}
```

---

## Composition Patterns

Senior-level component architecture avoids prop drilling through advanced composition:

### Children-as-Props Pattern

```tsx
// ❌ Before: Server component forced to "use client" because it wraps a client component
'use client';
export function Card({ title, onAction, children }) {
    return (
        <div>
            <h2>{title}</h2>
            {children}
            <button onClick={onAction}>Action</button> {/* only interactive part */}
        </div>
    );
}

// ✅ After: Server component passes children, only button is client
export function Card({ title, children, actionSlot }) {
    return (
        <div>
            <h2>{title}</h2>
            {children}
            {actionSlot} {/* Client component injected as slot */}
        </div>
    );
}
```

### Compound Component Pattern

Flag components with 10+ props that should use compound composition:

```tsx
// ❌ Before: Mega-prop component
<DataTable data={data} columns={cols} sortable paginated filterable
           onSort={handleSort} onFilter={handleFilter} onPageChange={handlePage}
           headerSlot={header} footerSlot={footer} emptySlot={empty} />

// ✅ After: Compound components — each piece composable
<DataTable data={data}>
    <DataTable.Header>
        <DataTable.Search onFilter={handleFilter} />
    </DataTable.Header>
    <DataTable.Body columns={cols} sortable onSort={handleSort} />
    <DataTable.Pagination onPageChange={handlePage} />
    <DataTable.Empty>No results found</DataTable.Empty>
</DataTable>
```

---

## React Compiler Awareness

If the project uses React Compiler (React Forget), flag:
- **Manual `useMemo` / `useCallback`** that the compiler auto-generates — these become unnecessary noise
- **Non-idiomatic patterns** that break compiler optimization: mutation during render, non-deterministic render output, reading `ref.current` during render
- **Components the compiler skips** (shows in React DevTools) — investigate why and fix the pattern

If the project does **not** use React Compiler, flag it as a recommendation with migration path.

---

## Server vs. Client Component Boundary

### Challenge Every `"use client"` Directive

For each `"use client"` component, answer:
1. **Does this component have interactive elements** (onClick, onChange, onSubmit, hover effects, etc.)? If no → should be a server component.
2. **Does this component use browser-only APIs** (window, document, localStorage, navigator)? If yes → is this the minimal surface that needs them?
3. **Does this component use React hooks** (useState, useEffect, useRef)? If yes → can the logic be extracted so the rendering stays on the server?

### Patterns to Flag

| Pattern | Problem | Fix |
|---------|---------|-----|
| `"use client"` on a page/layout component | Forces entire subtree to be client-rendered | Extract only interactive parts as client components |
| Client component wrapping static content | Server rendering wasted | Move static content to a server component parent, pass interactive bits as children |
| Data fetching in client component | Round trip: server → client → server (API) → client | Fetch in server component, pass data as props |
| `"use client"` for a single `onClick` | Entire component shipped to client for one handler | Extract a tiny `<InteractiveButton>` client component |
| Client component contamination | One `"use client"` at top of tree converts everything below | Push `"use client"` as deep as possible |

### Missing Suspense Boundaries

Flag server components that perform async operations without a `<Suspense>` boundary wrapping them. Missing boundaries cause:
- Sequential waterfall loading (parent waits for child)
- No streaming — entire page blocks until all data resolves
- No loading UI — user sees nothing until everything is ready

---

## Re-render Optimization

### What Causes Unnecessary Re-renders

| Cause | Detection | Fix |
|-------|-----------|-----|
| Inline object/array literals as props | `<Child style={{ color: 'red' }} />` in render | Extract to constant or `useMemo` |
| Function props created on every render | `<Child onClick={() => doThing(id)} />` | `useCallback` with stable deps |
| Context over-consumption | Component reads entire context but uses one field | Split context or use selector pattern |
| State too high in tree | Parent state change re-renders all children | Colocate state closer to where it's used |
| Missing `React.memo` on expensive children | Pure component re-renders on every parent update | Wrap with `React.memo` if props are referentially stable |
| Index-as-key in dynamic lists | `key={index}` on lists with add/remove/reorder | Use stable unique identifier as key |

### Context Optimization Patterns

```tsx
// ❌ Before: One fat context — every consumer re-renders on any change
const AppContext = createContext({ user, theme, notifications, cart });

// ✅ After: Split by update frequency
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const NotificationContext = createContext(notifications);
const CartContext = createContext(cart);
```

---

## Component Design Quality

### God Components
Flag components that:
- Have more than 5-7 `useState` calls
- Exceed ~200 lines of JSX
- Manage multiple unrelated concerns (data + UI + business logic)
- Have deeply nested conditional rendering (3+ levels of ternaries)
- Accept more than 8-10 props (decompose into compound components)

### Prop Drilling
Flag props passed through more than 2 intermediate components that don't use them. Suggest in priority order:
1. **Composition pattern** (children/render slots) — no extra abstraction needed
2. **Compound components** — for related component groups
3. **Context** — for truly shared state across distant siblings
4. **State management** — for cross-cutting concerns (auth, theme)

### Logic Separation
Flag components that mix UI and business logic. Extract:
- Data transformation → custom hooks (`useFormattedPrice`, `useFilteredItems`)
- Side effect orchestration → TanStack Query mutations or Server Actions
- Complex conditional logic → utility functions
- Form validation → Zod schemas (shared between client + server)

### Custom Hook Quality
Flag custom hooks that:
- Return more than 4-5 values (decompose into multiple hooks)
- Mix unrelated concerns (e.g., `useUser` that also manages notifications)
- Don't follow the `use` prefix convention
- Contain business logic that could be a Server Action instead

---

## Return Format

For each finding, return:
```
Component: <ComponentName> (file:line)
Issue Type: useEffect | Client Boundary | Re-render | Design Quality
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Recommended Fix: <specific replacement with code example>
Impact: <what improves — render count, bundle size, user experience>
```
