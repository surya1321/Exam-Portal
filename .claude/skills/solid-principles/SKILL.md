---
name: solid-principles
description: "Apply SOLID principles to improve code design, maintainability, and scalability. Use this skill during refactoring sessions, code reviews, or whenever analyzing existing code for design quality. Trigger on: refactoring code, reviewing pull requests, identifying design smells, improving architecture, reducing coupling, splitting responsibilities, making code more testable, or when the user mentions SOLID, SRP, OCP, LSP, ISP, DIP, design patterns, God class, tight coupling, or dependency injection. Apply this skill even when the user doesn't explicitly mention SOLID — if the code has design problems that SOLID addresses, use it."
---

# SOLID Principles — Design That Scales, Code That Lasts

## Why This Matters

SOLID principles exist because software changes. Requirements shift, features get added, teams grow, and codebases evolve. Code designed without these principles fights every change — a one-line feature requires edits across ten files, a bug fix introduces three new bugs, and testing is impossible without spinning up the entire system.

Well-designed code absorbs change gracefully. It lets you add behavior without rewriting existing code, swap implementations without breaking consumers, and test in isolation without elaborate mocking. SOLID isn't academic theory — it's the engineering foundation that makes this possible.

> **The goal isn't to satisfy five principles on a checklist. It's to build code that a team can confidently change, extend, and maintain over years — not just days.**

---

## The Core Workflow

When reviewing or refactoring code, follow this sequence:

1. **Assess** — Scan for SOLID violations and design smells
2. **Evaluate** — Map violations to specific principles and measure impact
3. **Judge** — Decide whether refactoring is warranted or the current design is appropriate
4. **Recommend** — Provide production-ready refactored solutions with before/after comparison

Never refactor for the sake of satisfying a principle. Always weigh **pragmatism vs. purity**.

---

## The Five Principles

### S — Single Responsibility Principle (SRP)

> **A class should have one, and only one, reason to change.**

This isn't about doing "one thing" — it's about having one **axis of change**. A class that formats reports and queries the database has two reasons to change: the report format changes, or the data source changes. These concerns should be separate.

**What to look for:**

| 🚩 Violation Signal | Why It's a Problem |
|---------------------|-------------------|
| Class handles business logic + data access | Database changes force business logic retesting |
| Method both validates input and persists it | Validation rules can't evolve independently |
| Component fetches data + formats it + renders it | UI changes risk breaking data layer |
| Class has 10+ dependencies injected | Almost certainly doing too many things |
| File exceeds ~300 lines (context-dependent) | Often a symptom of mixed concerns |
| Class name includes "And" or "Manager" | `OrderAndInventoryManager` is two responsibilities |

**How to fix:**

Split the class along its reasons to change. Each extracted class becomes focused, testable, and independently evolvable.

**Example — Before (SRP violation):**

```python
class OrderProcessor:
    def process_order(self, order):
        # Validates the order
        if not order.items:
            raise ValueError("Order must have items")
        if order.total <= 0:
            raise ValueError("Invalid total")

        # Calculates pricing
        subtotal = sum(item.price * item.quantity for item in order.items)
        tax = subtotal * 0.08
        order.total = subtotal + tax

        # Persists to database
        db.execute("INSERT INTO orders ...", order)

        # Sends confirmation
        email_body = f"Your order #{order.id} for ${order.total} is confirmed"
        smtp.send(order.customer_email, "Order Confirmed", email_body)
```

**Example — After (SRP applied):**

```python
class OrderValidator:
    def validate(self, order):
        if not order.items:
            raise ValueError("Order must have items")
        if order.total <= 0:
            raise ValueError("Invalid total")

class OrderPricingCalculator:
    def calculate_total(self, order, tax_rate=0.08):
        subtotal = sum(item.price * item.quantity for item in order.items)
        tax = subtotal * tax_rate
        return subtotal + tax

class OrderRepository:
    def save(self, order):
        db.execute("INSERT INTO orders ...", order)

class OrderConfirmationNotifier:
    def send_confirmation(self, order):
        email_body = f"Your order #{order.id} for ${order.total} is confirmed"
        smtp.send(order.customer_email, "Order Confirmed", email_body)
```

**When NOT to apply SRP:**
- Small scripts or CLI tools where splitting adds file management overhead without clarity benefit
- Prototypes and spike solutions that won't survive to production
- Simple CRUD operations where the "responsibilities" are trivially coupled

