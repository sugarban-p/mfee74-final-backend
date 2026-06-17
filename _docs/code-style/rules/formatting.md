## Relationship With ESLint

- This section defines writing guidelines and is **usually stricter than** the project's default ESLint configuration. For example, `@typescript-eslint/no-explicit-any` may be `off`, and the same applies to rules configured as warnings only.
- **Do not relax these rules just because lint passes**: still avoid `any`, fabricated APIs, and type assertions that bypass type checking.
- Before submitting, the project must still pass `pnpm run lint` or the corresponding command in `package.json`.

## Code Style Guidelines

Follow the project's `.prettierrc`. If one does not exist, use the following defaults.

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "endOfLine": "auto",
  "overrides": [
    {
      "files": ["*.css", "*.scss", "*.sass", "*.less"],
      "options": {
        "singleQuote": false
      }
    }
  ]
}
```
