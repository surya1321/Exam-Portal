---
name: backend-optimization-review
description: "Perform deep, production-grade backend optimization and code reviews using a multi-agent architecture where specialized sub-agents independently explore their domain in parallel and report findings back to a master orchestrator agent that synthesizes a unified, authoritative optimization report. Primarily focused on Python, FastAPI, SQLAlchemy, and PostgreSQL applications. Use this skill whenever reviewing backend code for performance, database query efficiency, async correctness, API design, security, infrastructure configuration, or production readiness. Trigger on: backend code reviews, FastAPI optimization, SQLAlchemy query audits, PostgreSQL index analysis, async/await correctness reviews, N+1 query detection, connection pool tuning, API design reviews, security audits, production readiness assessments, Pydantic model reviews, Alembic migration reviews, or any task where deep backend analysis is needed — even if the user doesn't explicitly say 'backend review'. Apply this skill even when the user asks to 'check my endpoints', 'review this service', 'optimize my queries', 'why is this slow', 'is this production ready', or 'audit this API'."
---

# Multi-Agent Backend Optimization Review — A Full Backend Engineering Review Board

## Why This Matters

A single reviewer scanning backend code sequentially faces an impossible trade-off: dive deep into query optimization and miss async correctness, or audit security and miss connection pool exhaustion. Real backend performance teams don't work this way — they assign specialists. A database engineer profiles query plans while a security engineer examines trust boundaries while a platform engineer evaluates async health — all simultaneously, all deeply, all independently.

This skill replicates that model. Instead of one agent juggling eight cognitive domains, it deploys **eight dedicated specialist sub-agents** — each with deep focus on their domain — running in parallel and reporting back to a **Master Orchestrator Agent** that consolidates, cross-correlates, and delivers a unified optimization verdict.

> **The most dangerous backend failures span multiple domains simultaneously — a synchronous blocking DB call inside an async endpoint that also lacks connection pooling and has no timeout. Only cross-correlation catches these compound failures.**

---

## Non-Negotiable Backend Standards

These are not suggestions. Every agent enforces these as absolute rules:

| Standard | Rule |
|---|---|
| Blocking calls in async endpoints | 🚫 **Never acceptable** — offload to executor or use async equivalent |
| Raw SQL string formatting | 🚫 **Never acceptable** — use ORM or `text()` with bound params |
| N+1 query patterns | 🚫 **Never acceptable** — use explicit eager loading strategies |
| Unindexed foreign keys | 🚫 **Never acceptable** — every FK must have a supporting index |
| `requests` library in async context | 🚫 **Never acceptable** — use `httpx.AsyncClient` |
| `Base.metadata.create_all()` in production | 🚫 **Never acceptable** — use Alembic migrations |
| Secrets in source code or `.env` committed | 🚫 **Never acceptable** — use secrets manager or CI/CD secrets |
| Bare `except:` swallowing errors | 🚫 **Never acceptable** — all exceptions must be handled and logged |
| Synchronous SQLAlchemy in async FastAPI | 🚫 **Never acceptable** — use `AsyncSession` with `asyncpg` |
| `print()` in production code | 🚫 **Never acceptable** — use structured logging |
| Async SQLAlchemy with `asyncpg` | ✅ **Mandatory** for all async FastAPI applications |
| Pydantic `BaseSettings` for config | ✅ **Mandatory** — no scattered `os.environ.get()` |
| `Depends()` for shared resources | ✅ **Mandatory** — no direct instantiation in route handlers |
| Alembic for all schema changes | ✅ **Mandatory** — no manual schema modifications |
| `pool_pre_ping=True` on engine | ✅ **Mandatory** — all production database engines |
| Stateful process memory (sessions, cache) | 🚫 **Never acceptable** — externalize to Redis for horizontal scaling |
| Direct PG connections at >3 instances | 🚫 **Never acceptable** — use PgBouncer for connection multiplexing |

---

## Multi-Agent Architecture

