---
name: interface-design
description: Use this skill whenever the task is to design, redesign, refine, critique, or explain UI for interactive products. Invoke it aggressively for dashboards, admin panels, SaaS apps, internal tools, settings screens, form flows, data tables, component systems, charts, design-system work, responsive app layouts, or any interface a real user operates repeatedly. Also use it when the user says "make it look better", "add polish", "redesign this", "critique my UI", "improve hierarchy", "fix spacing", "choose typography", "audit this design", or wants help understanding why a UI feels generic. Use it for both greenfield builds and iterative improvements. Do not use it for marketing/landing pages or one-off promotional pages.
---

# Interface Design

Build interface design with craft and consistency. Every design decision should be authored, not defaulted.

## When to Use This Skill

**Use for:** Dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces, charts, form flows, data tables, component libraries for web apps.

## Operating Modes

- **Build / redesign** — Create or revise interface direction, then implement it.
- **Critique / audit** — Diagnose what defaulted, what lacks hierarchy, and what should change.
- **Teach / explain** — Explain why a UI choice works, what is generic, and how to make decisions more intentional.

## The Sequential Design Flow

Every interface task follows this sequence. Do not skip or reorder steps.

```
Step 1: Requirements    → Understand who, what, and how it should feel
Step 2: Current Design  → Audit what already exists (redesign) or identify constraints (greenfield)
Step 3: Principles      → Ground decisions in design principles and systems thinking
Step 4: Psychology      → Apply perception and decision-making laws to the structure
Step 5: Domain          → Explore the product's world — colors, metaphors, signature
Step 6: Propose         → State direction, referencing domain + principles + psychology
Step 7: Build           → Implement with craft; run component checklist before each piece
Step 8: Evaluate        → Run the pre-presentation checks; fix before showing
Step 9: Wrap Up         → Surface the decisions that matter most
```

Read `references/example.md` if unsure how subtle layering translates into real component decisions.

---

# Step 1 — Requirements: Understand the Human and the Task

Before anything else, establish who you are designing for, what they need to do, and how it should feel. Without this, every subsequent decision has no foundation and will default to generic.

You will produce generic output unless you actively catch where defaults sneak in. Typography, navigation, data presentation, spacing, token naming, and layout all masquerade as infrastructure. They are not infrastructure. They are the design.

If the request already answers these questions, paraphrase and proceed. If not, ask — do not guess.

## Who Is This Human?

Not "users." The actual person. Where are they when they open this? What's on their mind? What did they do 5 minutes ago, and what will they do 5 minutes after?

A teacher reviewing submissions at 7am is not a developer debugging at midnight is not a founder between investor meetings. Their world shapes the interface — density, tone, color temperature, information priority.

## What Must They Accomplish?

Not "use the dashboard." The verb. Grade these submissions. Find the broken deployment. Approve the payment. The answer determines what leads, what follows, and what hides.

## What Should This Feel Like?

Say it in words that mean something. "Clean and modern" means nothing — every AI says that. Warm like a notebook? Cold like a terminal? Dense like a trading floor? Calm like a reading app? The feel shapes color, type, spacing, density — everything.

## Authoring Every Decision

Treat every major decision as authored. The question is never just "does this work?" It is "why this choice for this product, this user, and this moment?"

For every decision, you must explain WHY:
- Why this layout and not another?
- Why this color temperature?
- Why this typeface?
- Why this spacing scale?
- Why this information hierarchy?

If your answer is "it's common" or "it works" — you haven't chosen. You've defaulted. Defaults compound into generic output.

**The test:** If you swapped every decision for the most common alternative and the design felt no different, you never made real choices.

---

# Step 2 — Current Design: Audit What Exists

Before moving to principles or exploring the domain, understand the current state.

## For a Redesign or Improvement

Audit the existing design before changing anything:

- **What's working?** Look for patterns the user clearly understands, structures they rely on, interactions they've built habits around. Preserve these — Jakob's Law means users carry cognitive models from the existing design.
- **What defaulted?** Typography that's just "the readable default." Navigation that's just "the standard sidebar." Metric cards that could belong to any app. Name these specifically.
- **What's broken structurally?** Missing interaction states, inconsistent spacing, mixed depth strategies, harsh borders, flat text hierarchy. These are the priority fixes.
- **What did the user consciously not design?** Gaps where no decision was made and something just appeared. These are opportunities.

State your audit findings before proposing changes. The user needs to agree on what's actually broken before seeing a fix.

## For a Greenfield Build

