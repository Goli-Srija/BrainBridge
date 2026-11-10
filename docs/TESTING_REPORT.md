# BrainBridge — Testing Report

**Test date:** 10 November 2026
**Environment:** Linux, Node.js 22, PostgreSQL 16 (local instance used as a stand-in for Neon), Python 3.13, OpenJDK, gcc, headless Google Chrome. System time zone: Asia/Kolkata (UTC+5:30).

Only results that were actually observed are reported as passed.

## 1. Automated API tests — `npm test` → **50 passed, 0 failed**

| Area | Checks |
|---|---|
| Startup & DB | Health endpoint reports database connected |
| Auth | Protected route rejects missing token; weak password rejected; register returns JWT; duplicate email → 409; wrong password → 401; login; change password then re-login |
| Onboarding / profile | Profile saved, roadmap generated; invalid language rejected |
| Dashboard / roadmap | Readiness, streak, stats and recommendations returned; 4 stages with language-specific items; manual toggle; lesson completion auto-ticks roadmap item and is not double-counted |
| Learning | Module topics; lesson content; DSA lesson has Java, Python and C code |
| Aptitude | 20 quant topics each with ≥ 40 questions; quiz hides answers; submission scored with explanations; history and review |
| Coding | Filters; hidden tests hidden; reference solutions **accepted in Python, Java and C** (local runner); wrong answer detected; compile error detected; custom input run; drafts, bookmarks, submission history, solved filter |
| Communication / interview | Rubric evaluation; prep question practice; full mock interview (7 answers → report with 5 rounds) |
| Assessments | 6 assessments; questions hide answers; submission with topic breakdown |
| Resume / ATS | Create, edit, template switch; **real PDF parsed (generated with jsPDF) — same score on repeat (deterministic)**; unsupported file rejected |
| Portfolio / projects / companies / resources | Save + publish + public page; invalid URL rejected; 15 projects per role, 12 roles; eligibility labelled `not_verified`; 27 companies; resources and guides |
| Tracker | Heartbeat not double-counted within 50 s; manual session + goal update + invalid goal rejected; today's log, completion and streak = 1; calendar marks today; 30-day analytics, 7 skills, accuracy; progress aggregation |
| Streak unit test | Gaps and today/yesterday logic (`computeStreaks`) |
| Security | Another user cannot read your resume (404) |

## 2. Coding bank verification — `npm run verify:coding`

All **60 problems** (24 easy / 22 medium / 14 hard), **693 test cases**: the Python, Java and C reference solutions produce identical output on every test. Expected outputs in the database come from this run.

## 3. Lesson code verification

All 51 language-path examples (Java 19, Python 16, C 16) and all 60 DSA programs (20 topics × 3 languages) were compiled and executed successfully; the DSA outputs match across languages.

## 4. Browser (UI) tests — headless Chrome

- Landing → Register (form validation) → 2-step onboarding → Dashboard: **passed**.
- All sidebar pages and key sub-pages rendered without error states (26 routes, including Roadmap, all three aptitude sections, Programming, Coding list/problem, Communication + exercise, Interview (technical/HR), Resume, Portfolio, Projects, Companies + detail, Mock Interviews, Tracker, Assessments, Progress, Profile, Settings, Video Learning, lesson pages).
- Timed quiz taken and submitted through the UI → results and review shown.
- Java solution typed into the editor and submitted through the UI → **"Accepted — 11/11 tests passed"**.
- Tracker reflected the UI activity (coding 1/2, aptitude 5/10, streak 1).
- Mobile viewport (390 × 844): dashboard, tracker, coding page and slide-in menu render; **no horizontal overflow**.
- Production build served by Express (`npm run build` + `npm start`) works on one port.
- The only browser error observed was Monaco failing to download from its CDN because the test machine had no general internet access; the editor's built-in fallback (simple editor) was used. On a normal internet connection Monaco loads from the CDN.

## 5. Other checks

| Check | Result |
|---|---|
| `npm run dev` starts backend and frontend together; Vite proxy reaches API | Passed |
| `npm run build` | Passed |
| DOCX resume parsing (mammoth) | Passed (score 78 with section breakdown) |
| `CODE_RUNNER=none` | Submission returns `not_executed` with an explanation — nothing fabricated |
| CORS | Unknown origin → 403; dev origin and same-origin allowed |
| Time-zone bug (DATE columns shifted a day in IST) | Found during testing and **fixed** (DATE values returned as strings) |
| CORS blocking static assets in single-service mode | Found during testing and **fixed** (CORS applies only to `/api`) |

## 6. Not tested (external credentials/platforms unavailable)

| Item | Status |
|---|---|
| Neon hosted database | Not tested here (no credentials). The same SQL ran on PostgreSQL 16; the connection module enables SSL automatically for non-local URLs. Run `npm run db:init` with your Neon URL. |
| Render deployment | Not performed (no account access). Steps in `docs/DEPLOYMENT.md`; `render.yaml` provided. |
| Judge0 code execution | Implemented, not tested (no API key). |
| Optional AI feedback (Anthropic API) | Implemented, not tested (no API key). Without a key, all feedback is labelled rule-based. |
| Windows-specific execution | Not run on Windows here. Scripts use cross-platform Node commands; the code runner uses `python`/`py` and `.exe` handling on Windows. |
| YouTube embeds | Video IDs verified via web search results; playback not tested from the sandbox. |

## 7. Content coverage vs. original targets (honest)

| Requirement | Target | Delivered |
|---|---|---|
| Quant aptitude | 50–60 per topic | 49–54 per topic (20 topics) ✔ |
| Logical reasoning | 50–60 per topic | 48–62 for 13 topics; **Blood Relations 23** and **Statement & Conclusions 20** (hand-written) |
| Verbal ability | 50–60 per topic | Synonyms/Antonyms/Vocabulary 54, Voice 48; other 8 verbal topics **10–16 each** (hand-written) |
| Coding problems | 300–600 | **60** fully verified problems (all required fields + 3 solutions + tests) |
| Project ideas | 15–20 per role | 15 per role × 12 roles ✔ |
| Companies | 25–30 | 27 ✔ |
| Mock interview tracks | 4 tracks × 3–4 attempts | 4 × 4 ✔ |
| Resume templates | 4–5 | 5 ✔ |
| Programming/DSA topics | all listed | all listed ✔ (Java 19, Python 16, C 16, DSA 20) |

### How to add more content
1. Add items to the files in `server/database/content/` (e.g. new problems in `coding_medium.js`, new hand-written verbal questions in `verbal.js`).
2. For coding problems run `npm run verify:coding -- --write` (requires Python, JDK, gcc) — it checks the three solutions and stores expected outputs.
3. `npm run db:build-seed` then `npm run db:init`.
