## File Header Comment Guidelines

- Add a comment at the top of every code file that explains its **functionality** and **purpose**.
- Keep the comment concise and specific so new developers can understand the file's responsibility before reading the entire file.
- Suggested format, using the appropriate comment syntax for the language:
  - Functionality: the primary capability or behavior provided.
  - Purpose: why this file is needed and what problem it solves.

## Inline Comment Guidelines

- Write inline comments only when the **why is not obvious**, such as hidden constraints, specific bug workarounds, or surprising behavior.
- Do not explain what the code does; good naming should already communicate that.
- Do not record task IDs, PR numbers, or caller information in code comments; those belong in commit messages.
- Use at most one line per comment; multi-line comment blocks are prohibited.
- Do not casually delete existing comments, especially comments such as `// TODO`, `// FIXME`, and `// NOTE`.
