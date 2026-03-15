---
description: Workflow for dashboard performance optimization.
---
# Dashboard Optimization Workflow

Use this workflow when the dashboard feels slow or you want to improve visual responsiveness.

1. **Profiling**: Use Chrome DevTools (Performance tab) to identify long tasks or layout shifts.
2. **Component Audit**: Identify high-frequency re-renders in `EventCard` or `VenueCard`.
3. **Optimization Steps**:
    - Implement `memo()` for expensive sub-components.
    - Defer fetching of non-visible data (e.g., more info below the fold).
    - Optimize SVG/Image assets.
4. **Animation Refinement**: Adjust Framer Motion settings for smoother transitions.
5. **Verification**: Run performance tests on a mobile device and low-power machine.
6. **Build Validation**: Ensure no build errors are introduced by performance changes.