---

### O — Open/Closed Principle (OCP)

> **Software entities should be open for extension, but closed for modification.**

When adding new behavior requires editing existing, tested, working code — that's an OCP violation. New features should be added by writing new code, not changing old code.

**What to look for:**

| 🚩 Violation Signal | Why It's a Problem |
|---------------------|-------------------|
| `if/else` or `switch` chains checking type/status | Every new type requires editing the chain |
| Adding a feature means modifying 5+ existing files | Change ripples across the codebase |
| Core functions grow longer with every new requirement | Increasing risk of regression |
| Hardcoded logic for specific variants | Can't add variants without touching core |

**How to fix:**

Use the **Strategy Pattern**, **Plugin Architecture**, or **Polymorphism** to make behavior extensible without modifying the dispatch logic.

**Example — Before (OCP violation):**

```typescript
function calculateDiscount(customer: Customer): number {
    if (customer.type === "regular") {
        return customer.orderTotal * 0.05;
    } else if (customer.type === "premium") {
        return customer.orderTotal * 0.10;
    } else if (customer.type === "vip") {
        return customer.orderTotal * 0.15 + 10;
    }
    // Every new tier = another else-if added here
    return 0;
}
```

**Example — After (OCP applied — Strategy Pattern):**

```typescript
interface DiscountStrategy {
    calculate(orderTotal: number): number;
}

class RegularDiscount implements DiscountStrategy {
    calculate(orderTotal: number): number {
        return orderTotal * 0.05;
    }
}

class PremiumDiscount implements DiscountStrategy {
    calculate(orderTotal: number): number {
        return orderTotal * 0.10;
    }
}

class VipDiscount implements DiscountStrategy {
    calculate(orderTotal: number): number {
        return orderTotal * 0.15 + 10;
    }
}

// Adding a new tier = adding a new class. No existing code changes.
function calculateDiscount(strategy: DiscountStrategy, orderTotal: number): number {
    return strategy.calculate(orderTotal);
}
```

**When NOT to apply OCP:**
- When there are only 2-3 variants and growth is unlikely — a simple `if/else` is clearer
- When the abstraction would be used only once — don't build a plugin system for one plugin
- When the domain is stable and the switch cases haven't changed in years

---

### L — Liskov Substitution Principle (LSP)

> **Subtypes must be substitutable for their base types without altering program correctness.**

If calling code works with a base type, it must also work with any subtype — without surprises, crashes, or behavioral changes. Violating LSP makes polymorphism a lie.

**What to look for:**

| 🚩 Violation Signal | Why It's a Problem |
|---------------------|-------------------|
| Overridden method throws `NotImplementedError` | Subtype can't fulfill the base contract |
| Subtype strengthens preconditions | Callers that work with base type will fail |
| Subtype weakens postconditions / returns unexpected types | Callers can't rely on the return contract |
| `instanceof` / `typeof` checks before calling methods | Code doesn't trust the abstraction |
| Subclass ignores or no-ops a parent method | The inheritance hierarchy is wrong |

**How to fix:**

Redesign the hierarchy so subtypes genuinely fulfill the base contract. Often this means **composition over inheritance** or splitting into separate, focused interfaces.

**Example — Before (LSP violation):**

```python
class Bird:
    def fly(self):
        return "Flying high"

class Penguin(Bird):
    def fly(self):
        raise NotImplementedError("Penguins can't fly")  # Violates LSP!
```

**Example — After (LSP applied):**

```python
class Bird:
    def move(self):
        raise NotImplementedError

class FlyingBird(Bird):
    def move(self):
        return "Flying high"

class FlightlessBird(Bird):
    def move(self):
        return "Waddling along"

class Eagle(FlyingBird):
    pass

class Penguin(FlightlessBird):
    pass
```

**The key test:** Can you replace the parent with any child in every usage site without the code breaking, throwing unexpected errors, or behaving differently? If not, the hierarchy is wrong.

**When NOT to apply LSP:**
- Abstract base classes with `NotImplementedError` as a deliberate design choice (template method pattern)
- Framework-mandated inheritance where you don't control the base class

---

### I — Interface Segregation Principle (ISP)

> **No client should be forced to depend on methods it does not use.**

Fat interfaces that bundle unrelated capabilities force every implementor to provide methods they don't need. This creates dead code, misleading APIs, and fragile implementations.

