// Mock interview engine: 4 tracks x 4 sets. Each set runs Intro -> Technical -> Coding -> Project -> HR
// with increasing difficulty. Answers are scored with the rubric; a final report is produced at the end.
const db = require('../database/db');
const { HttpError, localDate, toInt } = require('../utils/http');
const activity = require('../services/activityService');
const { evaluateAnswer } = require('../services/answerEvaluator');
const ai = require('../services/aiService');

const TRACKS = {
  java: { name: 'Java Developer', description: 'Core Java, OOP, collections, JVM, SQL and Java projects.' },
  fullstack: { name: 'Full Stack Developer', description: 'HTML/CSS/JS, React, Node/Express, REST, databases and deployment.' },
  sde: { name: 'Software Development Engineer', description: 'DSA, problem-solving, OS/DBMS/CN fundamentals and design basics.' },
  data: { name: 'Data Analyst / AI-ML Engineer', description: 'SQL, statistics, Python data stack, ML fundamentals and case questions.' },
};
const STAGE_ORDER = ['intro', 'technical', 'coding', 'project', 'hr'];
const MIN_WORDS = { intro: 60, technical: 40, coding: 40, project: 60, hr: 50 };

exports.tracks = async (req, res) => {
  const sets = await db.many(`SELECT track, set_no, COUNT(*)::int questions FROM interview_questions WHERE bank='mock' GROUP BY track, set_no ORDER BY track, set_no`);
  const mine = await db.many(`SELECT id, track, set_no, status, overall_score, started_at, completed_at FROM mock_interviews WHERE user_id=$1 ORDER BY started_at DESC`, [req.user.id]);
  res.json({
    aiEnabled: ai.isEnabled(),
    tracks: Object.entries(TRACKS).map(([key, t]) => ({
      key, ...t,
      sets: sets.filter((s) => s.track === key).map((s) => {
        const attempts = mine.filter((m) => m.track === key && m.set_no === s.set_no);
        return { set_no: s.set_no, questions: s.questions, attempts: attempts.length, best: Math.max(0, ...attempts.map((a) => a.overall_score || 0)), inProgress: attempts.find((a) => a.status === 'in_progress') || null };
      }),
    })),
    history: mine,
  });
};