```
                        ┌──────────────────────────────────┐
                        │       MASTER ORCHESTRATOR         │
                        │             AGENT                 │
                        │                                   │
                        │  - Receives the backend code      │
                        │  - Dispatches to sub-agents       │
                        │  - Collects all findings          │
                        │  - Cross-correlates issues        │
                        │  - Synthesizes final report       │
                        └───────────────┬──────────────────┘
                                        │
   ┌──────────┬──────────┬──────────┬───┼────┬──────────┬──────────┬──────────┐
   │          │          │          │        │          │          │          │
   ▼          ▼          ▼          ▼        ▼          ▼          ▼          ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐
│PERF  │ │  DB &  │ │  API   │ │SECURITY│ │ASYNC │ │  INFRA   │ │PROD  │ │ SCALE &  │
│AGENT │ │  ORM   │ │DESIGN  │ │ AGENT  │ │AGENT │ │  AGENT   │ │READY │ │  LOAD    │
│      │ │ AGENT  │ │ AGENT  │ │        │ │      │ │          │ │AGENT │ │  AGENT   │
└──────┘ └────────┘ └────────┘ └────────┘ └──────┘ └──────────┘ └──────┘ └──────────┘
   │          │          │          │        │          │          │          │
   └──────────┴──────────┴──────────┴───┬────┴──────────┴──────────┴──────────┘
                                        │
                        ┌───────────────▼──────────────┐
                        │      UNIFIED FINAL REPORT     │
                        └──────────────────────────────┘
```

Each sub-agent has a **deep-dive reference file** in the `references/` directory. Read only the relevant agent file(s) when you need the full checklist.

---

## Core Workflow

### Phase 1: Intake & Context Parsing

Before dispatching, the Orchestrator must understand the backend stack:

1. **FastAPI version & mode** — FastAPI version, sync vs. async, ASGI server (uvicorn, gunicorn+uvicorn)
2. **SQLAlchemy version & mode** — 1.x legacy vs. 2.0; `Session` vs. `AsyncSession`; driver (`psycopg2` vs. `asyncpg`)
3. **PostgreSQL version** — Determines available features (CTEs, window functions, JSONB operators, RLS, partitioning)
4. **Pydantic version** — v1 vs. v2 determines validator API, `model_config`, and serialization methods
5. **Background task strategy** — `BackgroundTasks`, Celery, ARQ, or none
6. **Caching layer** — Redis, in-memory, or none
7. **Deployment model** — Docker, Kubernetes, bare metal, serverless
8. **Instance count & scaling strategy** — Single instance, multi-instance, auto-scaled, PgBouncer presence
9. **Create a shared context snapshot** — A brief summary sent to all sub-agents

### Phase 2: Parallel Dispatch

Dispatch the code simultaneously to all eight specialist sub-agents. Each receives:
- The code to review
- The shared context snapshot from Phase 1
- Their domain-specific deep-dive reference file
- Instructions to return structured findings

### Phase 3: Independent Deep-Dive

Each sub-agent explores exclusively within its domain. Read the agent's reference file in `references/` for the full exploration checklist:

| Agent | Reference File | Domain |
|-------|---------------|--------|
| ⚡ Performance Agent | `references/performance-agent.md` | Endpoint latency, serialization, caching strategy, memory utilization |
| 🗄️ DB & ORM Agent | `references/db-orm-agent.md` | N+1 queries, query optimization, async SQLAlchemy, schema design, transactions, connection pools |
| 🔌 API Design Agent | `references/api-design-agent.md` | FastAPI endpoints, Pydantic models, HTTP correctness, OpenAPI, versioning |
| 🔐 Security Agent | `references/security-agent.md` | Auth, injection, data exposure, PostgreSQL security, dependency CVEs |
| ⚙️ Async & Concurrency Agent | `references/async-concurrency-agent.md` | Async correctness, blocking call detection, concurrency patterns, background tasks, event loop health |
| 🏗️ Infrastructure Agent | `references/infrastructure-agent.md` | Configuration, Docker, startup/shutdown, logging, observability, dependency management |
| 🚀 Production Readiness Agent | `references/production-readiness-agent.md` | Error handling, resilience, health checks, rate limiting, testing, migrations, monitoring |
| 🔄 Scalability & Load Agent | `references/scalability-agent.md` | Horizontal scaling, DB scaling, PgBouncer, read replicas, partitioning, worker sizing, backpressure, distributed locking, capacity planning |

### Phase 4: Results Collection

Wait for all sub-agents to return structured findings. Each returns a categorized list with: severity, category, file/line location, description, current pattern, and recommended fix with code.

### Phase 5: Cross-Correlation

This is where the Orchestrator earns its role. Look for:

