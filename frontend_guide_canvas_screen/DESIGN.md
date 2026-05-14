# Design System Specification: High-Performance Node Interface

## 1. Overview & Creative North Star
### The Creative North Star: "The Ethereal Engine"
This design system is engineered for the high-velocity world of database architecture and node-based logic. It moves away from the "clunky" dashboards of the past, embracing an aesthetic that feels like a precision instrument floating in a digital void. 

The system achieves a premium editorial feel through **intentional asymmetry** and **atmospheric depth**. Rather than rigid grids, we utilize "breathing" layouts where complex technical data is balanced by vast expanses of deep navy space. The goal is to make the developer feel they are interacting with a living, high-performance machine—one that is both powerful and elegantly light.

---

## 2. Colors: Depth and Luminance
The palette is built on a foundation of deep, atmospheric blues, contrasted by high-frequency electric accents.

### The "No-Line" Rule
To maintain a high-end feel, **do not use 1px solid borders for sectioning.** 
*   **The Rule:** Boundaries must be defined by shifts in background color (e.g., a `surface-container-low` panel resting on a `background` floor).
*   **Exception:** Functional UI elements (like active node connections) may use a glow effect, but never a standard grey stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the surface-container tiers to create "nested" depth:
*   **Base Floor:** `background` (#030f1a).
*   **Main Panels:** `surface-container-low` (#051520).
*   **Nested Components:** `surface-container-high` (#0e212f).
*   **Elevated Nodes/Modals:** `surface-bright` (#182e3e) with a backdrop blur.

### The "Glass & Gradient" Rule
Floating panels (nodes, context menus) should utilize a **Glassmorphism** effect.
*   **Token:** Use `surface` at 60% opacity with a `backdrop-filter: blur(12px)`.
*   **CTAs:** Use subtle linear gradients for primary actions (e.g., `primary` to `primary-container`) to give buttons a "lit from within" soul.

---

## 3. Typography: Technical Precision
We pair the high-character **Space Grotesk** for headlines with the utilitarian perfection of **Inter** for data.

*   **Display & Headlines:** Use `display-lg` to `headline-sm` in Space Grotesk. This introduces a subtle "brutalist" edge to the technical environment.
*   **Data & Labels:** All monospaced or technical data should use Inter (or optionally JetBrains Mono for code blocks). 
*   **The Hierarchy Strategy:** Use extreme scale differences. A large `display-md` title next to a tiny, letter-spaced `label-sm` creates an editorial contrast that feels sophisticated and intentional.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too heavy for this "Ethereal Engine." Instead, we use light and tone to imply position.

### The Layering Principle
Instead of a drop shadow, elevate a card by moving it from `surface-container-low` to `surface-container-highest`. This "soft lift" feels more modern and integrated.

### Ambient Glows
When a "floating" effect is mandatory (e.g., an active database node):
*   **Shadow:** Use a large blur (24px+) at a very low opacity (6%) using the `primary` color token instead of black.
*   **Ghost Border:** If a container requires a border for clarity, use `outline-variant` at **15% opacity**. This creates a "glint" of light on the edge rather than a structural wall.

---

## 5. Components: Fluid Primitives

### Primary Buttons
*   **Style:** `primary` background with `on-primary` text. 
*   **Radius:** `md` (0.375rem).
*   **State:** On hover, apply a `primary_dim` glow effect. Avoid heavy borders; let the color do the work.

### Database Nodes (Cards)
*   **Construction:** Forbid the use of divider lines. 
*   **Separation:** Use vertical white space and `surface-container` shifts to separate the "Header," "Fields," and "Relations" within a node.
*   **Active State:** Use a 1px "Ghost Border" of `secondary` (#7eabfc) to indicate selection.

### Input Fields
*   **Background:** `surface-container-lowest` (pure black/deep navy).
*   **Border:** `outline-variant` at 20% opacity.
*   **Focus:** A 1px glow using the `primary` token. No heavy focus rings.

### The "Connection" Line
*   **Visual:** Thin, 1.5px paths using `secondary` or `tertiary`. 
*   **Animation:** For active data flows, use a CSS gradient animation that "pulses" from `primary` to `primary-dim` along the path.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `inter` for all readable code and table data to ensure maximum legibility.
*   **Do** embrace negative space. If a panel feels crowded, increase the spacing scale rather than adding a divider.
*   **Do** use `primary_fixed_dim` for "read-only" labels to give them a premium, metallic look.

### Don’t:
*   **Don't** use 100% opaque borders. They break the illusion of the "Vanta.js Fog" background moving behind the UI.
*   **Don't** use standard "Material" shadows. They look dirty on dark navy backgrounds. Use tinted ambient glows instead.
*   **Don't** use pure white (#FFFFFF) for body text. Use `on-surface-variant` (#9fadbb) to reduce eye strain and maintain the dark-mode atmosphere.