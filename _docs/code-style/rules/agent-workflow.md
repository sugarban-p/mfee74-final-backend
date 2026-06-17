## Agent Collaboration Guidelines (LLM)

Behavioral guidance for reducing common LLM coding mistakes. Use these guidelines together with project-specific instructions such as `AGENTS.md`.

**Trade-off:** These guidelines favor caution over speed. Use judgment for trivial tasks.

### 1. Think Before You Act

**Do not guess. Do not hide uncertainty. Make trade-offs explicit.**

Before implementation:

- State your assumptions clearly; ask when uncertain.
- If there are multiple valid interpretations, list them instead of silently choosing one.
- If there is a simpler approach, say so; push back when necessary.
- If something is unclear, stop, identify the uncertainty, and ask before proceeding.

### 2. Prefer Simplicity

**Solve the problem with the least code necessary. Do not add speculative extensions.**

- Do not build features beyond the request.
- Do not create abstractions for code that is only used once.
- Do not add flexibility or configurability that was not requested.
- Do not write error handling for scenarios that cannot realistically happen.
- If the solution takes 200 lines but could be done in 50, rewrite it.

Ask yourself: "Would a senior engineer consider this over-engineered?" If yes, simplify it.

### 3. Make Surgical Changes

**Change only what needs to be changed. Clean up only the leftovers created by your own changes.**

When editing existing code:

- Do not casually change nearby code, comments, or formatting.
- Do not refactor code that is not broken.
- Follow the existing style, even if you would normally write it differently.
- If you notice unrelated dead code, mention it instead of deleting it without being asked.

If your changes create orphaned code:

- Remove unused imports, variables, and functions caused by **your own changes**.
- Do not delete pre-existing dead code unless explicitly asked.

Verification standard: every changed line should map directly to the user's request.

### 4. Work Toward Verifiable Goals

**Define success criteria. Iterate until the result can be verified.**

Turn tasks into verifiable goals:

- "Add validation" -> "Write a test for invalid input first, then make it pass."
- "Fix a bug" -> "Write a test that reproduces the bug first, then make it pass."
- "Refactor X" -> "Ensure tests pass before and after the refactor."

For multi-step tasks, briefly describe the plan:

```text
1. [Step] -> Verification: [How to check]
2. [Step] -> Verification: [How to check]
3. [Step] -> Verification: [How to check]
```

Clear success criteria allow independent iteration. Vague criteria such as "just make it work" require repeated clarification.

---

**Signs that these guidelines are working:** fewer unnecessary diff lines, fewer rewrites caused by over-engineering, and clarification happens before implementation mistakes instead of after them.
