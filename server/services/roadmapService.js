// Generates a personalised 4-stage roadmap from the student's profile.
// Rules (easy to explain in a viva):
//  * Programming items use the student's preferred language (Java / Python / C).
//  * Target role adds role-specific items and marks the relevant ones "high" priority.
//  * Academic year changes priorities: early years focus on foundations, final years on placement-ready items.
//  * Preparation level: advanced students get foundation items marked "optional".
const db = require('../database/db');

const LANG_NAMES = { java: 'Java', python: 'Python', c: 'C' };
const LANG_BASICS = {
  java: ['intro', 'variables', 'operators', 'conditions', 'loops', 'methods', 'arrays', 'strings'],
  python: ['intro', 'variables', 'operators', 'conditions', 'loops', 'functions', 'lists', 'strings'],
  c: ['intro', 'variables', 'operators', 'conditions', 'loops', 'functions', 'arrays', 'strings'],
};
const LANG_INTERMEDIATE = {
  java: ['classes-objects', 'constructors', 'inheritance', 'polymorphism', 'interfaces', 'exceptions', 'collections'],
  python: ['dictionaries', 'sets', 'tuples', 'comprehensions', 'oop', 'exceptions', 'modules'],
  c: ['pointers', 'structures', 'dynamic-memory', 'recursion', 'file-handling'],
};

const ROLE_EXTRAS = {
  'Java Developer': [
    { stage: 2, module: 'java', topic: 'collections', priority: 'high' },
    { stage: 3, module: 'java', topic: 'multithreading', priority: 'high' },
    { stage: 3, module: 'java', topic: 'file-handling' },
  ],
  'Data Analyst': [
    { stage: 1, module: 'python', topic: 'lists', priority: 'high' },
    { stage: 2, module: 'python', topic: 'dictionaries', priority: 'high' },
    { stage: 2, module: 'core', topic: 'sql', priority: 'high' },
    { stage: 3, module: 'quant', topic: 'data-interpretation', priority: 'high' },
  ],
  'AI/ML Engineer': [
    { stage: 1, module: 'python', topic: 'functions', priority: 'high' },
    { stage: 2, module: 'python', topic: 'comprehensions', priority: 'high' },
    { stage: 2, module: 'quant', topic: 'probability', priority: 'high' },
    { stage: 3, module: 'dsa', topic: 'dynamic-programming', priority: 'high' },
  ],
  'Full Stack Developer': [
    { stage: 2, module: 'core', topic: 'sql', priority: 'high' },
    { stage: 3, module: 'core', topic: 'cn', priority: 'high' },
    { stage: 3, module: 'core', topic: 'system-design', priority: 'high' },
  ],
  'Frontend Developer': [
    { stage: 3, module: 'core', topic: 'cn', priority: 'high' },
    { stage: 3, module: 'core', topic: 'software-engineering' },
  ],
  'Backend Developer': [
    { stage: 2, module: 'core', topic: 'sql', priority: 'high' },
    { stage: 3, module: 'core', topic: 'os', priority: 'high' },
    { stage: 3, module: 'core', topic: 'system-design', priority: 'high' },
  ],
};
ROLE_EXTRAS['Data Scientist'] = ROLE_EXTRAS['AI/ML Engineer'];
ROLE_EXTRAS['Python Developer'] = [{ stage: 2, module: 'python', topic: 'oop', priority: 'high' }, { stage: 3, module: 'python', topic: 'file-handling' }];

