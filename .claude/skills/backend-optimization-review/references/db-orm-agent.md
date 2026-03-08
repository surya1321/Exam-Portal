# 🗄️ Database & ORM Agent — Deep-Dive Reference

## Domain
SQLAlchemy ORM usage, PostgreSQL query optimization, schema design, indexing strategy, and data access patterns.

## Core Mandate
N+1 queries, unindexed access patterns, and raw string SQL are **never acceptable**. Every ORM interaction is evaluated for correctness, efficiency, and production safety.

---

## N+1 Query Detection — Zero Tolerance Policy

Flag **every lazy-loaded relationship access** in a loop, list comprehension, or serialization context.

### Diagnosis

| Pattern | What It Looks Like | N+1 Count |
|---------|-------------------|-----------|
| Loop access on lazy relationship | `for user in users: print(user.roles)` | 1 + N queries |
| List comprehension with relationship | `[u.department.name for u in users]` | 1 + N queries |
| Pydantic serialization of relationships | `UserResponse.model_validate(user)` where response includes nested roles | 1 + N per nested model |
| Template/response rendering | Accessing `order.items` in a loop during response building | 1 + N queries |

### Correct Loading Strategy by Relationship Type

| Relationship | Strategy | When To Use |
|-------------|----------|-------------|
| Many-to-one / One-to-one | `joinedload()` | Always — single JOIN, no extra query |
| One-to-many (small collections) | `selectinload()` | Default — second query with `IN` clause, avoids cartesian product |
| One-to-many (large collections) | `subqueryload()` | When `IN` clause would be too large |
| Many-to-many | `selectinload()` | Default — avoids cartesian product from double JOIN |
| Conditional loading | `raiseload('*')` | Enforces explicit loading discipline — raises error on implicit access |
| Write-only collections | `WriteOnlyMapped` | Large collections never read in bulk — use `lazy="write_only"` |

### Before / After Example

```python
# ❌ Before: N+1 — 1 query for users, then N queries for roles
users = (await session.execute(select(User))).scalars().all()
for user in users:
    print(user.roles)  # Each access = new query

# ✅ After: 2 queries total — 1 for users, 1 IN query for all roles
from sqlalchemy.orm import selectinload
users = (await session.execute(
    select(User).options(selectinload(User.roles))
)).scalars().all()
for user in users:
    print(user.roles)  # Already loaded — no extra query
```

---

## Query Optimization

### Anti-Patterns to Flag

| Pattern | Problem | Fix |
|---------|---------|-----|
| `SELECT *` via ORM | Loading all columns when only 2 needed | `select(User.id, User.name)` column projection |
| Missing `.options()` | Queries that will trigger implicit lazy loads | Add explicit loading strategies |
| No `LIMIT` on queries | Could return millions of rows | Always paginate: `.limit(page_size).offset(offset)` |
| Python-level filtering | `[u for u in users if u.active]` after fetching all | Push to SQL: `.where(User.active == True)` |
| Individual `session.add()` in loop | N individual INSERTs | `session.add_all(objects)` or `insert(Model).values(rows)` |
| `session.query()` (legacy API) | SQLAlchemy 1.x style, deprecated | Migrate to `select()` statement style |
| Missing `with_for_update()` | Read-then-write race condition | Add `with_for_update()` for pessimistic locking |
| Cartesian product | Missing join condition producing N×M rows | Verify every join has an explicit ON condition |
| Missing `.unique()` | `selectinload` + `joinedload` producing duplicates | Add `.unique()` before `.scalars()` |

### Efficient Bulk Operations

```python
# ❌ Before: N individual INSERT statements
for item in items:
    session.add(Item(**item))
await session.commit()

# ✅ After: Single INSERT with multiple values
from sqlalchemy.dialects.postgresql import insert
stmt = insert(Item).values(items)
await session.execute(stmt)
await session.commit()

# ✅ After (with conflict handling): Upsert pattern
stmt = insert(Item).values(items).on_conflict_do_update(
    index_elements=[Item.external_id],
    set_={"name": stmt.excluded.name, "updated_at": func.now()}
)
```

---

## Async SQLAlchemy Correctness

### Critical Checks

| Check | Red Flag | Fix |
|-------|----------|-----|
| Session type | `Session` used in async context | Use `AsyncSession` with `create_async_engine` |
| Database driver | `psycopg2` in async application | Use `asyncpg` — `postgresql+asyncpg://` connection string |
| Lazy loading after session close | Accessing relationships after `await session.close()` | Load eagerly or use `expire_on_commit=False` |
| Missing `expire_on_commit=False` | Attributes expired after commit, causing `MissingGreenlet` | Set `expire_on_commit=False` in session factory |
| Session lifecycle | Session not closed/committed/rolled back in all paths | Use `async with session.begin():` for auto-management |
| Missing `await session.refresh()` | Accessing DB-generated values (timestamps, sequences) after commit without refresh | `await session.refresh(obj)` after commit |
| `run_sync` misuse | Using `session.run_sync()` for operations that have async equivalents | Use native async methods |

