// Placement readiness score (0-100). Deterministic and explainable - no random numbers.
// Each component = weight x (quality) x (coverage), so both accuracy and volume of practice matter.
const db = require('../database/db');

const WEIGHTS = { aptitude: 20, coding: 25, learning: 15, communication: 10, interview: 15, assessments: 10, resume: 5 };

async function calculate(userId, date) {
  const r = await db.one(
    `SELECT
      (SELECT COALESCE(SUM(total),0) FROM aptitude_attempts WHERE user_id=$1) apt_total,
      (SELECT COALESCE(SUM(correct),0) FROM aptitude_attempts WHERE user_id=$1) apt_correct,
      (SELECT COALESCE(SUM(CASE p.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END),0)
         FROM coding_problems p WHERE p.id IN (SELECT DISTINCT problem_id FROM coding_submissions WHERE user_id=$1 AND status='accepted')) code_points,
      (SELECT COUNT(DISTINCT problem_id) FROM coding_submissions WHERE user_id=$1 AND status='accepted') code_solved,
      (SELECT COUNT(*) FROM learning_progress WHERE user_id=$1 AND status='completed') lessons_done,
      (SELECT COALESCE(AVG(best),0) FROM (SELECT MAX(score) best FROM communication_attempts WHERE user_id=$1 GROUP BY exercise_id) t) comm_avg,
      (SELECT COUNT(DISTINCT exercise_id) FROM communication_attempts WHERE user_id=$1) comm_count,
      (SELECT COALESCE(AVG(overall_score),0) FROM mock_interviews WHERE user_id=$1 AND status='completed') mock_avg,
      (SELECT COUNT(*) FROM mock_interviews WHERE user_id=$1 AND status='completed') mock_count,
      (SELECT COALESCE(AVG(best),0) FROM (SELECT MAX(percent) best FROM assessment_attempts WHERE user_id=$1 GROUP BY assessment_id) t) assess_avg,
      (SELECT COUNT(DISTINCT assessment_id) FROM assessment_attempts WHERE user_id=$1) assess_count,
      (SELECT COUNT(*) FROM resume_records WHERE user_id=$1) resumes,
      (SELECT COALESCE(MAX(score),0) FROM resume_analysis WHERE user_id=$1) ats_best`,
    [userId]
  );
  const n = (k) => Number(r[k]) || 0;
  const cap = (x) => Math.max(0, Math.min(1, x));

  const parts = {
    aptitude: WEIGHTS.aptitude * (n('apt_total') ? n('apt_correct') / n('apt_total') : 0) * cap(n('apt_total') / 200),
    coding: WEIGHTS.coding * cap(n('code_points') / 100),
    learning: WEIGHTS.learning * cap(n('lessons_done') / 40),
    communication: WEIGHTS.communication * (n('comm_avg') / 100) * cap(n('comm_count') / 8),
    interview: WEIGHTS.interview * (n('mock_avg') / 100) * cap(n('mock_count') / 3),
    assessments: WEIGHTS.assessments * (n('assess_avg') / 100) * cap(n('assess_count') / 4),
    resume: (n('resumes') > 0 ? 2 : 0) + 3 * (n('ats_best') / 100),
  };
  const breakdown = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, { score: Math.round(v * 10) / 10, max: WEIGHTS[k] }]));
  const score = Math.round(Object.values(parts).reduce((a, b) => a + b, 0));
  const stats = {
    aptitudeAttempted: n('apt_total'), aptitudeAccuracy: n('apt_total') ? Math.round((n('apt_correct') / n('apt_total')) * 100) : 0,
    codingSolved: n('code_solved'), lessonsCompleted: n('lessons_done'), mockInterviews: n('mock_count'),
    assessmentsTaken: n('assess_count'), communicationDone: n('comm_count'),
  };

  if (date) {
    await db.query(
      `INSERT INTO placement_readiness (user_id, score, breakdown, calc_date) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, calc_date) DO UPDATE SET score=$2, breakdown=$3, created_at=NOW()`,
      [userId, score, JSON.stringify(breakdown), date]
    );
  }
  return { score, breakdown, stats };
}

module.exports = { calculate, WEIGHTS };
