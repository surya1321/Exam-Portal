---
name: code-review
description: "Perform deep, production-grade code reviews using a multi-agent architecture where specialized sub-agents independently explore their domain in parallel and report findings back to a master orchestrator agent that synthesizes a unified, authoritative review. Use this skill whenever reviewing code for quality, security, performance, architecture, or production readiness. Trigger on: code reviews, pull request reviews, reviewing diffs, auditing code quality, security review, architecture review, pre-merge review, pre-deployment review, reviewing code for production readiness, or any task where deep multi-dimensional code analysis is needed — even if the user doesn't explicitly say 'code review'. Apply this skill even when the user asks to 'check this code', 'review my changes', 'is this safe to deploy', or 'what do you think of this implementation'."
---

# Multi-Agent Code Review — A Full Engineering Review Board, Not a Single Reviewer

## Why This Matters

A single reviewer scanning code sequentially faces an impossible trade-off: go deep in one dimension and miss others, or go broad and catch nothing meaningful. Real engineering review boards don't work this way — they assign specialists. A security engineer examines trust boundaries while an architect evaluates structural integrity while an ops engineer assesses deployment safety — all simultaneously, all deeply, all independently.

This skill replicates that model. Instead of one agent juggling five cognitive domains, it deploys **five dedicated specialist sub-agents** — each with deep focus on their domain — running in parallel and reporting back to a **Master Orchestrator Agent** that consolidates, cross-correlates, and delivers a unified verdict.

The result: review depth and coverage that a single sequential pass cannot match.

> **The most dangerous bugs are the ones that span multiple domains simultaneously — a memory leak that's also a security vulnerability, an architectural shortcut that creates a production blind spot. Only cross-correlation catches these.**

---

## Multi-Agent Architecture

```
                        ┌─────────────────────────────┐
                        │    MASTER ORCHESTRATOR       │
                        │         AGENT                │
                        │                              │
                        │  - Receives the code         │
                        │  - Dispatches to sub-agents  │
                        │  - Collects all findings     │
                        │  - Cross-correlates issues   │
                        │  - Synthesizes final report  │
                        └──────────────┬──────────────┘
                                       │
          ┌──────────────┬─────────────┼─────────────┬──────────────┐
          │              │             │             │              │
          ▼              ▼             ▼             ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │  SECURITY   │ │  MEMORY  │ │  ARCH.   │ │   CODE   │ │  PRODUCTION  │
   │   AGENT     │ │  AGENT   │ │  AGENT   │ │ HYGIENE  │ │  READINESS   │
   │             │ │          │ │          │ │  AGENT   │ │    AGENT     │
   └─────────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘
          │              │             │             │              │
          └──────────────┴─────────────┼─────────────┴──────────────┘
                                       │
                        ┌──────────────▼──────────────┐
                        │      UNIFIED FINAL REPORT    │
                        └─────────────────────────────┘
```

---

## Core Workflow

When this skill is triggered, follow these seven phases in order:

### Phase 1: Intake & Context Parsing

Before dispatching anything, the Orchestrator must understand what it's reviewing:

1. **Identify the language and framework** — TypeScript/React? Python/FastAPI? Go/gRPC? This determines which vulnerability patterns, memory models, and idioms apply.
2. **Identify the system role** — Is this an API gateway? A payment service? A background worker? Different roles have different risk profiles.
3. **Identify the scope** — Is this a single function, a module, or a cross-cutting change? Scope determines the depth of architectural analysis.
4. **Create a shared context snapshot** — A brief summary of language, framework, system role, and scope that all sub-agents receive.

### Phase 2: Parallel Dispatch

Dispatch the code simultaneously to all five specialist sub-agents. Each sub-agent receives:
- The code to review
- The shared context snapshot from Phase 1
- Their domain-specific checklist (detailed below)
- Instructions to return structured findings

### Phase 3: Independent Deep-Dive

Each sub-agent explores exclusively within its domain. The cognitive load isolation is the key advantage — a Security Agent thinking only about trust boundaries will catch things a generalist scanning five dimensions cannot.

