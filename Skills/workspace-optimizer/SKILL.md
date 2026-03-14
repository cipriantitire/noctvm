---
name: workspace-optimizer
description: Implements the Self-Improving Skills pattern (Observe, Inspect, Amend, Evaluate). Use to optimize agent performance across the workspace.
---

# 🚀 Workspace Optimizer (Self-Improving Pattern)

Treat skills as living code, not static documentation. Follow the loop from the Vasilije (@tricalt) framework.

## 1. Observe
Monitor agent performance. Look for:
- **Silent Failures**: The agent completes the task but the quality is lower than expected.
- **Hallucinations**: Using endpoints or patterns that don't exist.
- **Friction**: The user having to correct the agent multiple times.

## 2. Inspect
Deep dive into the failure.
- Check the relevant `SKILL.md` for ambiguous "When to use" sections.
- Look for missing edge cases in the "Instructions".
- Verify if external APIs or dependencies have changed.

## 3. Amend (`.amendify()`)
Actively update the workspace:
- **Tighten Triggers**: Add specific keywords (e.g., "FVG", "Glassmorphism") to `SKILL.md`.
- **Add Conditions**: "If X fails, try Y instead of generic Z."
- **Update Protocols**: Correct hallucinated URLs or components.
- **Premium Guidelines**: Inject rules like "No emojis for icons" or "Z-Index Stacking Context Portals".

## 4. Evaluate
Run a test task to verify the fix. Example: "Redesign this card using the new Premium Rules."

---

## Workspace Knowledge
- **NOCTVM**: Focus on High-Performance WebGL and Premium UI/UX.
- **Portfolio**: Focus on Marketing Psychology and AI-SEO.
- **Trading Bot**: Focus on Quant Analysis and API Robustness.
