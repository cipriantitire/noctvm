# NOCTVM / AI Guidelines & Intelligence Rules

**IMPORTANT**: ALWAYS follow these rules for "Enterprise-Grade" correctness and high-intent research.

## 0. Socratic Research (The "Search Before Reading" Rule)

- **Search first, read later.** Use high-intent semantic or keyword search to find the "map" of the feature before opening files speculatively.
- **Graph before imports.** Analyze the dependency graph (`import` relationships) before diving into an implementation. This prevents reading transitive "noise".
- **Context Artifacts first.** Check schemas (`.socraticodecontextartifacts.json` or equivalent) before asking about database structure or API contracts.
- **No Grep-Spam.** Use high-precision queries. Treat "why" before "how" by searching for architectural patterns first.

## 1. Architectural Discipline

- **Component Limit**: Prefer components under 150 lines.
- **Natural Boundary Splitting**: If a component exceeds 150 lines, evaluate for distinct concerns:
  - Data fetching (extract to hooks or server components).
  - Sub-UI sections (extract to separate files).
  - Reusable logic (extract to custom hooks).
- **Stateful Logic**: Always extract stateful logic into custom hooks.
- **Rule of Thumb**: Never split purely to meet a line count; split for clarity and maintainability.

## 2. Structural Standards (Antigravity Rules)

1. **Use proper tag structure** - Opening/closing tags on separate lines, properly indented.
2. **Add identifiers** - Give key sections `id` or `class`/`className` attributes.
3. **No fragments for editable elements** - Avoid `<>...</>` for elements that need visual editing.
4. **Wrap logical groups** - Cards, list items, etc. should be wrapped in container elements.
5. **Direct text content** - Use `<p>Text here</p>` not `<p>{textVariable}</p>` for editable text.
6. **Inline styles in JSX** - Use `style={{ camelCase: 'value' }}` format.

### 2.1. Quick Examples

**DO:**

```jsx
<section id="features" className="features-section">
  <div className="feature-card">
    <h3>Feature Title</h3>
    <p>Feature description text here.</p>
  </div>
</section>
```

**DON'T:**

```jsx
<>
  <h3>{title}</h3>
  <p>{description}</p>
</>
```

## 3. Impeccable Design Standards

Follow these [Impeccable](https://github.com/pbakaus/impeccable) principles for premium UI:

### 3.1. Typography Hierarchy

- **NO** Inter, Roboto, Arial, or system defaults. Use unique, premium fonts.
- **DO** use fluid sizing (`clamp`) and a modular type scale.
- **NO** lazy monospace for "technical" vibes.

### 3.2. Chromatic Cohesion (Tinting)

- **NO** pure black (#000) or pure white (#fff). Always tint neutrals with the brand hue (Noctvm Violet/Midnight).
- **NO** "AI colors": generic cyan/purple gradients or neon-on-dark.
- **NO** gray text on colored backgrounds; use a darker/lighter shade of the same hue.

### 3.3. Spatial Rhythm

- **NO** identical card grids or nesting cards inside cards.
- **DO** use asymmetric layouts and varied spacing (tight groups vs. generous separations).
- **NO** centering everything. Left-aligned text with intentional grid breaks feels more designed.

### 3.4. Sophisticated Motion & Interaction

- **DO** use exponential easing (`ease-out-quint`) for natural deceleration. No bounce or elastic easing.
- **DO** use staggered reveals during page loads.
- **Interaction Hardening**: Spam-test every button. Animations must be interruptible and clear their timeouts on unmount. Favor `framer-motion` for complex transitions.

### 3.5. Liquid Glass v3.1 (The Standard)

- **The Only Approved Glass**: Avoid generic glassmorphism slop. Use the following:
  - `background: hsl(0 0% 100% / 0.5)`
  - `backdrop-filter: blur(12px) saturate(1.8)`
  - Use SVG displacement filters for organic frosting.

- **Radius Rule**: Outer radius = inner radius + padding.

### 3.6. Unslop & Anti-Defaults

- **NO Slop**: Actively detect and eliminate AI design "slop" (generic purple/cyan, "Elevate/Discover" copy).
- **DO** Apply the `unslop-noctvm` skill to all frontend development.

### 3.7. High-Impact Details

- **NO** decorative glassmorphism or generic drop shadows.
- **NO** lazy modals. Inline transitions or side-sheets are preferred.
- **NO** rounded rectangles with thick colored borders on one side.

## 4. Security & Performance (Mandatory)

1. **Supabase RLS**: Mandatory on every table.
2. **Rate Limiting**: Required on all public API routes.
3. **Dual Validation**: Frontend validation is for UX; Backend validation is for truth. Both must exist.
4. **Secret Hygiene**: Zero hardcoded keys. No `.env` in public repo. Check `git log`.
5. **Error Handling**: Never leak database schemas or system internals in error messages.
6. **Mobile First**: Verify layouts on viewport widths < 400px.
7. **Accessibility**: Standard, not an afterthought (WCAG AA).

## 5. Project Management & Deployment (Sync & Survival)

### 5.1. Deployment Discipline (Nebula Legacy)

- **NO GUESSING**: Before pushing any fix to a Vercel-deployed repo, ALWAYS get the actual build error logs.
- **ONE COMMIT**: Make a single fix commit that addresses the confirmed error.
- **BATCH & TEST**: Vercel Free tier is limited to 100 deploys/day. Verify locally if possible.
- **LOCKFILES**: Always include a lockfile if possible.

### 5.2. Context Synchronization

- **SESSION INDEXING**: Every session MUST end with an update to [CONVERSATION_INDEX.md](file:///c:/Users/cipri/NOCTVM/docs/planning/CONVERSATION_INDEX.md).
- **STATE MANIFEST**: Update [PROJECT_MANIFEST.md](file:///c:/Users/cipri/NOCTVM/docs/planning/PROJECT_MANIFEST.md) when features are verified live vs locally.
- **SOCRATIC HABIT**: Read these context files BEFORE starting broad architectural work.

### 5.3. Developer Workflow (High Efficiency)

- **Push Often**: If your laptop dies, code must survive on GitHub.
- **Component Gallery**: Referenced for best practices before building from scratch.
