# Design System Document: The Serene Healer

## 1. Overview & Creative North Star: "The Living Sanctuary"
This design system moves beyond the clinical coldness of traditional medical apps to create "The Living Sanctuary." The North Star is an editorial, high-end digital experience that feels as much like a premium wellness magazine as it does a medical tool.

We break the "template" look of WeChat Mini Programs by rejecting rigid grids in favor of **Intentional Asymmetry** and **Tonal Depth**. By utilizing overlapping card elements and a sophisticated hierarchy of "surfaces" rather than lines, we create a professional yet breathing space that guides the user’s eye toward health and recovery.

## 2. Colors: Tonal Atmosphere
The palette is rooted in a "Quiet Authority." We use Blue to represent medical precision and Green to represent organic growth.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** To achieve a premium look, boundaries must be defined solely through background color shifts. Use `surface-container-low` for secondary sections and `surface-container-lowest` (pure white) for primary interaction cards.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Base Layer:** `surface` (#f9f9fe).
- **Secondary Sectioning:** `surface-container` (#ededf2).
- **Primary Interaction Cards:** `surface-container-lowest` (#ffffff) sitting atop the base layer to create a soft, natural lift.

### The "Glass & Signature" Rule
- **Glassmorphism:** For floating headers or bottom navigation, use `surface` with a 70% opacity and a 20px backdrop-blur. This ensures the content "bleeds" through, making the app feel integrated.
- **Signature Textures:** Main Call-to-Actions (CTAs) should use a subtle linear gradient: `primary` (#0058bc) to `primary_container` (#0070eb) at a 135-degree angle. This adds "soul" and depth that a flat hex code cannot provide.

## 3. Typography: Editorial Authority
We pair **Plus Jakarta Sans** (Display/Headlines) with **Inter** (Body/Labels) to balance modern character with maximum legibility.

- **Display & Headlines (Plus Jakarta Sans):** Use `headline-lg` (2rem) for hero stats (e.g., daily steps) to command attention. The high x-height of Jakarta Sans feels optimistic and premium.
- **Body (Inter):** Use `body-md` (0.875rem) for medical descriptions. Inter is engineered for screen readability, ensuring that complex health data is never exhausting to read.
- **Labels:** Use `label-md` (0.75rem) in `on_surface_variant` (#414755) for metadata. The reduced contrast prevents the UI from feeling "cluttered."

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are forbidden. We use "Ambient Shadows" and "Tonal Stacking."

- **The Layering Principle:** To highlight a health report card, place a `surface-container-lowest` card on a `surface-container-low` background. The shift in hex value provides all the separation needed.
- **Ambient Shadows:** For the "醒目" (Striking) check-in button, use a shadow color tinted with the primary color: `rgba(0, 88, 188, 0.08)` with a 24px blur and 8px Y-offset.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use `outline_variant` at **15% opacity**. Never use 100% opaque borders.

## 5. Components: Intentional Simplicity

### The Signature Check-in Button (Action CTA)
- **Style:** High-pill shape (`rounded-full`).
- **Color:** Gradient from `secondary` (#006e28) to `secondary_container` (#6ffb85).
- **Interaction:** A subtle `scale(0.98)` on tap to provide haptic-like visual feedback.

### Cards & Lists: The "Invisible" Container
- **Cards:** Use `rounded-md` (12px) or `rounded-lg` (16px). Forbid the use of divider lines.
- **Lists:** Separate items using `spacing-4` (1rem) of vertical white space. If separation is visually required, use a thin `surface-variant` horizontal bar that doesn't touch the edges of the screen (inset dividers).

### Input Fields
- **Style:** Minimalist. No bottom line or box. Use a `surface-container-high` background with `rounded-sm` (8px).
- **Active State:** Transition the background to `surface-container-lowest` and apply a 2px "Ghost Border" of `primary`.

### Health Progress Tracks
- Use `secondary_fixed` for the track background and `secondary` for the progress fill. This creates a monochromatic, "healthy" depth that feels sophisticated.

## 6. Do’s and Don’ts

| Do | Don't |
| :--- | :--- |
| **Do:** Use `spacing-8` or `spacing-10` to create "Editorial Breathing Room" between major sections. | **Don't:** Cram information into a single screen to avoid scrolling. Health data needs air. |
| **Do:** Use `tertiary` (#4c4aca) for "insight" or "educational" chips to distinguish them from "actions." | **Don't:** Use more than three distinct colors in a single card component. |
| **Do:** Use `surface-dim` for inactive states to maintain the professional, clinical tone. | **Don't:** Use 1px #CCCCCC borders. They look like "out-of-the-box" templates. |
| **Do:** Align text-heavy content to a strict 16px (spacing-4) side margin. | **Don't:** Use "Floating" shadows that are grey or black; they muddy the "Sanctuary" vibe. |

## 7. Spacing & Rhythm
Consistency is maintained through a 4px base unit.
- **Card Internal Padding:** `spacing-5` (1.25rem).
- **Section Gaps:** `spacing-8` (2rem).
- **Component Radius:** Standardize on `md` (12px) for cards and `full` (999px) for interactive buttons to create a "soft-touch" interface.
