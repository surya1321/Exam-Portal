---
name: naming-conventions
description: "Enforce production-ready naming conventions across all code. Use this skill whenever writing, reviewing, or refactoring any code — variables, functions, classes, constants, loop iterators, parameters, and module names must all speak their purpose clearly. Apply this skill even when the user doesn't explicitly mention naming; good names are non-negotiable in production code. Trigger on: code reviews, new feature implementations, refactoring, pull request feedback, writing any new code, or improving existing code quality."
---

# Naming Conventions — Names That Speak Their Purpose

## Why This Matters

A well-named variable eliminates the need for a comment. A well-named function reads like a sentence describing what it does. Production-ready code is code that a new team member can read at 2 AM during an incident and immediately understand — without scrolling up to find context, without reading docstrings, and without asking the original author.

Names are the most-read part of any codebase. Every developer who touches the code will read them hundreds of times. Investing 30 seconds in a good name saves hours of comprehension time across the team's lifetime.

## The Core Principle

> **If you need a comment to explain what a variable holds or what a function does, the name is wrong.**

Names should make comments about *what* redundant. Comments should only explain *why* — the business reason, the non-obvious constraint, the workaround for a known issue.

---

## Naming Rules by Category

### Variables & Parameters

Variables describe **what they hold**, not their type or structure.

| ❌ Bad | ✅ Good | Why |
|--------|---------|-----|
| `d` | `elapsed_days` | What does `d` mean? Days? Data? Distance? |
| `data` | `user_profiles` | "Data" says nothing about what's inside |
| `temp` | `unprocessed_order` | What is temporary about it? Name the thing |
| `info` | `customer_billing_address` | "Info" is meaningless — info about what? |
| `val` | `discounted_price` | Be specific about what value this represents |
| `lst` | `active_subscriptions` | Name the collection by what it contains |
| `flag` | `is_email_verified` | Booleans should read as yes/no questions |
| `result` | `validation_errors` | Result of what? Name what it actually holds |
| `num` | `retry_count` | A number of what? |
| `str1` | `raw_input_query` | Never use type+number naming |

**Boolean naming** — Booleans should read like yes/no questions:
- Prefix with `is_`, `has_`, `can_`, `should_`, `was_`, `will_`
- `is_authenticated`, `has_permission`, `can_retry`, `should_notify`
- Never: `check`, `flag`, `status` (these are ambiguous verbs/nouns)

**Collection naming** — Use plural nouns that describe the contents:
- `active_users` not `user_list`
- `failed_payments` not `payments_arr`
- `pending_notifications` not `queue`

### Functions & Methods

Functions describe **what they do** — they are actions, so they start with a verb.

| ❌ Bad | ✅ Good | Why |
|--------|---------|-----|
| `process()` | `validate_payment_details()` | Process how? What? |
| `handle()` | `route_incoming_request()` | Handle is vague |
| `doStuff()` | `sync_inventory_with_warehouse()` | Self-explanatory |
| `run()` | `execute_scheduled_cleanup()` | Be specific about what runs |
| `getData()` | `fetch_user_order_history()` | What data? From where? |
| `check()` | `verify_email_domain_exists()` | Check what? For what condition? |
| `manage()` | `allocate_worker_to_task_queue()` | Manage is too broad |
| `update()` | `recalculate_cart_total()` | Update what, and how? |

**Function verb patterns:**

| Verb | Use When | Example |
|------|----------|---------|
| `fetch_` / `retrieve_` | Getting data from external source | `fetch_exchange_rates()` |
| `calculate_` / `compute_` | Deriving a value | `calculate_shipping_cost()` |
| `validate_` / `verify_` | Checking correctness | `validate_credit_card_number()` |
| `parse_` / `extract_` | Pulling structured data from raw input | `parse_csv_row()` |
| `format_` / `render_` | Transforming for display | `format_currency_for_locale()` |
| `send_` / `notify_` | Outbound communication | `send_password_reset_email()` |
| `create_` / `build_` | Constructing a new object | `build_api_response_payload()` |
| `delete_` / `remove_` | Destroying/removing | `remove_expired_sessions()` |
| `convert_` / `transform_` | Changing from one form to another | `convert_celsius_to_fahrenheit()` |
| `is_` / `has_` / `can_` | Boolean return check | `is_subscription_active()` |

