// Personalised "what to do next" list, based on real data:
// today's unmet goals, weak aptitude topics, unfinished roadmap items, target role and missing artefacts.
const db = require('../database/db');
const activity = require('./activityService');

const ROLE_TRACK = {
  'Java Developer': 'java', 'Full Stack Developer': 'fullstack', 'Frontend Developer': 'fullstack', 'Backend Developer': 'fullstack',
  'Software Development Engineer': 'sde', 'Python Developer': 'sde', 'Data Analyst': 'data', 'Data Scientist': 'data', 'AI/ML Engineer': 'data',
};

async function forUser(userId, date) {
  const recs = [];
  const profile = await db.one('SELECT * FROM student_profiles WHERE user_id = $1', [userId]);
  const goals = await activity.getGoals(userId);
  const log = await db.one('SELECT * FROM daily_activity_logs WHERE user_id = $1 AND activity_date = $2', [userId, date]);
  const comp = activity.completion(log, goals);
  const level = profile && profile.preparation_level === 'advanced' ? 'medium' : 'easy';

  // 1. Unmet daily goals
  const links = {
    coding_problems: `/coding?status=unsolved&difficulty=${level}`, aptitude_questions: '/aptitude', communication_exercises: '/communication',
    lessons: '/roadmap', interview_questions: '/interview', study_minutes: '/tracker',
  };
  comp.items.filter((i) => i.done < i.target).slice(0, 3).forEach((i) =>
    recs.push({ type: 'goal', title: `${i.label}: ${i.target - i.done} more to reach today's goal`, reason: `Daily goal ${i.done}/${i.target}`, link: links[i.key] }));

  // 2. Weak aptitude topics (accuracy below 60% with enough attempts)
  const weak = await db.many(
    `SELECT a.section, a.topic_slug, t.title, SUM(a.correct)::float / NULLIF(SUM(a.total),0) acc, SUM(a.total)::int n
     FROM aptitude_attempts a LEFT JOIN learning_topics t ON t.slug = a.topic_slug
     WHERE a.user_id = $1 AND a.topic_slug <> 'mixed' GROUP BY a.section, a.topic_slug, t.title
     HAVING SUM(a.total) >= 5 AND SUM(a.correct)::float / NULLIF(SUM(a.total),0) < 0.6 ORDER BY acc LIMIT 2`, [userId]);
  weak.forEach((w) => recs.push({ type: 'weak', title: `Revise ${w.title || w.topic_slug}`, reason: `Your accuracy is ${Math.round(w.acc * 100)}% over ${w.n} questions`, link: `/learn/${w.section}/${w.topic_slug}` }));

  // 3. Next roadmap items
  const next = await db.many(
    `SELECT ri.title, ri.link, ri.stage FROM roadmap_items ri JOIN learning_roadmaps r ON r.id = ri.roadmap_id
     WHERE r.user_id = $1 AND NOT ri.completed
     ORDER BY CASE ri.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, ri.stage, ri.sort_order LIMIT 2`, [userId]);
  next.forEach((n) => recs.push({ type: 'roadmap', title: n.title, reason: `Next on your roadmap (Stage ${n.stage})`, link: n.link }));

  // 4. Target-role mock interview
  const track = ROLE_TRACK[profile && profile.target_role];
  if (track) {
    const done = await db.one(`SELECT COUNT(*)::int c FROM mock_interviews WHERE user_id=$1 AND track=$2 AND status='completed'`, [userId, track]);
    if (done.c < 3) recs.push({ type: 'role', title: `Take a ${profile.target_role} mock interview`, reason: `${done.c}/3 completed for your target role`, link: '/mock-interviews' });
  }

  // 5. Resume
  const resume = await db.one('SELECT COUNT(*)::int c FROM resume_records WHERE user_id = $1', [userId]);
  if (!resume.c) recs.push({ type: 'resume', title: 'Create your first ATS-friendly resume', reason: 'Recruiters need a resume before any interview', link: '/resume' });

  // 6. Never-attempted aptitude sections
  const sections = await db.many('SELECT DISTINCT section FROM aptitude_attempts WHERE user_id = $1', [userId]);
  const tried = new Set(sections.map((s) => s.section));
  const names = { quant: 'Quantitative Aptitude', logical: 'Logical Reasoning', verbal: 'Verbal Ability' };
  Object.keys(names).filter((s) => !tried.has(s)).slice(0, 1).forEach((s) =>
    recs.push({ type: 'explore', title: `Start ${names[s]}`, reason: 'You have not practised this section yet', link: `/${s === 'quant' ? 'aptitude' : s}` }));

  return recs.slice(0, 7);
}

module.exports = { forUser, ROLE_TRACK };
