const db = require('../database/db');
const { localDate } = require('../utils/http');
const activity = require('../services/activityService');
const readiness = require('../services/readinessService');
const recommendations = require('../services/recommendationService');
const { getProfile } = require('./authController');

const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const fmt = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

exports.dashboard = async (req, res) => {
  const uid = req.user.id;
  const today = localDate(req);
  const [profile, goals, todayLog, streak, ready, recs] = await Promise.all([
    getProfile(uid), activity.getGoals(uid),
    db.one('SELECT * FROM daily_activity_logs WHERE user_id=$1 AND activity_date=$2', [uid, today]),
    activity.updateStreak(uid, today), readiness.calculate(uid, today), recommendations.forUser(uid, today),
  ]);
  const totals = await db.one(
    `SELECT COALESCE(SUM(study_minutes),0)::int minutes FROM daily_activity_logs WHERE user_id=$1`, [uid]);
  const modules = await db.one(
    `SELECT COUNT(*)::int completed FROM (
       SELECT m.id FROM learning_modules m JOIN learning_topics t ON t.module_id=m.id JOIN lessons l ON l.topic_id=t.id
       LEFT JOIN learning_progress p ON p.lesson_id=l.id AND p.user_id=$1 AND p.status='completed'
       GROUP BY m.id HAVING COUNT(l.id) = COUNT(p.id)) x`, [uid]);

  // Weekly (last 7 days) and monthly (last 30 days) series from the daily logs
  const from = addDays(today, -29);
  const logs = await db.many('SELECT * FROM daily_activity_logs WHERE user_id=$1 AND activity_date BETWEEN $2 AND $3', [uid, from, today]);
  const byDate = Object.fromEntries(logs.map((l) => [fmt(l.activity_date), l]));
  const series = [];
  for (let d = from; d <= today; d = addDays(d, 1)) {
    const l = byDate[d];
    series.push({ date: d, minutes: l ? l.study_minutes : 0, completion: l ? activity.completion(l, goals).percent : 0, solved: l ? l.coding_solved : 0, aptitude: l ? l.aptitude_attempted : 0 });
  }
  const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);
  const week = series.slice(-7);

  const recent = await db.many(
    `(SELECT 'aptitude' AS type, 'Aptitude quiz: ' || COALESCE((SELECT title FROM learning_topics t WHERE t.slug=a.topic_slug LIMIT 1), 'Mixed') AS title,
             a.correct || '/' || a.total || ' correct' AS detail, a.created_at AS at FROM aptitude_attempts a WHERE a.user_id=$1 ORDER BY a.created_at DESC LIMIT 5)
     UNION ALL
     (SELECT 'coding', 'Coding: ' || p.title, replace(s.status,'_',' ') || ' (' || s.language || ')', s.created_at FROM coding_submissions s JOIN coding_problems p ON p.id=s.problem_id WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 5)
     UNION ALL
     (SELECT 'lesson', 'Lesson completed: ' || l.title, '', lp.completed_at FROM learning_progress lp JOIN lessons l ON l.id=lp.lesson_id WHERE lp.user_id=$1 AND lp.status='completed' ORDER BY lp.completed_at DESC LIMIT 5)
     UNION ALL
     (SELECT 'mock', 'Mock interview: ' || m.track || ' #' || m.set_no, COALESCE(m.overall_score || '/100', 'in progress'), m.started_at FROM mock_interviews m WHERE m.user_id=$1 ORDER BY m.started_at DESC LIMIT 3)
     UNION ALL
     (SELECT 'assessment', 'Assessment: ' || a.title, aa.percent || '%', aa.created_at FROM assessment_attempts aa JOIN assessments a ON a.id=aa.assessment_id WHERE aa.user_id=$1 ORDER BY aa.created_at DESC LIMIT 3)
     UNION ALL
     (SELECT 'communication', 'Communication: ' || e.title, ca.score || '/100', ca.created_at FROM communication_attempts ca JOIN communication_exercises e ON e.id=ca.exercise_id WHERE ca.user_id=$1 ORDER BY ca.created_at DESC LIMIT 3)
     ORDER BY at DESC LIMIT 8`, [uid]);

  const history = await db.many('SELECT calc_date, score FROM placement_readiness WHERE user_id=$1 ORDER BY calc_date DESC LIMIT 30', [uid]);

  res.json({
    profile, today, goals,
    todayCompletion: activity.completion(todayLog, goals),
    streak,
    readiness: { ...ready, history: history.reverse().map((h) => ({ date: fmt(h.calc_date), score: h.score })) },
    stats: {
      studyHours: Math.round((totals.minutes / 60) * 10) / 10,
      codingSolved: ready.stats.codingSolved,
      aptitudeAttempted: ready.stats.aptitudeAttempted,
      aptitudeAccuracy: ready.stats.aptitudeAccuracy,
      lessonsCompleted: ready.stats.lessonsCompleted,
      modulesCompleted: modules.completed,
    },
    weekly: { series: week, minutes: sum(week, 'minutes'), solved: sum(week, 'solved'), aptitude: sum(week, 'aptitude'), activeDays: week.filter((d) => d.minutes > 0 || d.solved > 0 || d.aptitude > 0).length },
    monthly: { series, minutes: sum(series, 'minutes'), solved: sum(series, 'solved'), aptitude: sum(series, 'aptitude'), activeDays: series.filter((d) => d.minutes > 0 || d.solved > 0 || d.aptitude > 0).length },
    recent, recommendations: recs,
  });
};