### Correct Async Session Pattern

```python
# ❌ Before: Manual session management (error-prone)
session = AsyncSession(engine)
try:
    user = User(name="test")
    session.add(user)
    await session.commit()
except Exception:
    await session.rollback()
    raise
finally:
    await session.close()

# ✅ After: Context manager with auto-management
async with async_session_factory() as session:
    async with session.begin():
        user = User(name="test")
        session.add(user)
    # Auto-commits on exit, auto-rollbacks on exception
```

---

## Schema & Index Design

### Index Strategy — Every FK, Every Filter, Every Sort

| Check | What To Look For | Impact |
|-------|-----------------|--------|
| **FK without index** | `Column(ForeignKey("users.id"))` with no `index=True` | Full table scan on every JOIN involving this FK |
| **WHERE column without index** | Frequent `WHERE status = 'active'` with no index on `status` | Full table scan on filtering |
| **ORDER BY without index** | `ORDER BY created_at DESC` with no index on `created_at` | Filesort on every query |
| **Composite filter without composite index** | `WHERE org_id = X AND status = 'active'` | Two single-column indexes less efficient than one composite |
| **Missing partial index** | Index on `status` column with 95% = 'active' | Partial index: `Index(... postgresql_where=text("status = 'active'"))` |
| **Missing GIN on JSONB** | `data->>'key'` queries on JSONB column without GIN index | Full table scan on JSON queries |
| **Over-indexing** | 10+ indexes on a high-write table | Every INSERT/UPDATE/DELETE must update all indexes |

### Index Declaration Examples

```python
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)  # ✅ FK indexed
    status = Column(String(20), index=True)                          # ✅ Filter column indexed
    created_at = Column(DateTime, index=True)                        # ✅ Sort column indexed

    __table_args__ = (
        # ✅ Composite index for common query pattern
        Index("ix_orders_user_status", "user_id", "status"),
        # ✅ Partial index — only index active orders
        Index("ix_orders_active", "user_id",
              postgresql_where=text("status = 'active'")),
        # ✅ Unique constraint at DB level
        UniqueConstraint("user_id", "order_ref", name="uq_user_order_ref"),
    )
```

### Missing Constraints

| Constraint | When Missing | Risk |
|-----------|-------------|------|
| `NOT NULL` | Column allows null when it should never be null | App-level null checks are insufficient — data corruption risk |
| `UNIQUE` | Uniqueness validated only in app, not in DB | Race condition allows duplicate inserts |
| `CHECK` | Domain values (status enums, positive quantities) not constrained | Invalid data enters DB silently |
| `VARCHAR` length | Unbounded `String()` columns | Use `Text` explicitly or add length limits |

---

## Transaction Management

### Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Multi-step writes without transaction | Partial writes if step 3 of 5 fails | Wrap in `async with session.begin():` |
| Long transaction with external calls | Holds DB locks while calling external API | Move external calls outside transaction |
| Missing savepoints | All-or-nothing on complex multi-step operations | Use `session.begin_nested()` for partial rollback |
| Autoflush side effects | Premature writes mid-transaction before data is ready | Use `autoflush=False` when needed, flush explicitly |
| Missing idempotency | Unsafe retries on transient failures | Use upsert patterns with unique constraint guards |

---

## Connection Pool Management

### Production Pool Configuration

| Setting | Default | Production Recommendation | Why |
|---------|---------|--------------------------|-----|
| `pool_size` | 5 | 10–20 (adjust to workload) | 5 is insufficient for real concurrency |
| `max_overflow` | 10 | 20–40 | Burst capacity for traffic spikes |
| `pool_pre_ping` | `False` | **`True` always** | Checks connection health before use — prevents stale connection errors |
| `pool_recycle` | -1 (never) | 1800 (30 min) | Recycle before PostgreSQL's `idle_in_transaction_session_timeout` |
| `pool_timeout` | 30 | 10 | Fail fast instead of queuing requests indefinitely |
| `connect_args` | `{}` | `{"timeout": 5}` for asyncpg | Prevent infinite connection wait under load |

### Pool Exhaustion Detection

Flag patterns where connections are held longer than necessary:
- Long-running transactions holding connections while doing non-DB work
- Queries without timeouts allowing single slow query to hold a connection indefinitely
- Background tasks using the same pool as request handlers — should have a separate pool
- Session not returned to pool (missing `await session.close()` or context manager)

---

## Return Format

For each finding, return:
```
Location: <query or model definition> (file:line)
Issue Type: N+1 | Query Optimization | Async ORM | Schema | Transaction | Pool
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Recommended Fix: <corrected SQLAlchemy code>
Performance Impact: <estimated query plan improvement, index usage, connection savings>
```
