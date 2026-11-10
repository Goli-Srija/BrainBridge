// End-to-end API test. Start the server first (npm run dev or npm start), then: npm test
// Uses a brand-new random user each run, exercises every module and checks database persistence.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
let token = null;
let passed = 0, failed = 0;

async function api(method, path, body, { raw, form } = {}) {
  const headers = { 'X-Local-Date': localDate };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const data = raw ? await res.text() : await res.json().catch(() => ({}));
  return { status: res.status, data };
}
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

// Build a real text-based PDF with jsPDF (the same library the Resume Builder uses for downloads).
function makePdf(lines) {
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();
  lines.forEach((l, i) => doc.text(l, 15, 20 + i * 8));
  return Buffer.from(doc.output('arraybuffer'));
}

(async () => {
  const email = `test${Date.now()}@brainbridge.dev`;
  console.log(`\nBrainBridge API tests against ${BASE}\n`);

  console.log('Auth & onboarding');
  await test('health check reports database connected', async () => { const r = await api('GET', '/health'); assert(r.data.database === 'connected', JSON.stringify(r.data)); });
  await test('protected route rejects missing token', async () => { const r = await api('GET', '/dashboard'); assert(r.status === 401, 'expected 401, got ' + r.status); });
  await test('registration validates weak password', async () => { const r = await api('POST', '/auth/register', { name: 'Test', email, password: 'short' }); assert(r.status === 400, 'expected 400'); });
  await test('registration succeeds and returns a JWT', async () => {
    const r = await api('POST', '/auth/register', { name: 'Asha Rao', email, password: 'Placement2026' });
    assert(r.status === 201 && r.data.token, JSON.stringify(r.data)); token = r.data.token;
  });
  await test('duplicate email is rejected', async () => { const t = token; token = null; const r = await api('POST', '/auth/register', { name: 'Asha', email, password: 'Placement2026' }); token = t; assert(r.status === 409, 'expected 409'); });
  await test('login with wrong password fails', async () => { const t = token; token = null; const r = await api('POST', '/auth/login', { email, password: 'WrongPass1' }); token = t; assert(r.status === 401, 'expected 401'); });
  await test('login succeeds', async () => { const r = await api('POST', '/auth/login', { email, password: 'Placement2026' }); assert(r.status === 200 && r.data.token); token = r.data.token; });
  await test('onboarding saves profile and generates roadmap', async () => {
    const r = await api('PUT', '/profile', { college: 'XYZ Engineering College', branch: 'CSE', academic_year: '3', graduation_year: 2027, preferred_language: 'java', target_role: 'Java Developer', target_companies: ['TCS', 'Zoho'], preparation_level: 'beginner', daily_goal_minutes: 60, complete_onboarding: true });
    assert(r.status === 200 && r.data.user.onboarding_complete && r.data.roadmapUpdated, JSON.stringify(r.data));
  });
  await test('profile validation rejects invalid language', async () => { const r = await api('PUT', '/profile', { preferred_language: 'ruby' }); assert(r.status === 400); });

  console.log('Dashboard, roadmap & learning');
  let roadmap;
  await test('dashboard returns readiness, streak and stats', async () => { const r = await api('GET', '/dashboard'); assert(r.status === 200 && typeof r.data.readiness.score === 'number' && r.data.stats && r.data.recommendations.length > 0, JSON.stringify(r.data).slice(0, 300)); });
  await test('roadmap has 4 stages with Java items', async () => { const r = await api('GET', '/roadmap'); roadmap = r.data; assert(r.data.stages.length === 4 && r.data.stages[0].items.some((i) => i.title.startsWith('Java')), 'no java items'); });
  await test('roadmap item can be toggled complete', async () => { const id = roadmap.stages[3].items[0].id; const r = await api('PATCH', `/roadmap/items/${id}/toggle`); assert(r.data.item.completed === true); });
  let lessonId;
  await test('learning module lists topics', async () => { const r = await api('GET', '/learn/modules/java'); assert(r.data.topics.length >= 19); });
  await test('topic lesson loads with content', async () => { const r = await api('GET', '/learn/topic/java/loops'); lessonId = r.data.lessons[0].id; assert(r.data.lessons[0].content.code.java.includes('for')); });
  await test('lesson start + complete updates progress and roadmap', async () => {
    await api('POST', `/learn/lessons/${lessonId}/start`);
    const r = await api('POST', `/learn/lessons/${lessonId}/complete`); assert(r.data.firstTime === true);
    const r2 = await api('POST', `/learn/lessons/${lessonId}/complete`); assert(r2.data.firstTime === false, 'second completion should not double count');
    const rm = await api('GET', '/roadmap'); assert(rm.data.stages[0].items.find((i) => i.title === 'Java: loops').completed, 'roadmap item not auto-completed');
  });
  await test('DSA lesson has code in Java, Python and C', async () => { const r = await api('GET', '/learn/topic/dsa/graphs'); const c = r.data.lessons[0].content.code; assert(c.java && c.python && c.c); });

  console.log('Aptitude');
  let quiz;
  await test('section summary lists topics with question counts', async () => { const r = await api('GET', '/aptitude/summary/quant'); assert(r.data.topics.length === 20 && r.data.topics.every((t) => t.total >= 40), 'low counts'); });
  await test('quiz returns questions without answers', async () => { const r = await api('GET', '/aptitude/quiz?section=quant&topic=percentages&difficulty=easy&count=10'); quiz = r.data.questions; assert(quiz.length === 10 && quiz[0].answer_index === undefined); });
  await test('quiz submission is scored and logged', async () => {
    const r = await api('POST', '/aptitude/submit', { section: 'quant', topic: 'percentages', difficulty: 'easy', time_taken_s: 300, answers: quiz.map((q, i) => ({ question_id: q.id, selected: i % 4 })) });
    assert(r.data.total === 10 && r.data.review.length === 10 && typeof r.data.review[0].explanation === 'string');
  });
  await test('attempt history and review available', async () => { const r = await api('GET', '/aptitude/attempts?section=quant'); assert(r.data.attempts.length === 1); const d = await api('GET', `/aptitude/attempts/${r.data.attempts[0].id}`); assert(d.data.review.length === 10); });

  console.log('Coding practice');
  let problem;
  await test('problem list with filters', async () => { const r = await api('GET', '/coding/problems?difficulty=easy'); assert(r.data.problems.length >= 20 && r.data.problems.every((p) => p.difficulty === 'easy')); });
  await test('problem detail hides hidden tests', async () => { const r = await api('GET', '/coding/problems/gcd-and-lcm'); problem = r.data.problem; assert(problem.sample_tests.every((t) => !t.hidden) && problem.hidden_count > 0 && problem.solutions.java); });
  const status = (await api('GET', '/coding/runtime')).data;
  console.log(`    (runner mode: ${status.mode}; languages ${JSON.stringify(status.languages)})`);
  for (const lang of ['python', 'java', 'c']) {
    await test(`submit reference solution in ${lang} → accepted (or honest not_executed)`, async () => {
      const r = await api('POST', '/coding/submit', { problem_id: problem.id, language: lang, code: problem.solutions[lang] });
      if (!status.languages[lang]) assert(r.data.status === 'not_executed', 'should be honest when runtime missing');
      else assert(r.data.status === 'accepted' && r.data.passed === r.data.total, JSON.stringify(r.data).slice(0, 300));
    });
  }
  await test('wrong solution gets wrong_answer', async () => { if (!status.languages.python) return; const r = await api('POST', '/coding/submit', { problem_id: problem.id, language: 'python', code: 'print(1, 1)' }); assert(r.data.status === 'wrong_answer'); });
  await test('compile error reported for broken C', async () => { if (!status.languages.c) return; const r = await api('POST', '/coding/run', { problem_id: problem.id, language: 'c', code: 'int main( {' }); assert(r.data.status === 'compile_error'); });
  await test('run with custom input', async () => { if (!status.languages.python) return; const r = await api('POST', '/coding/run', { problem_id: problem.id, language: 'python', code: 'print(input()[::-1])', custom_input: 'abc\n' }); assert(r.data.stdout.trim() === 'cba'); });
  await test('draft saving + bookmarks + history', async () => {
    await api('POST', '/coding/draft', { problem_id: problem.id, language: 'java', code: '// my draft' });
    const d = await api('GET', '/coding/problems/gcd-and-lcm'); assert(d.data.drafts.some((x) => x.code.includes('my draft')));
    const b = await api('POST', '/bookmarks/toggle', { item_type: 'coding_problem', item_id: problem.id }); assert(b.data.bookmarked);
    const h = await api('GET', '/coding/submissions'); assert(h.data.submissions.length >= 3);
    const s = await api('GET', '/coding/problems?status=solved'); assert(!status.languages.python || s.data.problems.some((p) => p.id === problem.id));
  });

  console.log('Communication & interviews');
  await test('communication exercise rubric evaluation', async () => {
    const r = await api('POST', '/communication/exercises/tell-me-about-yourself/submit', { response: 'I am a final-year computer science student. I built a placement project using Java and React and completed an internship where I developed test scripts. My skills include Java, SQL and problem solving. I am looking for a software role where I can learn and grow with a strong team, for example by building reliable backend systems.' });
    assert(r.data.score > 0 && r.data.feedback.evaluator === 'rule-based' && r.data.feedback.rubric.length >= 4);
  });
  await test('interview prep practice evaluates answer', async () => {
    const qs = await api('GET', '/interview/questions/oops'); const id = qs.data.questions[0].id;
    const r = await api('POST', `/interview/questions/${id}/practice`, { answer: 'Encapsulation hides data, abstraction shows essentials, inheritance reuses code and polymorphism allows many forms, for example an interface with multiple implementations.' });
    assert(r.data.score > 40, 'score ' + r.data.score);
  });
  await test('mock interview: start, answer all, finish with report', async () => {
    const t = await api('GET', '/mock/tracks'); assert(t.data.tracks.length === 4 && t.data.tracks.every((x) => x.sets.length === 4));
    const s = await api('POST', '/mock/start', { track: 'java', set_no: 1 }); const id = s.data.interviewId;
    const sess = await api('GET', `/mock/${id}`); assert(sess.data.questions.length === 7);
    for (const qq of sess.data.questions) { const a = await api('POST', `/mock/${id}/answer`, { question_id: qq.id, answer: 'The JVM runs bytecode, the JRE adds libraries and the JDK adds the javac compiler. For example in my project I compiled with javac.' }); assert(a.data.score >= 0); }
    const f = await api('POST', `/mock/${id}/finish`); assert(typeof f.data.report.overall === 'number' && f.data.report.byStage.length === 5, JSON.stringify(f.data));
  });

  console.log('Assessments');
  await test('assessment start and submit with topic breakdown', async () => {
    const l = await api('GET', '/assessments'); assert(l.data.assessments.length === 6);
    const s = await api('GET', '/assessments/cs-fundamentals-1'); assert(s.data.questions.length === 20 && s.data.questions[0].answer_index === undefined);
    const answers = Object.fromEntries(s.data.questions.map((qq) => [qq.id, 0]));
    const r = await api('POST', '/assessments/cs-fundamentals-1/submit', { answers, time_taken_s: 600 }); assert(r.data.total === 20 && r.data.breakdown.length >= 5);
  });

  console.log('Resume, ATS, portfolio, projects, companies, resources');
  let resumeId;
  await test('resume create, update (template switch), list', async () => {
    const c = await api('POST', '/resume', { template_key: 'fresher' }); resumeId = c.data.resume.id;
    const data = { ...c.data.resume.data, personal: { ...c.data.resume.data.personal, phone: '+91 98765 43210' }, projects: [{ name: 'BrainBridge', tech: 'React, Node', description: 'Built a placement platform' }] };
    const u = await api('PUT', `/resume/${resumeId}`, { data, template_key: 'software' }); assert(u.data.resume.template_key === 'software' && u.data.resume.data.projects.length === 1);
  });
  await test('ATS analyzer parses a real PDF deterministically', async () => {
    const pdf = makePdf(['Asha Rao', 'asha@example.com | +91 98765 43210 | linkedin.com/in/asha | github.com/asha', 'Summary: Final-year CSE student.', 'Education: B.Tech CSE, XYZ College, CGPA 8.4', 'Skills: Java, Spring Boot, SQL, Git, REST API, OOP, Maven, JDBC', 'Projects: Developed a placement portal used by 200 students; reduced load time by 35%.', 'Internship: Implemented automated tests at ABC Labs.', 'Certifications: Oracle Java SE', 'Achievements: Won college hackathon']);
    const form = new FormData(); form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'resume.pdf'); form.append('role', 'Java Developer');
    const r1 = await api('POST', '/resume/analyze', null, { form });
    const form2 = new FormData(); form2.append('file', new Blob([pdf], { type: 'application/pdf' }), 'resume.pdf'); form2.append('role', 'Java Developer');
    const r2 = await api('POST', '/resume/analyze', null, { form: form2 });
    assert(r1.status === 200 && r1.data.score > 50 && r1.data.score === r2.data.score, JSON.stringify(r1.data).slice(0, 300));
  });
  await test('ATS rejects unsupported file type', async () => { const form = new FormData(); form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'notes.txt'); const r = await api('POST', '/resume/analyze', null, { form }); assert(r.status === 400); });
  await test('portfolio save, publish and public view', async () => {
    const g = await api('GET', '/portfolio'); const data = { ...g.data.portfolio.data, about: 'Aspiring Java developer.', skills: ['Java', 'SQL'], github: 'https://github.com/asha' };
    const s = await api('PUT', '/portfolio', { data, is_public: true, slug: g.data.portfolio.slug }); assert(s.status === 200);
    const t = token; token = null; const p = await api('GET', `/portfolio/public/${s.data.portfolio.slug}`); token = t; assert(p.data.portfolio.data.about.includes('Java'));
  });
  await test('portfolio rejects invalid URL', async () => { const g = await api('GET', '/portfolio'); const r = await api('PUT', '/portfolio', { data: { ...g.data.portfolio.data, github: 'not a url' } }); assert(r.status === 400); });
  await test('projects filter by role (15 per role)', async () => { const r = await api('GET', '/projects?role=Java%20Developer'); assert(r.data.projects.length === 15 && r.data.roles.length === 12); });
  await test('company detail separates verified status', async () => { const r = await api('GET', '/companies/tcs'); assert(r.data.sections.find((s) => s.section === 'eligibility').verification === 'not_verified'); const l = await api('GET', '/companies'); assert(l.data.companies.length === 27); });
  await test('resources and guides', async () => { const r = await api('GET', '/resources'); assert(r.data.resources.length > 30); const g = await api('GET', '/resources/guides'); assert(g.data.guides.length === 6); });

  console.log('Daily tracker, streaks, analytics & progress');
  await test('heartbeat adds a study minute but not twice within 50s', async () => {
    const a = await api('POST', '/tracker/heartbeat'); const b = await api('POST', '/tracker/heartbeat');
    assert(b.data.studyMinutesToday === a.data.studyMinutesToday, 'heartbeat double counted');
  });
  await test('manual study session + goals update', async () => {
    const l = await api('POST', '/tracker/log', { minutes: 45, topic: 'Operating Systems', notes: 'Revised deadlocks' }); assert(l.status === 200);
    const g = await api('PUT', '/tracker/goals', { coding_problems: 1, aptitude_questions: 10, study_minutes: 30 }); assert(g.data.goals.coding_problems === 1);
    const bad = await api('PUT', '/tracker/goals', { coding_problems: 500 }); assert(bad.status === 400);
  });
  await test('today shows one log row, completion and streak 1', async () => {
    const r = await api('GET', '/tracker/today'); assert(r.data.log && r.data.streak.current === 1 && r.data.completion.percent > 0, JSON.stringify(r.data).slice(0, 300));
    assert(r.data.log.topics_studied.includes('Operating Systems'));
  });
  await test('calendar marks today', async () => { const r = await api('GET', '/tracker/calendar'); const t = r.data.days.find((d) => d.isToday); assert(t && ['completed', 'partial'].includes(t.status)); });
  await test('analytics: 30-day series, skills and accuracy', async () => { const r = await api('GET', '/tracker/analytics'); assert(r.data.daily.length === 30 && r.data.skills.length === 7 && r.data.accuracy.aptitudeAttempted === 10); });
  await test('progress page aggregates modules/coding/assessments', async () => { const r = await api('GET', '/progress'); assert(r.data.modules.length === 10 && r.data.readiness.score > 0); });
  await test('streak calculation unit test (gaps, today/yesterday)', async () => {
    const { computeStreaks } = require('../services/activityService');
    const s = computeStreaks(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-05', '2026-01-06'], '2026-01-07');
    assert(s.current === 2 && s.longest === 3, JSON.stringify(s));
    const s2 = computeStreaks(['2026-01-05', '2026-01-06'], '2026-01-08'); assert(s2.current === 0 && s2.longest === 2);
  });

  console.log('Account');
  await test('change password then login with new password', async () => {
    const r = await api('POST', '/auth/change-password', { currentPassword: 'Placement2026', newPassword: 'NewPass2026' }); assert(r.status === 200);
    const t = token; token = null; const l = await api('POST', '/auth/login', { email, password: 'NewPass2026' }); token = t; assert(l.status === 200);
  });
  await test('user data is isolated between accounts', async () => {
    const t = token; token = null;
    const other = await api('POST', '/auth/register', { name: 'Other User', email: `other${Date.now()}@x.dev`, password: 'Another2026' });
    token = other.data.token;
    const r = await api('GET', `/resume/${resumeId}`); token = t; assert(r.status === 404, 'other user could read resume!');
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exitCode = failed ? 1 : 0;
})();
