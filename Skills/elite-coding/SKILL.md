---
name: elite-coding
description: Senior-level software engineering principles. Focuses on component modularity, subagent strategy, and rigorous verification. Use for any non-trivial architectural or coding task.
---

# 🚀 Elite Coding Principles

Adhere to these standards to maintain high code quality and operational excellence.

## 1. Modularity & Conciseness
- **Component Limit**: Keep components under 150 lines.
- **Natural Boundaries**: Split by concerns (Data fetching, sub-UI sections, reusable logic).
- **Hooks**: Always extract stateful logic into custom hooks.
- **Reasoned Splitting**: Never split purely for line count; follow natural boundaries.

## 2. Planning & Strategy
- **Plan Mode**: Enter plan mode for ANY task with 3+ steps or architectural decisions.
- **Fail-Fast**: If a task goes sideways, STOP and re-plan.
- **Subagent Strategy**: Use subagents liberally for research, exploration, and parallel analysis to keep the main context clean.

## 3. Self-Improvement Loop (`.amendify()`)
- **Lesson Capture**: After any correction, update `tasks/lessons.md` or this skill.
- **Prevent Recurrence**: Write rules for yourself that prevent repeating mistakes.
- **Iteration**: Ruthlessly iterate on lessons until the error rate drops.

## 4. Verification & Elegance
- **Proof of Work**: Never mark a task complete without proving it works via logs, tests, or diffs.
- **Staff Engineer Standard**: Ask: "Would a staff engineer approve this?"
- **Elegance**: For non-trivial changes, pause and ask: "Is there a more elegant way?" Handle hacky fixes by reimplementing the elegant solution once the core problem is understood.

## 5. Autonomous Execution
- **Zero Hand-holding**: Fix bugs independently by pointing at logs/errors and resolving them.
- **CI/CD Proficiency**: Resolve failing tests or CI issues without being told how.

---

## Task Management
1. **Plan First**: Write to `tasks/todo.md`.
2. **Verify Plan**: Check in before implementation.
3. **Track Progress**: Mark items complete.
4. **Explain Changes**: Summarize at each step.
5. **Document Results**: Add a review section to `tasks/todo.md`.
