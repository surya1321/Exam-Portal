# 📊 Observability & Alerting Agent — Deep-Dive Reference

## Table of Contents

- [Domain](#domain)
- [Error Capture & Tracking](#error-capture--tracking)
- [Structured Error Logging](#structured-error-logging)
- [Metrics & Alerting](#metrics--alerting)
- [Distributed Tracing for Errors](#distributed-tracing-for-errors)
- [Runbook & Recovery Documentation](#runbook--recovery-documentation)
- [Return Format](#return-format)

---

## Domain

Error visibility, structured logging, distributed tracing, metrics, and alerting for error conditions. The core principle: **if an error happens and nobody knows, it's worse than a crash** — every error must be captured, structured, correlated, measured, and alerted on.

---

## Error Capture & Tracking

### Error Tracking Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No error tracking integration | No Sentry, Datadog, Honeybadger, or equivalent | Integrate error tracking — unhandled production exceptions must be visible |
| Tracking missing context | Errors tracked without user ID, request ID, environment, release | Configure breadcrumbs, user context, tags, and release tracking |
| Overly aggressive filtering | `before_send` filters suppressing real errors to reduce noise | Review ignore lists — fix noise at the source, don't hide signal |
| No error grouping strategy | Every unique stack frame creates a new issue | Configure fingerprinting rules to group related errors |
| Missing release tracking | No release version attached to errors | Tag every error with the deployment version for regression detection |
| No performance monitoring | Only exceptions tracked, not slow transactions | Enable performance monitoring for latency regression detection |

### Sentry Integration Pattern

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.ENVIRONMENT,
    release=settings.APP_VERSION,
    traces_sample_rate=0.1,  # 10% of transactions
    profiles_sample_rate=0.1,
    integrations=[
        FastApiIntegration(transaction_style="endpoint"),
        SqlalchemyIntegration(),
    ],
    before_send=sanitize_event,  # Strip PII before sending
)

def sanitize_event(event, hint):
    """Remove sensitive data before sending to Sentry."""
    if "request" in event and "headers" in event["request"]:
        headers = event["request"]["headers"]
        # Strip auth headers
        event["request"]["headers"] = {
            k: v for k, v in headers.items()
            if k.lower() not in ("authorization", "cookie", "x-api-key")
        }
    return event
```

### Error Context Enrichment Pattern

```python
# Middleware that enriches Sentry context on every request
@app.middleware("http")
async def sentry_context_middleware(request: Request, call_next):
    with sentry_sdk.configure_scope() as scope:
        scope.set_tag("tenant_id", getattr(request.state, "tenant_id", "unknown"))
        scope.set_tag("request_id", getattr(request.state, "request_id", "unknown"))
        scope.set_user({
            "id": getattr(request.state, "user_id", None),
            # Never send email, name, or PII to error tracking
        })
        scope.set_context("request", {
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params),
        })
    return await call_next(request)
```

---

## Structured Error Logging

### Required Log Fields

All error logs must be structured (JSON or equivalent) with these consistent fields:

| Field Category | Fields | Purpose |
|---------------|--------|---------|
| **Identity** | `timestamp`, `level`, `service`, `environment`, `version`, `host` | Where and when |
| **Error** | `error_type`, `error_code`, `error_message`, `stack_trace` | What happened |
| **Request** | `request_id`, `method`, `path`, `duration_ms` | What was attempted |
| **User** | `user_id`, `tenant_id`, `session_id` (never PII) | Who was affected |
| **Operation** | `operation`, `retry_count`, `is_retryable` | What was tried |
| **Trace** | `trace_id`, `span_id`, `parent_span_id` | Distributed correlation |

### Structured Logging Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Unstructured error logs | `logger.error(f"Error: {e}")` — free text | Use structured logging: `logger.error("operation_failed", error_type=..., exc_info=True)` |
| Missing log correlation | Error logs not linked to request or trace | Thread request_id and trace_id through all log entries |
| Log level misuse | `INFO` for errors, `ERROR` for expected 404s | `WARNING` for client errors, `ERROR` for server errors, `INFO` for expected flows |
| Missing error context propagation | Deep errors logged without entry-point context | Propagate request context via contextvars or middleware |
| Logs not queryable | Cannot filter by error type, user, or tenant | Use structured fields — every field independently queryable |
| Excessive log volume | Logging full request/response bodies | Log metadata only — bodies only at `DEBUG` level with size limits |

### Structured Logging Setup Pattern

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()

# Usage — every log entry is structured and queryable
logger.error(
    "payment_processing_failed",
    user_id=user_id,
    tenant_id=tenant_id,
    request_id=request_id,
    payment_method_id=payment_method.id,
    amount=amount,
    error_type=type(exc).__name__,
    retry_count=attempt,
    is_retryable=True,
    exc_info=True,
)
```

### Context Propagation Pattern

```python
import contextvars
import structlog

# Request context available throughout the call stack
request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id")
tenant_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("tenant_id")
user_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("user_id")

@app.middleware("http")
async def context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request_id_var.set(request_id)

    # Bind to structlog — every log in this request automatically includes these
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        tenant_id=getattr(request.state, "tenant_id", None),
        user_id=getattr(request.state, "user_id", None),
        path=request.url.path,
        method=request.method,
    )

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response
```

---

## Metrics & Alerting

### Error Metrics Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No error rate metrics | No counter for errors by type, endpoint, status code | Add error rate counters with labels for type, endpoint, status |
| No error rate alerting | Error rates spike to 100% with no alert | Alert when error rate exceeds threshold (e.g., >1% of requests) |
| Count-based alerting | Alert when error count > 100 (meaningless without traffic context) | Use rate-based alerting: error_rate = errors / total_requests |
| No p99 latency alerting | High latency precedes error spikes — missed | Alert on p99 latency exceeding SLO threshold |
| No circuit breaker metrics | Circuit breakers open/close invisibly | Export circuit state as metric, alert on state transitions |
| No DLQ depth alerting | DLQ accumulates silently | Alert when DLQ depth exceeds threshold |

### Error Rate Metrics Pattern

```python
from prometheus_client import Counter, Histogram, Gauge

# Error counters — by type, endpoint, and status code
error_counter = Counter(
    "http_errors_total",
    "Total HTTP errors",
    ["method", "endpoint", "status_code", "error_type"],
)

# Request duration histogram — for latency SLO alerting
request_duration = Histogram(
    "http_request_duration_seconds",
    "Request duration in seconds",
    ["method", "endpoint", "status_code"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Circuit breaker state gauge
circuit_state = Gauge(
    "circuit_breaker_state",
    "Circuit breaker state (0=closed, 1=half-open, 2=open)",
    ["dependency"],
)

# DLQ depth gauge
dlq_depth = Gauge(
    "dlq_message_count",
    "Number of messages in dead letter queue",
    ["queue"],
)
```

### Alerting Rules Reference

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High error rate | `rate(http_errors_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01` | 🔴 Critical | Page on-call |
| p99 latency breach | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2.0` | 🟠 Warning | Investigate |
| Circuit breaker open | `circuit_breaker_state > 0` | 🟠 Warning | Check dependency |
| DLQ depth growing | `dlq_message_count > 100` | 🟠 Warning | Investigate failed messages |
| Error tracking budget | `sentry_events_today / sentry_daily_quota > 0.8` | 🟡 Info | Review error volume |
| Zero traffic | `rate(http_requests_total[5m]) == 0` | 🔴 Critical | Service may be down |

---

## Distributed Tracing for Errors

### Tracing Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No trace context on errors | Errors logged without trace_id and span_id | Attach trace context to every error log entry |
| Error spans not marked failed | Exception caught but span shows "success" | Call `span.set_status(ERROR)` when exception occurs |
| Exceptions not attached to spans | Caught exceptions not recorded on the span | Use `span.record_exception(exc)` to attach error detail |
| Trace context lost across async boundaries | Trace ID lost at task queue or message consumer | Propagate trace_id in message headers, restore in consumer |
| No sampling of error traces | Error traces sampled at same rate as success traces | Always capture traces for errored requests (head-based sampling exception) |

### Error Span Pattern

```python
from opentelemetry import trace
from opentelemetry.trace import StatusCode

tracer = trace.get_tracer(__name__)

async def process_order(order_id: str) -> dict:
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        try:
            result = await payment_service.charge(order_id)
            span.set_status(StatusCode.OK)
            return result
        except PaymentError as e:
            span.set_status(StatusCode.ERROR, str(e))
            span.record_exception(e)
            span.set_attribute("error.type", type(e).__name__)
            span.set_attribute("error.retryable", e.is_retryable)
            raise
```

### Trace Context Propagation Across Async Boundaries

```python
from opentelemetry.context import attach, detach
from opentelemetry.trace.propagation import get_current_span
from opentelemetry.propagate import inject, extract

# Producer — inject trace context into message headers
def publish_with_trace(topic: str, payload: dict):
    headers = {}
    inject(headers)  # Injects traceparent, tracestate into headers
    message_broker.publish(
        topic=topic,
        payload=payload,
        headers=headers,
    )

# Consumer — restore trace context from message headers
async def consume_with_trace(message):
    context = extract(message.headers)
    token = attach(context)
    try:
        with tracer.start_as_current_span("consume_message") as span:
            span.set_attribute("messaging.queue", message.queue)
            await process_message(message.payload)
    finally:
        detach(token)
```

---

## Runbook & Recovery Documentation

### Runbook Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Error codes with no runbook | Machine-readable codes defined but no documentation | Create runbook entry for every error code |
| Known errors with no resolution path | Same error encountered repeatedly with no documented fix | Document resolution procedure and link from error tracking |
| Errors with no owner | Error types with no responsible team | Assign ownership for every error domain |
| No severity classification in runbooks | All errors treated equally | Classify: P1 (page immediately), P2 (business hours), P3 (next sprint) |
| No escalation path | Unclear who to contact when on-call can't resolve | Document escalation chain per error domain |

### Runbook Entry Template

```markdown
## ERROR_CODE: PAYMENT_GATEWAY_TIMEOUT

**Severity:** P2 — Business Hours
**Owner:** Payments Team (#payments-oncall)
**Error Message (user):** "We couldn't process your payment right now. Please try again in a few minutes."

### What Happened
The payment gateway did not respond within the configured timeout (10 seconds).

### Likely Causes
1. Payment gateway experiencing high latency or outage
2. Network connectivity issue between our service and the gateway
3. Request payload too large (batch payments)

### Diagnosis Steps
1. Check payment gateway status page: https://status.paymentgateway.com
2. Check circuit breaker state: `circuit_breaker_state{dependency="payment_gateway"}`
3. Check p99 latency: `histogram_quantile(0.99, rate(payment_duration_seconds_bucket[5m]))`
4. Check error rate spike time correlation with gateway incidents

### Resolution
1. If gateway outage → wait for recovery, circuit breaker will auto-recover
2. If network issue → check VPC peering, security groups, DNS resolution
3. If persistent → increase timeout from 10s to 15s (temporary), investigate root cause

### Escalation
- 30 min unresolved → Payments Team Lead
- 1 hour unresolved → VP Engineering
```

---

## Return Format

For each finding, return:
```
Location: <file, integration, or configuration>
Issue Type: Error Tracking | Structured Logging | Metrics | Alerting | Distributed Tracing | Runbook
Severity: 🔴 | 🟠 | 🟡 | 🔵
Visibility Gap: <what errors or conditions are invisible to operators>
Missing Metric/Alert: <the specific metric or alert definition that should exist>
Impact on Incident Response: <how this gap delays or prevents diagnosis and resolution>
Remediation: <production-ready implementation with appropriate monitoring stack>
Monitoring Stack: <Sentry, Prometheus, OpenTelemetry, structlog, or equivalent>
```
