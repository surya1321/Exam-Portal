# 🏗️ Infrastructure & Configuration Agent — Deep-Dive Reference

## Domain
Application configuration, environment management, dependency management, containerization, FastAPI startup/shutdown, and observability.

---

## Configuration & Settings Management

### Pydantic BaseSettings — Mandatory Pattern

| Check | Red Flag | Fix |
|-------|----------|-----|
| `os.environ.get()` scattered in code | Config not centralized or validated | Use Pydantic `BaseSettings` |
| Hardcoded values | `timeout=30` in source code | Externalize to settings |
| `.env` in version control | Secrets leaked via git history | Add `.env` to `.gitignore` |
| No startup validation | Invalid config discovered at runtime | Validate at import time |
| No secret rotation | Secrets loaded once with no reload | Use secrets manager with TTL |

### Correct Settings Pattern

```python
from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr

class Settings(BaseSettings):
    database_url: SecretStr
    db_pool_size: int = Field(default=10, ge=5, le=50)
    jwt_secret: SecretStr
    jwt_algorithm: str = "HS256"
    redis_url: str = "redis://localhost:6379"
    external_api_timeout: int = Field(default=10, ge=1, le=60)

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=False,
    )

settings = Settings()  # Fails fast if env vars missing
```

---

## Dependency & Package Management

| Check | Red Flag | Fix |
|-------|----------|-----|
| Unpinned requirements | `fastapi>=0.100` | Pin exact: `fastapi==0.115.6` |
| No lock file | No `poetry.lock` or `pip-compile` output | Generate lock file |
| Dev deps in production | `pytest`, `black` in main requirements | Separate dev requirements |
| Legacy `setup.py` | No `pyproject.toml` | Migrate to `pyproject.toml` |

---

## Containerization & Docker

### Dockerfile Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| Running as root | No `USER` directive | Add `USER appuser` |
| No multi-stage build | Dev tools in prod image | Use builder + slim runtime stages |
| `COPY . .` without `.dockerignore` | `.git`, `.env` in image | Create `.dockerignore` |
| `FROM python:latest` | Non-reproducible builds | Use `python:3.12-slim` |
| No `HEALTHCHECK` | Orchestrator can't check readiness | Add `HEALTHCHECK` |
| Secrets as `ENV` | Baked into image layers | Use runtime injection |

---

## FastAPI Application Startup

### Lifespan Management

| Check | Red Flag | Fix |
|-------|----------|-----|
| `@app.on_event("startup")` | Deprecated | Use `lifespan` context manager |
| No startup validation | DB not verified before traffic | Check deps in lifespan |
| `create_all()` at startup | Destructive in production | Use Alembic exclusively |
| No graceful shutdown | In-flight requests not drained | Handle in lifespan |

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await verify_db_connection()
    app.state.http_client = httpx.AsyncClient(timeout=10)
    yield
    await app.state.http_client.aclose()
    await close_db_pools()

app = FastAPI(lifespan=lifespan)
```

---

## Logging & Observability

| Pattern | Problem | Fix |
|---------|---------|-----|
| `print()` statements | Not captured by log aggregators | Use `structlog` |
| f-string logging | Not parseable | Structured: `logger.info("event", extra={...})` |
| Missing request ID | Can't trace requests | Generate UUID in middleware |
| DEBUG in production | Floods logs, leaks data | Use INFO/WARNING |
| No Prometheus metrics | No request rate/latency data | `prometheus-fastapi-instrumentator` |
| No distributed tracing | Can't trace across services | OpenTelemetry SDK |

---

## Return Format

For each finding, return:
```
Location: <file or configuration>
Issue Type: Configuration | Dependencies | Docker | Startup | Logging | Observability
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what exists now>
Recommended Fix: <corrected configuration or code>
Deployment Impact: <risk to production deployment>
```