### Classes

Classes are **nouns** that represent a concept, entity, or responsibility.

| ❌ Bad | ✅ Good | Why |
|--------|---------|-----|
| `Manager` | `PaymentProcessor` | Manager of what? Be specific |
| `Handler` | `WebhookEventRouter` | Handler is generic |
| `Helper` | `DateTimeFormatter` | Helper classes are a code smell — name the responsibility |
| `Utils` | `StringSanitizer` | Utils is a grab-bag — each class should have one job |
| `Processor` | `InvoiceLineItemCalculator` | What does it process? |
| `Service1` | `NotificationDispatcher` | Never number your classes |
| `Data` | `CustomerProfile` | Name the domain concept |
| `Info` | `ShippingAddress` | Be precise about what information |

**Class naming patterns:**
- **Entities**: `Customer`, `Invoice`, `Subscription` — domain objects
- **Services**: `EmailDeliveryService`, `PaymentGatewayClient` — things that do work
- **Repositories**: `OrderRepository`, `UserRepository` — data access
- **Strategies**: `FlatRateShippingStrategy`, `TieredPricingStrategy` — interchangeable algorithms
- **Factories**: `DatabaseConnectionFactory`, `ReportGeneratorFactory` — object creation
- **Validators**: `InputSanitizer`, `SchemaValidator` — validation logic

### Constants

Constants are **SCREAMING_SNAKE_CASE** and describe the value's purpose:

| ❌ Bad | ✅ Good |
|--------|---------|
| `MAX` | `MAX_LOGIN_ATTEMPTS` |
| `TIMEOUT` | `API_REQUEST_TIMEOUT_SECONDS` |
| `SIZE` | `MAX_FILE_UPLOAD_SIZE_MB` |
| `RATE` | `MONTHLY_INTEREST_RATE_PERCENT` |
| `N` | `DEFAULT_PAGE_SIZE` |

Include the **unit** in the name when it's not obvious: `_SECONDS`, `_MB`, `_PERCENT`, `_MS`.

### Loop Variables

Short loops (under ~5 lines) can use `i`, `j`, `k` for numeric indices. Everything else gets a descriptive name.

| ❌ Bad | ✅ Good |
|--------|---------|
| `for x in users:` | `for active_user in users:` |
| `for item in data:` | `for pending_order in unprocessed_orders:` |
| `for k, v in d.items():` | `for product_id, stock_count in inventory.items():` |
| `for row in rows:` | `for transaction_record in daily_transactions:` |

**The singular/plural rule**: The iterator should be the singular form of the collection name:
- `for notification in pending_notifications:`
- `for endpoint in api_endpoints:`
- `for attempt in retry_attempts:`

### Modules & Files

Module and file names describe their **scope of responsibility**:

| ❌ Bad | ✅ Good |
|--------|---------|
| `utils.py` | `string_sanitization.py` |
| `helpers.py` | `date_formatting.py` |
| `misc.py` | `csv_export.py` |
| `common.py` | `authentication_middleware.py` |
| `funcs.py` | `payment_validation.py` |

---

## Anti-Patterns — What To Reject

These patterns signal poor naming and should always be corrected:

### 1. Single-Letter Names
**Exception**: `i`, `j` in short numeric loops (under ~5 lines).
Everything else — `x`, `n`, `d`, `s`, `e`, `f`, `r`, `t`, `p`, `q` — needs a real name.

### 2. Non-Universal Abbreviations
If the abbreviation isn't universally understood in the domain, spell it out.

| ❌ Abbreviated | ✅ Spelled Out |
|---------------|----------------|
| `usr_mgr` | `user_manager` |
| `btn_clk_hndlr` | `button_click_handler` |
| `calc_inv_ttl` | `calculate_invoice_total` |
| `proc_msg` | `process_incoming_message` |
| `auth_svc` | `authentication_service` |

**Acceptable abbreviations** (universally understood):
`id`, `url`, `api`, `http`, `html`, `css`, `js`, `db`, `sql`, `io`, `os`, `ip`, `dns`, `ssl`, `ssh`, `jwt`, `uuid`, `csv`, `json`, `xml`, `pdf`, `ui`, `ux`, `config`, `env`, `args`, `params`, `auth`, `admin`, `max`, `min`, `avg`, `src`, `dest`, `err`, `msg`, `req`, `res`, `ctx`

