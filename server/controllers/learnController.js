const db = require('../database/db');
const { HttpError, localDate } = require('../utils/http');
const activity = require('../services/activityService');

exports.listModules = async (req, res) => {
  const params = [req.user.id];
  let where = '';
  if (req.query.category) { params.push(req.query.category.split(',')); where = 'WHERE m.category = ANY($2)'; }
  const modules = await db.many(
    `SELECT m.*, COUNT(DISTINCT l.id)::int AS lesson_count,
            COUNT(DISTINCT p.lesson_id) FILTER (WHERE p.status = 'completed')::int AS completed_count
     FROM learning_modules m
     LEFT JOIN learning_topics t ON t.module_id = m.id
     LEFT JOIN lessons l ON l.topic_id = t.id
     LEFT JOIN learning_progress p ON p.lesson_id = l.id AND p.user_id = $1
     ${where} GROUP BY m.id ORDER BY m.sort_order`, params);
  res.json({ modules });
};

exports.getModule = async (req, res) => {
  const mod = await db.one('SELECT * FROM learning_modules WHERE slug = $1', [req.params.module]);
  if (!mod) throw new HttpError(404, 'Module not found.');
  const topics = await db.many(
    `SELECT t.id, t.slug, t.title, t.summary, t.sort_order, l.id AS lesson_id, l.difficulty, l.est_minutes,
            p.status, p.completed_at,
            (SELECT COUNT(*) FROM aptitude_questions q WHERE q.topic_slug = t.slug AND q.section = $3)::int AS question_count
     FROM learning_topics t
     LEFT JOIN lessons l ON l.topic_id = t.id
     LEFT JOIN learning_progress p ON p.lesson_id = l.id AND p.user_id = $2
     WHERE t.module_id = $1 ORDER BY t.sort_order`, [mod.id, req.user.id, mod.slug]);
  res.json({ module: mod, topics });
};

exports.getTopic = async (req, res) => {
  const row = await db.one(
    `SELECT t.*, m.slug AS module_slug, m.title AS module_title, m.category
     FROM learning_topics t JOIN learning_modules m ON m.id = t.module_id
     WHERE m.slug = $1 AND t.slug = $2`, [req.params.module, req.params.topic]);
  if (!row) throw new HttpError(404, 'Topic not found.');
  const lessons = await db.many(
    `SELECT l.*, p.status, p.completed_at FROM lessons l
     LEFT JOIN learning_progress p ON p.lesson_id = l.id AND p.user_id = $2
     WHERE l.topic_id = $1 ORDER BY l.sort_order`, [row.id, req.user.id]);
  const siblings = await db.many('SELECT slug, title, sort_order FROM learning_topics WHERE module_id = $1 ORDER BY sort_order', [row.module_id]);
  const idx = siblings.findIndex((s) => s.slug === row.slug);
  const bookmarked = lessons[0] ? !!(await db.one(`SELECT 1 FROM user_bookmarks WHERE user_id=$1 AND item_type='lesson' AND item_id=$2`, [req.user.id, lessons[0].id])) : false;
  const questionCount = (await db.one('SELECT COUNT(*)::int c FROM aptitude_questions WHERE section = $1 AND topic_slug = $2', [row.module_slug, row.slug])).c;
  res.json({
    topic: row, lessons, bookmarked, questionCount,
    prev: siblings[idx - 1] || null, next: siblings[idx + 1] || null,
  });
};

exports.startLesson = async (req, res) => {
  const lesson = await db.one('SELECT id FROM lessons WHERE id = $1', [req.params.id]);
  if (!lesson) throw new HttpError(404, 'Lesson not found.');
  await db.query(
    `INSERT INTO learning_progress (user_id, lesson_id, status) VALUES ($1,$2,'started') ON CONFLICT (user_id, lesson_id) DO NOTHING`,
    [req.user.id, lesson.id]);
  res.json({ message: 'Lesson started.' });
};

exports.completeLesson = async (req, res) => {
  const lesson = await db.one(
    `SELECT l.id, l.topic_id, t.title AS topic_title FROM lessons l JOIN learning_topics t ON t.id = l.topic_id WHERE l.id = $1`, [req.params.id]);
  if (!lesson) throw new HttpError(404, 'Lesson not found.');
  const prev = await db.one('SELECT status FROM learning_progress WHERE user_id=$1 AND lesson_id=$2', [req.user.id, lesson.id]);
  await db.query(
    `INSERT INTO learning_progress (user_id, lesson_id, status, completed_at) VALUES ($1,$2,'completed',NOW())
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET status='completed', completed_at=COALESCE(learning_progress.completed_at, NOW())`,
    [req.user.id, lesson.id]);
  const firstTime = !prev || prev.status !== 'completed';
  if (firstTime) {
    await activity.recordActivity(req.user.id, localDate(req), { lessons_completed: 1 }, lesson.topic_title);
    // Tick matching roadmap items automatically.
    await db.query(
      `UPDATE roadmap_items SET completed = TRUE, completed_at = NOW()
       WHERE topic_id = $2 AND NOT completed AND roadmap_id IN (SELECT id FROM learning_roadmaps WHERE user_id = $1)`,
      [req.user.id, lesson.topic_id]);
  }
  res.json({ message: firstTime ? 'Lesson marked complete. Great work!' : 'Lesson already completed.', firstTime });
};

exports.uncompleteLesson = async (req, res) => {
  await db.query(`UPDATE learning_progress SET status='started', completed_at=NULL WHERE user_id=$1 AND lesson_id=$2`, [req.user.id, req.params.id]);
  res.json({ message: 'Lesson marked as in progress.' });
};
