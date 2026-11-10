// Builds database/seed.sql from the content modules in ./content.
// Run: npm run db:build-seed   (then npm run db:init to load it)
// The generated seed.sql is committed, so students do NOT need to run this unless they change content.
const fs = require('fs');
const path = require('path');
const { rng, shuffle } = require('./content/lib');

const OUT = path.join(__dirname, '..', '..', 'database', 'seed.sql');

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;
const n = (v) => (v === null || v === undefined ? 'NULL' : Number(v));

const chunks = [];
function insert(table, cols, rows, batch = 150) {
  for (let i = 0; i < rows.length; i += batch) {
    const values = rows.slice(i, i + batch).map((r) => `(${r.join(', ')})`).join(',\n');
    chunks.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${values};`);
  }
}

// ---------------- load content ----------------
const quant = require('./content/quant').build();
const logical = require('./content/logical').build();
const verbal = require('./content/verbal').build();
const programming = require('./content/programming');
const dsa = require('./content/dsa').topics();
const core = require('./content/core').build();
const interview = require('./content/interview');
const coding = require('./content/coding');
const codingTests = JSON.parse(fs.readFileSync(path.join(__dirname, 'content', 'coding_tests.json'), 'utf8'));
const projects = require('./content/projects').build();
const companies = require('./content/companies').build();
const resources = require('./content/resources');

// ---------------- modules, topics, lessons ----------------
const MODULES = [
  ['java', 'Java Programming', 'programming', 'Core Java from basics to OOP, collections, exceptions and multithreading.', java()],
  ['python', 'Python Programming', 'programming', 'Python from basics to OOP, comprehensions, files and modules.', programming.python],
  ['c', 'C Programming', 'programming', 'C fundamentals: pointers, structures, memory management and files.', programming.c],
  ['dsa', 'Data Structures & Algorithms', 'dsa', 'Twenty DSA topics with code in Java, Python and C.', dsa],
  ['core', 'Core CS Subjects', 'core', 'OOPs, DBMS, SQL, OS, Computer Networks, Software Engineering and System Design.', core.coreTopics],
  ['quant', 'Quantitative Aptitude', 'aptitude', 'Twenty quant topics with formulas, shortcuts and timed practice.', quant.topics],
  ['logical', 'Logical Reasoning', 'logical', 'Fifteen reasoning topics with techniques and timed practice.', logical.topics],
  ['verbal', 'Verbal Ability', 'verbal', 'Grammar, vocabulary, comprehension and sentence skills.', verbal.topics],
  ['communication', 'Communication & Soft Skills', 'communication', 'Professional English, presentations, GDs and workplace skills.', core.commTopics],
  ['interview', 'Interview Etiquette', 'interview', 'Body language, dressing, confidence and handling tough moments.', interview.ETIQUETTE.map(([slug, title, text], i) => ({
    slug, title, summary: text.split('. ')[0] + '.', sort: i,
    lesson: { title, difficulty: 'easy', minutes: 10, content: { explanation: text, tips: text.split('. ').map((s) => s.replace(/\.$/, '')).filter(Boolean) } },
  }))],
];
function java() { return programming.java; }

insert('learning_modules', ['slug', 'title', 'category', 'description', 'sort_order'], MODULES.map((m, i) => [q(m[0]), q(m[1]), q(m[2]), q(m[3]), i]));
MODULES.forEach(([slug, , , , topics]) => {
  insert('learning_topics', ['module_id', 'slug', 'title', 'summary', 'sort_order'],
    topics.map((t) => [`(SELECT id FROM learning_modules WHERE slug = ${q(slug)})`, q(t.slug), q(t.title), q(t.summary), n(t.sort)]));
  insert('lessons', ['topic_id', 'title', 'content', 'difficulty', 'est_minutes', 'sort_order'],
    topics.map((t) => [
      `(SELECT t.id FROM learning_topics t JOIN learning_modules m ON m.id = t.module_id WHERE m.slug = ${q(slug)} AND t.slug = ${q(t.slug)})`,
      q(t.lesson.title), j(t.lesson.content), q(t.lesson.difficulty), n(t.lesson.minutes), 0,
    ]), 40);
});

// ---------------- aptitude questions ----------------
const r = rng(4242);
const apt = [...quant.questions, ...logical.questions, ...verbal.questions].map((x) => {
  const correct = x.options[x.answer_index];
  const opts = shuffle(r, x.options);
  return { ...x, options: opts, answer_index: opts.indexOf(correct) };
});
const seenQ = new Set();
const aptUnique = apt.filter((x) => { const k = x.topic_slug + '|' + x.question; if (seenQ.has(k)) return false; seenQ.add(k); return true; });
insert('aptitude_questions', ['section', 'topic_slug', 'question', 'options', 'answer_index', 'explanation', 'difficulty'],
  aptUnique.map((x) => [q(x.section), q(x.topic_slug), q(x.question), j(x.options), n(x.answer_index), q(x.explanation), q(x.difficulty)]), 200);

// ---------------- coding problems ----------------
const missing = coding.filter((p) => !codingTests[p.slug]);
if (missing.length) throw new Error('Missing verified tests for: ' + missing.map((p) => p.slug).join(', ') + '. Run: npm run verify:coding -- --write');
insert('coding_problems', ['slug', 'title', 'difficulty', 'topic', 'description', 'input_format', 'output_format', 'constraints', 'examples', 'hints', 'explanation', 'solutions', 'test_cases'],
  coding.map((p) => {
    const tests = codingTests[p.slug];
    const examples = p.examples.map((e) => ({ input: e.input, output: (tests.find((t) => t.input === e.input) || {}).output, explanation: e.explanation }));
    return [q(p.slug), q(p.title), q(p.difficulty), q(p.topic), q(p.description), q(p.input), q(p.output), q(p.constraints), j(examples), j(p.hints), q(p.explanation), j({ java: p.java, python: p.py, c: p.c }), j(tests)];
  }), 20);

// ---------------- communication exercises ----------------
insert('communication_exercises', ['slug', 'title', 'category', 'prompt', 'guidance', 'model_answer', 'keywords', 'min_words'],
  core.exercises.map((e) => [q(e.slug), q(e.title), q(e.category), q(e.prompt), q(e.guidance), q(e.model_answer), j(e.keywords), n(e.min_words)]));

// ---------------- resume templates ----------------
insert('resume_templates', ['key', 'name', 'description', 'section_order', 'accent'], [
  ['fresher', 'Fresher Resume', 'Education-first layout for students with projects and certifications.', ['summary', 'education', 'skills', 'projects', 'internships', 'certifications', 'achievements'], '#3730a3'],
  ['software', 'Software Developer', 'Skills and projects first, ideal for SDE and full-stack roles.', ['summary', 'skills', 'projects', 'experience', 'internships', 'education', 'certifications', 'achievements'], '#0f766e'],
  ['java', 'Java Developer', 'Highlights Java/Spring skills, backend projects and internships.', ['summary', 'skills', 'experience', 'internships', 'projects', 'education', 'certifications'], '#b45309'],
  ['data', 'Data Analyst / AI-ML', 'Emphasises tools, analytical projects and measurable insights.', ['summary', 'skills', 'projects', 'internships', 'experience', 'certifications', 'education', 'achievements'], '#6d28d9'],
  ['general', 'General Technical', 'Balanced single-column layout for any technical role.', ['summary', 'education', 'experience', 'internships', 'projects', 'skills', 'certifications', 'achievements'], '#1e293b'],
].map(([k, name, d, order, accent]) => [q(k), q(name), q(d), j(order), q(accent)]));

// ---------------- projects ----------------
insert('project_ideas', ['role', 'title', 'difficulty', 'problem_statement', 'description', 'tech_stack', 'features', 'architecture', 'expected_output', 'skills', 'resume_description', 'interview_questions'],
  projects.map((p) => [q(p.role), q(p.title), q(p.difficulty), q(p.problem_statement), q(p.description), j(p.tech_stack), j(p.features), q(p.architecture), q(p.expected_output), j(p.skills), q(p.resume_description), j(p.interview_questions)]), 60);

// ---------------- companies ----------------
insert('companies', ['slug', 'name', 'type', 'overview', 'products', 'careers_url', 'headquarters'],
  companies.map((c) => [q(c.slug), q(c.name), q(c.type), q(c.overview), q(c.products), q(c.careers_url), q(c.headquarters)]));
insert('company_preparation', ['company_id', 'section', 'title', 'content', 'verification', 'sort_order'],
  companies.flatMap((c) => c.sections.map((s) => [`(SELECT id FROM companies WHERE slug = ${q(c.slug)})`, q(s.section), q(s.title), j(s.content), q(s.verification), n(s.sort_order)])), 100);

// ---------------- interview questions ----------------
const iq = [...interview.prepRows(), ...interview.mockRows()];
insert('interview_questions', ['bank', 'category', 'track', 'set_no', 'sort_order', 'difficulty', 'question', 'model_answer', 'keywords'],
  iq.map((x) => [q(x.bank), q(x.category), q(x.track), n(x.set_no), n(x.sort_order), q(x.difficulty), q(x.question), q(x.model_answer), j(x.keywords)]));

// ---------------- assessments ----------------
const assessments = require('./content/assessments').build(aptUnique);
insert('assessments', ['slug', 'title', 'description', 'category', 'duration_min', 'pass_percent'],
  assessments.map((a) => [q(a.slug), q(a.title), q(a.description), q(a.category), n(a.duration_min), n(a.pass_percent)]));
insert('assessment_questions', ['assessment_id', 'question', 'options', 'answer_index', 'explanation', 'topic', 'sort_order'],
  assessments.flatMap((a) => a.questions.map((x, i) => [`(SELECT id FROM assessments WHERE slug = ${q(a.slug)})`, q(x.question), j(x.options), n(x.answer_index), q(x.explanation), q(x.topic), i])));

// ---------------- videos & resources ----------------
insert('video_resources', ['category', 'title', 'topic', 'description', 'source', 'url', 'embed_id', 'kind'], [
  ...resources.VIDEOS.map(([c, t, tp, d, s, u, e]) => [q(c), q(t), q(tp), q(d), q(s), q(u), q(e), q('video')]),
  ...resources.LINKS.map(([c, t, tp, d, s, u, k]) => [q(c), q(t), q(tp), q(d), q(s), q(u), 'NULL', q(k)]),
]);

// ---------------- write ----------------
const header = `-- BrainBridge seed data (generated by server/database/build-seed.js on ${new Date().toISOString().slice(0, 10)})\n-- Do not edit by hand: change server/database/content/*.js and run "npm run db:build-seed".\n`;
fs.writeFileSync(OUT, header + chunks.join('\n-- @@CHUNK\n') + '\n');
const stats = {
  modules: MODULES.length, lessons: MODULES.reduce((s, m) => s + m[4].length, 0), aptitude: aptUnique.length,
  coding: coding.length, codingTests: coding.reduce((s, p) => s + codingTests[p.slug].length, 0),
  projects: projects.length, companies: companies.length, interviewQuestions: iq.length,
  assessments: assessments.length, assessmentQuestions: assessments.reduce((s, a) => s + a.questions.length, 0),
  videos: resources.VIDEOS.length, links: resources.LINKS.length, communicationExercises: core.exercises.length,
};
console.log('seed.sql written:', (fs.statSync(OUT).size / 1024 / 1024).toFixed(2), 'MB');
console.log(stats);