### Phase 4: Results Collection

Wait for all sub-agents to return their structured findings. Each returns a categorized list with: severity, category, file/line location, description, and recommended fix.

### Phase 5: Cross-Correlation

This is where the Orchestrator earns its role. Look for:
- **Compound issues** — A memory leak (Memory Agent) that also exposes sensitive data (Security Agent)
- **Cascade risks** — An architectural shortcut (Architecture Agent) that removes a circuit breaker (Production Readiness Agent)
- **Severity elevation** — An issue rated Minor by one agent may become a Blocker when cross-domain impact is considered
- **Deduplication** — Two agents may flag the same root cause from different angles; merge and attribute to both domains
- **Conflict resolution** — If agents disagree on severity, the higher-impact assessment wins

### Phase 6: Report Synthesis

Assemble the Unified Final Report using the format defined below. Prioritize findings by cross-domain impact, then by severity.

### Phase 7: Verdict

Issue the final assessment and a prioritized remediation roadmap.

---

## The Five Specialist Agents

Each agent below operates independently. Read the agent that matches the domain you're analyzing.

---

### 🔐 Security Agent

**Domain:** All security vulnerabilities, threat surfaces, and trust boundary violations.

**Checklist — What to explore in every review:**

| Category | What To Look For |
|----------|-----------------|
| **Injection** | SQL injection, command injection, XSS, XXE, SSRF, template injection, LDAP injection |
| **Authentication** | Hardcoded secrets, weak token handling, missing auth checks, session fixation, credential stuffing vectors |
| **Data Exposure** | Sensitive data in logs, unencrypted storage, exposed stack traces, PII leakage, verbose error messages |
| **Input Validation** | Missing sanitization, trusting user-controlled data, type coercion abuse, deserialization of untrusted data |
| **Dependencies** | Known vulnerable packages (CVEs), outdated libraries, transitive dependency risks |
| **Access Control** | Missing authorization checks, privilege escalation paths, insecure direct object references (IDOR) |
| **Cryptography** | Weak hashing (MD5/SHA1 for passwords), hardcoded keys, improper IV/salt usage, deprecated cipher suites |
| **Architecture** | Missing zero-trust boundaries, overly broad service permissions, missing secrets management, blast radius |

**Knowledge base foundations:**
- OWASP Top 10 and CWE/SANS Top 25 as baseline assessment frameworks
- Zero Trust architecture principles
- Language-specific vulnerability patterns (e.g., prototype pollution in JS, pickle deserialization in Python)
- Secrets management best practices (vault integration, environment variable handling)

**Returns:** Categorized list of security findings with severity, CWE reference, file/line location, and production-ready fix

---

### 🧠 Memory & Resource Agent

**Domain:** Memory leaks, resource exhaustion, and all allocation/deallocation failures.

**Checklist — What to explore in every review:**

| Category | What To Look For |
|----------|-----------------|
| **Variables** | Allocated but never released, unbounded growing collections, uncleared caches |
| **Functions** | Allocating resources (file handles, DB connections, sockets) without guaranteed cleanup |
| **Classes & Objects** | Missing destructors, missing `dispose`/`cleanup` methods, circular references preventing GC |
| **Event Listeners** | Listeners registered but never removed, dangling references in closures |
| **Async & Promises** | Unresolved promises, missing `finally` blocks, fire-and-forget accumulation |
| **Timers** | `setInterval`/`setTimeout` with no corresponding `clearInterval`/`clearTimeout` |
| **DOM References** | Stale DOM references, detached nodes held in memory (where applicable) |
| **Resource Management** | Open DB connections, unclosed file handles/streams/sockets, missing transaction rollbacks, lock acquisition without guaranteed release, uncleaned temp files |

**Knowledge base foundations:**

