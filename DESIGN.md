# Design

Visual system for the Nails De Maison site. Source of truth for tokens is
`colors_and_type.css`; layout and component styles live in `site.css`. This
document captures the system so new work stays on-brand.

## Theme

French "maison" of nail care: editorial, calm, feminine, quiet luxury. Light
rosé surfaces carry the page; deep warm plum carries contrast bands (marquee,
ritual, booking card, footer). Brass hairlines as fine detail. A filmic grain
overlay (body::after) warms every surface.

## Color palette

All tokens defined in `colors_and_type.css` `:root`.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Ink (dark) | `--ink` | `#3A2A33` | Dark bands, primary buttons, display text |
| Ink soft | `--ink-soft` | `#4E3A45` | Secondary dark surfaces |
| Hover dark | `--espresso` | `#614A57` | Hovers on dark |
| Light surface | `--ivory` | `#F7EFEA` | Cards, light sections |
| Page bg | `--paper` | `#FCF7F3` | Body background |
| Panel | `--linen` | `#EFE0DA` | Panels, dividers, callouts |
| Primary accent | `--rose` | `#C27E8C` | Accent fills, selected states |
| Accent text | `--rose-deep` | `#9A536A` | Accent text on cream (AA on ivory) |
| Blush | `--blush` / `--blush-deep` | `#ECC9C8` / `#D49DA0` | Soft fills, emphasis |
| Supporting | `--mauve` / `--plum` | `#A88597` / `#6E4A5C` | Muted tones, rich accents |
| Botanical | `--sage` family | `#8B9079` etc. | Sparingly, botanical notes |
| Fine detail | `--brass` | `#BE9A6A` | Hairlines, eyebrow rules, frames |
| Body text | `--fg1` / `--fg2` / `--fg3` | ink / `#6A5560` / `#9A8590` | Primary / secondary / captions |
| Hero bg | (literal) | `#F2DCD8` | Hero blush, with texture image |

Rules: body text uses `--fg1`/`--fg2` (never `--fg3` for paragraphs); on dark
surfaces use `--ivory` and `--fg-on-ink-2` (`#CBB6C0`); never gray-on-color.

## Typography

| Role | Family | Token | Notes |
| --- | --- | --- | --- |
| Display | Marcellus | `--font-display` | Headlines, prices, brand. Single weight (400); scale carries hierarchy |
| Editorial serif | Cormorant Garamond | `--font-serif` | Leads, pull quotes, the italic `Home` accent |
| UI sans | Jost | `--font-sans` | Body, labels, buttons, nav |

Scale tokens: `--t-display` clamp(3.5–7rem), `--t-h1` clamp(2.5–4rem), `--t-h2`
clamp(1.9–2.75rem), `--t-lead` 1.375rem, `--t-body` 1.0625rem, `--t-eyebrow`
0.78rem tracked 0.28em uppercase. Hero h1 mobile override: clamp(2.3rem, 11vw, 3rem).

## Spacing & radii

Spacing scale `--s-1`(4px) … `--s-11`(160px). Section rhythm: `--s-10` (128px)
desktop, 64px at ≤600px. Radii: `--r-sm` 6px, `--r-md` 12px, `--r-lg` 20px,
`--r-pill` for buttons/chips. Cards and photos use `--r-md`.

## Motion

- Easing: `--ease` cubic-bezier(0.22,1,0.36,1); durations `--dur` 480ms, `--dur-fast` 240ms.
- **Reveal contract: transform-only entrances, opacity never animated.** Content
  must remain visible if a transition never fires (backgrounded tabs, headless).
  Reveals are a 14px translateY that settles; gated behind `html.anim`.
- Continuous motion (emblem float, marquee, scroll-cue bob) is gated behind
  `html.anim` and disabled under `prefers-reduced-motion`.
- Hover transforms: small lifts (−2/−3px) with soft shadows; photo zooms ≤1.07.

## Components

- **Buttons** (`.btn`): pill, uppercase 0.82rem tracked 0.16em. Variants:
  `solid` (ink), `outline`, `cream`, `outline-cream`, `sage` (rose fill).
- **Eyebrow** (`.eyebrow`): tracked uppercase rose-deep label with brass rule(s).
  Used as the established section-kicker system of this brand.
- **Header** (`.hdr`): fixed, transparent over hero, blurred ivory when scrolled;
  nav links with slide-in underline; hamburger + full-screen `mnav` below 980px.
- **Hero**: blush texture bg, brass passe-partout frame inset 24px (14px mobile),
  radial glow behind headline, centered content, meta row, scroll cue
  (`.hero-scroll`), 90svh so the marquee strip peeks (auto height ≤600px,
  top-aligned content below the fixed header).
- **Marquee strip** (`.strip`): dark band, Marcellus items with ✦ separators,
  edge-fade mask, infinite scroll.
- **Menu** (`.svc-cols`): letterpress-style rows (display-serif name, dotted
  rule, price). Two columns via `.cols-2` on desktop only; single centered
  column ≤980px. Never force columns with inline styles.
- **Gallery** (`.grid-shades`): 3-col (2-col ≤600px) of 3:4 photos, gentle zoom
  on hover, lightbox on tap. No captions.
- **Reviews** (`.quote`): blush band, oversized quote mark, auto-advancing
  carousel with dots/arrows, Google attribution link.
- **Booking modal** (`.bm-*`): branded calendar (date → time → details), chips
  and slots as pills, ink summary footer, success state with check. No
  third-party UI.
- **Footer**: ink band; brand, link columns, social discs (Instagram, Facebook,
  Google) that lift to a brass ring on hover.

## Layout

- Containers: `.wrap` 1240px / `.wrap-tight` 1000px, 32px gutters (22px ≤600px).
- Breakpoints: 980px (nav collapses, grids go single-column), 600px (phone
  rhythm: tighter sections, top-aligned hero, 2-col gallery).
- Dark/light banding gives the page its rhythm: blush hero → ink marquee →
  paper about → ivory menu → ink ritual → paper gallery → blush quote → paper
  booking (with ink card) → ink footer.
