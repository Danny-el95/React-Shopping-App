# SQL migrations

This folder contains ordered, forward-only SQL schema changes. No ORM is required.

`0001_create_users.sql` is a proposed initial schema for a new database, matching
the current registration fields. The `password` column stores a bcrypt hash,
never a plaintext password. This migration has not been applied or verified
against a running MySQL instance.

Before applying it to an existing database, inspect `SHOW CREATE TABLE users`
and reconcile the actual schema. Do not drop an existing table or use
`CREATE TABLE IF NOT EXISTS` to silently mark a mismatched schema as migrated.

`0002_create_sessions.sql` adds persistent login sessions. Its foreign key
requires `users.id` to be `BIGINT UNSIGNED`, matching `0001`. Check the existing
schema before applying this migration. This migration has not been run here.

## Naming and execution

- Name subsequent files `0002_description.sql`, `0003_description.sql`, etc.
- Never edit a migration after it has been applied to a shared database.
- The `src/db/migrate.js` runner uses `mysql2/promise`.
- Have the runner create a `schema_migrations` table recording the filename,
  SHA-256 checksum, and application timestamp.
- Acquire a MySQL advisory lock on a dedicated connection before checking and
  applying migrations. Release the lock and connection in a finally block.
- Read files in order, reject changes to recorded checksums, execute pending
  files, and record each successful migration only after its SQL succeeds.
- If a migration fails, stop immediately. MySQL DDL can implicitly commit;
  wrapping the file in a transaction does not guarantee a rollback. Inspect and
  reconcile any partially applied changes before retrying.
- Prefer one schema operation per file where practical. Keep seeds separate.
- Run migrations as a deployment step using a schema-management database user;
  the application's database user should only have its required runtime access.
- Do not automatically migrate when the HTTP server starts.

Run `npm run migrate:status` to inspect history and `npm run migrate` to apply
pending files. Both commands require a configured database and permission to
create the migration-history table; status can initialize this metadata table
but does not apply migration files. Use migration-user credentials through
environment variables when running these commands.

For an existing users table, compare its full definition with `0001` (columns,
types, indexes, charset, collation). After bringing it into agreement and taking
a backup, an operator can baseline `0001` in `schema_migrations` with its exact
filename and checksum. Do not baseline it merely because a table exists.
