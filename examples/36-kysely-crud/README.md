# 36 — Kysely CRUD

Demonstrates using `@nexusts/kysely` — the Kysely typed SQL query builder integration — with Bun's built-in `bun:sqlite`.

## Features

- `BunSqliteDialect.wrap()` — adapts `bun:sqlite` for Kysely's `SqliteDialect`
- `KyselyService` — wraps a Kysely instance with lazy initialization
- `KyselyRepository` — Lucid-style repository pattern with typed CRUD
- `KyselyModule.forRoot()` — module registration with KyselyConfig
- Table creation via `db.schema.createTable()`

## How to run

```bash
bun main.ts
```

Then test with curl:

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":30}'

# List all users
curl http://localhost:3000/users

# Find a user by ID
curl http://localhost:3000/users/1
```

## Dependencies

- [kysely](https://kysely.dev/) (peer dep — install with `bun add kysely`)
- `bun:sqlite` (built into Bun — no install needed)
