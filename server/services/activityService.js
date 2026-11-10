// Daily tracker logic: activity logging, goal completion and streaks.
// All dates are the student's LOCAL date (see utils/http.js -> localDate).
const db = require('../database/db');

// Counters that other modules may increment. Whitelisted to keep the SQL safe.
const COUNTERS = [
  'lessons_completed', 'coding_attempted', 'coding_solved', 'aptitude_attempted', 'aptitude_correct',
  'communication_completed', 'interview_answered', 'assessments_completed', 'mock_interviews_attempted', 'study_minutes',
];

// Which activity counter satisfies which daily goal.
const GOAL_MAP = [
  { goal: 'coding_problems', field: 'coding_solved', label: 'Coding problems solved' },
  { goal: 'aptitude_questions', field: 'aptitude_attempted', label: 'Aptitude questions practised' },
  { goal: 'communication_exercises', field: 'communication_completed', label: 'Communication exercises' },
  { goal: 'lessons', field: 'lessons_completed', label: 'Lessons completed' },
  { goal: 'interview_questions', field: 'interview_answered', label: 'Interview questions answered' },
  { goal: 'study_minutes', field: 'study_minutes', label: 'Study minutes' },
];

/**
 * Add to today's counters. Uses one row per (user, date) thanks to the UNIQUE constraint,
 * so repeated calls never create duplicate records - they just update the same row.
 */
async function recordActivity(userId, date, increments = {}, topic = null) {
  const fields = Object.keys(increments).filter((k) => COUNTERS.includes(k) && Number(increments[k]) > 0);
  const values = fields.map((f) => Math.round(Number(increments[f])));
  const cols = fields.map((f) => `, ${f}`).join('');
  const params = fields.map((_, i) => `, $${i + 4}`).join('');
  const updates = fields.map((f) => `${f} = daily_activity_logs.${f} + EXCLUDED.${f}, `).join('');
  await db.query(
    `INSERT INTO daily_activity_logs (user_id, activity_date, topics_studied${cols})
     VALUES ($1, $2, CASE WHEN $3::text IS NULL THEN '[]'::jsonb ELSE jsonb_build_array($3::text) END${params})
     ON CONFLICT (user_id, activity_date) DO UPDATE SET ${updates}
       topics_studied = CASE
         WHEN $3::text IS NULL OR daily_activity_logs.topics_studied ? $3::text THEN daily_activity_logs.topics_studied
         ELSE daily_activity_logs.topics_studied || jsonb_build_array($3::text) END,
       updated_at = NOW()`,
    [userId, date, topic, ...values]
  );
  await updateStreak(userId, date);
}

/**
 * Called by the browser once per minute while the student is actively using the app.
 * Ignored if a heartbeat was already counted in the last 50 seconds (prevents inflation).
 */
async function heartbeat(userId, date) {
  const row = await db.one(
    `INSERT INTO daily_activity_logs (user_id, activity_date, study_minutes, last_heartbeat_at)
     VALUES ($1, $2, 1, NOW())
     ON CONFLICT (user_id, activity_date) DO UPDATE SET
       study_minutes = daily_activity_logs.study_minutes +
         CASE WHEN daily_activity_logs.last_heartbeat_at IS NULL
                OR daily_activity_logs.last_heartbeat_at < NOW() - INTERVAL '50 seconds' THEN 1 ELSE 0 END,
       last_heartbeat_at = CASE WHEN daily_activity_logs.last_heartbeat_at IS NULL
                OR daily_activity_logs.last_heartbeat_at < NOW() - INTERVAL '50 seconds' THEN NOW()
                ELSE daily_activity_logs.last_heartbeat_at END,
       updated_at = NOW()
     RETURNING study_minutes`,
    [userId, date]
  );
  await updateStreak(userId, date);
  return row.study_minutes;
}

// A day counts as "active" if the student studied 5+ minutes or completed any activity.
const ACTIVE_SQL = `(study_minutes >= 5 OR lessons_completed > 0 OR coding_attempted > 0 OR aptitude_attempted > 0
  OR communication_completed > 0 OR interview_answered > 0 OR assessments_completed > 0 OR mock_interviews_attempted > 0)`;

const dayNum = (d) => Math.round(new Date(d + 'T00:00:00Z').getTime() / 86400000);
const fmt = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

/** Pure function (easy to test): compute current & longest streak from a list of active dates. */
function computeStreaks(activeDates, today) {
  const days = [...new Set(activeDates.map(fmt))].map(dayNum).sort((a, b) => a - b);
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  // Current streak: count back from today; if today has no activity yet, the streak is still alive from yesterday.
  const set = new Set(days);
  let cursor = dayNum(today);
  if (!set.has(cursor)) cursor -= 1;
  let current = 0;
  while (set.has(cursor)) { current++; cursor--; }
  return { current, longest, lastActive: days.length ? new Date(days[days.length - 1] * 86400000).toISOString().slice(0, 10) : null };
}

async function updateStreak(userId, today) {
  const rows = await db.many(`SELECT activity_date FROM daily_activity_logs WHERE user_id = $1 AND ${ACTIVE_SQL}`, [userId]);
  const s = computeStreaks(rows.map((r) => r.activity_date), today);
  await db.query(
    `INSERT INTO study_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET current_streak = $2, longest_streak = $3, last_active_date = $4, updated_at = NOW()`,
    [userId, s.current, s.longest, s.lastActive]
  );
  return s;
}

async function getGoals(userId) {
  let goals = await db.one('SELECT * FROM daily_goals WHERE user_id = $1', [userId]);
  if (!goals) goals = await db.one('INSERT INTO daily_goals (user_id) VALUES ($1) RETURNING *', [userId]);
  return goals;
}

/** Completion % = average of (done / target) over every goal with a target > 0, each capped at 100%. */
function completion(log, goals) {
  const items = GOAL_MAP.filter((g) => Number(goals[g.goal]) > 0).map((g) => {
    const done = log ? Number(log[g.field]) || 0 : 0;
    const target = Number(goals[g.goal]);
    return { key: g.goal, label: g.label, done, target, percent: Math.min(100, Math.round((done / target) * 100)) };
  });
  const percent = items.length ? Math.round(items.reduce((s, i) => s + i.percent, 0) / items.length) : 0;
  return { percent, items };
}

function isActive(log) {
  if (!log) return false;
  return log.study_minutes >= 5 || COUNTERS.some((c) => c !== 'study_minutes' && c !== 'aptitude_correct' && Number(log[c]) > 0);
}

module.exports = { recordActivity, heartbeat, updateStreak, computeStreaks, getGoals, completion, isActive, GOAL_MAP, COUNTERS };