**What to look for:**

| 🚩 Violation Signal | Why It's a Problem |
|---------------------|-------------------|
| Interface has 10+ methods | Almost certainly serves multiple clients |
| Implementors have methods that throw `NotImplementedError` | They can't fulfill the full contract |
| Implementors have methods with empty bodies or `pass` | The interface forces irrelevant behavior |
| Clients use only 2-3 methods from a 15-method interface | Over-dependency on unused surface area |
| One interface change breaks unrelated implementors | Coupled concerns that should be separated |

**How to fix:**

Split the fat interface into **small, role-specific interfaces** that each serve one client or cohesive use case.

**Example — Before (ISP violation):**

```typescript
interface Worker {
    work(): void;
    eat(): void;
    sleep(): void;
    attendMeeting(): void;
    writeReport(): void;
}

class Robot implements Worker {
    work() { /* ... */ }
    eat() { throw new Error("Robots don't eat"); }       // Forced to implement
    sleep() { throw new Error("Robots don't sleep"); }    // Forced to implement
    attendMeeting() { throw new Error("Not applicable"); }
    writeReport() { throw new Error("Not applicable"); }
}
```

**Example — After (ISP applied):**

```typescript
interface Workable {
    work(): void;
}

interface Feedable {
    eat(): void;
}

interface Restable {
    sleep(): void;
}

interface MeetingAttendee {
    attendMeeting(): void;
}

class Robot implements Workable {
    work() { /* ... */ }
    // Only depends on what it actually does
}

class HumanEmployee implements Workable, Feedable, Restable, MeetingAttendee {
    work() { /* ... */ }
    eat() { /* ... */ }
    sleep() { /* ... */ }
    attendMeeting() { /* ... */ }
}
```

**When NOT to apply ISP:**
- When the interface is genuinely cohesive and all implementors need all methods
- When splitting would create a proliferation of single-method interfaces that add ceremony without clarity
- Standard library or framework interfaces you don't control

---

### D — Dependency Inversion Principle (DIP)

> **High-level modules should not depend on low-level modules. Both should depend on abstractions.**

When a business logic class directly creates and calls a database client, a mailer, or an HTTP client, it's welded to those specific implementations. You can't test it in isolation, swap providers, or reuse it in a different context.

**What to look for:**

| 🚩 Violation Signal | Why It's a Problem |
|---------------------|-------------------|
| `new ConcreteClass()` inside business logic | Can't test without the real dependency |
| Hard-coded database calls in service layer | Can't swap databases or use in-memory for tests |
| Direct imports of infrastructure in domain layer | Domain logic tied to specific technology |
| Constructor creates its own dependencies | Impossible to inject mocks or alternatives |
| Static method calls to external services | Untestable, unseamable coupling |

**How to fix:**

Depend on **interfaces/abstractions**, inject implementations from the outside via constructor injection, factory methods, or IoC containers.

**Example — Before (DIP violation):**

```python
class OrderService:
    def __init__(self):
        self.database = PostgresDatabase()       # Hardcoded to Postgres
        self.mailer = SendGridMailer()            # Hardcoded to SendGrid
        self.logger = FileLogger("/var/log/app")  # Hardcoded to file system

    def place_order(self, order):
        self.database.save(order)
        self.mailer.send(order.customer_email, "Order placed!")
        self.logger.log(f"Order {order.id} placed")
```

**Example — After (DIP applied):**

```python
from abc import ABC, abstractmethod

class OrderRepository(ABC):
    @abstractmethod
    def save(self, order): ...

class NotificationSender(ABC):
    @abstractmethod
    def send(self, recipient, message): ...

class Logger(ABC):
    @abstractmethod
    def log(self, message): ...

class OrderService:
    def __init__(self, repository: OrderRepository, notifier: NotificationSender, logger: Logger):
        self.repository = repository
        self.notifier = notifier
        self.logger = logger

    def place_order(self, order):
        self.repository.save(order)
        self.notifier.send(order.customer_email, "Order placed!")
        self.logger.log(f"Order {order.id} placed")

# Now testable with mocks, swappable with any implementation
```

**When NOT to apply DIP:**
- Simple scripts with no test requirements
- When there's genuinely only one possible implementation and there never will be another
- Stable, mature utilities (e.g., `json.loads()`) that are effectively abstractions already

---

## Design Smells to Detect

