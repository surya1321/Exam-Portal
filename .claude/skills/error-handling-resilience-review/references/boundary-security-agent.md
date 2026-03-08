# 🔒 Boundary Security Agent — Deep-Dive Reference

## Table of Contents

- [Domain](#domain)
- [Information Leakage Audit](#information-leakage-audit)
- [Environment-Specific Error Detail Control](#environment-specific-error-detail-control)
- [Sensitive Data in Error Context](#sensitive-data-in-error-context)
- [Error Response Normalization](#error-response-normalization)
- [Return Format](#return-format)

---

## Domain

The absolute security wall between user-facing error responses and internal system details. This agent has one job — ensure that no internal information of any kind ever reaches a user-facing error response. Not in development. Not in staging. Not in production. Never.

---

## Information Leakage Audit

### What to Scan For

Scan every error response, exception handler, and error serialization path for leakage of:

| Category | Examples of Leaked Information |
|----------|-------------------------------|
| Stack traces | Line numbers, function call chains, file paths in tracebacks |
| Database details | Query strings, table names, column names, constraint names, ORM error messages |
| Infrastructure | Internal hostnames, IP addresses, ports, file system paths |
| Code internals | Class names, method names, module paths, package versions |
| Environment | Environment names, server identifiers, version strings, feature flag states |
| Cross-user data | User data belonging to other users in error responses |
| Credentials | Authentication tokens, session IDs, API keys (even partial) |
| Configuration | Internal IDs, configuration values, internal service URLs |
| Third-party errors | External service error messages passed through verbatim |

### Common Leakage Patterns

| Pattern | Red Flag | Fix |
|---------|----------|-----|
| Exception pass-through | `return {"error": str(exception)}` | Sanitize: return user-safe message, log full exception |
| Debug mode in production | `DEBUG=True` or `debug=True` active | Enforce `DEBUG=False` in production via environment checks |
| Generic handler without sanitization | `except Exception as e: return {"error": str(e)}` | Use sanitization layer: map exception types to user-safe messages |
| ORM error in response | `IntegrityError` message reaching client | Catch ORM errors, translate to semantic errors ("Email already registered") |
| Framework default errors | FastAPI validation format, Express default HTML, Spring Whitelabel | Replace with custom error handlers |
| HTTP headers leaking stack | `X-Powered-By`, `Server`, `X-AspNet-Version` | Strip technology-revealing headers |

### Exception Pass-Through Audit

```python
# 🚫 NEVER — str(exception) can contain DB errors, file paths, anything
@app.exception_handler(Exception)
async def handle_exception(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},  # ← INFORMATION LEAK
    )

# ✅ CORRECT — sanitized user message, full detail in logs only
@app.exception_handler(Exception)
async def handle_exception(request: Request, exc: Exception):
    request_id = request.state.request_id
    logger.error(
        "unhandled_exception",
        request_id=request_id,
        error_type=type(exc).__name__,
        error_message=str(exc),
        path=request.url.path,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong on our end. We're looking into it.",
                "request_id": request_id,
            }
        },
    )
```

---

## Environment-Specific Error Detail Control

### Environment Control Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| No environment distinction | Same error detail level everywhere | Centralized error serializer with environment awareness |
| `if env == "production"` scattered | Environment checks in individual handlers | Single error middleware enforces the boundary once |
| Same class for user and developer output | No type-level separation | Separate `UserError` (user-safe) from `InternalError` (developer detail) |
| Debug details inferred from environment | Auto-applying verbose errors based on env detection | Explicit config flag, never inferred — require opt-in |

### Environment Error Detail Matrix

| Environment | User Response | Developer Detail | Location of Detail |
|-------------|-------------|-------------------|-------------------|
| **Production** | User-safe message + correlation ID only | Full structured log | Server logs ONLY |
| **Staging** | User-safe message + correlation ID + error code | Full structured log | Server logs ONLY |
| **Development** | Full details acceptable (opt-in via config flag) | Full structured log | Response + logs (if flag enabled) |

### Centralized Error Serializer Pattern

```python
from app.config import settings

class ErrorSerializer:
    """One place that controls what errors look like to users. Period."""

    @staticmethod
    def serialize(
        exc: Exception,
        request_id: str,
        status_code: int = 500,
    ) -> dict:
        # User-safe response — same in ALL environments
        response = {
            "error": {
                "code": ErrorSerializer._get_error_code(exc),
                "message": ErrorSerializer._get_user_message(exc),
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        }

        # Development-only detail — EXPLICIT opt-in, never automatic
        if settings.INCLUDE_ERROR_DETAIL_IN_RESPONSE:
            response["error"]["_debug"] = {
                "type": type(exc).__name__,
                "detail": str(exc),
                "trace": traceback.format_exc(),
            }

        return response

    @staticmethod
    def _get_user_message(exc: Exception) -> str:
        """Map exception types to user-safe messages."""
        if isinstance(exc, ValidationError):
            return "Please check your input and try again."
        if isinstance(exc, AuthenticationError):
            return "Your session has expired. Please sign in again."
        if isinstance(exc, PermissionError):
            return "You don't have permission to perform this action."
        if isinstance(exc, ResourceNotFoundError):
            return "The item you're looking for doesn't exist or has been removed."
        # Default — never expose the real exception message
        return "Something went wrong on our end. We're looking into it."

    @staticmethod
    def _get_error_code(exc: Exception) -> str:
        """Map exception types to machine-readable codes."""
        ERROR_CODE_MAP = {
            ValidationError: "VALIDATION_FAILED",
            AuthenticationError: "AUTHENTICATION_REQUIRED",
            PermissionError: "FORBIDDEN",
            ResourceNotFoundError: "RESOURCE_NOT_FOUND",
            RateLimitError: "RATE_LIMITED",
        }
        return ERROR_CODE_MAP.get(type(exc), "INTERNAL_ERROR")
```

---

## Sensitive Data in Error Context

### PII & Credentials Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| PII in error logs | `logger.error(f"Failed for user {email}")` | Use user_id only: `logger.error("failed", user_id=user_id)` |
| Credentials in error context | Password or token logged on auth failure | Never log credentials — log "auth_failure" event with user_id only |
| Payment data in error context | Card numbers, CVVs in error logs | Never log payment data — use masked references only |
| Request body on validation error | Full request body logged including sensitive fields | Log only non-sensitive fields, or log field names without values |
| Bearer tokens in error logs | `Authorization` header value logged | Strip or mask authentication headers before logging |

### Safe Error Logging Pattern

```python
# 🚫 NEVER — PII and sensitive data in logs
logger.error(f"Payment failed for {user.email}, card ending {card_number[-4:]}: {e}")

# ✅ CORRECT — IDs only, structured, no PII
logger.error(
    "payment_processing_failed",
    user_id=user.id,
    tenant_id=tenant_id,
    payment_method_id=payment_method.id,
    error_type=type(e).__name__,
    request_id=request_id,
    exc_info=True,
)
```

---

## Error Response Normalization

### 500-Level Response Normalization

All 500-level responses must be normalized before leaving the system. A missing route handler, an ORM error, a timeout, and an unhandled exception must all produce the identical sanitized error envelope.

### Normalization Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Framework default error pages | FastAPI default validation JSON, Express HTML, Spring Whitelabel | Replace ALL default error handlers with custom handlers |
| Different 500 shapes | Timeout → different shape than ORM error → different than unhandled | Single exception handler normalizes all 5xx to one shape |
| Technology headers | `X-Powered-By: Express`, `Server: uvicorn` | Strip technology-identifying headers in production |
| Missing CORS on error responses | Error responses missing CORS headers → client can't read the error | Ensure CORS middleware applies to error responses too |

### Complete FastAPI Error Handler Set

```python
@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    """Normalize Pydantic/FastAPI validation errors."""
    return JSONResponse(
        status_code=422,
        content=ErrorSerializer.serialize_validation(exc, request.state.request_id),
    )

@app.exception_handler(HTTPException)
async def http_handler(request: Request, exc: HTTPException):
    """Normalize HTTPException to unified envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorSerializer.serialize(exc, request.state.request_id, exc.status_code),
    )

@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    """Catch-all — NO exception message ever reaches the user."""
    logger.error("unhandled_exception", exc_info=True, request_id=request.state.request_id)
    return JSONResponse(
        status_code=500,
        content=ErrorSerializer.serialize(exc, request.state.request_id, 500),
    )
```

---

## Return Format

For each finding, return:
```
Location: <file, handler, middleware, or response path>
Issue Type: Information Leakage | Environment Control | PII Exposure | Response Normalization
Severity: 🔴 | 🟠 | 🟡 | 🔵
Leakage Path: <exact code path where internal information reaches user response>
What Is Leaked: <specific information exposed — stack trace, DB error, hostname, etc.>
Attack/Disclosure Scenario: <how an attacker or user could exploit or encounter this leak>
Sanitized Replacement: <production-ready sanitized handler code>
OWASP/CWE Reference: <CWE-209, CWE-200, or equivalent>
```
