# BrainBridge

**An AI-Powered Personalized Placement Readiness Platform**
*One Platform. Every Skill. Your Placement Journey.*

BrainBridge brings aptitude, logical reasoning, verbal ability, programming (Java / Python / C), DSA, communication, interview preparation, resume building, portfolios, project guidance, company preparation, mock interviews, assessments and a daily study tracker into one web application.

| Layer | Technology |
|---|---|
| Frontend | React 18 (JavaScript/JSX), React Router, HTML5, CSS3, Chart.js, Monaco Editor, jsPDF |
| Backend | Node.js, Express.js, REST APIs |
| Database | PostgreSQL on Neon (`pg` library, plain SQL) |
| Auth | JWT + bcrypt (bcryptjs) + Express middleware |
| Deployment | GitHub + Render |

---

## 1. Prerequisites (Windows)

1. **Node.js 20 LTS or 22 LTS** — <https://nodejs.org> (check with `node -v`).
2. **Git** — <https://git-scm.com> (needed for GitHub/deployment).
3. **Visual Studio Code** — <https://code.visualstudio.com>.
4. **A free Neon account** — <https://neon.tech> (hosted PostgreSQL, so you do **not** install PostgreSQL locally).
5. *Optional, for running code in the Coding module on your laptop:*
   - **Python 3** (tick "Add python.exe to PATH" in the installer)
   - **JDK 17+** (e.g. Eclipse Temurin) — provides `javac` and `java`
   - **gcc** for C (e.g. MSYS2 / MinGW-w64, add its `bin` folder to PATH)

   Missing languages are reported honestly in the app ("not installed") — nothing is faked. Alternatively configure Judge0 (see §4).

## 2. Installation

1. Unzip / clone the project and open the **BrainBridge** folder in VS Code (*File → Open Folder*).
2. Open a terminal in VS Code (*Terminal → New Terminal*) and run:

```bash
npm install
```

This single command installs the root, `server` and `client` packages (npm workspaces).

## 3. Environment configuration

Create your `.env` file from the example (in the project root):

```bash
# Windows (Command Prompt or PowerShell)
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Open `.env` and set:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | Your Neon connection string (Neon dashboard → your project → **Connect** → copy the string ending in `?sslmode=require`). |
| `JWT_SECRET` | Any long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | `5000` (default) |
| `CLIENT_URL` | `http://localhost:5173` for local development |
| `CODE_RUNNER` | `local` (use installed compilers), `judge0`, or `none` |

`.env` is in `.gitignore` — never commit it.

## 4. Database connection & initialization (one time)

```bash
npm run db:init
```

This connects to Neon, creates all 34 tables from `database/schema.sql` and loads the content from `database/seed.sql`. You should see:

```
Connected: PostgreSQL 16...
Creating schema ...
Loading seed content (...)
Seed complete: { apt: '2132', coding: '60', lessons: '153', projects: '180', companies: '27', ... }
```

> ⚠️ `db:init` **drops and recreates** all tables. Run it once at setup (or when you want a clean demo database).
> `npm run db:seed` reloads only `seed.sql` into existing tables — use it only on freshly created tables; for a clean start use `npm run db:init`.

## 5. Seed data

`database/seed.sql` is generated from the content modules in `server/database/content/` and is already included. You only need to rebuild it if you change content:

```bash
npm run db:build-seed     # regenerates database/seed.sql
npm run db:init           # loads it
```

## 6. Start the application

```bash
npm run dev
```

This starts **both** servers together:

- React frontend → **<http://localhost:5173>**  ← open this in your browser
- Express API → <http://localhost:5000/api> (health check: <http://localhost:5000/api/health>)

Register a new account, complete the 2-step onboarding, and your personalised dashboard and roadmap are created.

VS Code shortcut: *Terminal → Run Task → "BrainBridge: dev"* runs the same command.

## 7. Testing

With the app running (`npm run dev` in one terminal), open a second terminal:

```bash
npm test                 # 50 end-to-end API checks (auth, every module, persistence, streaks, isolation)
npm run verify:coding    # runs Java/Python/C reference solutions of all 60 problems on every test case
```

`verify:coding` needs Python, JDK and gcc installed. See `docs/TESTING_REPORT.md` for the full test report.