| Compound Pattern | Agents Involved | Why It's Critical |
|-----------------|----------------|-------------------|
| Sync DB in async endpoint + no pool config | Async + DB + Infra | Event loop blocked, connections exhausted, no health checks |
| N+1 query + missing index + no cache | DB + Performance | DB collapse under real traffic — triple compounding |
| Missing auth + IDOR + no audit log | Security + API + Production | Unauthorized access with no forensic trail |
| No input validation + SQL injection | Security + API | Missing Pydantic model IS the vulnerability |
| No circuit breaker + no retry + no timeout | Production + Async + Infra | Single downstream failure cascades to full outage |
| `print()` in prod + no structured logging + no tracing | Infra + Production | Silent failures with zero operational visibility |
| Missing Alembic + `create_all()` in startup + no health check | Production + DB + Infra | Schema drift, destructive restarts, invisible failures |
| Large sync computation + no background task + no streaming | Performance + Async | Request timeout, worker exhaustion, client disconnection |
| In-memory state + no Redis + multiple instances | Scalability + Infra + Performance | Data inconsistency between instances, cache divergence, session loss on redeploy |
| No PgBouncer + high pool_size + >3 instances | Scalability + DB + Infra | Connection exhaustion crashes PostgreSQL — total service outage |
| No read replica + N+1 queries + no cache | Scalability + DB + Performance | Primary DB collapse under read-heavy traffic at scale |
| Single queue + heavy tasks + no priority | Scalability + Async + Production | Critical tasks starved behind long-running reports |
| No distributed lock + cron jobs + multiple instances | Scalability + Async + Production | Duplicate cron execution, data corruption, race conditions |

**Severity elevation rules:**
- A finding rated Minor by one agent becomes Major if it appears in two agent domains
- A finding in three or more domains is auto-elevated to Blocker
- Agents disagree on severity → the higher-impact assessment wins

### Phase 6: Report Synthesis

Assemble the Unified Final Report using the format below. Prioritize findings by cross-domain impact, then by severity.

### Phase 7: Verdict

Issue the final assessment and prioritized remediation roadmap.

---

## Unified Final Report Format

### 1. Executive Summary
- **Overall Health Score** across all eight dimensions: 🔴 Critical | 🟠 Needs Work | 🟡 Acceptable | 🟢 Healthy
- **Top 3 Critical Findings** — the most impactful cross-domain issues
- **Dimension Scores** — individual rating per agent domain

### 2. Non-Negotiables Violations Table
Every blocking call, N+1 query, raw SQL, missing index, and un-migrated schema change — listed explicitly with replacements. This section is mandatory even if the list is empty (an empty list is a pass).

### 3. Agent Findings Table

| # | Severity | Agent | Category | Location | Description |
|---|----------|-------|----------|----------|-------------|
| 1 | 🔴 Blocker | DB & ORM | N+1 Query | `services/user.py:45` | Lazy-loaded `user.roles` accessed in loop — use `selectinload(User.roles)` |
| 2 | 🔴 Blocker | Async | Blocking Call | `routes/report.py:23` | `requests.get()` inside async endpoint — use `httpx.AsyncClient` |
| 3 | 🟠 Major | Security | Injection | `utils/search.py:67` | `text(f"WHERE name = '{name}'")` — use bound parameters |
| ... | | | | | |

### 4. Compound Issues
Issues flagged by **multiple agents**, elevated with cross-domain impact analysis and a single unified fix recommendation.

### 5. Detailed Findings per Agent
For each agent, provide:
- Full explanation of each finding
- **Before** code (the current pattern)
- **After** code (the production-ready fix)
- Impact description: what improves and by how much (estimated)

### 6. Query Performance Scorecard
Estimated improvement in query time, index usage, and connection pool efficiency for key DB findings:

| Finding | Query Time | Index Usage | Pool Efficiency | Rows Scanned |
|---------|-----------|-------------|-----------------|--------------|
| Add index on `user_id` FK | ⬇️ -80% | ✅ Index Scan | — | ⬇️ -95% |
| Fix N+1 with `selectinload` | ⬇️ -90% | — | ⬇️ -N connections | — |
| ... | | | | |

### 7. Async Health Report
All blocking calls mapped with their async replacements and event loop impact:

| Blocking Call | Location | Async Replacement | Event Loop Impact |
|--------------|----------|-------------------|-------------------|
| `requests.get()` | `api/external.py:34` | `httpx.AsyncClient.get()` | 🔴 Blocks all concurrent requests |
| `time.sleep(5)` | `tasks/retry.py:12` | `await asyncio.sleep(5)` | 🔴 Freezes event loop for 5s |
| ... | | | |