function buildItems(profile) {
  const lang = profile.preferred_language || 'java';
  const L = LANG_NAMES[lang];
  const items = [];
  const add = (stage, title, description, link, extra = {}) => items.push({ stage, title, description, link, priority: 'normal', ...extra });
  const topicItem = (stage, module, topic, title, description, priority = 'normal') =>
    add(stage, title, description, `/learn/${module}/${topic}`, { module, topic, priority });

  // Stage 1 - Foundation
  LANG_BASICS[lang].forEach((t) => topicItem(1, lang, t, `${L}: ${t.replace(/-/g, ' ')}`, `Programming basics in ${L}.`));
  topicItem(1, 'core', 'mathematics', 'Mathematics for placements', 'Number sense, algebra basics and quick calculation.');
  topicItem(1, 'core', 'computer-fundamentals', 'Computer fundamentals', 'How computers, memory, OS and networks fit together.');
  topicItem(1, 'communication', 'english-grammar', 'English communication: grammar', 'Tenses, articles and sentence structure.');
  topicItem(1, 'communication', 'vocabulary', 'English communication: vocabulary', 'Build placement-ready vocabulary.');
  topicItem(1, 'logical', 'number-series', 'Logical thinking: number series', 'Spot patterns quickly.');
  topicItem(1, 'quant', 'number-systems', 'Quant: number systems', 'Divisibility, remainders, factors.');

  // Stage 2 - Intermediate
  ['complexity', 'arrays', 'strings', 'hashing', 'searching', 'sorting', 'linked-lists', 'stacks', 'queues'].forEach((t) =>
    topicItem(2, 'dsa', t, `DSA: ${t.replace(/-/g, ' ')}`, 'Core data structures with code in Java, Python and C.'));
  LANG_INTERMEDIATE[lang].forEach((t) => topicItem(2, lang, t, `${L}: ${t.replace(/-/g, ' ')}`, `Intermediate ${L}.`));
  topicItem(2, 'core', 'oops', 'OOPs concepts', 'The four pillars and how interviewers test them.');
  topicItem(2, 'core', 'dbms', 'DBMS', 'Normalisation, transactions, indexing.');
  topicItem(2, 'core', 'sql', 'SQL', 'Joins, grouping, subqueries.');
  ['percentages', 'profit-and-loss', 'time-and-work', 'time-speed-distance'].forEach((t) =>
    topicItem(2, 'quant', t, `Aptitude: ${t.replace(/-/g, ' ')}`, 'Formulas, shortcuts and timed practice.'));
  ['reading-comprehension', 'sentence-correction'].forEach((t) =>
    topicItem(2, 'verbal', t, `Verbal: ${t.replace(/-/g, ' ')}`, 'Verbal ability practice.'));

  // Stage 3 - Advanced
  ['recursion', 'backtracking', 'trees', 'bst', 'heaps', 'graphs', 'greedy', 'dynamic-programming', 'sliding-window', 'two-pointers', 'bit-manipulation'].forEach((t) =>
    topicItem(3, 'dsa', t, `Advanced DSA: ${t.replace(/-/g, ' ')}`, 'Interview-level problem patterns.'));
  topicItem(3, 'core', 'os', 'Operating Systems', 'Processes, scheduling, memory, deadlocks.');
  topicItem(3, 'core', 'cn', 'Computer Networks', 'OSI/TCP-IP, HTTP, DNS.');
  topicItem(3, 'core', 'software-engineering', 'Software Engineering', 'SDLC, Agile, testing.');
  topicItem(3, 'core', 'system-design', 'System design basics', 'Scalability, caching, load balancing.');
  topicItem(3, 'core', 'problem-solving', 'Problem-solving strategy', 'A repeatable method for unseen problems.');
  add(3, 'Solve 30 medium coding problems', 'Use the coding bank filtered to Medium.', '/coding?difficulty=medium');
  add(3, 'Technical interview preparation', 'Practise DSA, OOPs, DBMS, OS and CN questions.', '/interview');

  // Stage 4 - Placement ready
  const companies = (profile.target_companies || []).slice(0, 5);
  if (companies.length) companies.forEach((c) => add(4, `Company prep: ${c}`, 'Recruitment stages, topics and practice for this company.', `/companies?search=${encodeURIComponent(c)}`, { priority: 'high' }));
  else add(4, 'Company-specific preparation', 'Pick 3-5 target companies and study their process.', '/companies');
  add(4, 'Build an ATS-friendly resume', 'Use a template and check it with the ATS analyzer.', '/resume', { priority: 'high' });
  add(4, 'Build your portfolio', 'Showcase projects, GitHub and skills.', '/portfolio');
  add(4, `Build projects for ${profile.target_role || 'your target role'}`, 'Pick 2-3 projects from Project Guidance.', `/projects?role=${encodeURIComponent(profile.target_role || '')}`);
  add(4, 'Complete 3 mock interviews', 'Practise the full interview flow and read your report.', '/mock-interviews', { priority: 'high' });
  add(4, 'HR interview preparation', 'Self-introduction, strengths, career goals.', '/interview?tab=hr');
  add(4, 'Placement assessments', 'Take the timed assessments and review weak topics.', '/assessments');

  // Role extras (avoid duplicates)
  (ROLE_EXTRAS[profile.target_role] || []).forEach((x) => {
    const existing = items.find((i) => i.module === x.module && i.topic === x.topic);
    if (existing) existing.priority = x.priority || existing.priority;
    else topicItem(x.stage, x.module, x.topic, `${profile.target_role}: ${x.topic.replace(/-/g, ' ')}`, `Recommended for ${profile.target_role}.`, x.priority || 'normal');
  });

  // Year and level adjustments
  const year = profile.academic_year;
  items.forEach((i) => {
    if (year === '1' && i.stage === 1) i.priority = 'high';
    if ((year === '1') && i.stage === 4 && i.priority !== 'high') i.priority = 'optional';
    if ((year === '4' || year === 'graduate') && i.stage === 4) i.priority = 'high';
    if (profile.preparation_level === 'advanced' && i.stage === 1) i.priority = 'optional';
    if (profile.preparation_level === 'beginner' && i.stage === 1 && i.priority === 'normal') i.priority = 'high';
  });
  return items;
}

