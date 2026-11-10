const db = require('../database/db');
const { HttpError, localDate, toInt } = require('../utils/http');
const activity = require('../services/activityService');

exports.list = async (req, res) => {
  const rows = await db.many(
    `SELECT a.*, (SELECT COUNT(*)::int FROM assessment_questions q WHERE q.assessment_id=a.id) AS question_count,
            MAX(t.percent)::int AS best, COUNT(t.id)::int AS attempts
     FROM assessments a LEFT JOIN assessment_attempts t ON t.assessment_id=a.id AND t.user_id=$1
     GROUP BY a.id ORDER BY a.id`, [req.user.id]);
  res.json({ assessments: rows });
};

exports.start = async (req, res) => {
  const a = await db.one('SELECT * FROM assessments WHERE slug=$1', [req.params.slug]);
  if (!a) throw new HttpError(404, 'Assessment not found.');
  const questions = await db.many('SELECT id, question, options, topic FROM assessment_questions WHERE assessment_id=$1 ORDER BY sort_order, id', [a.id]);
  res.json({ assessment: a, questions });
};

exports.submit = async (req, res) => {
  const a = await db.one('SELECT * FROM assessments WHERE slug=$1', [req.params.slug]);
  if (!a) throw new HttpError(404, 'Assessment not found.');
  const answers = req.body.answers || {};
  const questions = await db.many('SELECT * FROM assessment_questions WHERE assessment_id=$1 ORDER BY sort_order, id', [a.id]);
  const topics = {};
  const review = questions.map((q) => {
    const sel = answers[q.id] === undefined || answers[q.id] === null ? null : toInt(answers[q.id], null);
    const correct = sel === q.answer_index;
    topics[q.topic] = topics[q.topic] || { topic: q.topic, total: 0, correct: 0 };
    topics[q.topic].total++; if (correct) topics[q.topic].correct++;
    return { id: q.id, question: q.question, options: q.options, selected: sel, answer_index: q.answer_index, correct, explanation: q.explanation, topic: q.topic };
  });
  const score = review.filter((r) => r.correct).length;
  const percent = Math.round((score / questions.length) * 100);
  const breakdown = Object.values(topics).map((t) => ({ ...t, percent: Math.round((t.correct / t.total) * 100) }));
  const time = Math.max(0, Math.min(toInt(req.body.time_taken_s, 0), a.duration_min * 60 + 120));
  const row = await db.one(
    `INSERT INTO assessment_attempts (user_id, assessment_id, score, total, percent, passed, answers, topic_breakdown, time_taken_s)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [req.user.id, a.id, score, questions.length, percent, percent >= a.pass_percent, JSON.stringify(answers), JSON.stringify(breakdown), time]);
  await activity.recordActivity(req.user.id, localDate(req), { assessments_completed: 1 }, `Assessment: ${a.title}`);
  res.json({ attemptId: row.id, score, total: questions.length, percent, passed: percent >= a.pass_percent, passPercent: a.pass_percent, breakdown, review, timeTaken: time });
};

exports.attempts = async (req, res) => {
  const rows = await db.many(
    `SELECT t.id, a.title, a.slug, t.score, t.total, t.percent, t.passed, t.time_taken_s, t.topic_breakdown, t.created_at
     FROM assessment_attempts t JOIN assessments a ON a.id=t.assessment_id WHERE t.user_id=$1 ORDER BY t.created_at DESC LIMIT 30`, [req.user.id]);
  res.json({ attempts: rows });
};
