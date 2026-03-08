# 📨 Async & Messaging Error Agent — Deep-Dive Reference

## Table of Contents

- [Domain](#domain)
- [Dead Letter Queue Assessment](#dead-letter-queue-assessment)
- [Message Processing Error Patterns](#message-processing-error-patterns)
- [Background Task Error Handling](#background-task-error-handling)
- [Distributed Transaction Error Handling](#distributed-transaction-error-handling)
- [Return Format](#return-format)

---

## Domain

Error handling in async operations, message queues, background tasks, event-driven systems, and distributed workflows. The core principle: **silent message loss is data loss** — every message that fails processing must be accounted for, logged, and recoverable.

---

## Dead Letter Queue Assessment

### Zero Tolerance for Silent Message Loss

Every message consumer in the codebase must have a configured DLQ. This is non-negotiable.

### DLQ Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No DLQ configured | Failed messages silently dropped | Configure DLQ on every queue/topic with failed message routing |
| DLQ missing context | DLQ receives message but no failure reason | Include original message, failure reason, attempt count, timestamps, consumer ID |
| DLQ not monitored | DLQ fills up silently with no alerts | Add DLQ depth as a monitored metric with alerting thresholds |
| No reprocessing strategy | DLQ messages accumulate with no remediation plan | Define process: investigate, fix root cause, replay with dead letter replay tooling |
| Replay without root cause fix | DLQ messages replayed before fixing the bug | Enforce root cause resolution before any DLQ replay |
| No DLQ retention policy | Messages accumulate forever or expire silently | Set retention aligned with business SLAs, alert before expiry |

### DLQ Configuration by Platform

| Platform | DLQ Configuration | Key Settings |
|----------|-------------------|-------------|
| **RabbitMQ** | `x-dead-letter-exchange` + `x-dead-letter-routing-key` | Max retries via `x-delivery-count`, per-queue DLQ binding |
| **AWS SQS** | `RedrivePolicy` with `deadLetterTargetArn` | `maxReceiveCount` controls retry threshold |
| **Kafka** | Dedicated `.DLQ` topic + custom error handler | `DeadLetterPublishingRecoverer` in Spring, manual in others |
| **Redis Streams** | Manual DLQ via pending entries list (`XPENDING`) | Claim and route messages exceeding delivery count |
| **Celery** | `task_reject_on_worker_lost=True` + `acks_late=True` | Custom `on_failure` handler routes to DLQ |

### DLQ Pattern — RabbitMQ Example

```python
# Queue declaration with DLQ routing
channel.queue_declare(
    queue="orders",
    arguments={
        "x-dead-letter-exchange": "dlx",
        "x-dead-letter-routing-key": "orders.dlq",
        "x-message-ttl": 86400000,  # 24h before DLQ
    },
)

# DLQ consumer for monitoring and alerting
async def process_dlq_message(message: IncomingMessage):
    logger.error(
        "message_in_dlq",
        queue="orders",
        message_id=message.message_id,
        original_routing_key=message.headers.get("x-first-death-queue"),
        death_reason=message.headers.get("x-first-death-reason"),
        death_count=len(message.headers.get("x-death", [])),
        body_preview=message.body[:200],
    )
    # Alert operations team
    await alert_service.send(
        severity="warning",
        title="Message in DLQ",
        detail=f"Queue: orders, ID: {message.message_id}",
    )
```

---

## Message Processing Error Patterns

### Consumer Error Handling Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No retry on consumer failure | Message fails processing → immediately acked and lost | Configure retry with backoff before routing to DLQ |
| Infinite retry on poison pill | Malformed message retried indefinitely | Set max delivery count, route to DLQ after threshold |
| No idempotency | At-least-once delivery → duplicate side effects | Use idempotency key (message ID + deduplication window) |
| Partial processing without compensation | Multi-step handler partially completes then fails | Implement atomic processing or compensation/rollback logic |
| No schema validation at consumption | Schema drift causes silent failures or corrupt data | Validate message schema at consumption boundary |
| Ack before processing | Message acknowledged before work completes | Ack after successful processing only (`acks_late=True`) |

### Idempotent Consumer Pattern

```python
class IdempotentConsumer:
    """Ensures each message is processed exactly once."""

    def __init__(self, redis: Redis, dedup_window_seconds: int = 3600):
        self.redis = redis
        self.dedup_window = dedup_window_seconds

    async def process_if_new(
        self, message_id: str, handler: Callable, payload: dict
    ) -> bool:
        # Atomically check-and-set the idempotency key
        dedup_key = f"msg:processed:{message_id}"
        was_set = await self.redis.set(
            dedup_key, "1", nx=True, ex=self.dedup_window
        )

        if not was_set:
            logger.info("duplicate_message_skipped", message_id=message_id)
            return False  # Already processed

        try:
            await handler(payload)
            return True
        except Exception:
            # Processing failed — remove dedup key so retry can attempt again
            await self.redis.delete(dedup_key)
            raise
```

### Message Schema Validation Pattern

```python
from pydantic import BaseModel, ValidationError

class OrderMessage(BaseModel):
    order_id: str
    user_id: str
    total_amount: float
    items: list[dict]

async def consume_order(raw_message: bytes) -> None:
    try:
        message = OrderMessage.model_validate_json(raw_message)
    except ValidationError as e:
        logger.error(
            "message_schema_validation_failed",
            error=str(e),
            raw_body=raw_message[:500],  # Truncated for safety
        )
        # Route to DLQ — schema errors are permanent, retrying won't help
        await route_to_dlq(raw_message, reason="schema_validation_failed")
        return

    await process_order(message)
```

---

## Background Task Error Handling

### Background Task Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No error handling in tasks | Unhandled exception → task silently fails | Wrap all tasks in try/except with structured logging |
| No task result monitoring | Fire-and-forget with no success/failure tracking | Track task outcomes with metrics: success, failure, timeout |
| Cascading task failures | Failed task triggers further failures with no isolation | Add circuit breaker or failure isolation between task chains |
| No task timeout | Tasks run indefinitely, consuming worker slots | Set hard timeout: Celery `task_time_limit`, asyncio `wait_for` |
| No task retry configuration | Failed tasks never retried | Configure retry with exponential backoff and max attempts |
| Missing task dead letter | Failed tasks exceeding max retries vanish | Route permanently failed tasks to a dead letter storage |

### Resilient Background Task Pattern

```python
from celery import Task

class BaseTaskWithErrorHandling(Task):
    """Base task with comprehensive error handling."""
    autoretry_for = (ConnectionError, TimeoutError)
    retry_backoff = True
    retry_backoff_max = 600
    retry_jitter = True
    max_retries = 3
    acks_late = True
    reject_on_worker_lost = True
    time_limit = 300  # Hard kill after 5 minutes
    soft_time_limit = 270  # Soft warning at 4.5 minutes

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(
            "task_permanently_failed",
            task_name=self.name,
            task_id=task_id,
            error_type=type(exc).__name__,
            error_message=str(exc),
            retry_count=self.request.retries,
            args=str(args)[:200],
            exc_info=True,
        )
        # Route to dead letter storage for investigation
        dead_letter_store.save(
            task_name=self.name,
            task_id=task_id,
            args=args,
            kwargs=kwargs,
            exception=str(exc),
            traceback=str(einfo),
        )

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning(
            "task_retrying",
            task_name=self.name,
            task_id=task_id,
            attempt=self.request.retries + 1,
            max_retries=self.max_retries,
            error_type=type(exc).__name__,
        )
```

---

## Distributed Transaction Error Handling

### Distributed Transaction Audit Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No saga compensation | Multi-step workflow fails mid-way, no rollback | Implement saga with compensation actions for each step |
| Two-phase commit without rollback | Distributed operations partially commit | Ensure guaranteed rollback path on any step failure |
| Missing outbox pattern | DB write + message publish not atomic | Use transactional outbox: write to DB, poll outbox, publish |
| Event sourcing without error events | No error/compensation events in event stream | Define error event types — failures must be visible in event history |
| No distributed trace context | Operations across services not correlated | Propagate trace ID and span ID across all service boundaries |

### Saga Pattern with Compensation

```python
class OrderSaga:
    """Orchestrates order creation with compensation on failure."""

    async def execute(self, order: Order) -> SagaResult:
        compensations: list[Callable] = []

        try:
            # Step 1: Reserve inventory
            reservation = await inventory_service.reserve(order.items)
            compensations.append(
                lambda: inventory_service.release(reservation.id)
            )

            # Step 2: Process payment
            payment = await payment_service.charge(order.user_id, order.total)
            compensations.append(
                lambda: payment_service.refund(payment.id)
            )

            # Step 3: Create shipment
            shipment = await shipping_service.create(order, reservation)
            compensations.append(
                lambda: shipping_service.cancel(shipment.id)
            )

            return SagaResult(status="completed", order_id=order.id)

        except Exception as e:
            logger.error("saga_step_failed", order_id=order.id, exc_info=True)
            # Compensate in reverse order
            for compensate in reversed(compensations):
                try:
                    await compensate()
                except Exception as comp_error:
                    logger.error(
                        "saga_compensation_failed",
                        order_id=order.id,
                        compensation=compensate.__name__,
                        error=str(comp_error),
                    )
                    # Alert — manual intervention required
                    await alert_service.critical(
                        f"Saga compensation failed for order {order.id}"
                    )

            return SagaResult(status="failed", order_id=order.id, error=str(e))
```

### Transactional Outbox Pattern

```python
async def create_order_with_outbox(
    session: AsyncSession, order_data: dict
) -> Order:
    """Atomic DB write + message publish via outbox."""
    async with session.begin():
        # Step 1: Write the order to DB
        order = Order(**order_data)
        session.add(order)

        # Step 2: Write the event to outbox table (same transaction)
        outbox_entry = OutboxMessage(
            topic="orders.created",
            key=str(order.id),
            payload=order.to_event_dict(),
            created_at=datetime.utcnow(),
        )
        session.add(outbox_entry)
        # Both committed atomically — no message loss possible

    return order

# Separate poller publishes outbox messages to the broker
async def outbox_poller():
    while True:
        async with get_session() as session:
            pending = await session.execute(
                select(OutboxMessage)
                .where(OutboxMessage.published_at.is_(None))
                .order_by(OutboxMessage.created_at)
                .limit(100)
            )
            for entry in pending.scalars():
                try:
                    await message_broker.publish(
                        topic=entry.topic, key=entry.key, payload=entry.payload
                    )
                    entry.published_at = datetime.utcnow()
                except Exception:
                    logger.error("outbox_publish_failed", entry_id=entry.id)
                    break  # Preserve ordering
            await session.commit()
        await asyncio.sleep(1)
```

---

## Return Format

For each finding, return:
```
Location: <file, consumer, task, or workflow>
Issue Type: DLQ Coverage | Message Retry | Idempotency | Saga Compensation | Background Task | Schema Validation
Severity: 🔴 | 🟠 | 🟡 | 🔵
Queue/Topic: <the queue, topic, or task affected>
Failure Scenario: <what goes wrong — message loss, duplicate processing, inconsistent state>
Data Loss Risk: <quantified — how many messages/events could be lost per hour/day>
Current Pattern: <what exists now>
Remediation: <production-ready fix with DLQ, retry, idempotency, or saga pattern>
Recovery Path: <how to recover from the failure after it occurs>
```
