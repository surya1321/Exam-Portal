# ⚡ Performance & Bottleneck Agent — Deep-Dive Reference

## Domain
Application-level performance, throughput bottlenecks, latency hotspots, and resource utilization.

---

## Endpoint Latency Analysis

### Slow Endpoint Detection

Flag endpoints exhibiting these patterns:

| Pattern | What It Looks Like | Impact |
|---------|-------------------|--------|
| No caching on repeated responses | Same computation on every request, no Redis/`lru_cache` | Unnecessary CPU and DB load |
| Inline CPU-bound work | Data processing, file parsing, PDF rendering in request handler | Blocks worker, starves concurrent requests |
| Missing pagination | Returning unbounded result sets: `select(Model).all()` | Timeouts and OOM as data grows |
| Missing field selection | Full model serialization when client needs 3 fields | Wasted serialization time and bandwidth |
| Serial independent I/O | Sequential `await` calls to unrelated services | Latency = sum of all calls instead of max |
| Sync tasks in request cycle | Sending email, writing audit log, triggering webhook inline | User waits for side effects they don't care about |

### Serial → Parallel Conversion

```python
# ❌ Before: Sequential — total latency = A + B + C
user = await get_user(user_id)
orders = await get_orders(user_id)
notifications = await get_notifications(user_id)

# ✅ After: Parallel — total latency = max(A, B, C)
user, orders, notifications = await asyncio.gather(
    get_user(user_id),
    get_orders(user_id),
    get_notifications(user_id),
)
```

### Background Task Offloading

Flag these operations if done synchronously in the request/response cycle:

| Operation | Why It Shouldn't Block | Offload To |
|-----------|----------------------|------------|
| Email sending | External SMTP latency (500ms–3s) | Celery / ARQ / `BackgroundTasks` (if lightweight) |
| Push notifications | External API with variable latency | Celery / ARQ |
| Audit log writes | Non-critical I/O | `BackgroundTasks` or async log buffer |
| Webhook dispatch | External endpoint may be slow or down | Celery with retry |
| Report/PDF generation | CPU-bound, 2–30s | Celery / ARQ with result backend |
| Image/file processing | CPU-bound, variable duration | `ProcessPoolExecutor` via `run_in_executor` |

---

## Serialization & Validation Performance

### Pydantic v1 → v2 Migration Flags

| v1 Pattern | v2 Replacement | Performance Impact |
|-----------|----------------|-------------------|
| `.dict()` | `.model_dump()` | v2 is compiled Rust — 5–50x faster |
| `.json()` | `.model_dump_json()` | Direct JSON serialization, no intermediate dict |
| `parse_obj(data)` | `model_validate(data)` | Rust-powered validation |
| `class Config:` | `model_config = ConfigDict(...)` | Modern declarative config |
| `@validator` | `@field_validator` | New decorator API |
| `@root_validator` | `@model_validator` | Changed semantics (mode='before'/'after') |

### Over-Serialization Detection

| Pattern | Problem | Fix |
|---------|---------|-----|
| Full ORM → Pydantic model for every response | Serializes 20 fields when API needs 5 | Create lightweight response DTOs with only needed fields |
| Nested model serialization | Eagerly serializes deep relationships | Use `response_model_exclude` or create separate flat models |
| Missing `response_model_exclude_unset=True` | Sends default values for every unset field | Add to endpoint decorator — reduces payload |
| Pydantic models for internal computation | Validation overhead on every internal function call | Use `dataclasses` or `TypedDict` for internal data passing |

---

## Caching Strategy Assessment

### Cache Layer Evaluation

| Layer | Technology | Check |
|-------|-----------|-------|
| Application-level | `functools.lru_cache` / `@cache` | Pure deterministic functions called repeatedly with same args? |
| Request-level | Redis with TTL | Frequently read, rarely changing data (config, permissions, reference data)? |
| Query-level | SQLAlchemy query caching | Identical queries executed across requests? |
| HTTP-level | `Cache-Control`, `ETag` headers | Static/semi-static API responses with no cache headers? |

### Cache Red Flags

| Red Flag | Problem | Fix |
|----------|---------|-----|
| No caching anywhere | Every read = fresh DB query | Add Redis for frequent reads, `lru_cache` for pure functions |
| Missing cache invalidation | Stale data served after mutations | Invalidate on write with `cache.delete(key)` pattern |
| User-specific data in shared cache | Data leakage between users | Cache key MUST include user/tenant discriminator |
| Cache stampede risk | All keys expire simultaneously under load | Use probabilistic early expiration or distributed locking |
| No cache warming | Cold-start degradation on deploy | Pre-populate critical cache keys in startup lifespan |
| Mutable data with long TTL | Stale data for extended periods | Match TTL to data volatility — config: hours, user data: minutes |

---

## Memory & Resource Utilization

### Large Data Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `result.all()` on huge tables | Entire table loaded into memory | Use `.yield_per(chunk_size)` or cursor-based pagination |
| `list(query_result)` | Materialized in memory before processing | Iterate directly: `async for row in result:` |
| Large list returned from function | Entire dataset buffered | Use `yield` for generator patterns |
| Full file read into memory | `file.read()` on multi-GB files | Use chunked reads: `for chunk in iter(lambda: f.read(8192), b""):` |
| No `StreamingResponse` | Large downloads buffered in memory | Use `StreamingResponse` for CSV exports, file downloads |

### Missing Generator Patterns

```python
# ❌ Before: Loads all 1M records into memory
async def get_all_users():
    result = await session.execute(select(User))
    return result.scalars().all()  # 1M User objects in memory

# ✅ After: Streams in chunks
async def get_all_users():
    result = await session.stream(select(User))
    async for partition in result.partitions(1000):
        for user in partition:
            yield user
```

### Streaming Response Pattern

```python
# ❌ Before: Buffer entire CSV in memory
@router.get("/export")
async def export_csv():
    data = await get_all_records()  # loads everything
    csv = generate_csv(data)
    return Response(csv, media_type="text/csv")

# ✅ After: Stream rows as generated
@router.get("/export")
async def export_csv():
    async def generate():
        yield "id,name,email\n"
        async for record in stream_all_records():
            yield f"{record.id},{record.name},{record.email}\n"
    return StreamingResponse(generate(), media_type="text/csv")
```

---

## Return Format

For each finding, return:
```
Location: <endpoint or function> (file:line)
Issue Type: Latency | Serialization | Caching | Memory
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Optimized Implementation: <specific replacement with code>
Estimated Impact: <latency reduction, throughput gain, memory saving>
```
