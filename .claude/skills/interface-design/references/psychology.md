# Design Psychology — Why Interfaces Work (or Don't)

Good interface design isn't just about aesthetics — it's grounded in how humans perceive, process, and decide. These principles explain WHY certain patterns work, so you can make informed decisions instead of copying conventions blindly.

## Table of Contents

- [Visual Hierarchy](#visual-hierarchy) — Controlling where the eye goes
- [Typography Hierarchy](#typography-hierarchy) — Making text structure legible at a glance
- [Core Decision-Making Laws](#core-decision-making-laws) — Hick's, Fitts's, Miller's, Jakob's
- [Gestalt Perception Principles](#gestalt-perception-principles) — How the brain groups and patterns
- [Cognitive Load & Emotional Design](#cognitive-load--emotional-design) — Reducing effort, building trust

---

## Visual Hierarchy

Visual hierarchy is the arrangement of elements to guide the eye in order of importance. Without it, every element competes equally and the user's brain has to work to figure out what matters — which means they often give up.

### How to Build Hierarchy

**Size and scale** — Larger elements draw attention first. The most important element on the screen (the primary action, the key metric, the page title) should be visually dominant. But dominance is relative — it only works if other elements are noticeably smaller.

**Contrast and weight** — High contrast (dark on light, or light on dark) pulls focus. Low contrast recedes. Use contrast to separate foreground content from background structure. Bold weight attracts before regular weight; color attracts before gray.

**Spatial position** — Users scan predictably. In left-to-right languages, the top-left quadrant gets the most attention. Primary content sits high and left; secondary content drifts right and down. Eye-tracking consistently shows F-shaped and Z-shaped scanning patterns:
- **F-pattern:** Users scan across the top, then down the left side, making horizontal scans at decreasing lengths. Place key information along this path.
- **Z-pattern:** For simpler layouts, the eye moves top-left → top-right → bottom-left → bottom-right. Landing pages and hero sections benefit from this flow.

**White space as emphasis** — The more space around an element, the more important it appears. Crowded elements feel equal; isolated elements feel significant. White space isn't wasted space — it's a hierarchy tool.

**Color as signal, not decoration** — A single accent color in a sea of neutrals screams for attention. This is the **Von Restorff Effect** (isolation effect): when multiple similar objects are present, the one that differs is remembered. This is exactly why CTA buttons use high-contrast colors — they're designed to be the one thing that breaks the pattern.

---

## Typography Hierarchy

Typography hierarchy makes text structure legible at a glance — before the user reads a single word. When hierarchy is weak, users can't scan effectively and the interface feels like a wall of text.

### Building Effective Type Hierarchy

**Use at least four levels** — headline, subhead, body, and caption/metadata. Each level should be distinguishable at arm's length through a combination of:
- **Size** — headline ≥ 1.5× body size
- **Weight** — headline bold (600–700), body regular (400), labels medium (500)
- **Letter-spacing** — tighter for headlines (presence), slightly wider for small labels (legibility)
- **Opacity/color** — primary text at full contrast, secondary text muted, metadata further muted

**Size alone is insufficient.** If you only change font size between levels, the hierarchy will be too weak to scan. Combine size + weight + color for each level to make them visually distinct without reading the content.

**Monospace for data.** Numbers, IDs, timestamps, and code belong in monospace with `font-variant-numeric: tabular-nums` for columnar alignment. Monospace signals "this is data" and keeps numbers vertically aligned in tables and lists.

**Line height matters.** Headlines need tight line height (1.1–1.2) for visual density. Body text needs generous line height (1.5–1.7) for comfortable reading. Mismatched line heights make text blocks feel unstable.

---

## Core Decision-Making Laws

These laws describe how humans make choices and interact with targets. Violating them creates friction; respecting them makes interfaces feel effortless.

### Hick's Law — Fewer Choices, Faster Decisions

> The time to make a decision increases logarithmically with the number of options.

When you present users with too many choices at once, decision-making slows or stalls entirely ("choice paralysis"). This is why effective interfaces:
- **Use progressive disclosure** — show essential options first, reveal advanced ones on demand
- **Provide smart defaults** — pre-select the most common choice so the user only acts if they need to deviate
- **Group and categorize** — turn 20 flat options into 4 groups of 5

**In practice:** A settings page with 30 ungrouped toggles overwhelms. The same settings organized into 5 categories with the most common pre-configured feels manageable.

### Fitts's Law — Size and Distance Determine Speed

> The time to reach a target is a function of the target's size and distance from the starting point.

Larger, closer targets are faster to hit. This directly shapes where you place interactive elements:
- **Primary actions should be large and within easy reach** — full-width buttons on mobile, prominent placement in the visual flow on desktop
- **Destructive actions should be smaller and further from primary actions** — reducing accidental activation
- **Corner and edge targets benefit from infinite depth** — elements against screen edges are easier to hit because the cursor can overshoot

**In practice:** A "Submit" button shoved into a corner at 12px font violates Fitts's Law. The same action as a prominent, full-width button near the form content respects it.

### Miller's Law — Chunk Information into Groups of 7±2

> The average person can hold about 7 (plus or minus 2) items in short-term memory at once.

When users encounter more than ~7 items in an unstructured list, retention and scanning degrade. Designers compensate by:
- **Chunking** — breaking long lists into meaningful groups (a 12-item navigation becomes 3 groups of 4)
- **Visual grouping** — using spacing, dividers, or headers to create perceivable clusters
- **Limiting visible options** — showing 5–7 items and hiding the rest behind "Show more" or tabs

**In practice:** A flat dropdown with 25 options is hard to use. The same options grouped into 4 labeled sections with 5–7 items each feels natural.

### Jakob's Law — Consistency With Existing Patterns

> Users spend most of their time on other sites and prefer yours to work the same way.

Users bring expectations from every other interface they use daily. When you deviate from established patterns, you force users to learn new behaviors — which feels like friction even if your pattern is objectively better. Respect conventions for:
- **Navigation placement** — logo top-left linking to home, primary nav along top or left
- **Form behavior** — Tab to move between fields, Enter to submit
- **Iconography** — gear for settings, magnifying glass for search, X for close
- **Interaction patterns** — swipe to delete on mobile, right-click for context menus

**When to break Jakob's Law:** Only when the deviation is so clearly superior that the learning cost pays for itself. If it's just "slightly different," follow the convention.

---

## Gestalt Perception Principles

The brain naturally seeks patterns and structure to simplify complexity. These principles describe how humans *automatically* group and organize visual elements — whether you intend it or not.

### Proximity — Close Things Belong Together

Elements near each other are perceived as a group, even without borders or lines. This is the most powerful grouping cue in interface design:
- Related form fields should be closer to each other than to unrelated fields
- Spacing between groups should be noticeably larger than spacing within groups
- A label 8px from its input but 24px from the next label clearly belongs to its input

**The mistake:** Using uniform spacing everywhere. When everything is equidistant, nothing is grouped, and the interface reads as a flat list instead of structured information.

### Similarity — Same Look, Same Function

Objects that share visual properties (color, shape, size, weight) are perceived as having the same function:
- All clickable elements should share visual traits (color, underline, cursor change)
- Status indicators should use consistent color coding (green = success, red = error)
- Card types with different functions should have visually distinct treatments

**The mistake:** Using the same card style for metrics, actions, and navigation. The user can't distinguish function from appearance.

### Closure — The Brain Completes Incomplete Shapes

Humans tend to perceive incomplete shapes as whole. Designers use this to:
- Create icons with implied shapes (a play button is just a triangle, but we see a "play" concept)
- Suggest hidden content (a partially visible card at the edge of a carousel implies "more")
- Build compact logos and marks that feel complete despite missing pieces

### Continuity — The Eye Follows Lines and Curves

Elements arranged along a line or curve are perceived as related and following a direction. Use this for:
- Progress indicators and step flows
- Data visualization (trendlines naturally suggest continuation)
- Horizontal scrolling areas (aligning items on a shared baseline)

---

## Cognitive Load & Emotional Design

### Reducing Cognitive Load

Cognitive load is the mental effort required to use a system. High cognitive load causes errors, frustration, and abandonment. Reduce it through:

**Progressive disclosure** — Show only what's needed now. Advanced settings, detailed explanations, and edge-case options reveal on demand. The user sees simplicity; the power is behind one click.

**Clear navigation and wayfinding** — Users should always know where they are, how they got here, and how to get back. Breadcrumbs, active states in navigation, and consistent page titles prevent the "lost in the app" feeling.

**Recognition over recall** — Show options rather than requiring users to remember them. Dropdowns beat text inputs for known option sets. Recent items and favorites reduce the need to navigate from scratch.

### Color Psychology

Colors evoke specific emotional responses. Use this intentionally:

| Color | Common Association | Typical Use |
|-------|-------------------|-------------|
| Blue | Trust, stability, calm | Finance, enterprise, medical |
| Green | Growth, success, safety | Confirmations, positive status, environmental |
| Red | Urgency, danger, energy | Errors, destructive actions, e-commerce CTAs |
| Orange/Yellow | Warmth, attention, caution | Warnings, highlights, creative tools |
| Purple | Premium, creative, luxury | Design tools, premium tiers |
| Neutral/Gray | Structure, professionalism | Backgrounds, secondary text, borders |

**Don't use color alone to communicate.** Colorblind users (8% of males) need redundant cues — icons, text labels, or patterns alongside color.

### Aesthetic-Usability Effect

Users perceive attractive interfaces as more usable — and they're more forgiving of minor functional flaws when the UI looks high-quality. This isn't vanity; it's a documented cognitive bias.

The implication: visual polish is not a nice-to-have. A well-crafted interface earns the user's patience and trust. A rough interface makes every friction point feel worse than it is.

### Social Proof

When users see that others have made the same choice, it validates their decision:
- Star ratings and review counts on products
- "Used by 10,000+ teams" on SaaS landing pages
- Activity indicators ("3 people are viewing this")
- Testimonials placed near conversion points

Social proof works because humans are uncertainty-averse — seeing others' positive experiences reduces perceived risk.