exports.progress = async (req, res) => {
  const uid = req.user.id;
  const today = localDate(req);
  const ready = await readiness.calculate(uid, today);
  const history = await db.many('SELECT calc_date, score FROM placement_readiness WHERE user_id=$1 ORDER BY calc_date LIMIT 90', [uid]);
  const modules = await db.many(
    `SELECT m.slug, m.title, m.category, COUNT(l.id)::int total, COUNT(p.id)::int completed
     FROM learning_modules m JOIN learning_topics t ON t.module_id=m.id JOIN lessons l ON l.topic_id=t.id
     LEFT JOIN learning_progress p ON p.lesson_id=l.id AND p.user_id=$1 AND p.status='completed'
     GROUP BY m.id ORDER BY m.sort_order`, [uid]);
  const coding = await db.many(
    `SELECT p.difficulty, COUNT(DISTINCT p.id)::int total, COUNT(DISTINCT s.problem_id)::int solved
     FROM coding_problems p LEFT JOIN coding_submissions s ON s.problem_id=p.id AND s.user_id=$1 AND s.status='accepted'
     GROUP BY p.difficulty ORDER BY CASE p.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`, [uid]);
  const codingTopics = await db.many(
    `SELECT p.topic, COUNT(DISTINCT p.id)::int total, COUNT(DISTINCT s.problem_id)::int solved
     FROM coding_problems p LEFT JOIN coding_submissions s ON s.problem_id=p.id AND s.user_id=$1 AND s.status='accepted'
     GROUP BY p.topic ORDER BY p.topic`, [uid]);
  const assessments = await db.many(
    `SELECT a.title, MAX(aa.percent)::int best, COUNT(aa.id)::int attempts FROM assessments a
     LEFT JOIN assessment_attempts aa ON aa.assessment_id=a.id AND aa.user_id=$1 GROUP BY a.id ORDER BY a.id`, [uid]);
  const mocks = await db.many(
    `SELECT track, set_no, overall_score, completed_at FROM mock_interviews WHERE user_id=$1 AND status='completed' ORDER BY completed_at`, [uid]);
  res.json({ readiness: ready, history: history.map((h) => ({ date: fmt(h.calc_date), score: h.score })), modules, coding, codingTopics, assessments, mocks });
};
