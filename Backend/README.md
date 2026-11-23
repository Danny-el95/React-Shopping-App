# Shopping App backend

Express 5, MySQL2 promises, bcrypt, handwritten SQL, and HTTP-only session cookies.
Requires Node.js 24 or later and a compatible MySQL/MariaDB server. The current
local database runs on XAMPP MariaDB 10.4.32 at `127.0.0.1:3307`. No ORM is used.

## Local XAMPP database

The existing `e_commerce` database was copied from MySQL on port 3306 to XAMPP
MariaDB on port 3307. User rows, password hashes, sessions, and migration history
were preserved and compared after import. The original MySQL database was not
modified. Backend `.env` now selects port 3307; application credentials were
recreated on XAMPP with privileges scoped to `e_commerce` for local development.

Start XAMPP MySQL before starting the backend. The control-panel MySQL port and
phpMyAdmin server port are configured as 3307. Restart the XAMPP control panel
if it was already open when these settings changed.

Migration backups and the verification report are in the ignored `.db-transfer`
folder. It includes an unchanged SQL export, a MariaDB-compatible import copy,
and the previous backend `.env`. These files contain private database material;
keep them out of Git. XAMPP config backups have the suffix
`.shopping-app-before-3307.bak` beside their original files.

To return the backend to the original server, restore the saved `.env` and restart
the backend. This does not copy new XAMPP writes back to the original database.
Do not rerun initial migrations: the imported migration history is already up
to date. Keep the old server and backups until the application has been checked.

## Setup

1. Run `npm install` inside `Backend`.
2. Copy `.env.example` to `.env` and set your local database credentials.
3. Create the configured database with `utf8mb4` encoding. Database provisioning
   is separate from migrations; the runner connects to an existing database.
4. For an existing database, inspect `SHOW CREATE TABLE users` and follow
   `src/db/migrations/README.md` before applying anything.
5. Run `npm run migrate:status`, then `npm run migrate` using a migration user.
6. Run `npm run dev` (watch mode) or `npm start`.
7. The API is available at `http://localhost:8080/api`. The frontend sends cookies
   with API requests and restores the current user when the page loads.

Environment variables already set in the process take precedence over `.env`.
Use a runtime database user with the required SELECT/INSERT/UPDATE/DELETE
permissions; schema creation and alteration belong to a separate migration user.
Never commit `.env` or use production credentials in tests.

## Structure

- `server.js`: checks the database connection, then starts the HTTP server.
- `src/app.js`: middleware and route composition without starting a listener.
- `src/config/env.js`: configuration loading and validation.
- `src/db/pool.js`: shared promise pool; multiple SQL statements are disabled.
- `src/db/session.repository.js`: creates, looks up, and deletes MySQL sessions.
- `src/modules/auth/auth.session.js`: cookie handling and `requireAuth` middleware.
- `src/modules/auth`: routes, validation, controllers, services, SQL repositories.
- `src/middleware`: centralized errors, unknown routes, browser-origin checks.
- `src/db/migrations`: numbered, immutable, forward-only SQL schema changes.
- `src/db/migrate.js` and `src/db/migration-runner.js`: migration execution,
  locking, checksums, and history checks.
- `src/db/seeds`: reserved for separately executed development data.
- `tests`: deferred validation, password handling, SQL binding, and migration checks.

Routes handle URLs, controllers handle HTTP, services handle business rules,
and repositories execute parameterized SQL. Add other features as modules using
the same pattern. For multi-query order operations, acquire one connection,
begin a transaction, pass that connection to all repositories involved, commit
or roll back, and release it in `finally`.

## API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/health` | Process health; startup verifies database connectivity |
| POST | `/api/auth/register` | Create account and session; return public user, status 201 |
| POST | `/api/auth/login` | Check credentials, create session, and return public user |
| GET | `/api/auth/me` | Verify session and return public user, or 401 |
| POST | `/api/auth/logout` | Delete current session and clear cookie, status 204 |

Root aliases for the auth endpoints preserve `/register` compatibility.
Register accepts `{ "username": "alice", "email": "alice@example.com",
"password": "your-password" }`; login accepts email and password. Username
allows 3–100 ASCII letters, numbers, or underscores. Passwords require at least
8 characters and at most 72 UTF-8 bytes. Email is trimmed and lowercased.
Error bodies use `{ "error": "message" }`.

Passwords are bcrypt hashes; responses never contain passwords or hashes.
Registration and login set an HTTP-only session cookie lasting seven days.
Only a SHA-256 hash of the random session token is stored in MySQL. The cookie
uses SameSite=Lax and Secure in production. User details and passwords are not
stored in localStorage. After refresh, AuthContext calls `/api/auth/me` and shows
a loading message until restoration finishes. Logout revokes the database
session before clearing the frontend user.

Use `requireAuth` on any protected backend route. It verifies the cookie against
the unexpired database session and sets `req.user`; never trust a user ID sent
by the browser as proof of identity. Resource ownership still needs checking
when implementing account or order APIs.

Run the sessions migration before using these endpoints. Its user foreign key
requires `users.id` to be BIGINT UNSIGNED, matching the initial users migration.
Existing databases must be inspected and reconciled first. No schema changes
are performed by server startup.

Use `localhost` for both the frontend and API in development; do not mix it with
`127.0.0.1`. Production requires HTTPS, an explicit `CLIENT_ORIGIN`, and frontend
and API hosting on the same site for SameSite=Lax cookies. Credentialed CORS and
the existing browser-origin check are enabled.
Do not enable a blanket `trust proxy`; configure a known proxy topology before
deploying behind a proxy so IP-based throttling identifies clients correctly.
The auth limiter uses process memory (30 attempts per IP per 15 minutes); use a
shared rate-limit store before running multiple API instances.

Password reset and email verification are not implemented. Products, carts,
and orders use the database through their respective API modules.
Expired sessions cannot authenticate. Periodically clean old rows with
`DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP();` in an operational job.

## Orders

Run `npm run migrate` to create `orders` and `order_items`. Checkout uses raw
SQL in a transaction: lock the user's cart, validate current prices and the cart
fingerprint, save the order and item snapshots, and clear the cart before commit.
Any failure rolls the transaction back. Prices and totals are integer cents in
USD. Status `placed` does not mean payment was collected; payment and shipping
processing are not implemented.

Authenticated endpoints:

- `POST /api/orders`: `{requestKey, expectedCartVersion}`. Use a UUID for the
  request key and the fingerprint returned by `GET /api/cart`. Reusing the same
  key returns the existing order without clearing a newer cart.
- `GET /api/orders?search=NS-000001&page=1&limit=10`: owned, visible history.
  Search accepts the full readable reference, case-insensitively.
- `GET /api/orders/NS-000001`: owned order, including archived records.
- `PATCH /api/orders/NS-000001/archive`: hide an order without deleting it.

References use the format `NS-000001` and grow as needed. They are display IDs;
the session user's ID always determines access. Purchased names and prices are
saved as snapshots so later catalog changes do not rewrite history.

The frontend loads history from the API. Old localStorage history is left
untouched and is not imported because the server cannot verify it. Only checkout
retry metadata is kept in sessionStorage, allowing safe retry after refresh or a
lost response. The database remains the source of truth for orders.

## Checks

Run tests with `npm test` (or `node --test --test-isolation=none tests/*.test.js`
where process spawning is restricted).
They mock the database pool and do not connect to
MySQL. They cover request validation, SQL value binding, password hashing,
duplicate accounts, login credential checks,
and migration checksums/failure handling. Verify SQL migrations and the complete
flow against a disposable MySQL database before deployment.