/** Create or regenerate the roadmap. Completed items stay completed when titles match. */
async function generate(userId) {
  const profile = await db.one('SELECT * FROM student_profiles WHERE user_id = $1', [userId]);
  if (!profile) return null;
  const items = buildItems(profile);
  const topics = await db.many(`SELECT t.id, t.slug, m.slug AS module FROM learning_topics t JOIN learning_modules m ON m.id = t.module_id`);
  const topicId = (m, t) => (topics.find((x) => x.module === m && x.slug === t) || {}).id || null;

  return db.tx(async (c) => {
    const old = await c.query(
      `SELECT ri.title FROM roadmap_items ri JOIN learning_roadmaps r ON r.id = ri.roadmap_id WHERE r.user_id = $1 AND ri.completed`, [userId]);
    const done = new Set(old.rows.map((r) => r.title));
    await c.query('DELETE FROM learning_roadmaps WHERE user_id = $1', [userId]);
    const title = `${LANG_NAMES[profile.preferred_language]} roadmap for ${profile.target_role || 'placements'}`;
    const snapshot = { language: profile.preferred_language, role: profile.target_role, year: profile.academic_year, level: profile.preparation_level };
    const { rows } = await c.query('INSERT INTO learning_roadmaps (user_id, title, based_on) VALUES ($1,$2,$3) RETURNING id', [userId, title, snapshot]);
    const roadmapId = rows[0].id;
    // Items whose lessons are already completed are marked done automatically.
    const completedTopics = new Set((await c.query(
      `SELECT l.topic_id FROM learning_progress p JOIN lessons l ON l.id = p.lesson_id WHERE p.user_id = $1 AND p.status = 'completed'`, [userId])).rows.map((r) => r.topic_id));
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const tid = it.module ? topicId(it.module, it.topic) : null;
      const isDone = done.has(it.title) || (tid && completedTopics.has(tid));
      await c.query(
        `INSERT INTO roadmap_items (roadmap_id, stage, title, description, link, topic_id, priority, sort_order, completed, completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [roadmapId, it.stage, it.title, it.description, it.link, tid, it.priority, i, !!isDone, isDone ? new Date() : null]
      );
    }
    return roadmapId;
  });
}

module.exports = { generate, buildItems };
