# Backend

Server-side code for Flux.

- `src/` contains the AI generation helpers, file parsing, database adapter, and mock session seed data used by the Next.js API routes.
- `prisma/` contains the schema, migrations, and local SQLite database files.
- `continuum/` contains the Continuum backend service.

Run migrations from the repository root:

```bash
npm run db:migrate
```
