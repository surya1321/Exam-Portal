# 🔌 API Design Agent — Deep-Dive Reference

## Domain
FastAPI endpoint design, request/response contracts, routing architecture, HTTP correctness, Pydantic model quality, and OpenAPI documentation.

---

## FastAPI Endpoint Design

### Thin Route Handlers

Flag route handlers that contain business logic directly. Route functions should be thin orchestrators:

```python
# ❌ Before: Business logic in route handler
@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    payload: OrderCreate,
    session: AsyncSession = Depends(get_session),
):
    # Validation, DB queries, business rules, notifications — all inline
    user = await session.get(User, payload.user_id)
    if not user:
        raise HTTPException(404)
    if user.balance < payload.total:
        raise HTTPException(400, "Insufficient balance")
    order = Order(**payload.model_dump())
    user.balance -= payload.total
    session.add(order)
    await session.commit()
    await send_confirmation_email(user.email, order.id)  # blocking side effect!
    return order

# ✅ After: Route handler delegates to service layer
@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    payload: OrderCreate,
    order_service: OrderService = Depends(get_order_service),
):
    return await order_service.create_order(payload)
```

### Dependency Injection Checklist

| Resource | Correct Pattern | Red Flag |
|----------|----------------|----------|
| DB session | `session: AsyncSession = Depends(get_session)` | `session = AsyncSession(engine)` inline |
| Auth context | `current_user: User = Depends(get_current_user)` | Manual JWT decode in every handler |
| Config/settings | `settings: Settings = Depends(get_settings)` | `os.environ.get("KEY")` scattered in handlers |
| External clients | `client: HttpxClient = Depends(get_http_client)` | `httpx.AsyncClient()` created per request |
| Service layer | `service: UserService = Depends(get_user_service)` | Service instantiated directly in handler |

### Router Organization

Flag all routes in a single file. Organize by domain:

```python
# ✅ Organized router structure
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(health.router, prefix="/health", tags=["Health"])
```

---

## Request Validation & Pydantic Models

### Input Validation Requirements

| Check | Red Flag | Fix |
|-------|----------|-----|
| Raw `dict` input | `async def handler(data: dict)` | Define a Pydantic request model |
| Unvalidated `Request` body | `body = await request.json()` | Use Pydantic model as parameter type |
| Anemic models | Models with no validators, no constraints, no `model_config` | Add field validators, constraints, and config |
| Same model for input and output | `UserModel` used for both create and response | Separate `UserCreate`, `UserUpdate`, `UserResponse` |
| Missing field constraints | Email without validation, numbers without bounds | Add `EmailStr`, `Field(ge=0, le=100)`, etc. |
| Missing `strict=True` | Silent type coercion (`"123"` → `123`) | Add `model_config = ConfigDict(strict=True)` where needed |
| Missing `Annotated` types | Complex validation without schema-level clarity | Use `Annotated[str, Field(min_length=1, max_length=255)]` |

### Pydantic Model Design Patterns

```python
# ❌ Before: Single model for everything — exposes internal fields
class User(BaseModel):
    id: int
    email: str
    password_hash: str  # Leaked in response!
    created_at: datetime
    internal_notes: str  # Leaked in response!

# ✅ After: Separate models for separate concerns
class UserCreate(BaseModel):
    email: EmailStr
    password: SecretStr = Field(min_length=8)

    model_config = ConfigDict(strict=True)

class UserUpdate(BaseModel):
    email: EmailStr | None = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### Field Validation Examples

```python
class OrderCreate(BaseModel):
    quantity: int = Field(ge=1, le=10000, description="Number of items to order")
    price: Decimal = Field(ge=0, decimal_places=2)
    email: EmailStr
    status: Literal["pending", "confirmed", "shipped"]
    notes: str = Field(default="", max_length=1000)

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v > 9999:
            raise ValueError("Quantity exceeds maximum batch size")
        return v
```

---

## HTTP Correctness

### Status Code Audit

| Situation | Correct Code | Common Mistake |
|-----------|-------------|----------------|
| Resource creation | `201 Created` | Returning `200 OK` |
| Successful deletion | `204 No Content` | Returning `200 OK` with body |
| Accepted for async processing | `202 Accepted` | Returning `200 OK` before processing |
| Client validation error | `422 Unprocessable Entity` | Returning `400 Bad Request` |
| Resource not found | `404 Not Found` | Returning `200 OK` with empty body |
| Auth required but missing | `401 Unauthorized` | Returning `403 Forbidden` |
| Auth valid but insufficient | `403 Forbidden` | Returning `401 Unauthorized` |
| Resource exists (conflict) | `409 Conflict` | Returning `400 Bad Request` |

### HTTP Method Audit

| Check | Red Flag | Fix |
|-------|----------|-----|
| GET with side effects | GET endpoint modifies data | Use POST/PUT/PATCH for state changes |
| POST where PUT is correct | Creating new resource on repeated calls | Use PUT with idempotent behavior |
| PUT not idempotent | PUT endpoint produces different results on retry | Ensure PUT is idempotent |
| PATCH without partial update | PATCH replaces entire resource | PATCH should apply partial updates |
| DELETE not idempotent | DELETE fails on second call | Return 204 even if already deleted |

### Error Response Standardization

```python
# ❌ Before: Inconsistent error shapes
raise HTTPException(400, "Bad request")
raise HTTPException(404, {"message": "Not found"})
raise HTTPException(500, detail={"error": str(e), "trace": traceback.format_exc()})  # Security risk!

# ✅ After: Unified error envelope
class ErrorResponse(BaseModel):
    error_code: str
    message: str
    details: list[str] = []

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error_code=exc.error_code,
            message=exc.user_message,
        ).model_dump(),
    )
```

---

## API Versioning & Evolution

### What To Flag

| Pattern | Problem | Fix |
|---------|---------|-----|
| No versioning strategy | Breaking changes with no migration path | Add `/v1/` prefix or `Accept-Version` header |
| Removing response fields | Clients break silently | Deprecate first, remove in next version |
| Changing field types | `id: int` → `id: str` breaks consumers | Never change types — add new field |
| No deprecation headers | Sunset endpoints without notice | Add `Deprecation` and `Sunset` HTTP headers |

---

## OpenAPI & Documentation

### Documentation Checklist

| Check | Red Flag | Fix |
|-------|----------|-----|
| Missing `summary` on routes | OpenAPI shows `/api/v1/users` with no description | Add `summary="List all users"` to decorator |
| Missing `description` | No detailed usage guidance | Add multi-line description with examples |
| Missing `tags` | All endpoints in one group | Add `tags=["Users"]` for logical grouping |
| Missing `responses` | No documented error responses | Add `responses={404: {"model": ErrorResponse}}` |
| Missing examples | Pydantic models have no example values | Add `json_schema_extra={"examples": [...]}` in model config |
| Auto-generated `operation_id` | `operation_id: "create_order_api_v1_orders_post"` | Customize: `operation_id="create_order"` |

---

## Return Format

For each finding, return:
```
Location: <endpoint or model> (file:line)
Issue Type: Endpoint Design | Pydantic | HTTP | Versioning | OpenAPI
Severity: 🔴 | 🟠 | 🟡 | 🔵
Current Pattern: <what the code does now>
Recommended Fix: <corrected FastAPI implementation>
Impact: <API quality, client experience, documentation>
```
