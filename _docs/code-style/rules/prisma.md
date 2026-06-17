## Prisma Naming Guidelines (If Prisma Is Used)

- Use `@map` to map database table names to `snake_case`.
- Do not use `@map` for database columns; follow Prisma's default field naming style.

## Prisma Anti-Hallucination Guidelines (If Prisma Is Used)

- Before writing any Prisma query, read `prisma/schema.prisma` to confirm model names, field names, and relation names.
- Never use models, fields, or relations that are not defined in the schema.
- Only use methods that exist in the official Prisma Client documentation, such as `findUnique`, `findMany`, `create`, `update`, `delete`, and `upsert`.
- Model name casing must match the schema exactly.
- In `include` and `select`, only use relation names defined in the schema; **never fabricate nested relations that do not exist**.
- If a field or relation does not exist in the schema, **do not invent it**. Instead:
  1. Add `// TODO: schema is missing this field/relation; migrate first`.
  2. Clearly tell the user which schema definition needs to be added.
