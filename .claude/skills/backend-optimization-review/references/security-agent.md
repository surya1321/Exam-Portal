# 🔐 Security Agent — Deep-Dive Reference

## Domain
All security vulnerabilities, authentication, authorization, and trust boundary violations specific to FastAPI/Python/PostgreSQL.

---

## Authentication & Authorization

### Authentication Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| Unprotected endpoints | Route accessible without `Depends(get_current_user)` | Add auth dependency to all protected routes |
| JWT `alg: none` | Library accepts `alg: none` tokens | Enforce algorithm: `jwt.decode(token, key, algorithms=["HS256"])` |
| Missing expiry validation | Token accepted after expiry | Validate `exp` claim and reject expired tokens |
| Missing issuer/audience | Any JWT accepted regardless of source | Validate `iss` and `aud` claims |
| No token invalidation | Logout doesn't invalidate token | Implement short TTL + refresh tokens, or token blacklist |
| Token in URL | JWT passed as query parameter | Tokens in headers only — URLs are logged |
| Hardcoded secrets | `SECRET_KEY = "my-secret"` in source | Use env vars via Pydantic `BaseSettings` |
| Timing attack on comparison | `if token == stored_token:` | Use `hmac.compare_digest(token, stored_token)` |

### Authorization Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| Missing ownership checks | User A can access User B's resources | Add `WHERE user_id = current_user.id` to all queries |
| Missing role validation | Any authenticated user can access admin endpoints | Add role-based `Depends()` guard |
| IDOR vulnerability | `/api/users/{id}` accessible by changing `id` | Verify ownership in service layer, not just authentication |
| Missing tenant isolation | Multi-tenant app without tenant scoping | Always filter by `org_id` from JWT context |
| Duplicated auth logic | Auth checks copy-pasted across endpoints | Centralize in reusable `Depends()` |

### Secure Auth Dependency Pattern

```python
# ✅ Centralized, reusable auth dependency
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub", "iss"]},
        )
    except JWTError as e:
        raise HTTPException(401, "Invalid token") from e

    user = await session.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(401, "User not found or inactive")
    return user

# Role-based guard
def require_role(role: str):
    async def check_role(user: User = Depends(get_current_user)):
        if role not in user.roles:
            raise HTTPException(403, "Insufficient permissions")
        return user
    return check_role
```

---

## Injection Vulnerabilities

### SQL Injection — Zero Tolerance

| Pattern | Severity | Example |
|---------|----------|---------|
| f-string in SQL | 🔴 Blocker | `text(f"SELECT * FROM users WHERE id = {user_id}")` |
| `.format()` in SQL | 🔴 Blocker | `text("SELECT * WHERE name = '{}'".format(name))` |
| `%` formatting in SQL | 🔴 Blocker | `text("SELECT * WHERE id = %s" % user_id)` |
| String concat in SQL | 🔴 Blocker | `text("SELECT * WHERE name = '" + name + "'")` |

**Every instance is a Blocker, no exceptions.**

```python
# ❌ CRITICAL: SQL injection
query = text(f"SELECT * FROM users WHERE name = '{name}'")

# ✅ Parameterized query
query = text("SELECT * FROM users WHERE name = :name").bindparams(name=name)

# ✅ Better: Use ORM
result = await session.execute(select(User).where(User.name == name))
```

### Other Injection Types

| Type | What To Flag | Fix |
|------|-------------|-----|
| Command injection | `subprocess.run(user_input)`, `os.system(cmd)` | Use `subprocess.run([cmd, arg], shell=False)` with allowlist |
| SSRF | `httpx.get(user_provided_url)` | Validate URL against allowlist of domains |
| Path traversal | `open(f"uploads/{filename}")` | Normalize path, verify it stays within allowed directory |
| Template injection | `template.render(user_content)` without escaping | Auto-escape enabled, sanitize all user content |

---

## Input Validation & Data Trust

### Beyond Pydantic Validation

| Check | What To Flag | Fix |
|-------|-------------|-----|
| HTML in text fields | User-submitted HTML stored and rendered | HTML sanitize or strip tags before storage |
| Mass assignment | `Model(**request.model_dump())` accepting all fields | Explicitly map only allowed fields |
| File upload without validation | No MIME check, no size limit | Validate MIME type, enforce max size, scan for malware |
| Missing rate limiting | Auth endpoints, password reset without limits | Add `slowapi` rate limiter |
| No request size limits | No max body size configured | Configure in uvicorn/nginx: `--limit-max-field-size` |

### Mass Assignment Prevention

```python
# ❌ Before: All request fields applied to model — mass assignment risk
user = User(**payload.model_dump())  # What if payload contains is_admin=True?

# ✅ After: Explicitly map allowed fields
user = User(
    email=payload.email,
    name=payload.name,
    # is_admin NOT mapped — even if present in payload
)
```

---

## Data Exposure

### Sensitive Data Audit

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Passwords in logs | `logger.info(f"Login: {email}, {password}")` | Never log credentials — log only `email` |
| Tokens in logs | `logger.debug(f"Token: {token}")` | Log token prefix only: `token[:8]...` |
| PII in error responses | Stack trace with user data returned to client | Return generic error message, log full details server-side |
| Full model in response | ORM model with `password_hash` returned | Use response-specific Pydantic model |
| Internal details in errors | `{"error": str(e)}` exposing SQL or stack trace | Sanitize: `{"error": "Internal server error"}` |
| Missing HTTPS | No HTTP → HTTPS redirect, no HSTS headers | Enforce HTTPS redirect, add `Strict-Transport-Security` |

---

## PostgreSQL-Specific Security

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Superuser connection | App connects as `postgres` | Create least-privilege role: `GRANT SELECT, INSERT, UPDATE, DELETE ON ...` |
| Missing RLS | Multi-tenant schema without row-level security | Enable RLS policies for tenant isolation at DB level |
| Missing column encryption | Sensitive columns stored in plaintext | Use `pgcrypto` for column-level encryption |
| Overly permissive grants | `GRANT ALL ON ALL TABLES` | Grant minimum required permissions per role |

---

## Dependency Security

| Check | What To Flag | Fix |
|-------|-------------|-----|
| Known CVEs | Packages with published vulnerabilities | Run `pip-audit` and upgrade affected packages |
| No vulnerability scanning | No `pip-audit` or `safety` in CI | Add `pip-audit` to CI pipeline |
| Unpinned dependencies | `fastapi>=0.100` in requirements | Pin exact versions: `fastapi==0.115.6` |
| No lock file | No `poetry.lock` or `pip-compile` output | Generate lock file for reproducible builds |
| `python-jose` vs `PyJWT` | `python-jose` has had security issues | Evaluate current CVE status and consider alternatives |

---

## Return Format

For each finding, return:
```
Location: <file:line or endpoint>
Issue Type: Auth | Injection | Data Exposure | Input Validation | PostgreSQL | Dependencies
Severity: 🔴 | 🟠 | 🟡 | 🔵
CWE Reference: <CWE-XXX where applicable>
Attack Scenario: <how this could be exploited>
Current Pattern: <vulnerable code>
Secure Fix: <production-ready remediation with code>
```
