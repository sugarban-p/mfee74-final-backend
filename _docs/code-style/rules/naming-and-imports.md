## Naming Guidelines

- Use `kebab-case` for file names.
- Modules in the same layer may use folder-level `index.ts` files for re-exports to reduce deeply nested relative paths.

## Import Ordering Guidelines

1. External packages, such as `react`, `next`, and third-party libraries.
2. Internal absolute imports, such as `@/lib` and `@/components`.
3. Relative imports, such as `./` and `../`.

Separate each group with a blank line.
