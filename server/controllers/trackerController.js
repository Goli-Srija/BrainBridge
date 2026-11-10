const db = require('../database/db');
const { HttpError, localDate, toInt } = require('../utils/http');
const activity = require('../services/activityService');
const recommendations = require('../services/recommendationService');

const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const fmt = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

exports.today = async (req, res) => {
  const date = localDate(req);
  const goals = await activity.getGoals(req.user.id);
  const log = await db.one('SELECT * FROM daily_activity_logs WHERE user_id=$1 AND activity_date=$2', [req.user.id, date]);
  const streak = await activity.updateStreak(req.user.id, date);
  res.json({ date, goals, log, completion: activity.completion(log, goals), streak });
};

exports.updateGoals = async (req, res) => {
  const fields = ['coding_problems', 'aptitude_questions', 'communication_exercises', 'lessons', 'interview_questions', 'study_minutes'];
  const limits = { coding_problems: 50, aptitude_questions: 200, communication_exercises: 20, lessons: 20, interview_questions: 50, study_minutes: 720 };
  const current = await activity.getGoals(req.user.id);
  const values = fields.map((f) => {
    const v = req.body[f] === undefined ? current[f] : toInt(req.body[f], NaN);
    const min = f === 'study_minutes' ? 10 : 0;
    if (!Number.isFinite(v) || v < min || v > limits[f]) throw new HttpError(400, `${f.replace(/_/g, ' ')} must be between ${min} and ${limits[f]}.`);
    return v;
  });
  const goals = await db.one(
    `UPDATE daily_goals SET ${fields.map((f, i) => `${f}=$${i + 2}`).join(', ')}, updated_at=NOW() WHERE user_id=$1 RETURNING *`,
    [req.user.id, ...values]);
  await db.query('UPDATE student_profiles SET daily_goal_minutes=$2 WHERE user_id=$1', [req.user.id, goals.study_minutes]);
  res.json({ goals, message: 'Daily goals updated.' });
};

// Manual study session: "I studied OS for 45 minutes"
exports.logSession = async (req, res) => {
  const minutes = toInt(req.body.minutes, 0);
  if (minutes < 1 || minutes > 600) throw new HttpError(400, 'Minutes must be between 1 and 600.');
  const topic = req.body.topic ? String(req.body.topic).trim().slice(0, 100) : null;
  const date = localDate(req);
  await activity.recordActivity(req.user.id, date, { study_minutes: minutes }, topic || null);
  if (req.body.notes) {
    await db.query(
      `UPDATE daily_activity_logs SET notes = TRIM(BOTH E'\\n' FROM COALESCE(notes,'') || E'\\n' || $3) WHERE user_id=$1 AND activity_date=$2`,
      [req.user.id, date, String(req.body.notes).slice(0, 500)]);
  }
  res.json({ message: `Logged ${minutes} minutes${topic ? ` of ${topic}` : ''}.` });
};

exports.heartbeat = async (req, res) => {
  const minutes = await activity.heartbeat(req.user.id, localDate(req));
  res.json({ studyMinutesToday: minutes });
};

exports.calendar = async (req, res) => {
  const today = localDate(req);
  const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : today.slice(0, 7);
  const start = `${month}-01`;
  const end = addDays(addDays(start, 32).slice(0, 7) + '-01', -1);
  const goals = await activity.getGoals(req.user.id);
  const logs = await db.many('SELECT * FROM daily_activity_logs WHERE user_id=$1 AND activity_date BETWEEN $2 AND $3', [req.user.id, start, end]);
  const byDate = Object.fromEntries(logs.map((l) => [fmt(l.activity_date), l]));
  const joined = await db.one('SELECT created_at FROM users WHERE id=$1', [req.user.id]);
  const joinDate = fmt(joined.created_at);
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const log = byDate[d];
    const c = activity.completion(log, goals);
    let status;
    if (d > today) status = 'future';
    else if (log && c.percent >= 100) status = 'completed';
    else if (log && activity.isActive(log)) status = 'partial';
    else if (d === today) status = 'today';
    else if (d < joinDate) status = 'before_join';
    else status = 'missed';
    days.push({ date: d, status, isToday: d === today, percent: log ? c.percent : 0, minutes: log ? log.study_minutes : 0,
      summary: log ? { lessons: log.lessons_completed, coding: log.coding_solved, aptitude: log.aptitude_attempted, topics: log.topics_studied } : null });
  }
  res.json({ month, today, days });
};

