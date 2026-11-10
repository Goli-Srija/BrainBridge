# BrainBridge — Technical Architecture

## 1. Overview

BrainBridge is a three-tier web application:

```
┌──────────────────────────┐   HTTPS / JSON    ┌───────────────────────────┐   SQL (pg, SSL)   ┌──────────────────────┐
│  React SPA (Vite)        │ ───────────────▶ │  Express REST API         │ ───────────────▶ │  PostgreSQL (Neon)   │
│  React Router, Chart.js, │  Authorization:   │  JWT auth middleware      │                   │  34 tables, indexes, │
│  Monaco, jsPDF           │  Bearer <JWT>     │  controllers → services   │                   │  FKs, constraints    │
│                          │  X-Local-Date     │                           │                   │                      │
└──────────────────────────┘                   └─────────┬─────────────────┘                   └──────────────────────┘
                                                         │ optional external services
                                     ┌───────────────────┼────────────────────┐
                                     ▼                   ▼                    ▼
                               Local compilers      Judge0 API          Anthropic API
                               (python/javac/gcc)   (code execution)    (optional AI feedback)
```

- **Development:** Vite (port 5173) proxies `/api` to Express (port 5000). `npm run dev` starts both with `concurrently`.
- **Production:** `npm run build` produces `client/dist`; Express serves it plus the API on one port.

## 2. Backend structure (MVC-style)

| Folder | Responsibility |
|---|---|
| `routes/index.js` | Maps every URL to a controller; applies `requireAuth` to all private routes. |
| `controllers/` | Validate input, call services, run SQL, shape JSON responses. |
| `services/` | Business logic independent of HTTP (see §5). |
| `middleware/auth.js` | Verifies the JWT and sets `req.user`. |
| `middleware/errors.js` | Converts errors (validation, unique violations, unexpected) into JSON. |
| `database/db.js` | One `pg.Pool`; helpers `one`, `many`, `tx` (transactions). DATE columns are returned as `YYYY-MM-DD` strings to avoid time-zone shifts. |
| `database/content/` | All educational content as JavaScript modules → `build-seed.js` → `database/seed.sql`. |

