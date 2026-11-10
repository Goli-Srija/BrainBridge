const db = require('../database/db');
const { HttpError, localDate, toInt } = require('../utils/http');
const activity = require('../services/activityService');

const SECTIONS = ['quant', 'logical', 'verbal'];

exports.summary = async (req, res) => {
  const section = req.params.section;
  if (!SECTIONS.includes(section)) throw new HttpError(404, 'Unknown aptitude section.');
  const topics = await db.many(
    `SELECT t.slug, t.title, t.summary, t.sort_order,
       COUNT(q.id)::int AS total,
       COUNT(q.id) FILTER (WHERE q.difficulty='easy')::int AS easy,
       COUNT(q.id) FILTER (WHERE q.difficulty='medium')::int AS medium,
       COUNT(q.id) FILTER (WHERE q.difficulty='hard')::int AS hard
     FROM learning_topics t JOIN learning_modules m ON m.id = t.module_id AND m.slug = $1
     LEFT JOIN aptitude_questions q ON q.section = $1 AND q.topic_slug = t.slug
     GROUP BY t.id ORDER BY t.sort_order`, [section]);
  const stats = await db.many(
    `SELECT topic_slug, SUM(total)::int attempted, SUM(correct)::int correct, COUNT(*)::int quizzes,
            MAX(ROUND(100.0*correct/NULLIF(total,0)))::int best
     FROM aptitude_attempts WHERE user_id=$1 AND section=$2 GROUP BY topic_slug`, [req.user.id, section]);
  const byTopic = Object.fromEntries(stats.map((s) => [s.topic_slug, s]));
  res.json({
    section,
    topics: topics.map((t) => {
      const s = byTopic[t.slug];
      return { ...t, attempted: s ? s.attempted : 0, accuracy: s && s.attempted ? Math.round((s.correct / s.attempted) * 100) : null, best: s ? s.best : null, quizzes: s ? s.quizzes : 0 };
    }),
  });
};

exports.quiz = async (req, res) => {
  const { section, topic } = req.query;
  if (!SECTIONS.includes(section)) throw new HttpError(400, 'Invalid section.');
  const count = Math.min(Math.max(toInt(req.query.count, 10), 5), 30);
  const params = [section];
  let where = 'section = $1';
  if (topic && topic !== 'mixed') { params.push(topic); where += ` AND topic_slug = $${params.length}`; }
  if (['easy', 'medium', 'hard'].includes(req.query.difficulty)) { params.push(req.query.difficulty); where += ` AND difficulty = $${params.length}`; }
  params.push(count);
  const questions = await db.many(
    `SELECT id, topic_slug, question, options, difficulty FROM aptitude_questions WHERE ${where} ORDER BY random() LIMIT $${params.length}`, params);
  if (!questions.length) throw new HttpError(404, 'No questions found for this selection.');
  res.json({ questions, timeLimitSeconds: questions.length * 72 }); // ~72 s per question, typical of placement tests
};

exports.submit = async (req, res) => {
  const { section, topic, difficulty, answers } = req.body;
  if (!SECTIONS.includes(section) || !Array.isArray(answers) || !answers.length) throw new HttpError(400, 'Invalid submission.');
  const ids = answers.map((a) => toInt(a.question_id, 0)).filter(Boolean);
  const rows = await db.many('SELECT id, question, options, answer_index, explanation, difficulty, topic_slug FROM aptitude_questions WHERE id = ANY($1)', [ids]);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const review = answers.filter((a) => byId[a.question_id]).map((a) => {
    const q = byId[a.question_id];
    const selected = a.selected === null || a.selected === undefined ? null : toInt(a.selected, null);
    return { question_id: q.id, question: q.question, options: q.options, selected, answer_index: q.answer_index, correct: selected === q.answer_index, explanation: q.explanation, difficulty: q.difficulty, topic_slug: q.topic_slug };
  });
  const correct = review.filter((r) => r.correct).length;
  const attemptedCount = review.filter((r) => r.selected !== null).length;
  const time = Math.max(0, Math.min(toInt(req.body.time_taken_s, 0), 7200));
  const attempt = await db.one(
    `INSERT INTO aptitude_attempts (user_id, section, topic_slug, difficulty, total, correct, time_taken_s, answers)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at`,
    [req.user.id, section, topic || 'mixed', difficulty || null, review.length, correct, time,
      JSON.stringify(review.map((r) => ({ question_id: r.question_id, selected: r.selected, correct: r.correct })))]);
  const topicTitle = await db.one('SELECT title FROM learning_topics WHERE slug = $1 LIMIT 1', [topic]);
  await activity.recordActivity(req.user.id, localDate(req), { aptitude_attempted: attemptedCount, aptitude_correct: correct }, topicTitle ? topicTitle.title : null);
  res.json({ attemptId: attempt.id, total: review.length, attempted: attemptedCount, correct, accuracy: review.length ? Math.round((correct / review.length) * 100) : 0, timeTaken: time, review });
};

exports.attempts = async (req, res) => {
  const params = [req.user.id];
  let where = 'user_id = $1';
  if (req.query.section) { params.push(req.query.section); where += ' AND section = $2'; }
  const attempts = await db.many(
    `SELECT a.id, a.section, a.topic_slug, a.difficulty, a.total, a.correct, a.time_taken_s, a.created_at,
            (SELECT title FROM learning_topics t WHERE t.slug = a.topic_slug LIMIT 1) AS topic_title
     FROM aptitude_attempts a WHERE ${where} ORDER BY created_at DESC LIMIT 50`, params);
  res.json({ attempts });
};

exports.attemptDetail = async (req, res) => {
  const a = await db.one('SELECT * FROM aptitude_attempts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!a) throw new HttpError(404, 'Attempt not found.');
  const rows = await db.many('SELECT id, question, options, answer_index, explanation, difficulty FROM aptitude_questions WHERE id = ANY($1)', [a.answers.map((x) => x.question_id)]);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const review = a.answers.filter((x) => byId[x.question_id]).map((x) => ({ ...byId[x.question_id], question_id: x.question_id, selected: x.selected, correct: x.correct }));
  res.json({ attempt: a, review });
};