### 3. Generic "Nothing" Names
These names carry zero information:

`data`, `info`, `temp`, `stuff`, `thing`, `item`, `element`, `object`, `value`, `result`, `response`, `output`, `input`, `content`, `payload`, `handler`, `manager`, `processor`, `service`, `controller` — **when used alone without qualification**.

They become acceptable when combined with a specific domain qualifier:
- `data` → `sensor_reading_data`
- `handler` → `webhook_event_handler`
- `result` → `search_query_result`

### 4. Numbered Names
Never: `user1`, `process2`, `result3`, `temp1`, `str2`

If you have two similar things, name them by their **role**:
- `user1, user2` → `sender, recipient`
- `result1, result2` → `cached_result, fresh_result`
- `process1, process2` → `validation_step, enrichment_step`
- `date1, date2` → `subscription_start_date, subscription_end_date`

### 5. Misleading Names
A name must accurately reflect behavior. These are the most dangerous bugs:
- A function called `validate_email` that also sends a confirmation email
- A variable called `total_price` that doesn't include tax
- A flag called `is_complete` that's `True` when processing is still underway
- A method called `get_user` that creates the user if not found

If behavior doesn't match the name, **rename** — don't add a comment.

---

## Language-Specific Conventions

### Python
- **Variables / functions**: `snake_case` — `calculate_total_price`, `user_email_address`
- **Classes**: `PascalCase` — `PaymentProcessor`, `HttpRequestHandler`
- **Constants**: `SCREAMING_SNAKE_CASE` — `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_SECONDS`
- **Private**: single underscore prefix — `_internal_cache`, `_validate_input()`
- **Dunder**: only for protocol methods — `__init__`, `__repr__`, `__len__`

### TypeScript / JavaScript
- **Variables / functions**: `camelCase` — `calculateTotalPrice`, `userEmailAddress`
- **Classes / Interfaces / Types**: `PascalCase` — `PaymentProcessor`, `UserProfile`
- **Constants**: `SCREAMING_SNAKE_CASE` — `MAX_RETRY_ATTEMPTS`, `API_BASE_URL`
- **Private**: TypeScript `private` keyword or `#` prefix
- **React components**: `PascalCase` — `UserProfileCard`, `PaymentForm`
- **Hooks**: `use` prefix — `useAuthStatus`, `useCartItems`
- **Event handlers**: `handle` + event — `handleFormSubmit`, `handleRowClick`

### General (All Languages)
- **Acronyms in names**: Treat as words — `HttpRequest` not `HTTPRequest`, `apiUrl` not `aPIURL`
- **Getters/setters**: Match the property — `get_shipping_cost()` / `set_shipping_cost()`
- **Factory methods**: `create_` or `build_` prefix — `create_database_connection()`
- **Conversion methods**: `to_` prefix — `to_json()`, `to_display_string()`
- **Test functions**: `test_` + behavior — `test_expired_token_returns_401()`

---

## Quick Self-Check

Before accepting any name, ask these questions:

1. **Can someone understand this name without seeing surrounding code?** If not, rename.
2. **Does this name tell me what it holds / does, not how it's structured?** `user_list` → `active_users`
3. **Would a new team member understand this at 2 AM during an incident?** If not, rename.
4. **Is this name specific enough to distinguish from similar things?** `get_data()` vs `fetch_user_order_history()`
5. **Does the name accurately reflect the current behavior?** If behavior changed but the name didn't, rename.

---

## Applying This Skill

When writing or reviewing code:

1. **Name first, implement second** — Decide what a function/variable should be called before writing it. If you can't name it clearly, you probably don't understand the concept well enough yet.
2. **Rename aggressively** — When you notice a bad name, fix it immediately. Bad names compound — they make everything around them harder to understand.
3. **Read code aloud** — `if is_subscription_active and has_valid_payment_method:` reads like English. `if flag1 and check2:` does not.
4. **Match the domain language** — Use the same terms as the business/product team. If they call it a "subscription", don't call it a "recurring_plan" in code.
5. **Don't fear long names** — `calculate_prorated_refund_for_cancelled_subscription()` is better than `calc_refund()`. Modern IDEs autocomplete. Clarity wins.