| Memory Model | Languages | Key Patterns |
|-------------|-----------|-------------|
| Garbage collected | JS, Python, Java, C#, Go | Closures holding references, event listener leaks, unbounded caches |
| Manual | C, C++ | Use-after-free, double-free, buffer overflow, dangling pointers |
| Ownership-based | Rust | Borrow checker violations, lifetime annotation issues |
| ARC | Swift, Obj-C | Retain cycles, weak/unowned reference misuse |
| Resource patterns | All | RAII (C++), try-with-resources (Java), context managers (Python), `defer` (Go) |

**Returns:** Memory and resource findings with allocation site, leak path, and remediation code

---

### 🏛️ Architecture Agent

**Domain:** Structural integrity, system design quality, and long-term architectural health.

**Checklist — What to explore in every review:**

| Category | What To Look For |
|----------|-----------------|
| **Layer Violations** | Business logic in controllers, data access in domain models, presentation concerns bleeding into core logic, cross-domain dependencies |
| **Coupling & Cohesion** | Tight coupling, low cohesion, hidden coupling via global state, circular dependencies |
| **Scalability** | Synchronous bottlenecks, monolithic aggregation points, stateful designs blocking horizontal scale, missing caching layers, unbounded data growth |
| **Distributed Systems** | Missing idempotency, two-phase commit anti-patterns, chatty service communication, distributed monolith patterns, missing circuit breakers/retries/timeouts/bulkheads |
| **Domain Model** | Anemic domain models, domain logic in wrong layer, leaky abstractions, missing aggregate boundaries, primitive obsession |
| **API & Contract Design** | Breaking changes without versioning, chatty APIs, over/under-fetching, missing contract validation, RPC-style thinking in REST |
| **Data Architecture** | Schema design issues, shared database anti-patterns, missing consistency strategies, N+1 queries, missing audit trails |
| **Event-Driven** | Missing dead letter queues, absent event schema versioning, ordering assumptions, missing idempotency keys |
| **Observability** | Missing distributed tracing, no correlation IDs, absent structured logging, missing SLI/SLO metrics |
| **Deployment** | Missing feature flags, deployment coupling, no health check endpoints, non-graceful shutdown, environment hardcoding |

**Knowledge base foundations:**
- Layered, Hexagonal, Clean Architecture patterns
- CQRS, Event Sourcing, Saga patterns
- CAP theorem, BASE vs. ACID, eventual consistency
- 12-Factor App methodology
- OpenTelemetry, REST maturity model, API versioning strategies

**Returns:** Architectural findings mapped to affected system layers, with current vs. recommended design descriptions

---

### 🧹 Code Hygiene Agent

**Domain:** Code quality, maintainability, clarity, edge case handling, and internal design correctness.

**Checklist — What to explore in every review:**

| Category | What To Look For |
|----------|-----------------|
| **Dead Code** | Unused variables, unreachable branches, commented-out code left behind |
| **Duplication** | Duplicated logic that should be extracted and reused |
| **Magic Values** | Magic numbers and strings without named constants |
| **Complexity** | Overly deep nesting, cyclomatic complexity hotspots, functions doing too much |
| **Naming** | Misleading variable/function names that obscure intent |
| **Documentation** | Missing or outdated comments on complex logic |
| **SRP** | Functions doing too much — Single Responsibility violations at the code level |
| **Edge Cases** | null/undefined/none handling, empty input handling, boundary conditions, off-by-one errors |
| **Numeric** | Integer overflow/underflow, floating point precision issues |
| **Concurrency** | Race conditions, deadlocks, thread-safety violations |
| **I/O** | Partial reads/writes, encoding issues |
| **Type Safety** | Type coercion abuse, unsafe casts |
| **Time** | Timezone edge cases, daylight saving time handling, date boundary issues |
| **Test Coverage** | Test coverage gaps on critical paths |

