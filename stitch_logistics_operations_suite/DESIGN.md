```markdown
# Design System Specification: Architectural Logistics & Precision

## 1. Creative North Star: The Sovereign Intelligence
The "Sovereign Intelligence" aesthetic moves beyond utilitarian logistics into the realm of high-end consultancy and premium hardware. It is inspired by the intersection of McKinsey’s editorial authority and Apple’s physical minimalism. 

We reject the "cluttered dashboard" trope. Instead, we embrace **high-tonal depth, intentional asymmetry, and extreme whitespace**. The UI should feel like a physical object—machined steel, frosted glass, and ink-heavy paper. We communicate precision not through borders, but through the perfect alignment of typography and the subtle weight of layered surfaces.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. They create visual noise and "trap" content. Instead, define boundaries through:
- **Tonal Shifts:** Transitioning from `surface` (#f7fafc) to `surface-container-low` (#f1f4f6).
- **Negative Space:** Using the spacing scale to create distinct optical groupings.

### Surface Hierarchy & Nesting
Treat the interface as a series of stacked, physical layers. 
- **Base Layer:** `surface` (#f7fafc) — The "Desk."
- **Intermediate Layer:** `surface-container` (#ebeef0) — The "Work-mat."
- **Focus Layer:** `surface-container-lowest` (#ffffff) — The "Paper." Use this for primary content cards to create a natural, soft lift.

### Glass & Gradient (The "Atmospheric" Layer)
To evoke premium hardware, use Glassmorphism for floating elements (drawers, navigation bars).
- **Backdrop Blur:** 20px - 40px.
- **Fill:** `surface-container-lowest` at 70% opacity.
- **Signature Gradient:** For Hero CTAs and high-impact states, use a subtle linear gradient from `primary_container` (#0a1a3c) to `primary` (#000001). This creates "ink-depth" rather than flat digital color.

---

## 3. Typography: The Editorial Voice

We use **Manrope** as our sole typeface. Its geometric foundations ensure a modern, technological feel, while its open apertures allow for exceptional legibility in Spanish and Chinese (Simplified/Traditional) character sets.

*   **Display (Editorial Impact):** Use `display-lg` (3.5rem) with -2% letter spacing. This is for high-level data summaries or section headers. It should feel authoritative.
*   **Headlines (Structural Guidance):** `headline-md` (1.75rem) serves as the primary navigation anchor within modules.
*   **Body (Functional Clarity):** `body-lg` (1rem) is the workhorse. For Chinese characters, ensure a `line-height` of at least 1.6 to prevent dense visual "clumping."
*   **Labels (The "Meta" Layer):** `label-md` (0.75rem) should always be in All-Caps with +5% letter spacing when used in English to differentiate from body text.

---

## 4. Elevation & Depth: Tonal Layering

Shadows are an admission of failure in layout unless used for temporary "floating" states. 

*   **The Layering Principle:** Rather than `box-shadow`, place a `surface-container-lowest` (#ffffff) element on top of a `surface-container-low` (#f1f4f6) background. This provides 100% accessible contrast without visual "fuzz."
*   **Ambient Shadows:** If a component must float (e.g., a modal), use a shadow tinted with the `on-surface` color: `rgba(24, 28, 30, 0.06)` with a 40px blur and 20px offset.
*   **The Ghost Border:** For high-density data grids where separation is critical, use the `outline-variant` (#c5c6cf) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Status Badges (Signature Isometric)
Badges must not look like "pills." They are status indicators with a technical soul.
- **Structure:** `surface-container-highest` background with a 2px left-accent bar of the semantic color.
- **Icons:** Include a 16px **subtle isometric icon** (30-degree perspective) to the left of the text.
- **Semantic Mapping:**
    - **In Transit:** `primary_fixed_dim` (#b8c6f1) - Steel blue tones.
    - **Delayed:** `error` (#ba1a1a) - High-end oxblood, not "stoplight" red.
    - **Delivered:** `on_secondary_container` (#556479) - Sophisticated slate green/blue.

### Buttons: The "Tactile" Precision
- **Primary:** `primary_container` (#0a1a3c) background with `on_primary` (#ffffff) text. Use `md` (0.375rem) rounding for a "precision-cut" look.
- **Secondary:** Transparent background with a `Ghost Border`.
- **Tertiary:** Text only, using `label-md` (bold) with a subtle underline of 2px that only appears on hover.

### Cards & Lists: The "No-Divider" Rule
- Forbid horizontal rules `<hr>`.
- Separate list items using 12px of vertical padding and a background shift to `surface-container-low` on hover. This keeps the "canvas" clean and editorial.

### Input Fields
- **State:** Avoid boxing the input. Use a "Bottom-Line Only" approach or a very subtle `surface-variant` fill.
- **Focus:** Transition the bottom line to `primary_container` (#0a1a3c) with a 2px weight.

---

## 6. Do’s and Don’ts

### Do
- **Do** prioritize "Over-spacing." If it feels like too much white space, add 8px more.
- **Do** align Chinese and Spanish text to the same baseline, but increase line-height for Chinese to match the visual "weight" of Latin descenders.
- **Do** use `primary_fixed_dim` (#b8c6f1) for secondary data points to maintain the "Steel & Navy" McKinsey aesthetic.

### Don't
- **Don’t** use pure black (#000000) for text. Use `on_surface` (#181c1e) to keep the contrast high-end rather than harsh.
- **Don’t** use default Material Design "rounded" buttons (Full Radius). Stick to the scale: `md` (0.375rem) is our maximum for structural elements.
- **Don’t** use vibrant "Neon" colors. All semantic colors must be slightly desaturated to feel "Steel" and "Professional."