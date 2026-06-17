---
name: task-problem-log
description: Log task execution problems and their resolutions in a persistent Markdown file. Use when Codex is blocked or interrupted by sandbox restrictions during a task, including filesystem, network, permission, or command-execution sandbox failures that prevent continuing normally.
---

# Task Problem Log

Use this skill when a task is blocked or interrupted by sandbox restrictions.

## Workflow

1. Locate this skill folder.
2. Confirm `error-log.md` exists in the `task-problem-log` skill folder. If it does not exist, create it as an empty Markdown file.
3. Inspect `references/` for a relevant solution before logging the problem. Prefer targeted search by command name, tool name, error text, or sandbox type.
4. If a relevant `references/` solution exists, try that solution first.
   - If it succeeds, report the solution used and do not append a new `error-log.md` entry unless the incident revealed a new detail that should be preserved.
   - If it fails, continue to the next step.
5. If `references/` has no relevant solution, or the referenced solution fails, read `error-log.md` and search for a related previous case.
6. If `error-log.md` has a previous resolution that can be applied successfully, report the reused solution and do not append a duplicate entry.
7. If no known solution works, open `error-log.md` for editing.
8. Append a blank line at the bottom, then add one new entry using English only:

```markdown
### [Brief problem summary]
- Time: [problem occurrence time in yyyy-MM-dd hh:mm:ss]
- Execution context: [detailed explanation of what Codex was trying to do and what sandbox restriction or failure occurred]
- Resolved: [key explanation of the resolution / reason it remains unresolved]
```

9. Save `error-log.md`.
10. After the task is interrupted or completed, report whether the problem was solved from `references/`, solved from `error-log.md`, logged as a new entry, or still unresolved.

## Rules

- Check `references/` for solutions before reading or writing `error-log.md`.
- Read `error-log.md` only if `references/` has no relevant solution or the referenced solution fails.
- Do not create a duplicate log entry when a previous `error-log.md` solution is successfully reused.
- Write all `error-log.md` entries in English.
- Do not delete or rewrite previous log entries, even when the problem has been resolved.
- Keep each entry concise but specific enough to explain the original blocker and outcome.
