const db = require('../database/db');
const { HttpError, localDate, toInt } = require('../utils/http');
const activity = require('../services/activityService');
const runner = require('../services/codeRunner');

const LANGS = ['java', 'python', 'c'];
const MAX_CODE = 50000;

const STARTERS = {
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input as described in "Input Format", then print the answer.\n\n    }\n}\n`,
  python: `import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # Read input as described in "Input Format", then print the answer.\n\n\nif __name__ == "__main__":\n    main()\n`,
  c: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n    // Read input as described in "Input Format", then print the answer.\n\n    return 0;\n}\n`,
};

exports.list = async (req, res) => {
  const params = [req.user.id];
  const where = [];
  if (['easy', 'medium', 'hard'].includes(req.query.difficulty)) { params.push(req.query.difficulty); where.push(`p.difficulty = $${params.length}`); }
  if (req.query.topic) { params.push(req.query.topic); where.push(`p.topic = $${params.length}`); }
  if (req.query.search) { params.push(`%${req.query.search}%`); where.push(`(p.title ILIKE $${params.length} OR p.topic ILIKE $${params.length})`); }
  if (req.query.status === 'solved') where.push('s.solved');
  if (req.query.status === 'unsolved') where.push('(s.solved IS NULL OR NOT s.solved)');
  if (req.query.bookmarked === 'true') where.push('b.id IS NOT NULL');
  const problems = await db.many(
    `SELECT p.id, p.slug, p.title, p.difficulty, p.topic,
            COALESCE(s.solved, FALSE) AS solved, COALESCE(s.attempts, 0)::int AS attempts, (b.id IS NOT NULL) AS bookmarked
     FROM coding_problems p
     LEFT JOIN (SELECT problem_id, BOOL_OR(status='accepted') solved, COUNT(*) attempts FROM coding_submissions WHERE user_id=$1 GROUP BY problem_id) s ON s.problem_id = p.id
     LEFT JOIN user_bookmarks b ON b.user_id = $1 AND b.item_type = 'coding_problem' AND b.item_id = p.id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY CASE p.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, p.id`, params);
  const topics = await db.many('SELECT topic, COUNT(*)::int count FROM coding_problems GROUP BY topic ORDER BY topic');
  const totals = await db.one(
    `SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE difficulty='easy')::int easy, COUNT(*) FILTER (WHERE difficulty='medium')::int medium,
            COUNT(*) FILTER (WHERE difficulty='hard')::int hard,
            (SELECT COUNT(DISTINCT problem_id)::int FROM coding_submissions WHERE user_id=$1 AND status='accepted') solved
     FROM coding_problems`, [req.user.id]);
  res.json({ problems, topics, totals });
};

exports.detail = async (req, res) => {
  const p = await db.one('SELECT * FROM coding_problems WHERE slug = $1 OR id::text = $1', [req.params.slug]);
  if (!p) throw new HttpError(404, 'Problem not found.');
  const drafts = await db.many('SELECT language, code, updated_at FROM code_drafts WHERE user_id=$1 AND problem_id=$2', [req.user.id, p.id]);
  const solved = !!(await db.one(`SELECT 1 FROM coding_submissions WHERE user_id=$1 AND problem_id=$2 AND status='accepted' LIMIT 1`, [req.user.id, p.id]));
  const bookmarked = !!(await db.one(`SELECT 1 FROM user_bookmarks WHERE user_id=$1 AND item_type='coding_problem' AND item_id=$2`, [req.user.id, p.id]));
  const { test_cases, ...rest } = p;
  res.json({
    problem: { ...rest, sample_tests: test_cases.filter((t) => !t.hidden), hidden_count: test_cases.filter((t) => t.hidden).length },
    starters: STARTERS, drafts, solved, bookmarked,
  });
};

function validateCode(body) {
  if (!LANGS.includes(body.language)) throw new HttpError(400, 'Language must be java, python or c.');
  if (typeof body.code !== 'string' || !body.code.trim()) throw new HttpError(400, 'Write some code first.');
  if (body.code.length > MAX_CODE) throw new HttpError(400, 'Code is too long.');
}

exports.runtimeStatus = async (req, res) => res.json(await runner.status());

// Run against the visible sample tests (or custom input). Not saved as a submission.
exports.run = async (req, res) => {
  validateCode(req.body);
  const p = await db.one('SELECT id, test_cases FROM coding_problems WHERE id = $1', [req.body.problem_id]);
  if (!p) throw new HttpError(404, 'Problem not found.');
  if (typeof req.body.custom_input === 'string') {
    return res.json({ custom: true, ...(await runner.runCustom(req.body.language, req.body.code, req.body.custom_input)) });
  }
  const result = await runner.runTests(req.body.language, req.body.code, p.test_cases.filter((t) => !t.hidden));
  res.json(result);
};

// Submit: run against ALL tests (including hidden) and store the result.
exports.submit = async (req, res) => {
  validateCode(req.body);
  const p = await db.one('SELECT id, title, test_cases FROM coding_problems WHERE id = $1', [req.body.problem_id]);
  if (!p) throw new HttpError(404, 'Problem not found.');
  const alreadySolved = !!(await db.one(`SELECT 1 FROM coding_submissions WHERE user_id=$1 AND problem_id=$2 AND status='accepted' LIMIT 1`, [req.user.id, p.id]));
  const result = await runner.runTests(req.body.language, req.body.code, p.test_cases);
  const sub = await db.one(
    `INSERT INTO coding_submissions (user_id, problem_id, language, code, status, passed, total, runner, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at`,
    [req.user.id, p.id, req.body.language, req.body.code, result.status, result.passed || 0, result.total || 0, result.runner,
      JSON.stringify({ message: result.message || null, tests: (result.tests || []).map((t) => ({ verdict: t.verdict, hidden: t.hidden, timeMs: t.timeMs })) })]);
  // Save the code as the latest draft too.
  await db.query(
    `INSERT INTO code_drafts (user_id, problem_id, language, code) VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, problem_id, language) DO UPDATE SET code = EXCLUDED.code, updated_at = NOW()`,
    [req.user.id, p.id, req.body.language, req.body.code]);
  if (result.status !== 'not_executed') {
    const newlySolved = result.status === 'accepted' && !alreadySolved;
    await activity.recordActivity(req.user.id, localDate(req), { coding_attempted: 1, coding_solved: newlySolved ? 1 : 0 }, `Coding: ${p.title}`);
  }
  res.json({ submissionId: sub.id, ...result });
};

exports.saveDraft = async (req, res) => {
  validateCode(req.body);
  await db.query(
    `INSERT INTO code_drafts (user_id, problem_id, language, code) VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, problem_id, language) DO UPDATE SET code = EXCLUDED.code, updated_at = NOW()`,
    [req.user.id, toInt(req.body.problem_id, 0), req.body.language, req.body.code]);
  res.json({ message: 'Code saved.' });
};

exports.submissions = async (req, res) => {
  const params = [req.user.id];
  let where = 's.user_id = $1';
  if (req.query.problem_id) { params.push(toInt(req.query.problem_id, 0)); where += ' AND s.problem_id = $2'; }
  const rows = await db.many(
    `SELECT s.id, s.problem_id, p.title, p.slug, p.difficulty, s.language, s.status, s.passed, s.total, s.runner, s.created_at, s.code
     FROM coding_submissions s JOIN coding_problems p ON p.id = s.problem_id WHERE ${where} ORDER BY s.created_at DESC LIMIT 50`, params);
  res.json({ submissions: rows });
};