### 8. Scalability Ceiling Report
For each critical path, map the theoretical throughput ceiling and the limiting factor:

| Critical Path | Current Ceiling | Limiting Factor | Fix | New Ceiling |
|--------------|----------------|-----------------|-----|-------------|
| `POST /orders` | 80 req/s | Worker count (8 × 100ms) | Add instances + PgBouncer | 320 req/s |
| `GET /dashboard` | 200 req/s | DB connections (pool=10, no replica) | Read replica + cache | 2000 req/s |
| ... | | | | |

### 9. Passed Checks ✅
Explicitly list what the backend does **well** across all dimensions. Good engineering deserves recognition.

### 10. Remediation Roadmap
1. **Fix immediately** (blockers) — before merge
2. **Fix before deploy** (majors) — before production
3. **Address next sprint** (minors) — schedule soon
4. **Consider** (suggestions) — discuss in architecture reviews

### 11. Final Verdict

| Verdict | Meaning |
|---------|---------|
| 🔴 **Needs Rework** | Non-negotiable violations or critical production failure risks |
| 🟠 **Approve with Changes** | Important issues to fix, but core approach is sound |
| 🟢 **Approved** | Meets production standards across all eight dimensions |

---

## Severity Levels

| Level | Icon | Meaning | Action |
|-------|------|---------|--------|
| **Blocker** | 🔴 | Violates non-negotiable standards, causes data loss, security breach, or production outage risk | Stop the merge |
| **Major** | 🟠 | Significant performance degradation, reliability risk, or maintainability impact under production load | Fix before merge |
| **Minor** | 🟡 | Noticeable improvement opportunity with low immediate risk | Next sprint |
| **Suggestion** | 🔵 | Best practice alignment, future-proofing, or developer experience improvement | Discuss with team |

---

## Guiding Principles

1. **The Orchestrator reviews like a senior backend architect** responsible for the system surviving Black Friday traffic AND a security audit simultaneously.

2. **Each sub-agent reviews like a specialist** who only cares deeply about their domain — thorough, uncompromising, and focused.

3. **Every blocking call in async code is guilty until proven innocent** — the burden of proof is on the developer to justify it.

4. **Every relationship access is a potential N+1** — the ORM Agent assumes the worst until loading strategies are explicit and intentional.

5. **Every DB column without an index strategy is a future outage** — the DB Agent plans for 100x the current data volume.

6. **Every architecture decision must survive 100x scale** — the Scalability Agent evaluates whether the current design requires an architectural rewrite to handle 100x traffic, and flags anything that does.

7. **Never over-engineer** — recommend complexity only when the gain is measurable and justified under realistic production load.

8. **Be specific and actionable** — vague findings from any agent are not acceptable. State what's wrong, where, why, and provide the fix.

9. **Always show before vs. after code** — optimization advice without concrete implementation is insufficient.

10. **The Orchestrator connects findings, not just collects them** — the most dangerous issues compound across async, DB, scalability, and production resilience simultaneously.

---

## Why Multi-Agent Over Single Agent

| Dimension | Single Agent | Multi-Agent |
|---|---|---|
| **Focus depth** | Shallow across all domains | Deep within each domain |
| **Cognitive load** | High — context switching across 8 domains | Low — each agent owns one domain fully |
| **Coverage** | Risk of missing issues due to breadth | Comprehensive — no domain deprioritized |
| **Speed** | Sequential exploration | Parallel exploration |
| **Cross-domain insight** | Accidental | Deliberate via Orchestrator correlation |
| **Reliability** | Single point of missed analysis | Redundancy through specialization |

---

## Quick Self-Check

Before finalizing the report, the Orchestrator asks:

1. **Did every agent return findings?** If an agent found nothing, explicitly state "No issues found in [domain]" — a clean bill of health is valuable information.
2. **Did I check every blocking call?** The async audit must be exhaustive, not sampled.
3. **Did I check every relationship access?** The N+1 audit must cover every ORM query with joined models.
4. **Are there compound issues I missed?** Re-scan findings across agents for overlapping locations or related root causes.
5. **Is every finding specific and actionable?** If a finding says "improve query performance" without a table, column, index, and fix — rewrite it.
6. **Did I credit what the code does well?** The "Passed Checks" section builds trust.
7. **Is the remediation roadmap prioritized?** A flat list of 40 findings is unhelpful. Group by urgency.
8. **Does the final verdict reflect the actual risk?** A single non-negotiable violation = 🔴 Needs Rework, regardless of everything else.