These anti-patterns signal deeper SOLID violations. When you spot them, trace back to the principle they break:

| Anti-Pattern | Description | Principle Violated |
|-------------|-------------|-------------------|
| **God Object** | One class that knows everything and does everything | SRP — too many reasons to change |
| **Shotgun Surgery** | One change requires edits across many classes/files | SRP — responsibility is scattered |
| **Divergent Change** | One class gets modified for many different reasons | SRP — multiple responsibilities |
| **Feature Envy** | A method uses more data from another class than its own | SRP — logic is in the wrong class |
| **Inappropriate Intimacy** | Two classes know too much about each other's internals | DIP — missing abstraction boundary |
| **Refused Bequest** | Subclass inherits methods it doesn't want or use | LSP / ISP — wrong hierarchy |
| **Primitive Obsession** | Using primitives instead of small domain objects | SRP — domain logic scattered across callers |
| **Rigid Hierarchy** | Deep inheritance trees that resist modification | OCP / LSP — prefer composition |

---

## Supporting Design Patterns

These patterns are the primary tools for enforcing SOLID principles. Apply them as solutions, not as goals:

| Pattern | SOLID Principle | Use When |
|---------|----------------|----------|
| **Strategy** | OCP | Swapping interchangeable algorithms without modifying consumers |
| **Factory / Abstract Factory** | DIP, OCP | Decoupling object creation from usage, supporting new types |
| **Decorator** | OCP, SRP | Adding behavior to objects without modifying their class |
| **Adapter** | DIP, ISP | Making incompatible interfaces work together |
| **Facade** | ISP, SRP | Providing a simplified interface over a complex subsystem |
| **Observer** | OCP, DIP | Decoupling event producers from consumers |
| **Template Method** | OCP, LSP | Defining algorithm skeleton with customizable steps |
| **Proxy** | SRP, DIP | Adding access control, caching, or logging around an object |
| **Dependency Injection** | DIP | Providing dependencies from outside rather than creating them |

---

## The Judgment Framework

Not every SOLID violation needs fixing. Use this decision framework:

### Refactor When:
- The violation causes **real pain** — bugs from changes, difficulty testing, fear of touching code
- The code is in a **high-change area** — features are actively being added or modified
- The codebase is **growing** — more developers, more features, longer lifespan
- The violation makes **testing impractical** — can't write unit tests without the full system
- You're already **in the file** making changes — opportunistic refactoring is efficient

### Leave As-Is When:
- The code is **stable** — hasn't changed in months and isn't expected to
- The scope is **limited** — small script, one-off tool, prototype
- Refactoring would add **accidental complexity** — three files and an interface for a 20-line function
- The team would find the abstraction **harder to understand** than the current code
- The violation is **benign** — technically impure but causing no actual problems

### The Litmus Test:

> **"If I had to add a new variant / requirement to this code tomorrow, would the current design fight me?"**
> 
> If yes → refactor. If no → leave it.

---

## Applying This Skill

When reviewing or refactoring code:

1. **Scan for smells first** — Don't jump to principles. Detect the symptoms (God class, shotgun surgery, feature envy), then trace them to the violated principle.

2. **Evaluate impact** — Is this violation causing real problems or is it theoretically impure but practically fine? A three-case `switch` that hasn't changed in a year doesn't need a Strategy pattern.

3. **Show before and after** — Always provide a concrete comparison so the improvement is visible and measurable. Abstract advice without code is unhelpful.

4. **Explain the trade-off** — Every refactoring has a cost. More files, more indirection, more concepts to learn. Be honest about the downsides and justify why the benefits outweigh them.

5. **Respect the codebase context** — A startup MVP and an enterprise platform have different needs. What's over-engineering in one is essential architecture in the other. Match the solution to the project's scale, team size, and expected lifespan.

6. **One principle at a time** — If code violates multiple principles, fix the most impactful one first. Stacking five refactorings in one pass creates a review nightmare and increases risk.

---

## Quick Self-Check

Before recommending a refactoring, ask:

1. **Is there a real problem here?** Or am I applying a principle for its own sake?
2. **Will this change survive the next three requirements?** Or will it be refactored again?
3. **Can a new team member understand the refactored design?** Or did I add complexity that only I can follow?
4. **Is the trade-off worth it?** More abstractions = more indirection. Is the benefit clear?
5. **Am I solving a problem that actually exists?** Or one I'm imagining might exist someday?