Identify the constraints and existing context:
- What platform and technology? (web, mobile, desktop — each has native patterns Jakob's Law demands you respect)
- What data and content will actually appear? Don't design for placeholder lorem ipsum — know the real content shape.
- What's adjacent to this interface? If it lives inside an existing product, what visual language does that product already use?
- Are there existing design tokens, fonts, or component libraries to extend?

---

# Step 3 — Principles: Ground Decisions in Design Systems

These are the areas where defaults most commonly sneak in. Before building any component, run through this checklist mentally. For token-level implementation detail, CSS patterns, dark mode specifics, or control token guidance, read `references/principles.md`.

- **Token architecture** — Every color traces to primitives: foreground, background, border, brand, semantic. No random hex values.
- **Text hierarchy** — Four levels (primary, secondary, tertiary, muted), not two. Flat text hierarchy = flat design.
- **Border progression** — Borders aren't binary. Scale intensity to match boundary importance.
- **Control tokens** — Form controls get their own tokens, separate from surface tokens, so interactive elements can be tuned independently.
- **Spacing** — Pick a base unit, use multiples everywhere. Random spacing values are the clearest sign of no system.
- **Padding** — Symmetrical unless content genuinely requires asymmetry.
- **Depth** — Choose ONE strategy (borders-only, subtle shadows, layered shadows, or surface shifts) and commit. Mixing approaches fragments the visual language.
- **Border radius** — Sharper = technical, rounder = friendly. Build a consistent scale.
- **Typography** — Combine size, weight, and letter-spacing. Size alone doesn't create hierarchy.
- **Card layouts** — Design internal structure for each card's specific content, but keep surface treatment consistent.
- **Controls** — Native `<select>` and `<input type="date">` render un-stylable OS elements. Build custom components.
- **Iconography** — Icons clarify, not decorate. If removing an icon loses no meaning, remove it.
- **Animation** — Fast micro-interactions (~150ms), smooth deceleration easing. Avoid spring/bounce in professional interfaces.
- **States** — Every interactive element needs: default, hover, active, focus, disabled. Data needs: loading, empty, error. Missing states feel broken.
- **Navigation context** — Screens need grounding. Include navigation, location indicators, and user context. Floating components feel like demos, not products.
- **Dark mode** — Lean on borders over shadows (shadows disappear on dark backgrounds). Desaturate semantic colors slightly.

---

# Step 4 — Psychology: Apply Perception and Decision Laws

Every layout, hierarchy, and interaction decision has a behavioral basis. Apply these before structuring the interface — they determine how users will perceive and navigate it. For the full reference with detailed examples, read `references/psychology.md`.

## Visual Hierarchy — Control Where the Eye Goes First

Size, contrast, position, and white space direct attention before the user reads a single word. The Von Restorff effect (the thing that differs gets remembered) explains why CTAs use high-contrast accent colors. The F-pattern and Z-pattern describe where eyes travel on first scan — place the most critical content along these paths.

The primary action, key metric, or main content should visually dominate. When everything competes equally, nothing wins.

## Typography Hierarchy — Make Structure Legible Before Reading

Use a minimum of four levels: headline, subhead, body, caption. Distinguish them with size + weight + color combined — size alone is insufficient for clear scanning. Monospace for data, `tabular-nums` for numerical alignment.

## Interaction Laws

Apply these during layout and component sizing decisions:

- **Hick's Law** — More choices = slower decisions. Use progressive disclosure, smart defaults, and grouped options (5–7 items per group) to prevent choice paralysis.
- **Fitts's Law** — Larger, closer targets are faster to hit. Primary actions should be prominent and easy to reach; destructive actions should be smaller and away from primary ones.
- **Miller's Law** — Humans hold ~7 items in working memory. Chunk navigation, options, and lists into perceivable groups. Use visual spacing and headers to make clusters obvious.
- **Jakob's Law** — Users expect your interface to work like others they use daily. Respect conventions (logo → home, gear → settings, search icon → search) unless your alternative is unambiguously superior.

## Gestalt Perception

These operate automatically — design with them, not against them:

- **Proximity** — Elements close together are perceived as a group. Consistent spacing within groups, larger gaps between groups.
- **Similarity** — Same visual treatment signals same function. All clickable elements should share a visual trait. All status indicators should use consistent color coding.
- **Closure** — The brain completes incomplete shapes. Use this for icons, carousels, and attention guidance.

## Cognitive Load

Reducing mental effort prevents abandonment. Design for:
- **Recognition over recall** — show options, don't require users to remember them
- **Progressive disclosure** — show what's needed now; reveal advanced details on demand
- **Clear wayfinding** — users should always know where they are, how they got here, and how to go back

The aesthetic-usability effect means a polished interface earns patience. Users forgive functional flaws more readily in well-crafted designs.

---

# Step 5 — Domain: Find the Product's World

This is where defaults get caught — or don't.

Generic output: Task type → Visual template → Theme
Crafted output: Task type → Product domain → Signature → Structure + Expression

The difference: time spent in the product's world before any visual or structural thinking.

## Four Required Outputs (Produce All Before Proposing)

**Do not propose any direction until you produce all four:**

**Domain:** Concepts, metaphors, vocabulary from this product's world. Not features — territory. Minimum 5.

**Color world:** What colors exist naturally in this product's domain? Not "warm" or "cool" — go to the actual world. If this product were a physical space, what would you see? What colors belong there that don't belong elsewhere? List 5+.

**Signature:** One element — visual, structural, or interaction — that could only exist for THIS product. If you can't name one, keep exploring.

**Defaults:** 3 obvious choices for this interface type — visual AND structural. You can't avoid patterns you haven't named.

## Intent Must Carry Through Every Token

Saying "warm" and using cold colors is not following through. Intent is not a label — it's a constraint that shapes every decision.

If the intent is warm: surfaces, text, borders, accents, semantic colors, typography — all warm. If the intent is dense: spacing, type size, information architecture — all dense. If the intent is calm: motion, contrast, color saturation — all calm.

Check your output against your stated intent. Does every token reinforce it?

---

# Step 6 — Propose: State Direction Before Building

Your direction must explicitly reference all four domain outputs: concepts you explored, colors from the color world, your signature element, and what replaces each default.

**The test:** Read your proposal. Remove the product name. Could someone identify what this is for? If not, it's generic. Explore deeper.

## Direction Proposal — What It Must Reference

```
Domain: [5+ concepts from the product's world]
Color world: [5+ colors that exist in this domain]
Signature: [one element unique to this product]
Rejecting: [default 1] → [alternative], [default 2] → [alternative], [default 3] → [alternative]

Direction: [approach that connects to the above]
```

Ask: "Does that direction feel right?" — only when the direction is genuinely ambiguous or there are multiple viable paths. If the direction is clear, state it briefly and proceed.

---

# Step 7 — Build: Implement With Craft

## Per-Component Design Checklist

Before writing UI code — even small additions — be able to answer:

```
Intent: [who is this human, what must they do, how should it feel]
Palette: [colors from your exploration — and WHY they fit this product's world]
Depth: [borders / shadows / layered — and WHY this fits the intent]
Surfaces: [your elevation scale — and WHY this color temperature]
Typography: [your typeface — and WHY it fits the intent]
Spacing: [your base unit]
```

Use this as an internal checklist. Surface it explicitly only when the user needs rationale or the tradeoffs are non-obvious. If you can't explain WHY for each choice, you're defaulting — stop and think.

## Craft Foundations

### Subtle Layering — The Backbone of Professional Interfaces

This is the quality floor regardless of design direction. You should barely notice the system working. When you look at Vercel's dashboard, you don't think "nice borders." You just understand the structure. The craft is invisible — and that's how you know it's working.

### Surface Elevation — Stack Surfaces, Don't Fragment Them

Surfaces stack. A dropdown sits above a card which sits above the page. Build a numbered elevation system starting from the base. In dark mode, higher elevation = slightly lighter. Each jump should be only a few percentage points of lightness — barely visible in isolation, but hierarchy emerges as surfaces stack.

**Key decisions:**
- **Sidebars:** Same background as canvas — a subtle border is all the separation needed. Different colors fragment the visual space.
- **Dropdowns:** One level above their parent surface, or they blend into the card.
- **Inputs:** Slightly darker than surroundings — inputs are "inset" and signal "type here" without heavy borders.

### Borders — Invisible When Idle, Findable When Needed

Use low-opacity rgba so borders define edges without demanding attention. Build a progression matching intensity to boundary importance: standard, softer, emphasis, focus rings.

**The squint test:** Blur your eyes. Hierarchy should still be perceivable. Nothing should jump out. If borders are the first thing you notice, they're too strong.

### Infinite Expression — No Two Interfaces Should Look the Same

Every pattern has infinite variations. Never produce identical output: same sidebar width, same card grid, same metric boxes every time signals AI-generated immediately.

A metric display could be a hero number, sparkline, gauge, progress bar, trend badge, or something new. The architecture should emerge from the task and data. Linear's cards don't look like Notion's. Vercel's metrics don't look like Stripe's. Same concepts, infinite expressions.

### Color — Ground It in the Product's Physical World

Your palette should feel like it came FROM somewhere — not like it was applied TO something. Before reaching for a palette, spend time in the product's world. What would you see in the physical version of this space? What materials, light, objects?

Temperature is one axis but not enough. Is this quiet or loud? Dense or spacious? Serious or playful? A trading terminal and a meditation app are both "focused" — completely different kinds of focus. Find the specific quality.

---

# Step 8 — Evaluate: Pre-Presentation Quality Check

**Before showing the user, look at what you made.**

Ask: "If they said this lacks craft, what would they mean?" That thing you just thought of — fix it first. Your first output is probably generic. The work is catching it before the user has to.

## Four Checks to Run Before Showing Anything

- **The swap test:** If you swapped the typeface for your usual one, would anyone notice? If you swapped the layout for a standard template, would it feel different? Wherever swapping wouldn't matter, you defaulted.
- **The squint test:** Blur your eyes. Can you still perceive hierarchy? Is anything jumping out harshly? Craft whispers.
- **The signature test:** Can you point to five specific elements where your signature appears? Not "the overall feel" — actual components. A signature you can't locate doesn't exist.
- **The token test:** Read your CSS variables out loud. Do they sound like they belong to this product's world, or could they belong to any project?

If any check fails, iterate before showing.

## Anti-Patterns — What to Actively Reject

- **Harsh borders** — If borders are the first thing you notice, they steal attention from content. Use low-opacity rgba so they define edges without demanding focus.
- **Dramatic surface jumps** — Large lightness gaps look like separate apps glued together. Whisper-quiet shifts (2–4% lightness) create hierarchy you feel rather than see.
- **Inconsistent spacing** — Random pixel values are the clearest signal that no design system exists. Every value should trace to a base unit.
- **Mixed depth strategies** — Combining borders-only with drop shadows fragments the visual language. One approach, committed to fully.
- **Missing interaction states** — Elements that don't respond to hover, focus, or disabled states feel like photographs of software. Users need feedback that the interface is alive.
- **Dramatic drop shadows** — Heavy shadows draw attention to chrome instead of content. Shadows should be barely perceptible — felt, not seen.
- **Large radius on small elements** — A 12px radius on a 32px button is a pill by accident. Scale radius to element size.
- **Pure white cards on colored backgrounds** — The contrast jump breaks surface hierarchy. Tint cards to match the page's color temperature.
- **Thick decorative borders** — Heavy borders fragment the visual field. Something else (spacing, surface color) should be doing the structural work.
- **Gradients and color for decoration** — Unmotivated color is noise. Every color application should communicate something: status, action, emphasis, or identity.
- **Multiple accent colors** — More accents = more competition = nothing stands out. One accent, used with intention, beats five without thought.
- **Different hues for different surfaces** — Gray card on a blue background reads as two separate interfaces. Same hue, shift only lightness.

---

# Step 9 — Wrap Up: Surface the Logic Behind Your Decisions

When you finish, close with the design direction and the concrete decisions that matter most:

- Direction and feel
- Depth strategy (borders, shadows, layered, or surface shifts)
- Spacing base unit
- Key component patterns worth reusing in this task

Do not rely on a saved memory file. Keep the rationale in the current response so the user can review it immediately.

---

# Workflow

## Communication Style — Stay Invisible, Not Silent

Be invisible. Don't announce modes, narrate process, or describe what you're doing before you do it.

**Never say:** "I'm in ESTABLISH MODE", "Let me check a saved system...", "I'll now run the domain exploration..."

**Instead:** Jump into work. State results, not process. Surface reasoning only when it helps the user make a decision.

---

# Reference Files — Load On Demand

Load these references only when you hit the scenario they solve. Do not preload all of them.

| Reference | Load when | What it gives you |
| --- | --- | --- |
| `references/example.md` | Before building, if you're unsure how subtle layering translates to actual UI decisions | Concrete sidebar, surface, border, and dropdown choices with reasoning |
| `references/principles.md` | You need token-level implementation detail, CSS patterns, dark mode specifics, spacing systems, or control token guidance | Full system-building reference: primitives, elevation hierarchy, depth strategies, typography, and more |
| `references/critique.md` | Before running `/interface-design:critique` or doing a post-build craft pass | Review protocol for catching what defaulted — composition, craft, content, and structure |
| `references/psychology.md` | When making hierarchy, layout, or interaction decisions and you need to understand the WHY behind patterns | Visual hierarchy, typography hierarchy, Hick's/Fitts's/Miller's/Jakob's Laws, Gestalt principles, cognitive load |

# Commands

- `/interface-design:status` — Current direction and design constraints in the active task
- `/interface-design:audit` — Check code against the intended interface direction. Read `references/principles.md` for the token and system standards to audit against.
- `/interface-design:extract` — Extract reusable patterns from existing code
- `/interface-design:critique` — Read `references/critique.md`, then critique your build for craft and rebuild what defaulted
