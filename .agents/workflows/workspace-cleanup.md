---
description: Workflow for maintaining a clean and fast environment.
---
# Workspace Cleanup Workflow

Use this workflow weekly or whenever the environment feels slow or buggy.

1. **Log Rotation**: Archive old development logs or temporary files in `logs/` or `tmp/`.
2. **Context Reset**: If a conversation gets too large/slow, summarize the current status and start a NEW conversation with the relevant specialized agent.
3. **Dependency Check**: Run `npm audit` and update outdated packages that might be causing tool-calling overhead.
4. **Artifact Hygiene**: Move completed implementation plans or walkthroughs to an archive folder if they clutter the brain.
5. **Agent Refresh**: Update `SKILL.md` files with new patterns discovered during development.

## Pro-Tips for Speed
- Always work in small increments.
- Avoid 1000+ line files; split them early.
- Keep the number of open documents to a minimum.