**Knowledge base foundations:**
- SOLID principles (especially SRP at the method level)
- Cyclomatic complexity thresholds (>10 = warning, >20 = refactor)
- Code smell taxonomy (Fowler's catalog)
- Edge case patterns by language
- Test coverage standards for critical paths

**Returns:** Hygiene and edge case findings with file location, code smell category, and refactored example

---

### 🚀 Production Readiness Agent

**Domain:** Operational fitness, reliability, and deployment safety under real-world conditions.

**Checklist — What to explore in every review:**

| Category | What To Look For |
|----------|-----------------|
| **Error Handling** | Exceptions caught and handled gracefully? Errors swallowed silently? Proper error propagation? |
| **Logging** | Sufficient for debugging? Sensitive values (passwords, tokens, PII) being logged? Structured logging? |
| **Observability** | Metrics, traces, health check hooks present where expected? |
| **Configuration** | Environment-specific values externalized vs. hardcoded? |
| **Graceful Degradation** | Downstream failure handling (DB down, API unavailable) without cascading crashes? |
| **Idempotency** | Operations safe to retry? Side effects guarded against duplicate execution? |
| **Rate Limiting** | Protection against abuse or runaway loops? |
| **Scalability** | Blocking calls on main thread, N+1 patterns, missing pagination? |
| **Deployment Safety** | Breaking schema changes, missing migrations, feature flags for risky rollouts? |
| **Resilience** | Circuit breakers, retry with exponential backoff, timeout budgets, fallback strategies? |
| **Graceful Shutdown** | In-flight request draining before process termination? |
| **SLA/SLO Alignment** | Does the code's performance and error handling profile support defined reliability targets? |

**Knowledge base foundations:**
- Circuit breaker, bulkhead, and retry patterns
- Blue-green deployments, canary releases
- RED/USE metrics methodology
- SLI/SLO frameworks
- Graceful shutdown patterns
- Distributed tracing (OpenTelemetry, Jaeger)

**Returns:** Production readiness findings with operational risk level, failure scenario description, and remediation steps

---

## Unified Final Report Format

After all agents return findings and cross-correlation is complete, produce the report in this exact structure:

### 1. Executive Summary

- **Overall Health Score** — A single rating across all five dimensions: 🔴 Critical | 🟠 Needs Work | 🟡 Acceptable | 🟢 Healthy
- **Top 3 Critical Findings** — The most impactful cross-domain issues that require immediate action
- **Dimension Scores** — Individual health rating per agent domain

### 2. Agent Findings Table

A compact table with every finding:

| # | Severity | Agent | Category | Location | Description |
|---|----------|-------|----------|----------|-------------|
| 1 | 🔴 Blocker | Security | Injection | `api/users.ts:42` | Unsanitized user input in SQL query |
| 2 | 🟠 Major | Architecture | Coupling | `services/order.ts` | Direct DB calls in controller layer |
| ... | | | | | |

### 3. Compound Issues

Issues flagged by **multiple agents**, elevated with cross-domain impact analysis:

> **Example:** A memory leak in the connection pool (Memory Agent) combined with missing circuit breaker (Production Readiness Agent) and no retry limit (Architecture Agent) = cascading failure under load that exhausts all available connections.

### 4. Detailed Findings per Agent

For each agent, provide:
- Full explanation of each finding
- **Before** code (the problem)
- **After** code (the production-ready fix or redesign recommendation)
- Impact description at code level, system level, and business level

### 5. Passed Checks ✅

Explicitly list what the code does **well** across all dimensions. Good engineering deserves recognition, and it builds trust in the review.

### 6. Remediation Roadmap

Prioritized fix order:
1. **Fix immediately** (blockers) — What to address before merge
2. **Fix before deploy** (majors) — What to address before production
3. **Address soon** (minors) — What to schedule in the next sprint
4. **Consider** (suggestions) — What to discuss in architecture reviews

### 7. Final Verdict

| Verdict | Meaning |
|---------|---------|
| 🔴 **Needs Rework** | Critical issues that require significant changes before merge |
| 🟠 **Approve with Changes** | Important issues to fix, but the core approach is sound |
| 🟢 **Approved** | Code meets production standards across all dimensions |

---

## Severity Levels

Apply these consistently across all agents:

| Level | Icon | Meaning | Action |
|-------|------|---------|--------|
| **Blocker** | 🔴 | Must fix before merge — poses immediate risk | Stop the merge |
| **Major** | 🟠 | Should fix before merge — significant impact | Fix before merge |
| **Minor** | 🟡 | Address soon — low immediate risk | Schedule for next sprint |
| **Suggestion** | 🔵 | Optional improvement — best practice alignment | Discuss with team |

---

## Cross-Correlation Patterns

The Orchestrator should actively look for these multi-domain compound issues:

| Compound Pattern | Agents Involved | Why It's Dangerous |
|-----------------|----------------|-------------------|
| Memory leak + no monitoring | Memory + Production | Leak goes undetected until OOM crash in production |
| Missing auth check + IDOR + no audit trail | Security + Architecture | Unauthorized access with no forensic trail |
| No input validation + SQL/command injection | Security + Code Hygiene | The missing validation IS the vulnerability |
| Tight coupling + no circuit breaker | Architecture + Production | Single dependency failure cascades to full outage |
| Hardcoded secrets + no secrets management | Security + Architecture | Secrets in source control, no rotation capability |
| No error handling + no logging + no alerts | Code Hygiene + Production | Silent failures in production with zero visibility |
| N+1 queries + no pagination + no caching | Architecture + Production | Database collapse under real traffic |
| Missing cleanup + event listener leak + no memory monitoring | Memory + Production | Gradual performance degradation until restart required |

---

## Guiding Principles

These principles govern how every agent thinks and what the Orchestrator prioritizes:

1. **The Orchestrator reviews like someone on-call at 3 AM AND responsible for the 2-year evolution of this system** — both immediate operational risk and long-term architectural health matter.

2. **Each sub-agent reviews like a specialist who only cares deeply about their domain** — thorough, uncompromising, and focused. No hedging, no "this might be fine."

3. **Distinguish between local code issues and systemic architectural issues** — a fixable-in-the-PR bug gets a code fix; a systemic pattern gets a design conversation recommendation.

4. **Never nitpick style over substance** — every agent prioritizes real-world impact over theoretical purity. A missing semicolon is not a finding. A missing auth check is.

5. **Be specific and actionable** — vague findings like "consider improving error handling" are not acceptable. State what's wrong, where it is, what the risk is, and provide the fix.

6. **Treat every external input as untrusted and every system boundary as a potential failure point** — this is the security and resilience mindset that should permeate all agents.

7. **All recommended fixes must be production-ready** — practical, idiomatic, and architecturally consistent with the codebase. No toy examples.

8. **Always explain *why* something is a risk** — at the code level, system level, and business level when relevant. Engineers make better decisions when they understand the reasoning.

9. **The Orchestrator's job is not just to collect findings but to connect them** — the most dangerous issues are the ones that span multiple domains simultaneously.

---

## Why Multi-Agent Over Single Agent

| Dimension | Single Agent | Multi-Agent |
|-----------|-------------|-------------|
| **Focus depth** | Shallow across all domains | Deep within each domain |
| **Cognitive load** | High — context switching between domains | Low — each agent owns one domain fully |
| **Coverage** | Risk of missing issues due to breadth | Comprehensive — no domain deprioritized |
| **Speed** | Sequential exploration | Parallel exploration |
| **Cross-domain insight** | Accidental | Deliberate via Orchestrator correlation |
| **Reliability** | Single point of missed analysis | Redundancy through specialization |

---

## Quick Self-Check

Before finalizing the report, the Orchestrator asks:

1. **Did every agent return findings?** If an agent found nothing, explicitly state "No issues found in [domain]" — don't silently omit it. A clean bill of health in a domain is valuable information.
2. **Are there compound issues I missed?** Re-scan findings across agents for overlapping locations or related root causes.
3. **Is every finding specific and actionable?** If a finding says "improve error handling" without a code location, specific risk, and fix — rewrite it.
4. **Did I credit what the code does well?** The "Passed Checks" section builds trust and shows the review is balanced, not adversarial.
5. **Is the remediation roadmap prioritized?** A flat list of 20 findings is unhelpful. Group by urgency and sequence dependencies.
6. **Does the final verdict reflect the actual risk?** A single Blocker should not result in 🟢 Approved, even if everything else is perfect.
