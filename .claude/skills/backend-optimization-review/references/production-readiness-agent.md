# 🚀 Production Readiness Agent — Deep-Dive Reference

## Domain
Operational fitness, resilience, reliability, and deployment safety under real-world production conditions.

---

## Error Handling & Resilience

### Error Handling Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| Bare `except:` | Swallows all exceptions silently | Catch specific exceptions, log, re-raise or handle |
| `except Exception:` without logging | Errors hidden from operators | Log with context, then handle |
| No FastAPI exception handlers | Unhandled exceptions → raw 500 | Register `@app.exception_handler()` |
| Missing circuit breaker | External service failures cascade | Use `tenacity` or `pybreaker` |
| No retry with backoff | Transient failures not retried | `tenacity.retry(wait=wait_exponential())` |
| No timeout on external calls | One slow service exhausts connections | Set explicit timeouts on httpx, DB, Redis |
| No fallback on failure | Hard failure when dependency is down | Return cached/default data on downstream failure |

### Circuit Breaker Pattern

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
    reraise=True,
)
async def call_external_api(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.post(EXTERNAL_URL, json=payload)
        response.raise_for_status()
        return response.json()
```

### Timeout Configuration Checklist

| Resource | Timeout Required | Pattern |
|----------|-----------------|---------|
| httpx client | Request + connect timeout | `httpx.AsyncClient(timeout=httpx.Timeout(10, connect=5))` |
| DB queries | Statement timeout | `connect_args={"server_settings": {"statement_timeout": "5000"}}` |
| Redis operations | Socket timeout | `aioredis.from_url(url, socket_timeout=5)` |
| Background tasks | Task hard timeout | Celery: `task_time_limit=300` |

---

## Health Checks & Readiness

### Required Endpoints

| Endpoint | Purpose | What It Checks |
|----------|---------|----------------|
| `GET /health` | Liveness probe | App process is running |
| `GET /ready` | Readiness probe | DB, Redis, and critical dependencies reachable |
| `GET /metrics` | Prometheus scraping | Request rate, error rate, latency histograms |

### Health Check Implementation

```python
@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.get("/ready")
async def readiness_check(session: AsyncSession = Depends(get_session)):
    checks = {}
    try:
        await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unreachable"

    try:
        await redis.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "unreachable"

    all_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if all_ok else 503,
        content={"status": "ready" if all_ok else "not_ready", "checks": checks},
    )
```

---

## Database Production Readiness

### Migration Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| `create_all()` in production | Destructive, no version control | Use Alembic exclusively |
| No Alembic migrations | Schema changes applied manually | Initialize Alembic, create migration history |
| No rollback scripts | Forward-only migrations | Write and test `downgrade()` for every migration |
| No startup DB retry | App crashes if DB not ready yet | Retry connection with backoff in lifespan |
| Blocking migrations | `ALTER TABLE ... ADD COLUMN NOT NULL` on large table | Use `ADD COLUMN ... DEFAULT` or multi-step migration |

### DB Connection Retry on Startup

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(5), wait=wait_exponential(min=1, max=30))
async def verify_db_connection():
    async with async_engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    logger.info("Database connection verified")
```

---

## Rate Limiting & Protection

| Check | Red Flag | Fix |
|-------|----------|-----|
| No rate limiting | Auth endpoints unprotected | Use `slowapi` middleware |
| No request size limits | Susceptible to large payload DoS | Configure max body size |
| No timeout middleware | Requests run indefinitely | Add request timeout middleware |
| Wildcard CORS | `allow_origins=["*"]` in production | Restrict to known domains |
| No request throttling | Resource-intensive endpoints unprotected | Add per-endpoint rate limits |

### Rate Limiting Pattern

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest):
    ...
```

---

## Testing & Quality Gates

### Testing Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| No async test setup | `unittest.TestCase` for async code | Use `pytest-asyncio` |
| Testing functions directly | Calling route functions, not HTTP layer | Use `httpx.AsyncClient` with `ASGITransport` |
| No integration tests | Only unit tests — no DB/HTTP verification | Add tests with real DB transactions |
| Hardcoded test data | Brittle fixtures | Use `factory_boy` or `polyfactory` |
| No CI pipeline | No automated tests on every commit | Set up CI with test + lint + type check |
| Missing critical path tests | Auth, payment, data mutation untested | Prioritize tests on critical business flows |

### Async Test Pattern

```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post("/api/v1/users", json={
        "email": "test@example.com",
        "name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
```

---

## Observability in Production

| Check | Red Flag | Fix |
|-------|----------|-----|
| No error tracking | Unhandled exceptions invisible | Integrate Sentry |
| No slow query logging | Slow queries hidden | Set PostgreSQL `log_min_duration_statement` |
| No APM | No latency regression detection | DataDog, New Relic, or OpenTelemetry |
| No alerting on SLO breach | Error rate spikes unnoticed | Wire p95 latency and error rate alerts |

---

## Return Format

For each finding, return:
```
Location: <file, endpoint, or configuration>
Issue Type: Error Handling | Health Check | Migration | Rate Limiting | Testing | Observability
Severity: 🔴 | 🟠 | 🟡 | 🔵
Failure Scenario: <what goes wrong in production>
Current Pattern: <what exists now>
Remediation: <production-ready fix with code>
Operational Risk: <impact on availability, reliability, recoverability>
```
