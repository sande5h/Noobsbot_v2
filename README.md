# Noobsbot v2

Next.js 15 app (App Router, React 19). Fresh rewrite that will eventually replace the current Noobsbot site.

## Requirements

- Node **24.14.1** (pinned in `.node-version` and `package.json` `engines`)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to DirectAdmin (shared hosting)

DirectAdmin uses **Nginx Unit** as the app server. **Never run `npm run build` on the server** — shared-hosting process limits cause `spawn EAGAIN` during Next.js static generation. Always build locally.

### One-time setup on the server

In DirectAdmin → Node.js → Create Application:
- **Startup file:** `server.js`
- **Node version:** 24.14.1

### Deploy workflow (every release)

```bash
# 1. Build and package locally
bash deploy.sh

# 2. Upload deploy.zip to the server (DirectAdmin File Manager or SCP)
# 3. Extract deploy.zip into the app root (replace all files)
# 4. In DirectAdmin → Node.js → Restart the app
```

`deploy.sh` builds locally, copies `.next/static/` + `public/` into `.next/standalone/`, and zips the standalone output to `deploy.zip`. The zip bundles `node_modules` — no `npm install` on the server.

### What's in `deploy.zip`

The contents of `.next/standalone/`:

```
server.js
package.json
node_modules/      ← bundled, no install needed
.next/
public/
```

### Important: don't build while the dev server runs

`npm run dev` and `npm run build` share the `.next/` directory. Running a production build while `next dev` is live corrupts the dev server (500s / "is not a function"). **Stop the dev server before running `deploy.sh`.**

### Troubleshooting

| Issue | Fix |
|---|---|
| "Can't acquire lock" in the DA UI | UI bug — the site is still running. SSH in and `pkill -f "node server.js"`, then restart. |
| `ENOENT: prerender-manifest.json` | Build is missing/incomplete. Run `bash deploy.sh` locally and re-upload. |
| `spawn EAGAIN` | You tried to build on the server. Always build locally with `deploy.sh`. |

## Chat (rooms)

Password-gated chat rooms backed by **MariaDB on the same host** (no external service).

- **Admin** (first user): adds users and creates rooms. No public sign-up.
- **Members**: log in, see all rooms, favourite them, enter a room password to chat.
- Messages now; file sharing later (`attachments` table is already in the schema).
- Real-time via short-polling (`/api/rooms/[id]/messages?after=<id>`), so it works under Nginx Unit without WebSockets.

### Environment variables

Set these in **DirectAdmin → Node.js app config** (locally they live in `.env.local`; see `.env.example`):

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=...        # the MySQL user you create in DirectAdmin → Databases
DB_PASSWORD=...
DB_NAME=...        # the database you create in DirectAdmin → Databases
DB_POOL_SIZE=5
AUTH_SECRET=...    # openssl rand -hex 32
ADMIN_USER=admin   # used once by the seed script
ADMIN_PASS=...
```

### Local development

```bash
# one-time: start MariaDB and create a dev db/user, then:
npm run init-db     # applies db/schema.sql
npm run seed:admin  # creates the first admin from ADMIN_USER / ADMIN_PASS
npm run dev
```

Log in at `http://localhost:3000/login`.

### On DirectAdmin (one-time DB setup)

1. **Databases** → create a database + user, note the credentials.
2. Put those + `AUTH_SECRET` + `ADMIN_*` into the Node.js app's env vars.
3. Apply the schema: either import `db/schema.sql` via **phpMyAdmin**, or in **Terminal**:
   ```bash
   node --env-file=.env.production scripts/init-db.mjs
   node --env-file=.env.production scripts/seed-admin.mjs
   ```
   (Create `.env.production` with the same keys, or export the vars inline.)
4. Restart the Node.js app.

`deploy.sh` bundles `node_modules` into the standalone output, so `mysql2`, `bcryptjs`, and `jose` ship with the build — no `npm install` on the server. All three are pure-JS (no native compile).
