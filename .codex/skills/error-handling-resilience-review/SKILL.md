---
name: error-handling-resilience-review
description: "Use when reviewing code for error handling quality, resilience patterns, information leakage, retries, circuit breakers, DLQ coverage, observability gaps, or production failure readiness."
---

# Multi-Agent Error Handling & Resilience Review — A Full Reliability Engineering Review Board

## Why This Matters

A single reviewer scanning error handling sequentially faces an impossible trade-off: dive deep into error response contracts and miss circuit breaker gaps, or audit observability and miss silent message loss in async pipelines. Real reliability engineering teams don't work this way — they assign specialists. A contract engineer audits every error response shape while a resilience engineer stress-tests retry strategies while a security engineer scans for information leakage — all simultaneously, all deeply, all independently.

This skill replicates that model. Instead of one agent juggling five cognitive domains, it deploys **five dedicated specialist sub-agents** — each with deep focus on their domain — running in parallel and reporting back to a **Master Orchestrator Agent** that consolidates, cross-correlates, and delivers a unified resilience verdict.

> **The most dangerous error handling failures span multiple domains simultaneously — a missing circuit breaker combined with a swallowed exception combined with a missing DLQ and no alert creates a perfect storm of invisible, unrecoverable failure. Only cross-correlation catches these compound catastrophes.**

---

## The Two-Audience Error Philosophy

This is the core non-negotiable that governs the entire review:

> **Users see clarity. Developers see truth. Systems never expose secrets.**

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERROR OCCURS                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┴────────────────┐
           │                                │
           ▼                                ▼
┌─────────────────────┐          ┌───────────────────────────┐
│   USER RESPONSE     │          │    DEVELOPER LOG / TRACE  │
│                     │          │                           │
│  ✅ Simple message  │          │  ✅ Full stack trace       │
│  ✅ Actionable hint │          │  ✅ Request context        │
│  ✅ Reference ID    │          │  ✅ System state           │
│  ✅ Support path    │          │  ✅ Input parameters       │
│                     │          │  ✅ Retry history          │
│  🚫 No stack trace  │          │  ✅ Correlation ID         │
│  🚫 No DB errors   │          │  ✅ User/tenant ID         │
│  🚫 No internals   │          │  ✅ Structured & queryable │
│  🚫 No tech jargon │          │                           │
└─────────────────────┘          └───────────────────────────┘
           │                                │
           ▼                                ▼
  Seen by: End User                Seen by: Developer / On-Call
  Goal: Clarity & Trust            Goal: Fast Diagnosis & Fix
```

---

## Non-Negotiable Error Handling Standards

These are not suggestions. Every agent enforces these as absolute rules:

| Standard | Rule |
|---|---|
| Stack traces in API responses | 🚫 **Never acceptable** — in any environment, for any user |
| DB error messages in responses | 🚫 **Never acceptable** — sanitize at the handler layer |
| Internal service details in responses | 🚫 **Never acceptable** — hostnames, IPs, ports, paths |
| Silent error swallowing | 🚫 **Never acceptable** — every caught error must be logged |
| Inconsistent error shapes | 🚫 **Never acceptable** — one envelope contract, everywhere |
| Fixed-interval retries | 🚫 **Never acceptable** — exponential backoff with jitter only |
| Missing DLQ on message consumers | 🚫 **Never acceptable** — silent message loss is data loss |
| Missing circuit breakers on dependencies | 🚫 **Never acceptable** — cascading failures are preventable |
| PII in error logs | 🚫 **Never acceptable** — use IDs, never raw personal data |
| Unified error envelope | ✅ **Mandatory** — consistent shape with code, message, request_id |
| Structured error logging | ✅ **Mandatory** — JSON, queryable, correlated to trace |
| Exponential backoff with jitter | ✅ **Mandatory** — all retry logic, all transient failures |
| Circuit breakers on all external deps | ✅ **Mandatory** — database, cache, APIs, message brokers |
| DLQ on all message consumers | ✅ **Mandatory** — with monitoring, alerting, and replay strategy |
| Error tracking in production | ✅ **Mandatory** — Sentry or equivalent capturing full context |

---

## Multi-Agent Architecture

```
                        ┌──────────────────────────────────┐
                        │       MASTER ORCHESTRATOR         │
                        │             AGENT                 │
                        │                                   │
                        │  - Receives the codebase          │
                        │  - Dispatches to sub-agents       │
                        │  - Collects all findings          │
                        │  - Cross-correlates issues        │
                        │  - Synthesizes final report       │
                        └───────────────┬──────────────────┘
                                        │
        ┌──────────────┬────────────────┼────────────────┬──────────────┐
        │              │                │                │              │
        ▼              ▼                ▼                ▼              ▼
