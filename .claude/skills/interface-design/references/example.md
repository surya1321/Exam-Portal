# Subtle Layering in Practice — How to Translate Principles into Decisions

The subtle layering principle says you should barely notice the system working. This file shows how that translates into specific component decisions. Learn the thinking, not the values — your palette will differ, but the reasoning pattern won't.

---

## The Core Mindset

**You should barely notice the system working.**

When you look at Vercel's dashboard, you don't think "nice borders." You just understand the structure. When you look at Supabase, you don't think "good surface elevation." You just know what's above what. The craft is invisible — and that's how you know it's working.

Every example below follows the same logic: make the smallest change that creates the right distinction.

---

## Example: Dashboard with Sidebar and Dropdown

### Surface Jump Size — Why So Subtle?

Each elevation jump should be only a few percentage points of lightness. You can barely see the difference in isolation. But when surfaces stack, hierarchy emerges. This is the Vercel/Supabase approach — whisper-quiet shifts that you *feel* rather than see.

**The mistake to avoid:** Dramatic jumps between elevations, or using different hues for different levels. Keep the same hue across your entire surface system — shift only lightness to build elevation.

### Sidebar Color — Why Match the Canvas?

Many dashboards use a different background for the sidebar. This fragments the visual space — you end up with "sidebar world" and "content world" as two separate visual systems competing for attention.

**The better approach:** Same background as canvas, separated by a subtle border. The sidebar is part of the app, not a separate region. Vercel does this. Supabase does this. The border is enough.

### Dropdown Elevation — Why One Level Above Its Parent?

The dropdown floats above the card it emerged from. If both share the same surface color, the dropdown blends into the card — you lose the sense of it hovering. Bringing it one elevation level up creates the sense of floating without being jarring.

**Paired with:** A slightly higher border opacity on overlays (popovers, dropdowns) because they're floating in space without context to anchor them. A touch more definition helps them feel contained.

---

## Example: Form Controls

### Input Background — Why Darker, Not Lighter?

Inputs are "inset" — they *receive* content, they don't project it. A slightly darker background signals "type here" without needing heavy borders. This is the inset principle: recessed surfaces feel interactive.

**The mistake to avoid:** Making inputs lighter than cards. A lighter input floats above its context instead of sitting inside it. The wrong direction breaks the "where do I interact?" mental model.

### Focus State — Why Subtle Rather than Glowing?

Focus needs to be visible — accessibility isn't optional. But you don't need a glowing ring or dramatic color. A noticeable increase in border opacity accomplishes the state change clearly.

**The principle:** Subtle-but-noticeable, not dramatic-and-distracting. Focus is communication, not decoration.

---

## Adapting to Your Context

These examples use dark mode defaults, but the same logic applies everywhere:

- **Warmer hues:** Shift the base toward yellow/orange — the elevation logic stays the same
- **Cooler hues:** Shift toward blue-gray — borders and surfaces still progress by small lightness increments
- **Light mode:** Higher elevation uses shadow instead of lightness. Cards cast a subtle shadow on the canvas. The principle (small distinguishable differences) is constant, the method inverts.

**What never changes:** barely different, still distinguishable. The values adapt. The approach doesn't.

---

## Quick Craft Check

Before shipping any layered UI, run the squint test:

1. Blur your eyes or step back from the screen
2. Can you still perceive which regions are which?
3. Is anything jumping out at you — borders, shadows, color shifts?
4. Can you tell what's above what?

If hierarchy is visible and nothing is harsh — the layering is working. If you have to explain the structure to make it visible, the surfaces aren't doing their job yet.
