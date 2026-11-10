// Communication exercises and interview-preparation practice (both use the rule-based answer evaluator).
const db = require('../database/db');
const { HttpError, localDate } = require('../utils/http');
const activity = require('../services/activityService');
const { evaluateAnswer } = require('../services/answerEvaluator');
const ai = require('../services/aiService');

// ---------------- Communication ----------------
exports.listExercises = async (req, res) => {
  const exercises = await db.many(
    `SELECT e.id, e.slug, e.title, e.category, e.prompt, e.min_words,
            MAX(a.score)::int AS best_score, COUNT(a.id)::int AS attempts
     FROM communication_exercises e LEFT JOIN communication_attempts a ON a.exercise_id = e.id AND a.user_id = $1
     GROUP BY e.id ORDER BY e.id`, [req.user.id]);
  res.json({ exercises });
};

exports.getExercise = async (req, res) => {
  const e = await db.one('SELECT * FROM communication_exercises WHERE slug = $1', [req.params.slug]);
  if (!e) throw new HttpError(404, 'Exercise not found.');
  const attempts = await db.many('SELECT id, response, score, feedback, created_at FROM communication_attempts WHERE user_id=$1 AND exercise_id=$2 ORDER BY created_at DESC LIMIT 10', [req.user.id, e.id]);
  res.json({ exercise: e, attempts });
};

exports.submitExercise = async (req, res) => {
  const e = await db.one('SELECT * FROM communication_exercises WHERE slug = $1', [req.params.slug]);
  if (!e) throw new HttpError(404, 'Exercise not found.');
  const response = String(req.body.response || '').trim();
  if (response.split(/\s+/).length < 10) throw new HttpError(400, 'Please write at least 10 words.');
  if (response.length > 8000) throw new HttpError(400, 'Response is too long.');
  const result = evaluateAnswer(response, { keywords: e.keywords, minWords: e.min_words });
  const aiResult = await ai.aiFeedback({ question: e.prompt, answer: response, modelAnswer: e.model_answer, track: 'communication' });
  const feedback = { ...result, ai: aiResult };
  const row = await db.one(
    'INSERT INTO communication_attempts (user_id, exercise_id, response, score, feedback) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at',
    [req.user.id, e.id, response, result.score, JSON.stringify(feedback)]);
  await activity.recordActivity(req.user.id, localDate(req), { communication_completed: 1 }, `Communication: ${e.title}`);
  res.json({ attemptId: row.id, score: result.score, feedback, modelAnswer: e.model_answer });
};

// ---------------- Interview preparation (question bank) ----------------
exports.prepCategories = async (req, res) => {
  const cats = await db.many(
    `SELECT category, COUNT(*)::int count FROM interview_questions WHERE bank='prep' GROUP BY category ORDER BY MIN(id)`);
  res.json({ categories: cats });
};

exports.prepQuestions = async (req, res) => {
  const questions = await db.many(
    `SELECT id, category, difficulty, question, model_answer, keywords FROM interview_questions WHERE bank='prep' AND category=$1 ORDER BY sort_order, id`,
    [req.params.category]);
  res.json({ questions });
};

exports.prepPractice = async (req, res) => {
  const q = await db.one(`SELECT * FROM interview_questions WHERE id=$1 AND bank='prep'`, [req.params.id]);
  if (!q) throw new HttpError(404, 'Question not found.');
  const answer = String(req.body.answer || '').trim();
  if (answer.split(/\s+/).length < 5) throw new HttpError(400, 'Please write a fuller answer (at least 5 words).');
  const result = evaluateAnswer(answer, { keywords: q.keywords, minWords: q.category === 'hr' ? 60 : 40 });
  const aiResult = await ai.aiFeedback({ question: q.question, answer, modelAnswer: q.model_answer, track: 'technical/HR interview' });
  await activity.recordActivity(req.user.id, localDate(req), { interview_answered: 1 }, `Interview: ${q.category}`);
  res.json({ ...result, ai: aiResult, modelAnswer: q.model_answer, aiEnabled: ai.isEnabled() });
};