┌─────────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐ ┌────────────┐
│   ERROR     │ │  RESILIENCE│ │  BOUNDARY   │ │  ASYNC &   │ │OBSERVABIL- │
│  CONTRACT   │ │    AGENT   │ │  SECURITY   │ │  MESSAGING │ │   ITY      │
│   AGENT     │ │            │ │   AGENT     │ │   AGENT    │ │   AGENT    │
└─────────────┘ └────────────┘ └─────────────┘ └────────────┘ └────────────┘
        │              │                │                │              │
        └──────────────┴────────────────┼────────────────┴──────────────┘
                                        │
                        ┌───────────────▼──────────────┐
                        │      UNIFIED FINAL REPORT     │
                        └──────────────────────────────┘
```

Each sub-agent has a **deep-dive reference file** in the `references/` directory. Read only the relevant agent file(s) when you need the full checklist.

---

## Core Workflow

### Phase 1: Intake & Context Parsing

Before dispatching, the Orchestrator must understand the error handling landscape:

1. **Language & framework** — Python/FastAPI? Java/Spring? Node/Express? This determines which error handling patterns, exception models, and middleware apply.
2. **Error response shape** — Is there a unified error envelope? What does it look like? How many different error shapes exist across the API?
3. **External dependencies** — Which databases, caches, APIs, and message brokers does the code interact with? Each is a failure point.
4. **Message queue systems** — RabbitMQ, SQS, Kafka, Redis Streams? Each has different DLQ and retry semantics.
5. **Error tracking tools** — Sentry, Datadog, Honeybadger? Or nothing?
6. **Logging framework** — structlog, python-json-logger, Winston, Logback? Structured or unstructured?
7. **Async model** — async/await, thread pools, message consumers, background task workers?
8. **Create a shared context snapshot** — A brief summary sent to all sub-agents.

### Phase 2: Parallel Dispatch

Dispatch the code simultaneously to all five specialist sub-agents. Each receives:
- The code to review
- The shared context snapshot from Phase 1
- Their domain-specific deep-dive reference file
- Instructions to return structured findings

### Phase 3: Independent Deep-Dive

Each sub-agent explores exclusively within its domain. Read the agent's reference file in `references/` for the full exploration checklist:

| Agent | Reference File | Domain |
|-------|---------------|--------|
| 📋 Error Contract Agent | `references/error-contract-agent.md` | Error response shapes, user/developer boundary, API error contract, error taxonomy |
| 🛡️ Resilience Agent | `references/resilience-agent.md` | Retry logic, circuit breakers, timeouts, fallbacks, backpressure, bulkheads |
| 🔒 Boundary Security Agent | `references/boundary-security-agent.md` | Information leakage, environment controls, PII in logs, error sanitization |
| 📨 Async & Messaging Agent | `references/async-messaging-agent.md` | DLQ coverage, message retry, idempotency, saga compensation, background tasks |
| 📊 Observability Agent | `references/observability-agent.md` | Error tracking, structured logging, metrics, distributed tracing, alerting, runbooks |

### Phase 4: Results Collection

Wait for all sub-agents to return structured findings. Each returns a categorized list with: severity, category, file/line location, description, current pattern, recommended fix with code, and blast radius.

### Phase 5: Cross-Correlation

This is where the Orchestrator earns its role. Look for:

| Compound Pattern | Agents Involved | Why It's Catastrophic |
|-----------------|----------------|----------------------|
| Missing circuit breaker + swallowed exception + no alert | Resilience + Contract + Observability | External outage causes silent data loss with zero visibility |
| Stack trace in response + no sanitization layer + debug mode | Boundary + Contract + Observability | Internal architecture exposed to attackers |
| No DLQ + no retry on consumer + no message tracking | Async + Resilience + Observability | Messages silently lost with no recovery path |
| Generic 500 + no correlation ID + no structured logging | Contract + Observability + Boundary | User reports error, developers cannot find it |
| No timeout + no circuit breaker + no fallback | Resilience + Contract + Observability | Single slow dependency takes down entire system |
| PII in logs + verbose error response + no env control | Boundary + Observability + Contract | Dual privacy violation — logs AND responses leak user data |
| No retry + no idempotency key + no saga compensation | Resilience + Async + Contract | Partial failures leave system in inconsistent state |
| Missing error tracking + swallowed exceptions + no DLQ alerts | Observability + Contract + Async | Perfect blindness — errors happen, nobody knows |

**Severity elevation rules:**
- A finding rated Minor by one agent becomes Major if it appears in two agent domains
- A finding in three or more domains is auto-elevated to Blocker
- Agents disagree on severity → the higher-impact assessment wins

### Phase 6: Report Synthesis

Assemble the Unified Final Report using the format below. Prioritize findings by cross-domain impact, then by severity.

### Phase 7: Verdict

Issue the final resilience assessment and prioritized remediation roadmap.

---

## Unified Final Report Format

### 1. Executive Summary
- **Overall Resilience Health Score** across all five dimensions: 🔴 Critical | 🟠 Needs Work | 🟡 Acceptable | 🟢 Healthy
- **Top 3 Compound Critical Failures** — the most dangerous cross-domain error handling gaps
- **Dimension Scores** — individual rating per agent domain

### 2. Two-Audience Compliance Report
Full audit of every error response — does it pass the user/developer boundary test? Every endpoint that returns errors must be listed with its current shape and compliance status.

### 3. Non-Negotiables Violations Table
Every information leak, missing DLQ, missing circuit breaker, silent error swallow, and inconsistent error shape — listed explicitly with fixes. Mandatory even if empty (empty = pass).

### 4. Agent Findings Table

| # | Severity | Agent | Category | Location | Description |
|---|----------|-------|----------|----------|-------------|
| 1 | 🔴 Blocker | Boundary | Info Leak | `handlers/error.py:34` | `str(exception)` serialized directly into response — exposes DB errors |
| 2 | 🔴 Blocker | Async | Missing DLQ | `consumers/order.py:12` | No DLQ configured — failed messages silently dropped |
| 3 | 🟠 Major | Resilience | No Circuit Breaker | `services/payment.py:67` | External payment API called with no circuit breaker |
| ... | | | | | |

### 5. Compound Issues
Issues flagged by **multiple agents**, elevated with cross-domain blast radius analysis and a single unified fix recommendation.

### 6. Information Leakage Findings
Every path where internal details can reach a user-facing response, with the exact leak and the sanitized replacement.

### 7. Resilience Gap Map
Every external dependency mapped against its retry strategy, circuit breaker status, timeout configuration, and fallback:

| Dependency | Retry | Circuit Breaker | Timeout | Fallback | Status |
|-----------|-------|----------------|---------|----------|--------|
| PostgreSQL | ✅ Backoff | ❌ Missing | ✅ 5s | ❌ None | 🟠 |
| Redis | ❌ None | ❌ Missing | ❌ None | ❌ None | 🔴 |
| Payment API | ✅ 3x | ✅ pybreaker | ✅ 10s | ✅ Cached | 🟢 |

### 8. DLQ & Async Coverage Report
Every message consumer audited for DLQ configuration, retry policy, idempotency, and monitoring.

### 9. Observability Coverage Report
Every error type mapped against its logging, tracking, metrics, and alerting coverage.

### 10. Detailed Findings per Agent
For each agent: full explanation + **Before** code + **After** code showing the correct error handling pattern.

### 11. Passed Checks ✅
Explicitly list what the error handling does **well** across all dimensions. Good engineering deserves recognition.

### 12. Remediation Roadmap
1. **Fix immediately** (blockers) — information leakage, missing DLQs, missing circuit breakers
2. **Fix before deploy** (majors) — retry strategies, structured logging, error tracking
3. **Address next sprint** (minors) — error message quality, alerting thresholds
4. **Consider** (suggestions) — runbook improvements, observability enhancements

### 13. Final Verdict

| Verdict | Meaning |
|---------|---------|
| 🔴 **Needs Rework** | Information leakage to users, silent data loss, or missing circuit breakers on critical paths |
| 🟠 **Approve with Changes** | Important error handling gaps to fix, but core approach is sound |
| 🟢 **Approved** | Meets production resilience standards across all five dimensions |

---

## Severity Levels

| Level | Icon | Meaning | Action |
|-------|------|---------|--------|
| **Blocker** | 🔴 | Information leakage, silent data loss, missing circuit breakers on critical paths, DLQ absent on production consumers | Stop the merge |
| **Major** | 🟠 | Inconsistent error shapes, missing retry logic, swallowed errors without logging, missing error tracking | Fix before merge |
| **Minor** | 🟡 | Suboptimal error messages, missing structured log fields, alerting thresholds not tuned | Next sprint |
| **Suggestion** | 🔵 | Runbook improvements, error message tone refinement, observability enhancements | Discuss with team |

---

## Guiding Principles

1. **The Orchestrator reviews like an engineer paged at 3am** because a user reported an error with no reference ID, no logs exist, and the circuit breaker was never set up — every gap in this review represents that future incident.

2. **Every error is a conversation** — with the user it must be reassuring and clear, with the developer it must be complete and honest, with the monitoring system it must be structured and actionable.

3. **The information boundary is non-negotiable and absolute** — there is no error type, no environment, no user role, and no debug flag that justifies leaking internal details to a user-facing response.

4. **Silent failures are the most dangerous failures** — an error that is swallowed, dropped, or hidden is worse than one that crashes loudly, because at least a crash is visible.

5. **Resilience is not optional** — every external dependency will fail, every message will occasionally fail to process, every network call will occasionally time out — the question is whether the system handles it gracefully or catastrophically.

6. **Be specific and actionable** — "improve error handling" is not a finding. The exact file, function, error path, and corrected implementation is the minimum acceptable output.

7. **The Orchestrator connects findings, not just collects them** — the most dangerous resilience failures are the ones where a missing circuit breaker, a swallowed exception, a missing DLQ, and a missing alert all exist on the same code path simultaneously.

8. **Always show before vs. after code** — error handling advice without concrete implementation is insufficient.

---

## Why Multi-Agent Over Single Agent

| Dimension | Single Agent | Multi-Agent |
|---|---|---|
| **Focus depth** | Shallow across all domains | Deep within each domain |
| **Cognitive load** | High — context switching across contracts, resilience, security, async, and observability | Low — each agent owns one domain fully |
| **Coverage** | Risk of missing issues due to breadth | Comprehensive — no domain deprioritized |
| **Speed** | Sequential exploration | Parallel exploration |
| **Cross-domain insight** | Accidental | Deliberate via Orchestrator correlation |
| **Reliability** | Single point of missed analysis | Redundancy through specialization |

---

## Quick Self-Check

Before finalizing the report, the Orchestrator asks:

1. **Did every agent return findings?** If an agent found nothing, explicitly state "No issues found in [domain]" — a clean bill of health is valuable information.
2. **Did I audit every error response path?** The two-audience compliance check must be exhaustive, not sampled.
3. **Did I map every external dependency?** The resilience gap map must cover every database, cache, API, and message broker.
4. **Are there compound issues I missed?** Re-scan findings across agents for overlapping locations or related root causes.
5. **Is every finding specific and actionable?** If a finding says "improve error handling" without a file, function, error path, and fix — rewrite it.
6. **Did I credit what the code does well?** The "Passed Checks" section builds trust.
7. **Is the remediation roadmap prioritized?** A flat list of 40 findings is unhelpful. Group by urgency.
8. **Does the final verdict reflect the actual risk?** A single information leakage path = 🔴 Needs Rework, regardless of everything else.