async function loadSession(id, userId) {
  const m = await db.one('SELECT * FROM mock_interviews WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!m) throw new HttpError(404, 'Interview not found.');
  const questions = await db.many(
    `SELECT id, category, difficulty, question, sort_order FROM interview_questions WHERE bank='mock' AND track=$1 AND set_no=$2
     ORDER BY array_position($3::text[], category), sort_order`, [m.track, m.set_no, STAGE_ORDER]);
  const responses = await db.many('SELECT question_id, answer, score, feedback, evaluator FROM mock_interview_responses WHERE interview_id=$1', [m.id]);
  return { m, questions, responses };
}

exports.start = async (req, res) => {
  const track = req.body.track;
  const setNo = toInt(req.body.set_no, 0);
  if (!TRACKS[track]) throw new HttpError(400, 'Unknown interview track.');
  const exists = await db.one(`SELECT COUNT(*)::int c FROM interview_questions WHERE bank='mock' AND track=$1 AND set_no=$2`, [track, setNo]);
  if (!exists.c) throw new HttpError(400, 'Interview set not found.');
  const open = await db.one(`SELECT id FROM mock_interviews WHERE user_id=$1 AND track=$2 AND set_no=$3 AND status='in_progress'`, [req.user.id, track, setNo]);
  const id = open ? open.id : (await db.one('INSERT INTO mock_interviews (user_id, track, set_no, evaluator) VALUES ($1,$2,$3,$4) RETURNING id',
    [req.user.id, track, setNo, ai.isEnabled() ? 'rule-based+ai' : 'rule-based'])).id;
  if (!open) await activity.recordActivity(req.user.id, localDate(req), { mock_interviews_attempted: 1 }, `Mock interview: ${TRACKS[track].name}`);
  res.json({ interviewId: id, resumed: !!open });
};

exports.session = async (req, res) => {
  const { m, questions, responses } = await loadSession(req.params.id, req.user.id);
  res.json({ interview: m, track: TRACKS[m.track], questions, responses, aiEnabled: ai.isEnabled() });
};

exports.answer = async (req, res) => {
  const { m, questions } = await loadSession(req.params.id, req.user.id);
  if (m.status === 'completed') throw new HttpError(400, 'This interview is already completed.');
  const qid = toInt(req.body.question_id, 0);
  if (!questions.find((q) => q.id === qid)) throw new HttpError(400, 'Question does not belong to this interview.');
  const answer = String(req.body.answer || '').trim();
  if (!answer) throw new HttpError(400, 'Please type your answer (you can write "I don\'t know" and an attempt).');
  if (answer.length > 6000) throw new HttpError(400, 'Answer is too long.');
  const q = await db.one('SELECT * FROM interview_questions WHERE id=$1', [qid]);
  const result = evaluateAnswer(answer, { keywords: q.keywords, minWords: MIN_WORDS[q.category] || 40 });
  const aiResult = await ai.aiFeedback({ question: q.question, answer, modelAnswer: q.model_answer, track: TRACKS[m.track].name });
  const feedback = { ...result, ai: aiResult, modelAnswer: q.model_answer };
  await db.query(
    `INSERT INTO mock_interview_responses (interview_id, question_id, answer, score, feedback, evaluator) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (interview_id, question_id) DO UPDATE SET answer=EXCLUDED.answer, score=EXCLUDED.score, feedback=EXCLUDED.feedback, evaluator=EXCLUDED.evaluator, created_at=NOW()`,
    [m.id, qid, answer, result.score, JSON.stringify(feedback), aiResult ? 'rule-based+ai' : 'rule-based']);
  await activity.recordActivity(req.user.id, localDate(req), { interview_answered: 1 });
  res.json({ score: result.score, feedback });
};

exports.finish = async (req, res) => {
  const { m, questions, responses } = await loadSession(req.params.id, req.user.id);
  if (!responses.length) throw new HttpError(400, 'Answer at least one question before finishing.');
  const byStage = STAGE_ORDER.map((stage) => {
    const qs = questions.filter((q) => q.category === stage);
    const rs = responses.filter((r) => qs.some((q) => q.id === r.question_id));
    // Unanswered questions count as 0 so skipping does not inflate the score.
    const avg = qs.length ? Math.round(rs.reduce((s, r) => s + r.score, 0) / qs.length) : null;
    return { stage, questions: qs.length, answered: rs.length, score: avg };
  }).filter((s) => s.questions);
  const overall = Math.round(responses.reduce((s, r) => s + r.score, 0) / questions.length);
  const allMissing = {};
  responses.forEach((r) => (r.feedback.missingKeywords || []).forEach((k) => { allMissing[k] = (allMissing[k] || 0) + 1; }));
  const strongest = [...byStage].sort((a, b) => b.score - a.score)[0];
  const weakest = [...byStage].sort((a, b) => a.score - b.score)[0];
  const verdict = overall >= 75 ? 'Interview ready - keep practising to stay sharp.' : overall >= 55 ? 'Nearly there - strengthen the weaker rounds below.' : 'Needs more preparation - revise the topics listed and retry this set.';
  const report = {
    overall, verdict, byStage, answered: responses.length, total: questions.length,
    strongest: strongest && strongest.stage, weakest: weakest && weakest.stage,
    topicsToRevise: Object.entries(allMissing).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k),
    evaluator: m.evaluator,
    note: 'Scores come from a transparent rule-based rubric (content coverage, depth, structure, specificity). ' +
      (ai.isEnabled() ? 'Extra written feedback marked "AI" was generated by the configured AI model.' : 'No AI model is configured, so all feedback is rule-based.'),
  };
  await db.query(`UPDATE mock_interviews SET status='completed', overall_score=$2, report=$3, completed_at=NOW() WHERE id=$1`, [m.id, overall, JSON.stringify(report)]);
  res.json({ report });
};
