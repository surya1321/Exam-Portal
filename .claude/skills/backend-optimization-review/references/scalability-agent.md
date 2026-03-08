# 🔄 Scalability & Load Engineering Agent — Deep-Dive Reference

## Domain
Horizontal and vertical scaling readiness, database scaling patterns, connection math, worker scaling, backpressure, distributed systems patterns, and capacity planning.

## Core Mandate
Production systems must be designed to handle **100x current load without architectural rewrites**. Every design decision is evaluated against its scaling ceiling. Stateful services that prevent horizontal scaling are **never acceptable** in production.

---

## Table of Contents

1. [Horizontal Scaling Readiness](#horizontal-scaling-readiness)
   - Stateless Service Verification (8 stateful patterns)
   - Stateless Architecture Checklist
   - Deployment Scaling Checks
2. [Database Scaling](#database-scaling)
   - Connection Math — The Most Common Scaling Bottleneck
   - PgBouncer — External Connection Pooling
   - Read Replicas & Write/Read Splitting
   - Table Partitioning
3. [Worker & Task Queue Scaling](#worker--task-queue-scaling)
   - Celery/ARQ Worker Sizing (6 settings)
   - Queue Architecture at Scale
   - Queue Saturation Monitoring
4. [Backpressure & Load Shedding](#backpressure--load-shedding)
   - Backpressure Mechanisms (6 mechanisms)
   - Graceful Degradation Under Load
5. [Distributed Systems Patterns](#distributed-systems-patterns)
   - Distributed Locking
   - Event-Driven Decoupling
   - CQRS Pattern for Read/Write Separation
6. [Capacity Planning](#capacity-planning)
   - Load Testing Recommendations
   - Scaling Ceiling Identification
   - Connection Budget Planning
7. [Return Format](#return-format)

---

## Horizontal Scaling Readiness

### Stateless Service Verification

A service **cannot scale horizontally** if it holds state in process memory. Flag every instance:

| Stateful Pattern | Problem | Stateless Fix |
|-----------------|---------|---------------|
| In-memory session storage | Sessions lost on restart/scale | Store in Redis: `aioredis` with TTL |
| In-memory cache (`dict`) | Each instance has different cache | Centralize in Redis |
| `global` mutable state | Shared state across requests breaks on multiple instances | Move to Redis or DB |
| File-based storage | Local filesystem not shared across instances | Use object storage (S3/GCS) or shared volume |
| `functools.lru_cache` on mutable data | Each instance caches independently, stale reads | Redis-backed cache for shared data |
| WebSocket connections on single instance | Can't route messages across instances | Use Redis Pub/Sub or dedicated WebSocket gateway |
| Background task results in memory | Lost on restart, invisible to other instances | Use Celery result backend (Redis/DB) |
| Thread-local state | Breaks with multiple workers/instances | Use `contextvars` or request-scoped dependencies |

### Stateless Architecture Checklist

```python
# ❌ Before: Stateful — cannot scale horizontally
# In-memory cache shared across requests
_user_cache = {}

async def get_user(user_id: int) -> User:
    if user_id not in _user_cache:
        _user_cache[user_id] = await db_get_user(user_id)
    return _user_cache[user_id]

# ✅ After: Stateless — Redis-backed, scales to N instances
async def get_user(user_id: int, redis: Redis = Depends(get_redis)) -> User:
    cached = await redis.get(f"user:{user_id}")
    if cached:
        return User.model_validate_json(cached)
    user = await db_get_user(user_id)
    await redis.setex(f"user:{user_id}", 300, user.model_dump_json())
    return user
```

### Deployment Scaling Checks

| Check | Red Flag | Fix |
|-------|----------|-----|
| Sticky sessions required | Load balancer must route to same instance | Eliminate session affinity — externalize state |
| Single-instance deployment | No redundancy, single point of failure | Minimum 2 instances behind load balancer |
| No auto-scaling configuration | Fixed instance count regardless of load | Configure HPA (Kubernetes) or auto-scaling group |
| No load balancer health checks | Traffic routed to unhealthy instances | Configure active health checks on `/ready` |
| Deployment causes downtime | All instances restart simultaneously | Rolling deployment with `maxUnavailable: 0` |

---

## Database Scaling

### Connection Math — The Most Common Scaling Bottleneck

**The formula every backend engineer must know:**

```
Total connections = num_instances × workers_per_instance × pool_size_per_worker
PostgreSQL max_connections default = 100

Example failure:
  3 instances × 4 workers × pool_size=20 = 240 connections needed
  PostgreSQL max_connections = 100
  ❌ Connection exhaustion under normal load!
```

Flag any deployment where `total_connections > max_connections`.

| Deployment Config | Connection Count | Solution |
|-------------------|-----------------|----------|
| 2 instances × 2 workers × pool=10 | 40 | ✅ Within default 100 |
| 3 instances × 4 workers × pool=20 | 240 | ❌ Use PgBouncer |
| 5 instances × 4 workers × pool=10 | 200 | ❌ Use PgBouncer |
| 10 instances × 2 workers × pool=5 | 100 | ⚠️ At limit — PgBouncer recommended |

### PgBouncer — External Connection Pooling

Flag any deployment with >3 application instances connecting directly to PostgreSQL without PgBouncer:

| Check | Red Flag | Fix |
|-------|----------|-----|
| App connects directly to PG | Connection count scales with app instances | Add PgBouncer between app and PG |
| No PgBouncer pool mode set | Wrong mode for workload | `transaction` mode for FastAPI (releases conn after each transaction) |
| PgBouncer in `session` mode | Connections held for entire client session | Use `transaction` mode for connection multiplexing |
| No PgBouncer `max_client_conn` | Unlimited client connections | Set based on expected instance count |
| Missing `server_pool_size` | Default may be too low | Set to PostgreSQL `max_connections - reserved` |

```ini
# ✅ PgBouncer configuration for FastAPI + asyncpg
[databases]
mydb = host=pg-primary.internal port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction          # Release after each transaction
max_client_conn = 400            # Handle up to 400 app connections
default_pool_size = 50           # 50 actual PG connections
reserve_pool_size = 10           # Extra connections for burst
server_idle_timeout = 60         # Recycle idle server connections
```

### Read Replicas & Write/Read Splitting

Flag applications where **all queries (including reads) hit the primary database**:

| Pattern | Problem | Fix |
|---------|---------|-----|
| All queries to primary | Primary handles both reads and writes | Route reads to replica |
| No read replica | Single DB for all traffic | Add streaming replica for read scaling |
| Read-after-write to replica | Replication lag causes stale reads | Read from primary for recently written data |
| Analytics on primary | Heavy reports compete with OLTP queries | Run analytics on dedicated replica |

```python
# ✅ Write/Read splitting with SQLAlchemy
from sqlalchemy.ext.asyncio import create_async_engine

write_engine = create_async_engine("postgresql+asyncpg://primary:5432/db")
read_engine = create_async_engine("postgresql+asyncpg://replica:5432/db")

async def get_write_session() -> AsyncSession:
    async with AsyncSession(write_engine) as session:
        yield session

async def get_read_session() -> AsyncSession:
    async with AsyncSession(read_engine) as session:
        yield session

# Routes use the appropriate session
@router.get("/users/{user_id}")
async def get_user(user_id: int, session: AsyncSession = Depends(get_read_session)):
    ...

@router.post("/users")
async def create_user(payload: UserCreate, session: AsyncSession = Depends(get_write_session)):
    ...
```

### Table Partitioning

Flag tables that will grow unbounded (logs, events, audit trails, time-series data):

| Pattern | When To Partition | Strategy |
|---------|------------------|----------|
| Time-series data (logs, events) | >10M rows or >1GB table size | Range partition by `created_at` (monthly/weekly) |
| Multi-tenant data | Large tenant disparities | List partition by `tenant_id` |
| Status-based queries | 95% of queries on `active` records | List partition by `status` |
| High-cardinality lookups | Queries on specific subset of large table | Hash partition for even distribution |

```python
# ✅ Range-partitioned table in SQLAlchemy + Alembic
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(BigInteger, primary_key=True)
    created_at = Column(DateTime, nullable=False)
    action = Column(String, nullable=False)
    payload = Column(JSONB)

    __table_args__ = {
        "postgresql_partition_by": "RANGE (created_at)",
    }

# In Alembic migration — create partitions
op.execute("""
    CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
    CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
""")
```

---

## Worker & Task Queue Scaling

### Celery/ARQ Worker Sizing

| Setting | Default | Scaling Recommendation | Why |
|---------|---------|----------------------|-----|
| `concurrency` | CPU count | I/O-bound: 2–4× CPU, CPU-bound: CPU count | I/O workers spend time waiting |
| `prefetch_multiplier` | 4 | Set to 1 for long tasks | Prevents one worker hoarding all tasks |
| `task_acks_late` | `False` | Set to `True` for critical tasks | Task re-queued if worker crashes mid-execution |
| `worker_max_tasks_per_child` | None | Set to 1000 for memory-leaky tasks | Recycles worker after N tasks |
| `task_time_limit` | None | **Always set** | Prevents zombie tasks holding resources forever |
| `task_soft_time_limit` | None | Set slightly below `task_time_limit` | Allows graceful cleanup before hard kill |

### Queue Architecture at Scale

```
# ❌ Before: Single queue — all tasks compete
celery_app.conf.task_default_queue = "default"

# ✅ After: Priority queues by task type
celery_app.conf.task_routes = {
    "tasks.send_email": {"queue": "notifications"},
    "tasks.generate_report": {"queue": "heavy"},
    "tasks.process_webhook": {"queue": "webhooks"},
    "tasks.audit_log": {"queue": "low-priority"},
}
# Run separate workers per queue with appropriate concurrency:
# celery -A app worker -Q notifications -c 4
# celery -A app worker -Q heavy -c 2 --max-tasks-per-child=100
# celery -A app worker -Q webhooks -c 8
```

### Queue Saturation Monitoring

| Metric | Alert Threshold | Indicates |
|--------|----------------|-----------|
| Queue depth | >1000 pending tasks | Producers outpacing consumers — add workers |
| Task latency (queue wait) | >30s for urgent tasks | Workers saturated or stuck |
| Task failure rate | >5% | Bug or downstream failure — investigate |
| Worker memory | >80% of limit | Memory leak — enable `max_tasks_per_child` |
| Active task count vs concurrency | At max for >5 min | All workers busy — scale horizontally |

---

## Backpressure & Load Shedding

### Backpressure Mechanisms

Flag systems that accept unlimited work without shedding under overload:

| Mechanism | Implementation | Purpose |
|-----------|---------------|---------|
| **Request rate limiting** | `slowapi` per-endpoint | Reject excess requests early |
| **Connection pool timeout** | `pool_timeout=5` | Fail fast when DB is overwhelmed |
| **Queue max length** | `task_reject_on_worker_lost=True` | Don't queue more than workers can handle |
| **Circuit breaker** | `tenacity` or `pybreaker` | Stop calling failing downstream |
| **HTTP 429/503 responses** | Rate limit middleware | Tell clients to back off |
| **Request timeout** | Uvicorn `--timeout-keep-alive` | Kill long-running requests |

### Graceful Degradation Under Load

```python
# ✅ Graceful degradation — serve cached/degraded response when DB is overloaded
async def get_dashboard(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    redis: Redis = Depends(get_redis),
):
    # Try fresh data first
    try:
        data = await asyncio.wait_for(
            fetch_dashboard_data(session, user_id),
            timeout=2.0,
        )
        await redis.setex(f"dashboard:{user_id}", 60, data.model_dump_json())
        return data
    except (asyncio.TimeoutError, DBError):
        # Fallback to cached data
        cached = await redis.get(f"dashboard:{user_id}")
        if cached:
            logger.warning("serving_cached_dashboard", user_id=user_id)
            return DashboardResponse.model_validate_json(cached)
        raise HTTPException(503, "Service temporarily unavailable")
```

---

## Distributed Systems Patterns

### Distributed Locking

Flag shared resources accessed from multiple instances without coordination:

| Pattern | Problem | Fix |
|---------|---------|-----|
| No distributed lock on cron jobs | Multiple instances run same cron simultaneously | Redis lock: `SET key NX EX 30` |
| File-based locks | Only works on single instance | Redis-based distributed lock |
| No lock timeout | Dead instance holds lock forever | Always set lock expiry (TTL) |
| Lock without retry | Fails immediately if lock held | Retry with backoff, or skip gracefully |

```python
# ✅ Redis distributed lock for cron/scheduled tasks
import redis.asyncio as redis

async def acquire_lock(redis_client: redis.Redis, lock_name: str, ttl: int = 30) -> bool:
    return await redis_client.set(f"lock:{lock_name}", "1", nx=True, ex=ttl)

async def release_lock(redis_client: redis.Redis, lock_name: str):
    await redis_client.delete(f"lock:{lock_name}")

# Usage in scheduler
async def run_daily_cleanup():
    if not await acquire_lock(redis, "daily_cleanup", ttl=600):
        logger.info("cleanup_skipped", reason="another instance holds lock")
        return
    try:
        await perform_cleanup()
    finally:
        await release_lock(redis, "daily_cleanup")
```

### Event-Driven Decoupling

Flag synchronous service-to-service calls that create tight coupling:

| Pattern | Problem | Fix |
|---------|---------|-----|
| Sync HTTP call to trigger downstream | Caller waits for downstream, fails if it's down | Publish event to queue, downstream processes async |
| Direct DB access across service boundaries | Schema coupling, no independent scaling | API calls or event-driven communication |
| Shared database between services | Cannot scale or deploy independently | Database-per-service with events for synchronization |

### CQRS Pattern for Read/Write Separation

Flag systems where read and write paths have fundamentally different scaling needs:

```python
# ✅ CQRS: Separate command (write) and query (read) paths

# Command side — writes to primary, publishes event
class OrderCommandService:
    async def create_order(self, payload: OrderCreate) -> Order:
        async with self.write_session.begin():
            order = Order(**payload.model_dump())
            self.write_session.add(order)
        await self.event_bus.publish("order.created", order.id)
        return order

# Query side — reads from replica or denormalized view
class OrderQueryService:
    async def get_order_summary(self, order_id: int) -> OrderSummary:
        return await self.read_session.execute(
            select(OrderSummaryView).where(OrderSummaryView.id == order_id)
        )
```

---

## Capacity Planning

### Load Testing Recommendations

| Scenario | Tool | What to Measure |
|----------|------|-----------------|
| Single endpoint throughput | `locust` or `k6` | Max RPS before p95 > 500ms |
| Sustained load | `k6` with ramp-up | Connection pool exhaustion, memory growth |
| Spike testing | `k6` with sudden burst | Queue depth, error rate, recovery time |
| Soak testing | `k6` over 24h | Memory leaks, connection leaks, log volume |

### Scaling Ceiling Identification

For each critical endpoint, calculate the theoretical maximum throughput:

```
Throughput ceiling = min(
    DB connections available / avg query duration,
    Worker count × (1 / avg response time),
    External API rate limit / calls per request,
    Redis connections / avg cache operations per request,
)

Example:
  DB: 50 connections / 50ms avg = 1000 req/s
  Workers: 8 workers × (1 / 100ms) = 80 req/s  ← BOTTLENECK
  Redis: 100 conns / 2ms = 50,000 req/s
  
  System ceiling = 80 req/s (limited by worker count)
  Fix: Add more workers or optimize response time
```

### Connection Budget Planning

| Component | Budget Calculation |
|-----------|-------------------|
| PostgreSQL `max_connections` | `(instances × workers × pool_size) + PgBouncer overhead + superuser reserve` |
| Redis `maxclients` | `(instances × workers × redis_pool_size) + Celery workers + monitoring` |
| External API rate limits | `(instances × workers × reqs_per_second) < API rate limit` |

---

## Return Format

For each finding, return:
```
Location: <service, configuration, or architecture pattern>
Issue Type: Stateful Service | DB Scaling | Worker Scaling | Backpressure | Distributed | Capacity
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Ceiling: <max throughput or connection limit before failure>
Scaling Fix: <architectural change with code/config>
Scale Impact: <new ceiling after fix, or scaling factor improvement>
```
