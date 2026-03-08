# Critique Protocol — From Correct to Crafted

Your first build shipped the structure. Now look at it the way a design lead reviews a junior's work — not asking "does this work?" but "would I put my name on this?"

---

## The Gap Between Correct and Crafted

There's a distance between correct and crafted. Correct means the layout holds, the grid aligns, the colors don't clash. Crafted means someone cared about every decision down to the last pixel. You can feel the difference immediately — the way you tell a hand-thrown mug from an injection-molded one. Both hold coffee. One has presence.

Your first output lives in correct. This critique pulls it toward crafted.

---

## Layer 1 — Composition: Step Back and Read the Layout

Look at the whole thing before inspecting the parts.

**Does the layout breathe unevenly?** Great interfaces have rhythm — dense tooling areas give way to open content, heavy elements balance against light ones, the eye travels through the page with purpose. Default layouts are monotone: same card size, same gaps, same density everywhere. Flatness is the sound of no one deciding.

**Do your proportions mean something?** A 280px sidebar next to full-width content says "navigation serves content." A 360px sidebar says "these are peers." The specific number declares what matters. If you can't articulate what your proportions communicate, they're not communicating anything.

**Is there a clear focal point?** Every screen has one thing the user came here to do. That thing should dominate — through size, position, contrast, or the space around it. When everything competes equally, nothing wins and the interface feels like a parking lot.

---

## Layer 2 — Craft: Move Close, Pixel-Close

**Spacing grid** — Every value a multiple of 4, no exceptions. But correctness alone isn't craft. A tool panel at 16px padding feels workbench-tight; the same card at 24px feels like a brochure. The same number can be right in one context and lazy in another. Density is a design decision, not a constant.

**Typography** — Squint at the text. If size alone separates your headline from your body from your label, the hierarchy is too weak. Weight, tracking, and opacity create layers that size alone can't. You should be able to tell levels apart at arm's length.

**Surfaces** — Remove every border from your CSS mentally. Can you still perceive structure through surface color alone? If not, your surfaces aren't working hard enough. Hierarchy should live in the surfaces first, borders second.

**Interaction states** — Every button, link, and clickable region should respond to hover and press. Not dramatically — a subtle shift in background, a gentle darkening. Missing states make an interface feel like a photograph of software instead of software.

---

## Layer 3 — Content: Read It as a User Would

Read every visible string critically. Not checking for typos — checking for coherence.

**Does this screen tell one story?** Could a real person at a real company be looking at exactly this data right now? Or does the page title belong to one product, the article body to another, and the sidebar metrics to a third?

Content incoherence breaks the illusion faster than any visual flaw. A beautifully designed interface with nonsensical content is a movie set with no script.

---

## Layer 4 — Structure: Open the CSS and Find the Lies

Look for places that *look* right but are held together with tape.

Watch for: negative margins undoing a parent's padding, calc() values that exist only as workarounds, absolute positioning to escape layout flow. Each is a shortcut where a clean solution exists.

- Cards with full-width dividers → use flex column and section-level padding
- Centered content → use max-width with auto margins
- Overlapping elements → use z-index with an intentional stacking context

The correct answer is always simpler than the hack.

---

## Final Pass — The One Question That Matters

Look at your output one last time.

Ask: **"If they said this lacks craft, what would they point to?"**

That thing you just thought of — fix it. Then ask again.

The first build was the draft. The critique is the design.