**Authorization:** every query on user data includes `WHERE user_id = req.user.id` (tested: one user cannot read another user's resume).

## 3. Frontend structure

- `App.jsx` — routes; `RequireAuth` guards private pages and forces onboarding first.
- `hooks/useAuth.jsx` — JWT stored in `localStorage`; `/auth/me` restores the session; any 401 logs out.
- `hooks/useApi.js` — loading / error / reload state for GET requests (every page shows loading, error and empty states).
- `hooks/useHeartbeat.js` — measures real study time (see §5.2).
- `services/api.js` — adds `Authorization` and `X-Local-Date` headers to every request.
- Pages are lazy-loaded (code splitting) to keep the first load small.

## 4. Database design

34 tables (schema in `database/schema.sql`). Key relationships:

```
users 1─1 student_profiles          users 1─1 learning_roadmaps 1─* roadmap_items *─1 learning_topics
users 1─1 daily_goals               learning_modules 1─* learning_topics 1─* lessons 1─* learning_progress *─1 users
users 1─* daily_activity_logs  (UNIQUE user_id + activity_date)   users 1─1 study_streaks
users 1─* aptitude_attempts        aptitude_questions (section, topic_slug, difficulty)
coding_problems 1─* coding_submissions *─1 users     code_drafts (PK user, problem, language)
communication_exercises 1─* communication_attempts *─1 users
resume_templates 1─* resume_records *─1 users       resume_analysis *─1 users
companies 1─* company_preparation (verification: official | guidance | not_verified)
interview_questions (bank: prep | mock; track; set_no) 1─* mock_interview_responses *─1 mock_interviews *─1 users
assessments 1─* assessment_questions;  assessments 1─* assessment_attempts *─1 users
portfolio_profiles (PK user_id, UNIQUE slug)   placement_readiness (UNIQUE user_id + calc_date)   user_bookmarks (UNIQUE user,type,item)
```

Integrity features: primary keys, foreign keys with `ON DELETE CASCADE` (deleting an account removes all its data), `UNIQUE` constraints (emails, one activity row per user per day, one bookmark per item), `CHECK` constraints (difficulty values, goal ranges, score 0-100), and indexes on every lookup path.

## 5. Key algorithms (explainable in a viva)

### 5.1 Daily activity logging (no duplicates)
Every action calls `activityService.recordActivity(userId, localDate, {counter: +n}, topic)`, which runs
`INSERT ... ON CONFLICT (user_id, activity_date) DO UPDATE SET counter = counter + EXCLUDED.counter`.
One row per student per **local** day, updated atomically. The browser sends its local date (`X-Local-Date`); the server rejects dates more than ±2 days from now.

### 5.2 Study time (heartbeat)
While a page is visible and the student interacted in the last 2 minutes, the browser POSTs `/tracker/heartbeat` once a minute. The SQL adds 1 minute only if the previous heartbeat is ≥ 50 seconds old, so time cannot be inflated. Students can also log offline study manually.

### 5.3 Streaks
A day is *active* if study minutes ≥ 5 or any activity counter > 0. `computeStreaks(dates, today)` sorts distinct days, finds the longest consecutive run, and counts backwards from today (or yesterday, so the streak is not "broken" before the student studies today). Unit-tested with gaps.

### 5.4 Goal completion & calendar
Completion % = average over goals of `min(100, done / target × 100)`. Calendar status: *completed* (100%), *partial* (active but < 100%), *missed* (past day after joining with no activity), *today*, *future*.

### 5.5 Placement readiness score (0-100)
`Σ weight × quality × coverage`:

| Part | Weight | Formula |
|---|---|---|
| Aptitude | 20 | accuracy × min(1, attempted / 200) |
| Coding | 25 | min(1, Σ difficulty points of solved problems / 100) (easy 1, medium 2, hard 3) |
| Learning | 15 | min(1, lessons completed / 40) |
| Communication | 10 | avg best score / 100 × min(1, exercises / 8) |
| Interview | 15 | avg mock score / 100 × min(1, mocks / 3) |
| Assessments | 10 | avg best % / 100 × min(1, tests / 4) |
| Resume | 5 | 2 if a resume exists + 3 × best ATS score / 100 |

Stored daily in `placement_readiness` to draw the history chart.

### 5.6 Personalised roadmap
`roadmapService.buildItems(profile)` creates 4 stages. Rules: programming items use the chosen language; the target role adds role-specific items (e.g. Data Analyst → SQL, Python data structures, DI); target companies add Stage-4 items; academic year and preparation level set priorities (e.g. 1st-years: Foundation = high, Stage 4 = optional; advanced students: Foundation = optional). Items linked to topics are ticked automatically when the lesson is completed. Regeneration keeps completed items.

### 5.7 Rule-based answer evaluation (communication, interview, mock)
Deterministic rubric: content coverage of expected keywords (50, synonyms supported) + depth vs. minimum words (20) + structure (sentences & linking words, 15) + specificity (numbers, action verbs, examples, 15) − filler-word penalty. Feedback lists strengths, improvements and missing ideas. If `ANTHROPIC_API_KEY` is set, extra feedback is added and labelled **AI-generated**; the score is never AI-generated.

### 5.8 ATS analyzer
Real text extraction (`pdf-parse` for PDF, `mammoth` for DOCX), then fixed rules: contact details (15), section completeness (25), role + job-description keyword match (25), impact — action verbs & quantified results (15), formatting/length (10), language heuristics (10). Same file → same score. Clearly marked as *indicative*.

### 5.9 Code execution
`codeRunner` supports three modes. **local**: writes code to a temp folder, compiles (`javac`, `gcc`) or interprets (`python`), runs each test with stdin, a 5-second timeout and output limits, compares normalised output. **judge0**: sends the same to a Judge0 server. **none**: returns `not_executed`. If a compiler is missing the API says so — results are never fabricated. Local mode is disabled by default in production.

### 5.10 Content generation
Aptitude questions are produced by seeded generators that **compute** the correct answer and explanation (e.g. profit %, train timing, calendar days via JavaScript `Date`); seating/floor puzzles are generated with a brute-force solver that adds clues until exactly one arrangement remains. Coding problems are verified by running all three reference solutions on every test (`npm run verify:coding`).

## 6. Security

- Passwords hashed with bcrypt (cost 10); never stored or returned in plain text.
- JWT (7-day expiry) signed with `JWT_SECRET` from the environment.
- Parameterised SQL everywhere (no string-built user input) → SQL-injection safe.
- Input validation on every write endpoint; upload limit 5 MB, PDF/DOCX only.
- CORS restricted to configured origins; secrets only in `.env` (git-ignored).
- Portfolio pages are private unless the student publishes them.

## 7. REST API summary

| Area | Endpoints |
|---|---|
| Auth & profile | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /profile`, `POST /auth/change-password`, `DELETE /auth/account` |
| Dashboard | `GET /dashboard`, `GET /progress` |
| Roadmap | `GET /roadmap`, `POST /roadmap/regenerate`, `PATCH /roadmap/items/:id/toggle` |
| Learning | `GET /learn/modules`, `GET /learn/modules/:module`, `GET /learn/topic/:module/:topic`, `POST /learn/lessons/:id/start|complete|uncomplete` |
| Aptitude | `GET /aptitude/summary/:section`, `GET /aptitude/quiz`, `POST /aptitude/submit`, `GET /aptitude/attempts[/:id]` |
| Coding | `GET /coding/runtime`, `GET /coding/problems[/:slug]`, `POST /coding/run`, `POST /coding/submit`, `POST /coding/draft`, `GET /coding/submissions` |
| Tracker | `GET /tracker/today`, `PUT /tracker/goals`, `POST /tracker/log`, `POST /tracker/heartbeat`, `GET /tracker/calendar`, `GET /tracker/analytics`, `GET /tracker/recommendations` |
| Communication | `GET /communication/exercises[/:slug]`, `POST /communication/exercises/:slug/submit` |
| Interview | `GET /interview/categories`, `GET /interview/questions/:category`, `POST /interview/questions/:id/practice` |
| Mock interviews | `GET /mock/tracks`, `POST /mock/start`, `GET /mock/:id`, `POST /mock/:id/answer`, `POST /mock/:id/finish` |
| Assessments | `GET /assessments`, `GET /assessments/attempts`, `GET /assessments/:slug`, `POST /assessments/:slug/submit` |
| Career | `/resume` (CRUD, templates, roles), `POST /resume/analyze`, `GET /resume/analysis`, `GET|PUT /portfolio`, `GET /portfolio/public/:slug`, `GET /projects`, `GET /companies[/:slug]`, `GET /resources[/guides]`, `GET /bookmarks`, `POST /bookmarks/toggle` |
