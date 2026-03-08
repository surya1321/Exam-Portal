# 📋 Error Contract Agent — Deep-Dive Reference

## Table of Contents

- [Domain](#domain)
- [Unified Error Envelope Compliance](#unified-error-envelope-compliance)
- [User-Facing Error Message Quality](#user-facing-error-message-quality)
- [Developer-Facing Error Context Quality](#developer-facing-error-context-quality)
- [Error Classification System](#error-classification-system)
- [Validation Error Handling](#validation-error-handling)
- [Return Format](#return-format)

---

## Domain

Error response shape consistency, the user/developer information boundary, and the API error contract.

**Core Mandate:** Users and developers are two entirely different audiences. Every error in the system must be designed with both in mind simultaneously — and the wall between what each sees must be absolute.

---

## Unified Error Envelope Compliance

### Shape Audit

Audit every error response in the codebase for shape consistency. Flag any endpoint returning a different error structure.

All error responses must conform to a single envelope contract:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The item you're looking for doesn't exist or has been removed.",
    "request_id": "req_01HX7K9MZPQR4VTNW8YCBF3GD",
    "timestamp": "2026-03-04T10:22:31Z"
  }
}
```

### Envelope Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Missing `request_id` | Users cannot report errors, developers cannot find them | Add correlation ID to every error response |
| Missing `code` field | Clients cannot programmatically handle errors | Add machine-readable error code (e.g., `VALIDATION_FAILED`, `RATE_LIMITED`) |
| Missing `timestamp` | Cannot correlate user reports to log entries by time | Add ISO 8601 timestamp to every error response |
| Inconsistent HTTP status codes | Same error → different status codes across endpoints | Standardize status code mapping per error type |
| Mixed error shapes | Some endpoints return `{"error": ...}`, others `{"detail": ...}` | Enforce one envelope shape via middleware/exception handler |
| Human-only messages | No machine-readable code, only a message string | Add stable `code` that clients can switch on |

---

## User-Facing Error Message Quality

### Good vs. Bad User Messages

| Quality | Example | Why |
|---------|---------|-----|
| ✅ Good | "Your session has expired. Please sign in again." | Clear, actionable, no internals |
| ✅ Good | "We couldn't process your payment. Please check your card details and try again." | Specific guidance, no technical detail |
| ✅ Good | "Something went wrong on our end. We're looking into it. Reference: req_01HX7K" | Honest, provides reference for support |
| 🚫 Bad | "IntegrityError: duplicate key value violates unique constraint users_email_key" | DB error leaked to user |
| 🚫 Bad | "Connection to 10.0.1.45:5432 refused" | Internal infrastructure exposed |
| 🚫 Bad | "NullPointerException at com.service.UserService.findById(UserService.java:142)" | Stack trace leaked |
| 🚫 Bad | "Internal Server Error" | No guidance, no reference, no actionability |
| 🚫 Bad | "Invalid input" | No indication of what was invalid or how to fix it |

### Message Quality Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Technical jargon in user messages | Error messages written for developers in user responses | Rewrite with plain language, actionable guidance |
| Overly vague messages | "An error occurred" with no reference ID or action | Add reference ID and suggested next step |
| Blame-shifting messages | "Invalid input" with no specifics | Identify which input, why it's invalid, how to fix |
| Missing localization support | Hardcoded English in multi-locale apps | Use error codes mapped to locale-specific message catalogs |
| Inconsistent tone | Mix of formal/informal/technical across endpoints | Define and enforce a voice and tone guide for errors |

---

## Developer-Facing Error Context Quality

### Required Context in Every Error Log

Every caught error must produce a structured log entry containing:

| Field | Description | Example |
|-------|-------------|---------|
| **What** | Error type, message, full stack trace | `IntegrityError: duplicate key on users.email` |
| **Why** | Triggering input, failing condition, system state | `User registration with email already in DB` |
| **Where** | File, function, line, service | `services/user.py:create_user:45` |
| **When** | Precise timestamp with timezone | `2026-03-04T10:22:31.456Z` |
| **Who** | User ID, session ID, tenant ID, request ID (never raw PII) | `user_id=usr_123, tenant_id=t_456, request_id=req_789` |
| **What was tried** | Operation attempted, parameters (sanitized), retry count | `POST /api/users, attempt 2 of 3` |
| **What happened next** | Recovered? Retried? DLQ? Alerted? | `Sent to DLQ after 3 attempts, alert triggered` |

### Developer Context Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Context-free logs | `logger.error("Something went wrong")` | Add exception object, request context, structured fields |
| Unstructured log strings | `f"Error processing {user_id}: {e}"` | Use structured logging: `logger.error("processing_failed", user_id=user_id, exc_info=True)` |
| Missing exception chaining | `raise NewException("failed")` without `from` | Use `raise NewException("failed") from original_exception` |
| Missing correlation | Logs not linked to request/trace ID | Thread correlation ID through the entire call stack |
| Raw PII in logs | Email, name, phone in error context | Use user_id, tenant_id — never raw personal data |

---

## Error Classification System

### Error Taxonomy Audit

Assess whether the codebase has a clear, enforced error taxonomy:

| Category | HTTP Range | Description | Client Action |
|----------|-----------|-------------|---------------|
| **Client Errors** | 4xx | Validation, auth, not found, conflict, rate limit | Client can fix these |
| **Server Errors** | 5xx | Infrastructure, unhandled, dependency outage | Server must fix these |
| **Transient Errors** | Varies | Network timeout, temporary unavailability | Safe to retry |
| **Permanent Errors** | Varies | Invalid data, constraint violation, business rule | Retrying will not help |

### Classification Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Flat exception hierarchy | Single `Exception` or `Error` class for everything | Create semantic error type hierarchy: `ValidationError`, `AuthError`, `ExternalServiceError` |
| 4xx logged as 5xx severity | Validation error logged as `ERROR` | Log client errors at `WARNING`, server errors at `ERROR` |
| 5xx disguised as 4xx | Server failure returned as 400 | Return accurate status codes — server failures are 5xx |
| Missing retryable distinction | No indication if error is transient | Add `is_retryable` field to error types or use `Retry-After` header |
| No error code registry | Error codes invented ad-hoc per endpoint | Maintain a centralized error code registry with documentation |

---

## Validation Error Handling

### Validation Response Quality

| Check | Red Flag | Fix |
|-------|----------|-----|
| Generic "Validation failed" | No field-level detail | Return per-field errors: `{"field": "email", "message": "Must be a valid email address"}` |
| Inconsistent validation shapes | Pydantic, custom, ORM constraints return different formats | Normalize all validation errors through a single serializer |
| Schema exposure | "Field 'internal_user_id' is required" | Only expose public field names in validation responses |
| Missing error distinction | Same message for "required" and "format" errors | "name is required" vs. "name must be between 2 and 50 characters" |

### Validation Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please fix the following issues and try again.",
    "request_id": "req_01HX7K9MZPQR4VTNW8YCBF3GD",
    "timestamp": "2026-03-04T10:22:31Z",
    "details": [
      {"field": "email", "code": "INVALID_FORMAT", "message": "Must be a valid email address."},
      {"field": "name", "code": "TOO_SHORT", "message": "Must be at least 2 characters."}
    ]
  }
}
```

---

## Return Format

For each finding, return:
```
Location: <endpoint, handler, or middleware>
Issue Type: Envelope Compliance | User Message Quality | Developer Context | Error Taxonomy | Validation
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Error Shape: <what the endpoint currently returns on error>
Violation: <what's wrong — missing field, leaked detail, inconsistent shape>
User Impact: <what the end user experiences>
Developer Impact: <what the developer loses — correlation, searchability, context>
Corrected Implementation: <production-ready error response and handler code>
```
