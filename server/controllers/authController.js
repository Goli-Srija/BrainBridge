const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { signToken } = require('../middleware/auth');
const { HttpError, requireFields } = require('../utils/http');
const roadmapService = require('../services/roadmapService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LANGS = ['java', 'python', 'c'];
const YEARS = ['1', '2', '3', '4', 'graduate'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

function validatePassword(pw) {
  if (!pw || pw.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new HttpError(400, 'Password must contain letters and numbers.');
}

async function getProfile(userId) {
  return db.one(
    `SELECT u.id, u.name, u.email, u.created_at, p.college, p.branch, p.academic_year, p.graduation_year,
            p.preferred_language, p.target_role, p.target_companies, p.preparation_level, p.daily_goal_minutes, p.onboarding_complete
     FROM users u LEFT JOIN student_profiles p ON p.user_id = u.id WHERE u.id = $1`, [userId]);
}

exports.register = async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);
  const name = String(req.body.name).trim();
  const email = String(req.body.email).trim().toLowerCase();
  if (name.length < 2 || name.length > 100) throw new HttpError(400, 'Name must be 2-100 characters.');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  validatePassword(req.body.password);

  const exists = await db.one('SELECT id FROM users WHERE email = $1', [email]);
  if (exists) throw new HttpError(409, 'An account with this email already exists. Please log in.');

  const hash = await bcrypt.hash(req.body.password, 10); // bcrypt with cost factor 10 - plaintext is never stored
  const user = await db.tx(async (c) => {
    const u = (await c.query('INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email', [name, email, hash])).rows[0];
    await c.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [u.id]);
    await c.query('INSERT INTO daily_goals (user_id) VALUES ($1)', [u.id]);
    await c.query('INSERT INTO study_streaks (user_id) VALUES ($1)', [u.id]);
    return u;
  });
  res.status(201).json({ token: signToken(user), user: await getProfile(user.id) });
};

exports.login = async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const email = String(req.body.email).trim().toLowerCase();
  const user = await db.one('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
  const ok = user && (await bcrypt.compare(req.body.password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Incorrect email or password.');
  res.json({ token: signToken(user), user: await getProfile(user.id) });
};

exports.me = async (req, res) => {
  const profile = await getProfile(req.user.id);
  if (!profile) throw new HttpError(401, 'Account not found. Please log in again.');
  res.json({ user: profile });
};

// Used for onboarding AND for editing the profile/preferences later.
exports.updateProfile = async (req, res) => {
  const b = req.body;
  const errors = [];
  if (b.name !== undefined && (String(b.name).trim().length < 2)) errors.push('Name must be at least 2 characters.');
  if (b.preferred_language !== undefined && !LANGS.includes(b.preferred_language)) errors.push('Language must be Java, Python or C.');
  if (b.academic_year !== undefined && b.academic_year !== null && !YEARS.includes(String(b.academic_year))) errors.push('Invalid academic year.');
  if (b.preparation_level !== undefined && !LEVELS.includes(b.preparation_level)) errors.push('Invalid preparation level.');
  if (b.graduation_year !== undefined && b.graduation_year !== null && b.graduation_year !== '' && !(Number(b.graduation_year) >= 2000 && Number(b.graduation_year) <= 2100)) errors.push('Graduation year must be between 2000 and 2100.');
  if (b.daily_goal_minutes !== undefined && !(Number(b.daily_goal_minutes) >= 10 && Number(b.daily_goal_minutes) <= 720)) errors.push('Daily goal must be 10-720 minutes.');
  if (b.email !== undefined && !EMAIL_RE.test(String(b.email).trim())) errors.push('Invalid email address.');
  if (errors.length) throw new HttpError(400, errors.join(' '));

  const before = await getProfile(req.user.id);
  if (b.name !== undefined || b.email !== undefined) {
    const email = b.email !== undefined ? String(b.email).trim().toLowerCase() : before.email;
    const clash = await db.one('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, req.user.id]);
    if (clash) throw new HttpError(409, 'That email is used by another account.');
    await db.query('UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3', [b.name !== undefined ? String(b.name).trim() : before.name, email, req.user.id]);
  }
  const pick = (k, def) => (b[k] !== undefined ? b[k] : def);
  const companies = Array.isArray(b.target_companies) ? b.target_companies.map((c) => String(c).trim()).filter(Boolean).slice(0, 15) : before.target_companies || [];
  await db.query(
    `UPDATE student_profiles SET college=$2, branch=$3, academic_year=$4, graduation_year=$5, preferred_language=$6, target_role=$7,
       target_companies=$8, preparation_level=$9, daily_goal_minutes=$10, onboarding_complete = onboarding_complete OR $11, updated_at=NOW()
     WHERE user_id=$1`,
    [req.user.id, pick('college', before.college), pick('branch', before.branch), pick('academic_year', before.academic_year) || null,
      pick('graduation_year', before.graduation_year) || null, pick('preferred_language', before.preferred_language || 'java'),
      pick('target_role', before.target_role), companies, pick('preparation_level', before.preparation_level || 'beginner'),
      Number(pick('daily_goal_minutes', before.daily_goal_minutes || 60)), Boolean(b.complete_onboarding)]
  );
  if (b.daily_goal_minutes !== undefined) await db.query('UPDATE daily_goals SET study_minutes=$2, updated_at=NOW() WHERE user_id=$1', [req.user.id, Number(b.daily_goal_minutes)]);

  const after = await getProfile(req.user.id);
  // Regenerate the roadmap when anything it depends on changed (or on first onboarding).
  const keys = ['preferred_language', 'target_role', 'academic_year', 'preparation_level'];
  const changed = keys.some((k) => String(before[k]) !== String(after[k])) || JSON.stringify(before.target_companies) !== JSON.stringify(after.target_companies);
  const hasRoadmap = await db.one('SELECT id FROM learning_roadmaps WHERE user_id = $1', [req.user.id]);
  if (after.onboarding_complete && (changed || !hasRoadmap)) await roadmapService.generate(req.user.id);
  res.json({ user: after, roadmapUpdated: after.onboarding_complete && (changed || !hasRoadmap) });
};

exports.changePassword = async (req, res) => {
  requireFields(req.body, ['currentPassword', 'newPassword']);
  const user = await db.one('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!(await bcrypt.compare(req.body.currentPassword, user.password_hash))) throw new HttpError(400, 'Current password is incorrect.');
  validatePassword(req.body.newPassword);
  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [await bcrypt.hash(req.body.newPassword, 10), req.user.id]);
  res.json({ message: 'Password updated successfully.' });
};

exports.deleteAccount = async (req, res) => {
  requireFields(req.body, ['password']);
  const user = await db.one('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!(await bcrypt.compare(req.body.password, user.password_hash))) throw new HttpError(400, 'Password is incorrect.');
  await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
  res.json({ message: 'Account deleted.' });
};

exports.getProfile = getProfile;
