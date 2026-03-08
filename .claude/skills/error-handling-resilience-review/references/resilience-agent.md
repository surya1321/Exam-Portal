# 🛡️ Resilience Agent — Deep-Dive Reference

## Table of Contents

- [Domain](#domain)
- [Retry Logic Assessment](#retry-logic-assessment)
- [Circuit Breaker Assessment](#circuit-breaker-assessment)
- [Timeout Strategy Assessment](#timeout-strategy-assessment)
- [Fallback Strategy Assessment](#fallback-strategy-assessment)
- [Rate Limiting & Backpressure](#rate-limiting--backpressure)
- [Return Format](#return-format)

---

## Domain

Retry logic, circuit breakers, fallback strategies, timeouts, and graceful degradation patterns. Every external dependency is a failure point — this agent ensures the system survives when they fail.

---

## Retry Logic Assessment

### Retry Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No retry on transient failures | External HTTP calls, DB connection errors, queue publish failures fail permanently | Add retry with exponential backoff + jitter |
| Fixed-interval retries | Retrying every N seconds — causes thundering herd | Use `min(cap, base * 2^attempt) + random_jitter` |
| Unlimited retry loops | No max retry count or total timeout budget | Set max attempts AND total timeout budget |
| Retrying non-retryable errors | Retrying 400, 401, 404 — will never succeed | Only retry transient errors (5xx, timeout, connection refused) |
| Missing idempotency on retried writes | Retrying non-idempotent operations (bank transfer, order creation) | Add idempotency key to all retried write operations |
| Missing retry budget | No per-request or per-user retry limits | Implement retry budgets to prevent pool exhaustion |
| No jitter | All instances retry at exactly the same time | Add random jitter to break synchronized retry storms |

### Exponential Backoff with Jitter Pattern

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential_jitter,
    retry_if_exception_type,
    before_sleep_log,
)
import logging

logger = logging.getLogger(__name__)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=30, jitter=5),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def call_external_service(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(SERVICE_URL, json=payload)
        response.raise_for_status()
        return response.json()
```

### Retryable vs. Non-Retryable Decision Matrix

| Error Type | Retryable? | Reason |
|-----------|-----------|--------|
| 408 Request Timeout | ✅ Yes | Server timed out, may succeed on retry |
| 429 Too Many Requests | ✅ Yes | Respect `Retry-After` header |
| 500 Internal Server Error | ✅ Yes (cautiously) | May be transient |
| 502 Bad Gateway | ✅ Yes | Upstream may recover |
| 503 Service Unavailable | ✅ Yes | Temporary overload |
| Connection refused | ✅ Yes | Service may be restarting |
| DNS resolution failure | ✅ Yes (with delay) | DNS may propagate |
| 400 Bad Request | ❌ No | Client error, won't change |
| 401 Unauthorized | ❌ No | Credentials wrong |
| 403 Forbidden | ❌ No | Permission denied |
| 404 Not Found | ❌ No | Resource doesn't exist |
| 409 Conflict | ❌ No | State conflict, needs resolution |
| 422 Unprocessable Entity | ❌ No | Validation failure |

---

## Circuit Breaker Assessment

### Circuit Breaker Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No circuit breaker on external deps | DB, cache, APIs, microservices, message brokers unprotected | Add circuit breaker on every external dependency |
| Default thresholds | Using library defaults for production traffic | Tune thresholds to realistic failure rates and recovery times |
| No circuit breaker metrics | No visibility into state changes, open duration | Export circuit state as metric, alert on state transitions |
| Too-broad scope | Single circuit for entire external service | Per-endpoint or per-operation circuit breakers |
| Sync circuit breaker in async code | Blocking implementation in async context | Use async-compatible circuit breaker |
| No half-open probing | Circuit stays open forever or reopens immediately | Implement half-open state with limited probe requests |

### Circuit Breaker States

```
     ┌──────────┐    failure threshold     ┌──────────┐
     │  CLOSED  │ ───────exceeded────────► │   OPEN   │
     │ (normal) │                          │(failing) │
     └──────────┘                          └──────────┘
          ▲                                      │
          │          ┌──────────────┐             │
          │          │  HALF-OPEN   │  recovery   │
          └──────────│ (probing)    │◄──timeout───┘
        probe        └──────────────┘
       succeeds
```

### Circuit Breaker Pattern

```python
import pybreaker

external_api_breaker = pybreaker.CircuitBreaker(
    fail_max=5,               # Open after 5 failures
    reset_timeout=30,         # Try again after 30 seconds
    exclude=[                 # Don't count these as failures
        httpx.HTTPStatusError,  # 4xx are client errors, not service failures
    ],
)

@external_api_breaker
async def call_external_api(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(API_URL, json=payload)
        response.raise_for_status()
        return response.json()
```

---

## Timeout Strategy Assessment

### Timeout Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No timeout on I/O operations | HTTP calls, DB queries, cache ops with no timeout | Set explicit timeouts on every I/O operation |
| Unrealistic timeout values | 30s timeout on simple DB lookup, 100ms on complex report | Tune timeouts to realistic operation SLAs |
| Missing timeout cascading | Parent timeout longer than sum of child timeouts | Parent timeout must be shorter than child sum |
| Timeout not treated as transient | Timeout exceptions caught as permanent failures | Treat timeouts as retryable transient errors |
| Missing deadline propagation | Top-level timeout not propagated to downstream calls | Pass remaining deadline budget to child operations |

### Timeout Configuration Reference

| Resource | Timeout Type | Pattern |
|----------|-------------|---------|
| HTTP client | Connect + read | `httpx.AsyncClient(timeout=httpx.Timeout(10, connect=5))` |
| DB queries | Statement timeout | `connect_args={"server_settings": {"statement_timeout": "5000"}}` |
| Redis operations | Socket timeout | `aioredis.from_url(url, socket_timeout=5)` |
| Background tasks | Hard timeout | Celery: `task_time_limit=300` |
| gRPC calls | Deadline | `context.set_deadline(datetime.now() + timedelta(seconds=5))` |
| Message processing | Visibility timeout | SQS: `VisibilityTimeout=60` |

### Deadline Propagation Pattern

```python
async def process_order(order_id: str, deadline: float) -> dict:
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError("Deadline exceeded before starting")

    # Propagate remaining budget to each child operation
    user = await get_user(order_id, timeout=min(remaining * 0.3, 5.0))
    remaining = deadline - time.monotonic()

    inventory = await check_inventory(order_id, timeout=min(remaining * 0.5, 5.0))
    remaining = deadline - time.monotonic()

    payment = await process_payment(order_id, timeout=min(remaining, 10.0))
    return {"status": "completed"}
```

---

## Fallback Strategy Assessment

### Fallback Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No fallback responses | Hard failure when a cached/default response would suffice | Return stale data or degraded response on downstream failure |
| Fallback as fragile as primary | Fallback calls the same failing service through different path | Use genuinely independent fallback (cache, static default) |
| No graceful degradation tiers | All-or-nothing — no partial functionality | Define degradation tiers: full → partial → minimal → error |
| Fallbacks hiding real failures | Silently returning empty results | Return degraded response with a degradation indicator |
| Missing bulkheads | All operations sharing same thread/connection pool | Isolate pools per dependency so one slow service can't starve others |

### Graceful Degradation Tiers

```python
async def get_product_recommendations(user_id: str) -> dict:
    # Tier 1: Full functionality — personalized recommendations
    try:
        return await recommendation_engine.get_personalized(user_id, timeout=3.0)
    except (httpx.TimeoutException, pybreaker.CircuitBreakerError):
        logger.warning("recommendation_engine_degraded", user_id=user_id)

    # Tier 2: Partial — popular items (cached)
    try:
        cached = await redis.get("popular_products")
        if cached:
            return {"products": json.loads(cached), "degraded": True, "source": "cache"}
    except Exception:
        logger.warning("redis_cache_unavailable", user_id=user_id)

    # Tier 3: Minimal — static fallback
    return {"products": STATIC_POPULAR_PRODUCTS, "degraded": True, "source": "static"}
```

---

## Rate Limiting & Backpressure

### Outbound Rate Limiting Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No outbound rate limiting | Unlimited calls to rate-limited external APIs | Implement client-side rate limiting before hitting provider limits |
| No backpressure handling | Consuming faster than downstream can handle | Add throttling mechanism based on downstream response times |
| Missing 429 handling | Not respecting `Retry-After` headers | Parse and honor `Retry-After`, implement adaptive backoff |
| No concurrency limits | Unlimited concurrent requests to external APIs | Use semaphore to cap concurrent outbound calls |

### Outbound Rate Limiting Pattern

```python
import asyncio

# Semaphore limits concurrent requests to external API
_external_api_semaphore = asyncio.Semaphore(10)

async def call_rate_limited_api(payload: dict) -> dict:
    async with _external_api_semaphore:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(API_URL, json=payload)
            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning("rate_limited", retry_after=retry_after)
                await asyncio.sleep(retry_after)
                response = await client.post(API_URL, json=payload)
            response.raise_for_status()
            return response.json()
```

---

## Return Format

For each finding, return:
```
Location: <file, function, or dependency>
Issue Type: Retry Logic | Circuit Breaker | Timeout | Fallback | Rate Limiting
Severity: 🔴 | 🟠 | 🟡 | 🔵
Dependency: <the external dependency affected>
Failure Scenario: <what goes wrong when this dependency fails>
Current Pattern: <what exists now>
Missing Pattern: <what resilience pattern is absent>
Remediation: <production-ready fix with code using tenacity, pybreaker, or equivalent>
Blast Radius: <what cascading failures result from this gap>
```
