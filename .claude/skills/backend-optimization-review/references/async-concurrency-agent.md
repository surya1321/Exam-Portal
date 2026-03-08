# ⚙️ Async & Concurrency Agent — Deep-Dive Reference

## Domain
Async/await correctness, concurrency patterns, background task management, and event loop health.

## Core Mandate
Synchronous blocking calls inside async endpoints are **never acceptable**. Every blocking operation must be offloaded or replaced with an async equivalent. No exceptions.

---

## Async/Await Correctness — Zero Tolerance for Blocking

### Blocking Call Detection

Flag **every** instance of these inside `async def` functions:

| Blocking Call | Async Replacement | Event Loop Impact |
|--------------|-------------------|-------------------|
| `time.sleep(n)` | `await asyncio.sleep(n)` | 🔴 Freezes all concurrent requests for `n` seconds |
| `requests.get/post()` | `await httpx_client.get/post()` | 🔴 Blocks event loop for entire HTTP round-trip |
| `open()` / file I/O | `aiofiles.open()` | 🟠 Blocks for disk I/O duration |
| `psycopg2` / sync SQLAlchemy | `asyncpg` / async SQLAlchemy | 🔴 Blocks for entire query execution |
| `subprocess.run()` | `asyncio.create_subprocess_exec()` | 🔴 Blocks for subprocess duration |
| `os.path.exists()` / `os.listdir()` | `aiofiles.os` or `run_in_executor` | 🟡 Short block, but compounds at scale |
| CPU-bound computation | `loop.run_in_executor(executor, fn)` | 🔴 Starves event loop of CPU time |
| `smtplib.SMTP()` | `aiosmtplib` or offload to task queue | 🔴 Blocks for SMTP handshake and send |

### Missing `await` Detection

```python
# ❌ Missing await — coroutine created but never executed
async def handler():
    get_user(user_id)  # Returns coroutine object, does nothing!
    return {"status": "ok"}

# ✅ Correct
async def handler():
    user = await get_user(user_id)
    return {"status": "ok"}
```

### Fake Async Detection

Flag `async def` functions containing no `await` — misleading and adds coroutine overhead:

```python
# ❌ Fake async — no await inside, adds overhead
async def calculate_tax(amount: float) -> float:
    return amount * 0.1  # Pure computation, should be def, not async def

# ✅ Fix: Regular function
def calculate_tax(amount: float) -> float:
    return amount * 0.1
```

### Nested Event Loop Detection

```python
# ❌ FATAL: asyncio.run() inside running event loop → RuntimeError
async def handler():
    result = asyncio.run(some_coroutine())  # Crashes!

# ✅ Fix: Just await it
async def handler():
    result = await some_coroutine()
```

---

## Concurrency Patterns

### Sequential → Parallel Conversion

Flag independent `await` calls executed sequentially:

```python
# ❌ Before: Sequential — 3 seconds total (1s + 1s + 1s)
user = await get_user(user_id)          # 1s
permissions = await get_permissions(user_id)  # 1s
preferences = await get_preferences(user_id)  # 1s

# ✅ After: Parallel — 1 second total (max of all three)
user, permissions, preferences = await asyncio.gather(
    get_user(user_id),
    get_permissions(user_id),
    get_preferences(user_id),
)

# ✅ Better (Python 3.11+): TaskGroup with structured error handling
async with asyncio.TaskGroup() as tg:
    t1 = tg.create_task(get_user(user_id))
    t2 = tg.create_task(get_permissions(user_id))
    t3 = tg.create_task(get_preferences(user_id))
user, permissions, preferences = t1.result(), t2.result(), t3.result()
```

### Unbound Concurrency Detection

Flag `asyncio.gather()` on user-controlled collections with no concurrency limit:

```python
# ❌ Before: 10,000 concurrent requests — overwhelms DB/API/event loop
results = await asyncio.gather(*[
    fetch_data(item_id) for item_id in item_ids  # Could be 10,000 items!
])

# ✅ After: Bounded concurrency with semaphore
semaphore = asyncio.Semaphore(50)  # Max 50 concurrent operations

async def bounded_fetch(item_id: int):
    async with semaphore:
        return await fetch_data(item_id)

results = await asyncio.gather(*[
    bounded_fetch(item_id) for item_id in item_ids
])
```

### Shared State Synchronization

Flag shared mutable state accessed from multiple coroutines without locking:

```python
# ❌ Before: Race condition on shared counter
counter = 0
async def increment():
    global counter
    counter += 1  # Not atomic — read-modify-write can interleave

# ✅ After: Async lock for shared state
lock = asyncio.Lock()
counter = 0
async def increment():
    global counter
    async with lock:
        counter += 1
```

---

## Background Tasks

### Task Strategy Assessment

| Use Case | Correct Strategy | Wrong Strategy |
|----------|-----------------|----------------|
| Fire-and-forget email | `BackgroundTasks` or lightweight queue | Celery (overkill for simple sends) |
| Audit log write | `BackgroundTasks` | Nothing — losing audit is acceptable? No. |
| PDF report generation | Celery / ARQ | `BackgroundTasks` — too heavy, no retry |
| Bulk data import | Celery / ARQ with chunking | Inline processing — blocks request |
| Webhook dispatch | Celery with retry | `BackgroundTasks` — no retry on failure |
| Third-party API orchestration | Celery with retry + dead letter | `BackgroundTasks` — no failure handling |

### Background Task Red Flags

| Red Flag | Problem | Fix |
|----------|---------|-----|
| Heavy computation in `BackgroundTasks` | Shares thread pool with request handlers | Move to Celery/ARQ with dedicated workers |
| No retry logic | Failed tasks vanish silently | Add `tenacity` retry or use Celery's built-in retry |
| No idempotency | Retried tasks create duplicate side effects | Add idempotency key and check before execution |
| No task monitoring | No visibility into task success/failure | Add Flower for Celery, or result backend + alerting |
| No dead letter queue | Permanently failed tasks are lost | Configure DLQ for inspection and manual retry |

### Task Idempotency Pattern

```python
# ✅ Idempotent task — safe to retry
@celery_app.task(bind=True, max_retries=3, acks_late=True)
def send_notification(self, notification_id: str):
    notification = get_notification(notification_id)
    if notification.sent_at is not None:
        return  # Already sent — idempotent exit

    try:
        deliver(notification)
        mark_as_sent(notification_id)
    except TransientError as e:
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
```

---

## Event Loop Health

### Event Loop Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| CPU work inline | `>10ms` synchronous computation freezes all requests | `await loop.run_in_executor(executor, heavy_fn)` |
| Missing `uvloop` | Default asyncio loop is slower for I/O | Set `uvloop` as event loop policy in production |
| `asyncio.get_event_loop()` | Deprecated in Python 3.10+ | Use `asyncio.get_running_loop()` or `asyncio.run()` |
| Thread-unsafe objects in executor | `Session` or `httpx.Client` shared across threads | Create per-thread instances inside the executor function |
| No slow callback monitoring | Long sync operations invisible | Set `loop.slow_callback_duration` for debugging |

### CPU Offloading Pattern

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor

executor = ProcessPoolExecutor(max_workers=4)

async def generate_report(data: dict):
    loop = asyncio.get_running_loop()
    # CPU-bound work runs in separate process — doesn't block event loop
    result = await loop.run_in_executor(executor, build_pdf, data)
    return result
```

---

## Return Format

For each finding, return:
```
Location: <function or endpoint> (file:line)
Issue Type: Blocking Call | Missing Await | Concurrency | Background Task | Event Loop
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Async Fix: <corrected async implementation>
Event Loop Impact: <how this affects concurrent request handling>
```
