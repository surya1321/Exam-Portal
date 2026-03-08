# 🗄️ Data Fetching & State Management Agent — Deep-Dive Reference

## Domain
All data fetching, server state, client state, caching, and synchronization patterns.

## Core Mandate
`useEffect` for data fetching is **never acceptable**. TanStack Query is the standard. Every data fetching pattern is evaluated against this baseline.

## Table of Contents
- [TanStack Query Adoption](#tanstack-query-adoption) — useQuery, query key factory, `useQueries`, `select`
- [Next.js Server-Side Data Fetching](#nextjs-server-side) — Server Actions, Zod type contracts, streaming
- [Client State Management](#client-state) — Zustand, Context, URL state, derived state anti-patterns
- [Caching Strategy Assessment](#caching-strategy)
- [Advanced Mutation Patterns](#advanced-mutations) — optimistic updates, `setQueryData`, dehydration/hydration
- [Data Layer Scalability](#data-layer-scalability) — pagination, real-time data, large dataset rendering

---

## TanStack Query Adoption & Correctness

### Flag Non-TanStack Data Fetching

Every instance of these patterns on the client must be flagged:

| Anti-Pattern | What It Looks Like | Replacement |
|-------------|-------------------|-------------|
| `useEffect` + `fetch` | `useEffect(() => { fetch(url).then(setData) }, [deps])` | `useQuery({ queryKey: [key, deps], queryFn: () => fetch(url) })` |
| `useEffect` + `axios` | `useEffect(() => { axios.get(url).then(setData) }, [])` | `useQuery({ queryKey: [key], queryFn: () => axios.get(url) })` |
| Custom fetch hooks | Custom `useFetch` that reinvents caching | Replace with TanStack Query — it handles caching, dedup, retry, and more |
| SWR (if TanStack Query is standard) | `useSWR(key, fetcher)` | Migrate to `useQuery` for consistency and richer mutation support |
| Redux async thunks for server state | `createAsyncThunk` fetching API data | `useQuery` for reads, `useMutation` for writes |

### Verify TanStack Query Correctness

| Check | What To Look For | Red Flag |
|-------|-----------------|----------|
| **Query key design** | Keys must be stable, serializable, and include all dependencies | `queryKey: ['todos']` when it should be `['todos', { status, page }]` |
| **`staleTime` configuration** | Must match data volatility | Missing entirely (defaults to 0 = refetch on every mount) |
| **`gcTime` configuration** | Should keep inactive data long enough for back-navigation | Too short = cache miss on return; too long = memory waste |
| **`enabled` flag** | Conditional queries must use `enabled` | Query runs unconditionally when it depends on another query's result |
| **Error handling** | Must handle errors in UI | Missing `error` state rendering or `onError` callback |
| **Loading states** | Must show loading UI | Missing loading skeleton/spinner while query is pending |

### Advanced TanStack Query Patterns to Check

| Pattern | When It's Missing | Impact |
|---------|------------------|--------|
| **Optimistic updates** | Mutation succeeds but UI waits for refetch | Sluggish UX — user sees delay after action |
| **Query invalidation** | `useMutation` without `onSuccess: () => queryClient.invalidateQueries(...)` | Stale data persists after write |
| **Prefetching** | Critical data not prefetched on hover or route transition | Unnecessary loading states on navigation |
| **`useSuspenseQuery`** | Data fetching without Suspense integration | Missing streaming, no Suspense-based loading |
| **`useInfiniteQuery`** | Pagination fetching entire dataset | Overfetching — loads all pages when user sees one |
| **`placeholderData`** | No placeholder shown while fresh data loads | Blank screen flash on query key change |
| **Dependent queries** | Chained `useEffect` fetches instead of `enabled: !!dependentData` | Waterfall fetching, extra render cycles |

### Duplicate Query Keys
Scan for components using the same data but different query keys. These should share a cache entry:

```tsx
// ❌ Duplicate keys — same data fetched twice
useQuery({ queryKey: ['user-data'], queryFn: fetchUser })      // in Header
useQuery({ queryKey: ['current-user'], queryFn: fetchUser })   // in Sidebar

// ✅ Same key — shared cache, single fetch
useQuery({ queryKey: ['user', userId], queryFn: fetchUser })   // both components
```

### Query Key Factory Pattern

Flag projects without a centralized query key strategy. Scattered string keys cause cache misses and invalidation bugs:

```tsx
// ❌ Before: Scattered string keys across components
useQuery({ queryKey: ['todos'], ... })           // in TodoList
useQuery({ queryKey: ['todos', id], ... })       // in TodoDetail
useQuery({ queryKey: ['todo-list'], ... })       // in Dashboard (same data, different key!)

// ✅ After: Query key factory — single source of truth
const todoKeys = {
    all:    ['todos'] as const,
    lists:  () => [...todoKeys.all, 'list'] as const,
    list:   (filters: TodoFilters) => [...todoKeys.lists(), filters] as const,
    details:  () => [...todoKeys.all, 'detail'] as const,
    detail: (id: string) => [...todoKeys.details(), id] as const,
};

// Usage:
useQuery({ queryKey: todoKeys.detail(id), queryFn: () => fetchTodo(id) });

// Precise invalidation:
queryClient.invalidateQueries({ queryKey: todoKeys.lists() }); // invalidate all lists
queryClient.invalidateQueries({ queryKey: todoKeys.all });     // invalidate everything
```

### `useQueries` for Parallel Independent Fetching

Flag multiple independent `useQuery` calls that could use `useQueries` for better batch control:

```tsx
// ❌ Before: Separate loading/error states for each query
const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
const projects = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
const activity = useQuery({ queryKey: ['activity'], queryFn: fetchActivity });

// ✅ After: Batch queries with combined loading state
const results = useQueries({
    queries: [
        { queryKey: ['users'], queryFn: fetchUsers },
        { queryKey: ['projects'], queryFn: fetchProjects },
        { queryKey: ['activity'], queryFn: fetchActivity },
    ],
    combine: (results) => ({
        data: results.map(r => r.data),
        isPending: results.some(r => r.isPending),
    }),
});
```

---

## Next.js Server-Side Data Fetching

### Patterns to Flag

| Pattern | Problem | Replacement |
|---------|---------|-------------|
| Client-side fetch for request-time data | Extra round trip: server → client → API → client | Server component with `async/await` direct data access |
| Missing `fetch` cache semantics | `fetch(url)` without Next.js `cache` or `next` options | Add `cache: 'force-cache'` or `next: { revalidate: 60 }` |
| Sequential data fetching | `const a = await fetchA(); const b = await fetchB();` | `const [a, b] = await Promise.all([fetchA(), fetchB()])` |
| Missing `React.cache()` | Same function called multiple times in one render pass | Wrap with `cache()` to deduplicate within a single render |
| Pages Router patterns | `getServerSideProps` / `getStaticProps` in App Router project | Migrate to server component `async` data fetching |
| Missing Streaming | All data resolves before any UI renders | Wrap async sections in `<Suspense>` for progressive streaming |

### Server Actions as Mutation Handlers

In App Router projects, flag client-side mutation patterns that should use Server Actions:

```tsx
// ❌ Before: Client component with API route mutation
'use client';
async function handleSubmit(formData: FormData) {
    const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
    });
    if (!response.ok) throw new Error('Failed');
    router.refresh();
}

// ✅ After: Server Action — no API route needed, type-safe, progressive enhancement
// actions/todo.ts
'use server';
import { z } from 'zod';

const CreateTodoSchema = z.object({
    title: z.string().min(1).max(200),
    priority: z.enum(['low', 'medium', 'high']),
});

export async function createTodo(prevState: State, formData: FormData) {
    const validated = CreateTodoSchema.safeParse(Object.fromEntries(formData));
    if (!validated.success) return { error: validated.error.flatten() };

    await db.insert(todos).values(validated.data);
    revalidatePath('/todos');
    return { success: true };
}
```

Flag Server Actions that:
- Accept unvalidated input (no Zod schema)
- Don't check authorization (missing auth check)
- Return sensitive data in the response
- Don't use `revalidatePath` / `revalidateTag` after mutation

### Type-Safe API Contracts with Zod

Flag data flowing from external sources without runtime validation:

```tsx
// ❌ Before: Trust the API response blindly
const data = await fetch('/api/users').then(r => r.json());
// If API changes shape, runtime crash deep in component tree

// ✅ After: Validate at the boundary
const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'user', 'viewer']),
});

const UsersResponseSchema = z.array(UserSchema);

async function fetchUsers(): Promise<User[]> {
    const response = await fetch('/api/users');
    if (!response.ok) throw new ApiError(response.status);
    const data = await response.json();
    return UsersResponseSchema.parse(data); // Fails fast with clear error
}
```

Benefits: Catches API contract changes at the boundary, not deep in rendering. Enables auto-generated TypeScript types from schemas.

---

## Client State Management

### Server State vs. Client State

The #1 mistake: storing server data (API responses, user profiles, lists) in client state managers. This creates stale data, manual refetch logic, and cache invalidation nightmares.

| Data Type | Where It Belongs | Manager |
|-----------|-----------------|---------|
| API responses, user data, lists | **Server state** | TanStack Query |
| Form input values | **Local state** | React Hook Form or `useState` |
| UI state (modal open, accordion expanded) | **Local state** | `useState` / `useReducer` |
| Theme, locale, auth status | **Global client state** | Context / Zustand (sparingly) |
| Filters, pagination, search, tabs | **URL state** | `useSearchParams` / `nuqs` |
| Derived values from other state | **Computed** | `useMemo` or compute inline — never `useState` |

### URL State Neglect

Flag any of these stored in `useState` instead of URL search params:
- Filters and sort order
- Pagination (current page, page size)
- Search terms
- Active tab or section
- Selected item IDs (where sharing/bookmarking matters)

**Why this matters:** `useState` is lost on refresh, can't be shared via URL, and breaks back-button navigation.

### Derived State Anti-Pattern

```tsx
// ❌ Before: Derived state stored in useState + synced via useEffect
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);
const [totalPrice, setTotalPrice] = useState(0);

useEffect(() => {
    setFilteredItems(items.filter(i => i.active));
}, [items]);

useEffect(() => {
    setTotalPrice(filteredItems.reduce((sum, i) => sum + i.price, 0));
}, [filteredItems]);

// ✅ After: Computed during render — no state, no effects
const [items, setItems] = useState([]);
const filteredItems = useMemo(() => items.filter(i => i.active), [items]);
const totalPrice = useMemo(() => filteredItems.reduce((sum, i) => sum + i.price, 0), [filteredItems]);
```

---

## Caching Strategy Assessment

### Cache Layer Evaluation

| Layer | Technology | What To Check |
|-------|-----------|---------------|
| CDN edge cache | Vercel, CloudFront, etc. | Are static assets and ISR pages cached at the edge? |
| Server-side cache | Next.js `fetch` cache, Redis | Is frequently requested data cached server-side with appropriate TTL? |
| Client-side cache | TanStack Query | Is `staleTime` configured per-query based on data volatility? |
| Browser cache | HTTP headers | Are `Cache-Control` headers set on API responses? |

### Red Flags

- **No caching at all** — Every request goes to the origin, every time
- **Over-caching** — Sensitive user data cached at CDN or with long TTL
- **Missing invalidation** — Cache populated but never invalidated after mutations
- **Cache stampede** — All cache entries expire simultaneously under high traffic

### Advanced TanStack Query Mutation Patterns

Flag mutations that miss these senior-level patterns:

**`select` for Data Transformation:**

```tsx
// ❌ Before: Transform data in component on every render
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
const activeUsers = data?.filter(u => u.active); // re-computed every render

// ✅ After: Transform inside useQuery with select — memoized by TanStack Query
const { data: activeUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    select: (users) => users.filter(u => u.active),
});
```

**Direct Cache Manipulation with `setQueryData`:**

```tsx
// ✅ Optimistic update: update cache immediately, revert on error
const mutation = useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
        await queryClient.cancelQueries({ queryKey: todoKeys.detail(newTodo.id) });
        const previous = queryClient.getQueryData(todoKeys.detail(newTodo.id));
        queryClient.setQueryData(todoKeys.detail(newTodo.id), newTodo);
        return { previous };
    },
    onError: (err, newTodo, context) => {
        queryClient.setQueryData(todoKeys.detail(newTodo.id), context?.previous);
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
});
```

**Query Dehydration/Hydration for SSR:**

```tsx
// In server component: prefetch and dehydrate
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function Page() {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
        queryKey: todoKeys.lists(),
        queryFn: fetchTodos,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TodoList /> {/* Client component — cache already warm */}
        </HydrationBoundary>
    );
}
```

Flag client components that fetch data on mount when it could be prefetched and dehydrated from the server.

---

## Data Layer Scalability

Flag data patterns that work at 100 records but collapse at 100,000:

### Pagination Strategy

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| **Offset** (`?page=3&limit=20`) | Simple, supports "jump to page" | Slow on large datasets (DB scans), inconsistent with inserts/deletes | Admin tables, small datasets |
| **Cursor** (`?cursor=abc&limit=20`) | Consistent, fast regardless of dataset size | Can't jump to arbitrary page | Feeds, timelines, infinite scroll |
| **Keyset** (`?after_id=123&limit=20`) | Fast, consistent, works with any sorted field | Requires unique, sortable column | APIs serving mobile clients, real-time feeds |

```tsx
// ❌ Before: Load all data, filter client-side
const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()), // Returns 50,000 users
});
const filtered = allUsers?.filter(u => u.active); // Client processes 50K records

// ✅ After: Server-side pagination + filtering
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['users', { status: 'active' }],
    queryFn: ({ pageParam }) => fetchUsers({ cursor: pageParam, status: 'active', limit: 20 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
});
```

### Real-Time Data Patterns

Flag applications that poll for real-time data when better options exist:

| Pattern | Latency | Server Load | Best For |
|---------|---------|-------------|---------|
| **Polling** (`refetchInterval: 5000`) | 0-5s delay | High — N clients × M requests/min | When other options aren't available |
| **SSE** (Server-Sent Events) | Near-instant | Low — one persistent connection | Notifications, live feeds, dashboards |
| **WebSocket** | Instant, bidirectional | Medium — persistent connection pool | Chat, collaboration, gaming |
| **Webhook + revalidation** | Event-driven | Minimal — only on changes | Background data sync, CMS previews |

```tsx
// ❌ Before: Polling every 3 seconds (wasteful)
useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 3000, // 20 requests/minute per user
});

// ✅ After: SSE for push-based updates
useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (event) => {
        queryClient.setQueryData(['notifications'], JSON.parse(event.data));
    };
    return () => eventSource.close();
}, []);
```

### Large Dataset Rendering

Flag lists rendering hundreds or thousands of items without virtualization:

| Collection Size | Rendering Strategy | Tool |
|----------------|-------------------|------|
| < 50 items | Render all — DOM can handle it | Plain `.map()` |
| 50-500 items | Consider virtualization if items are complex | Monitor with React DevTools Profiler |
| 500+ items | **Mandatory virtualization** — DOM will thrash | `react-window`, `react-virtuoso`, `@tanstack/react-virtual` |
| 10,000+ items | Virtualization + server-side pagination | Infinite scroll with `useInfiniteQuery` + virtualization |

---

## Return Format

For each finding, return:
```
Location: <file:line or component name>
Issue Type: TanStack Query | Server Fetch | Client State | Caching
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Replacement: <TanStack Query or server component pattern with code>
Performance Impact: <what improves — latency, bundle, UX>
```
