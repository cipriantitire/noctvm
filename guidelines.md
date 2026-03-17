# NOCTVM Agent Guidelines (Vibe Coder Edition)

## 🏗️ Architecture Standards

- **Component Limit**: Prefer components under 150 lines.
- **Natural Boundary Splitting**: If a component exceeds 150 lines, evaluate for distinct concerns:
  - Data fetching (extract to hooks or server components).
  - Sub-UI sections (extract to separate files).
  - Reusable logic (extract to custom hooks).
- **Stateful Logic**: Always extract stateful logic into custom hooks.
- **Rule of Thumb**: Never split purely to meet a line count; split for clarity and maintainability.

## 🎨 UI/UX Excellence

- **Liquid Glass v3.1**:
  - `background: hsl(0 0% 100% / 0.5)`
  - `backdrop-filter: blur(12px) saturate(1.8)`
  - Use SVG displacement filters for organic frosting.
- **Radius Rule**: Outer radius = inner radius + padding.
- **Interaction Hardening**: 
  - Spam-test every button.
  - Animations must be interruptible and clear their timeouts on unmount.
  - Favor `framer-motion` for complex transitions.

## 🔒 Security & Performance

- **Supabase RLS**: Mandatory on every table.
- **Rate Limiting**: Required on all public API routes.
- **Dual Validation**: Frontend validation is for UX; Backend validation is for truth. Both must exist.
- **Secret Hygiene**: Zero hardcoded keys. No `.env` in public repo. Check `git log`.
- **Error Handling**: Never leak database schemas or system internals in error messages.
- **Mobile First**: Verify layouts on viewport widths < 400px.

## 🚀 Efficiency

- **Push Often**: If your laptop dies, code must survive on GitHub.
- **Component Gallery**: Referenced for best practices.
- **Accessibility**: Standard, not an afterthought (WCAG AA).