exports.analytics = async (req, res) => {
  const today = localDate(req);
  const uid = req.user.id;
  const goals = await activity.getGoals(uid);
  const from30 = addDays(today, -29);
  const logs = await db.many('SELECT * FROM daily_activity_logs WHERE user_id=$1 AND activity_date BETWEEN $2 AND $3', [uid, from30, today]);
  const byDate = Object.fromEntries(logs.map((l) => [fmt(l.activity_date), l]));
  const daily = [];
  for (let d = from30; d <= today; d = addDays(d, 1)) {
    const l = byDate[d];
    daily.push({
      date: d, minutes: l ? l.study_minutes : 0, completion: l ? activity.completion(l, goals).percent : 0,
      codingSolved: l ? l.coding_solved : 0, aptitude: l ? l.aptitude_attempted : 0, aptitudeCorrect: l ? l.aptitude_correct : 0, lessons: l ? l.lessons_completed : 0,
    });
  }
  // Monthly totals for the last 6 months
  const monthly = await db.many(
    `SELECT to_char(activity_date, 'YYYY-MM') AS month, SUM(study_minutes)::int minutes, SUM(coding_solved)::int coding,
            SUM(aptitude_attempted)::int aptitude, SUM(lessons_completed)::int lessons, COUNT(*)::int days
     FROM daily_activity_logs WHERE user_id=$1 AND activity_date > ($2::date - INTERVAL '6 months')
     GROUP BY 1 ORDER BY 1`, [uid, today]);
  // Topic-wise aptitude performance
  const topics = await db.many(
    `SELECT a.section, a.topic_slug, COALESCE(t.title, a.topic_slug) title, SUM(a.total)::int attempted, SUM(a.correct)::int correct
     FROM aptitude_attempts a LEFT JOIN (SELECT DISTINCT ON (slug) slug, title FROM learning_topics) t ON t.slug = a.topic_slug
     WHERE a.user_id=$1 GROUP BY a.section, a.topic_slug, t.title ORDER BY attempted DESC LIMIT 15`, [uid]);
  // Skill-wise progress (each 0-100)
  const s = await db.one(
    `SELECT
      (SELECT COALESCE(ROUND(100.0*SUM(correct)/NULLIF(SUM(total),0)),0) FROM aptitude_attempts WHERE user_id=$1 AND section='quant')::int quant,
      (SELECT COALESCE(ROUND(100.0*SUM(correct)/NULLIF(SUM(total),0)),0) FROM aptitude_attempts WHERE user_id=$1 AND section='logical')::int logical,
      (SELECT COALESCE(ROUND(100.0*SUM(correct)/NULLIF(SUM(total),0)),0) FROM aptitude_attempts WHERE user_id=$1 AND section='verbal')::int verbal,
      (SELECT COUNT(DISTINCT problem_id) FROM coding_submissions WHERE user_id=$1 AND status='accepted')::int coding_solved,
      (SELECT COUNT(*) FROM coding_problems)::int coding_total,
      (SELECT COALESCE(ROUND(AVG(best)),0) FROM (SELECT MAX(score) best FROM communication_attempts WHERE user_id=$1 GROUP BY exercise_id) x)::int communication,
      (SELECT COALESCE(ROUND(AVG(overall_score)),0) FROM mock_interviews WHERE user_id=$1 AND status='completed')::int interview,
      (SELECT COALESCE(ROUND(AVG(percent)),0) FROM assessment_attempts WHERE user_id=$1)::int assessments`, [uid]);
  const accuracy = await db.one(`SELECT COALESCE(SUM(total),0)::int attempted, COALESCE(SUM(correct),0)::int correct FROM aptitude_attempts WHERE user_id=$1`, [uid]);
  const codingAcc = await db.one(`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE status='accepted')::int accepted FROM coding_submissions WHERE user_id=$1 AND status <> 'not_executed'`, [uid]);
  res.json({
    daily, weekly: daily.slice(-7), monthly, topics,
    skills: [
      { skill: 'Quantitative', value: s.quant }, { skill: 'Logical', value: s.logical }, { skill: 'Verbal', value: s.verbal },
      // Coding: 50 solved problems (or all problems, if fewer) = 100%
      { skill: 'Coding', value: s.coding_total ? Math.min(100, Math.round((100 * s.coding_solved) / Math.min(s.coding_total, 50))) : 0 },
      { skill: 'Communication', value: s.communication }, { skill: 'Interview', value: s.interview }, { skill: 'Assessments', value: s.assessments },
    ],
    accuracy: { aptitude: accuracy.attempted ? Math.round((100 * accuracy.correct) / accuracy.attempted) : 0, aptitudeAttempted: accuracy.attempted, aptitudeCorrect: accuracy.correct,
      coding: codingAcc.total ? Math.round((100 * codingAcc.accepted) / codingAcc.total) : 0, codingSubmissions: codingAcc.total },
  });
};

exports.recommendations = async (req, res) => {
  res.json({ recommendations: await recommendations.forUser(req.user.id, localDate(req)) });
};
