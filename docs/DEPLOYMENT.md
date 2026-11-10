# Deployment Guide — GitHub + Render + Neon

You need: a GitHub account, a Render account (<https://render.com>, free tier is fine for a demo) and your Neon database.

---

## Step 1 — Prepare the Neon database (one time)

1. In Neon, open your project → **Connect** → copy the connection string (ends with `?sslmode=require`).
2. Put it in your local `.env` as `DATABASE_URL` and run once from your laptop:

   ```bash
   npm run db:init
   ```

   The deployed app uses the same database, so it does not need to run this itself.

## Step 2 — Push the code to GitHub

```bash
git init                       # skip if the folder is already a git repo
git add .
git commit -m "BrainBridge capstone"
git branch -M main
git remote add origin https://github.com/<your-username>/brainbridge.git
git push -u origin main
```

Check on GitHub that **`.env` is NOT listed** (it is ignored by `.gitignore`).

---

## Option A (recommended) — one Render Web Service for frontend + backend

Express serves the built React app, so one service gives one URL and no CORS setup.

1. Render dashboard → **New → Web Service** → connect your GitHub repo.
2. Settings:

   | Setting | Value |
   |---|---|
   | Runtime | Node |
   | Root Directory | *(leave empty)* |
   | Build Command | `npm install --include=dev && npm run build` |
   | Start Command | `npm start` |

3. **Environment variables** (Environment tab):

   | Key | Value |
   |---|---|
   | `NODE_VERSION` | `22` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | your Neon connection string |
   | `JWT_SECRET` | a long random string (different from local is fine) |
   | `CLIENT_URL` | `https://<your-service-name>.onrender.com` |
   | `CODE_RUNNER` | `judge0` (with the Judge0 variables below) or `none` |

4. Click **Create Web Service**. After the build, open `https://<your-service-name>.onrender.com`.

Alternatively use the included **`render.yaml`**: Render → **New → Blueprint** → select the repo, then fill in the secret values when prompted.

> Free Render services sleep after inactivity; the first request can take ~1 minute. Open the site a few minutes before your demo.

---

## Option B — separate Render services (Static Site + Web Service)

### B1. Backend (Web Service)

Same as Option A, but:

- Build Command: `npm install`
- Start Command: `npm start`
- `CLIENT_URL` = the URL of your static site from B2 (e.g. `https://brainbridge-web.onrender.com`). Several URLs may be comma-separated.

### B2. Frontend (Static Site)

1. Render → **New → Static Site** → same repo.
2. Build Command: `npm install --include=dev && npm run build`
3. Publish Directory: `client/dist`
4. Environment variable: `VITE_API_URL` = `https://<backend-service>.onrender.com/api`
5. **Redirects/Rewrites** tab → add rule: Source `/*`, Destination `/index.html`, Action **Rewrite** (needed for React Router deep links like `/dashboard`).

After both deploy, update the backend's `CLIENT_URL` if the static site URL changed, and redeploy the backend.

---

## Code execution in production

For safety, the local compiler runner is **disabled automatically when `NODE_ENV=production`** (running untrusted code on a public server is dangerous). Choose one:

- **Judge0 (recommended):** create a free Judge0 CE subscription on RapidAPI, then set
  `CODE_RUNNER=judge0`, `JUDGE0_URL=https://judge0-ce.p.rapidapi.com`, `JUDGE0_API_KEY=<your key>`, `JUDGE0_API_HOST=judge0-ce.p.rapidapi.com`.
- **None:** `CODE_RUNNER=none` — the editor, saving and solutions still work; the page clearly states that execution is not configured. No results are faked.

## Optional AI feedback

Set `ANTHROPIC_API_KEY` (and optionally `AI_MODEL`) to add extra written feedback in mock interviews and communication exercises. It is always labelled **"AI-generated"**; scores stay rule-based. Without a key, nothing claims to be AI.

## Post-deployment checklist

- [ ] `https://<url>/api/health` returns `{"status":"ok","database":"connected"}`
- [ ] Register → onboarding → dashboard works
- [ ] Refreshing a deep link (e.g. `/tracker`) does not 404
- [ ] Coding page shows the expected execution mode
- [ ] No secrets in the GitHub repository
