# Design

## Theme

Strictly dark mode. The interface lives at night — deep tinted blacks with violet accents. No pure #000; the canonical background is `#050505` with violet-tinted midnight `#1a0a2e`. The aesthetic evokes high-end nightlife: premium, exclusive, nocturnal.

## Color Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--noctvm-black` | `#050505` | `5 5 5` | Canonical background, page base |
| `--noctvm-midnight` | `#1a0a2e` | `26 10 46` | Deep tinted surfaces, gradients |
| `--noctvm-violet` | `#7c3aed` | `124 58 237` | Primary accent, CTAs, active states |
| `--noctvm-gold` | `#d4a843` | `212 168 67` | Secondary accent, highlights, special states |
| `--noctvm-silver` | `#9ca3af` | `156 163 175` | Body text, secondary text, muted content |
| `--noctvm-emerald` | `#10b981` | `16 185 129` | Success states, confirmations |
| `--noctvm-surface` | `#0a0a0a` | `10 10 10` | Card/panel backgrounds |
| `--noctvm-surface-light` | `#111111` | `17 17 17` | Elevated surfaces, inputs |
| `--noctvm-border` | `#1a1a1a` | `26 26 26` | Subtle borders, dividers |

**Semantic aliases** (for animate-ui/shadcn compatibility):
- `--background` → `--noctvm-black`
- `--foreground` → `#ffffff`
- `--primary` → `--noctvm-violet`
- `--muted` → `--noctvm-surface`
- `--muted-foreground` → `--noctvm-silver`
- `--destructive` → `#ef4444`
- `--ring` → `--noctvm-violet`

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / Headings | FreshID (local) | 200-800 | Hero text, section titles, brand moments |
| Body / UI | Satoshi (local) | 300-900 | All body text, labels, descriptions |
| Data / Technical / Mono | JetBrains Mono (Google) | 400 | Timestamps, code, micro-labels, stats |

**Type scale** (Tailwind tokens):
- `text-noctvm-xs`: 8px
- `text-noctvm-micro`: 9px
- `text-noctvm-caption`: 10px
- `text-noctvm-label`: 11px
- `text-noctvm-sm`: 12px
- `text-noctvm-base`: 13px
- `text-noctvm-xl`: 20px
- `text-noctvm-2xl`: 22px

**Heading treatment**: Bold, `tracking-wider`, `uppercase` for FreshID display text.
**Mono treatment**: `tracking-widest`, `uppercase` for micro-labels.

## Spacing

4px base grid. Token scale:
- `--space-1` through `--space-6`: 0.25rem → 1.5rem
- Extended: `--space-7` (1.75rem), `--space-8` (2rem), `--space-10` (2.5rem), `--space-12` (3rem), `--space-16` (4rem), `--space-20` (5rem), `--space-24` (6rem)

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.75rem (12px) | Small elements, tags |
| `--radius-md` | 1rem (16px) | Buttons, inputs |
| `--radius-lg` | 1.25rem (20px) | Cards, panels |
| `--radius-xl` | 1.875rem (30px) | Modals, sheets |
| `--radius-2xl` | 2.25rem (36px) | Large containers |
| `--radius-3xl` | 2.75rem (44px) | Hero sections |

**Radius Rule**: Outer radius = inner radius + padding. Applied via `corner-shape: squircle` where supported.

## Elevation / Glass

**Liquid Glass v3.1** — the only approved glass standard:

| Variant | Background | Blur | Saturation | Border | Shadow |
|---------|-----------|------|------------|--------|--------|
| `.frosted-glass` | `hsla(0, 0%, 100%, 0.07)` | 12px | 2.0 | `rgba(255,255,255,0.1)` | Inset highlight + outer + violet glow |
| `.frosted-glass-subtle` | Near-transparent | 4px | Low | Near-invisible | Minimal |
| `.frosted-glass-modal` | `rgba(18,18,18,0.88)` | 12.8px | 1.0 | `rgba(255,255,255,0.1)` | Soft shadow |
| `.frosted-glass-header` | `hsla(0, 0%, 5%, 0.75)` | 25px | 2.5 | Bottom-only | None |
| `.frosted-noise` | — | — | — | — | SVG displacement filter (`#glass-distortion`) |

**SVG Filters**: Global `glass-distortion` and `glass-distortion-nav` filters defined in `layout.tsx`.

**GlassPanel Component Variants**:
- `card` → `.frosted-glass`
- `modal` → `.frosted-glass-modal` + `.frosted-noise`
- `sheet` → `.frosted-glass-modal` + `.frosted-noise`
- `popover` → `.frosted-glass-subtle`
- `nav` → `.frosted-glass-header`
- `input` → `.frosted-glass`
- `button` → `.glass-button`

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Hover states, micro-interactions |
| `--duration-normal` | 300ms | Transitions, reveals |
| `--duration-slow` | 500ms | Page transitions, complex animations |

**Easing**: Exponential deceleration (`ease-out-quint`) for all entrances. No bounce, no elastic.
**Staggered reveals**: Used on page loads for cards and lists.
**Reduced motion**: Glass effects flatten under `prefers-reduced-motion` and `prefers-contrast: more`.

## Z-Index Scale

| Token | Value | Layer |
|-------|-------|-------|
| `--z-dropdown` | 70 | Dropdowns, select menus |
| `--z-sheet` | 80 | Bottom sheets, side panels |
| `--z-popover` | 90 | Popovers, tooltips |
| `--z-modal` | 100 | Modal overlays |
| `--z-modal-content` | 105 | Modal content |
| `--z-overlay` | 110 | Full-screen overlays |
| `--z-viewer` | 200 | Media viewers, stories |
| `--z-toast` | 200 | Toast notifications |

## Components

### Button
- **Primary**: Gradient `from-noctvm-violet to-purple-500`, white text, shadow glow
- **Secondary**: `border-white/10`, `bg-black/40`, `text-noctvm-silver`
- **Ghost**: `text-noctvm-silver`, hover white, `text-noctvm-micro uppercase tracking-widest`
- **Submit**: Solid violet, `text-noctvm-caption uppercase tracking-widest`
- **Outline**: `border-noctvm-border`, transparent bg

### Card
Uses `GlassPanel` with `card` variant. No side-stripe borders. No nesting cards inside cards.

### Input / Field
Uses `GlassPanel` with `input` variant. Labels use `text-noctvm-micro`.

### Modal
Uses `GlassPanel` with `modal` variant. Backdrop uses `.modal-frost-overlay` (`blur(12px) saturate(1.8)`).

### Scrollbar
Custom violet gradient scrollbar (4px default, 8px for `.custom-scrollbar`). Hidden on mobile.

## Dark Mode

NOCTVM is **dark mode only**. No light mode toggle. The `dark` class is applied at the HTML root.

## Accessibility

- WCAG AA target
- `prefers-reduced-motion`: Glass flattens, animations disabled
- `prefers-contrast: more`: Glass becomes solid, borders strengthen
- Focus rings use `--noctvm-violet`
