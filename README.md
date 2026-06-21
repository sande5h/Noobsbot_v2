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
