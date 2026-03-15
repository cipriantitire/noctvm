---
description: Workflow for UI development and design refinement in NOCTVM.
---
# UI Development Workflow

Use this workflow when building new components, refining themes, or fixing visual bugs.

1. **Design Alignment**: Review the design requirement and "Liquid Glass" theme guidelines in the UI Architect SKILL.
2. **Create Core Styles**: If needed, update `src/app/globals.css` with new variables or utility classes.
3. **Build Component**: Create the component in `src/components/`. Use modern React patterns and types.
4. **Interactive Polish**: Add hover effects, transitions, and Framer Motion animations.
5. **Responsive Check**: Test the component on mobile and desktop viewports.
6. **Performance Check**: Verify that the component doesn't cause excessive re-renders.

## Tips
- Use `lucide-react` for icons.
- Ensure consistent spacing (using 4px/8px grid).
- Always wrap complex interactions in `useCallback` or `useMemo` where appropriate.