## 8. Production build

```bash
npm run build    # builds the React app into client/dist
npm start        # Express serves the API AND the built frontend
```

Open **<http://localhost:5000>** — one server, one URL (this is also how the recommended Render deployment works).

## 9. Deployment

See **`docs/DEPLOYMENT.md`** for step-by-step GitHub + Render + Neon instructions (single-service and separate frontend/backend options). A `render.yaml` blueprint is included.

---

## npm scripts (run from the project root)

| Command | Purpose |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start backend (port 5000) + frontend (port 5173) |
| `npm run build` | Production build of the frontend |
| `npm start` | Start the production server (API + built frontend) |
| `npm run db:init` | Create tables and load seed content |
| `npm run db:build-seed` | Regenerate `database/seed.sql` from content files |
| `npm test` | API end-to-end tests (server must be running) |
| `npm run verify:coding` | Cross-check all coding problems in 3 languages |

## Project structure

```
BrainBridge/
├── client/                 React frontend (Vite)
│   └── src/
│       ├── components/     UI kit, icons, charts, code editor, lesson renderer
│       ├── hooks/          useAuth (JWT session), useApi (data loading), useHeartbeat (study time)
│       ├── layouts/        AppLayout (sidebar + top bar)
│       ├── modules/        Quiz runner, feedback, resume PDF, portfolio view, forms
│       ├── pages/          One file per screen (Dashboard, Roadmap, Coding, Tracker ...)
│       ├── services/api.js Fetch wrapper (token + local date headers)
│       └── styles/         Design system (global.css)
├── server/                 Express backend
│   ├── controllers/        Request handlers per module
│   ├── routes/index.js     All REST routes
│   ├── middleware/         JWT auth, error handler
│   ├── services/           Streaks, readiness score, roadmap generator, rubric evaluator,
│   │                       ATS analyzer, code runner, recommendations, optional AI
│   ├── database/           db.js (pg pool), init.js, build-seed.js, content/ (all seed content)
│   ├── tests/              api.test.js, verify-coding.js
│   └── server.js
├── database/               schema.sql, seed.sql
├── docs/                   ARCHITECTURE.md, DEPLOYMENT.md, TESTING_REPORT.md
├── .env.example  .gitignore  package.json  render.yaml  README.md
```

## What is included (content)

| Area | Included |
|---|---|
| Aptitude questions | 2,132 (Quant 1,070 · Logical 745 · Verbal 317) with explanations and Easy/Medium/Hard levels |
| Lessons | 153 (Java 19, Python 16, C 16, DSA 20, Core CS 10, Quant 20, Logical 15, Verbal 12, Communication 18, Etiquette 7) |
| Coding problems | 60 original problems (24 easy, 22 medium, 14 hard), ~690 test cases, Java/Python/C solutions — all verified |
| Communication | 18 lessons + 10 rubric-scored placement exercises |
| Interview | 49 prep questions with model answers + 112 mock-interview questions (4 tracks × 4 sets) |
| Assessments | 6 timed tests (130 questions) |
| Projects | 180 ideas (12 roles × 15) |
| Companies | 27 with labelled guidance |
| Videos & resources | 15 verified videos + 28 courses/docs/platforms + 6 career guides |

Honest gaps versus the original targets are listed in `docs/TESTING_REPORT.md` (e.g. the coding bank has 60 problems, not 300–600).

## Troubleshooting

| Problem | Fix |
|---|---|
| `DATABASE_URL is not set` | Create `.env` from `.env.example` in the **project root**. |
| `db:init` fails with SSL / connection error | Copy the full Neon string including `?sslmode=require`; check your internet; Neon projects may sleep — retry. |
| "Cannot reach the BrainBridge server" in the browser | The backend is not running — use `npm run dev` (not just the client). |
| Port 5000 or 5173 already in use | Close the other program, or change `PORT` in `.env`. |
| Coding page says "python/java/c is not installed" | Install that language and make sure it is on PATH (restart VS Code), or configure Judge0. |
| Monaco editor stuck on "Loading editor" | It loads from a CDN — needs internet. Click "Use simple editor" (works offline). |
| Login keeps logging out | `JWT_SECRET` changed — log in again. |
