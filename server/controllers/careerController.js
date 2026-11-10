// Resume builder, ATS analyzer, portfolio, project ideas, companies, resources and bookmarks.
const db = require('../database/db');
const { HttpError, toInt } = require('../utils/http');
const ats = require('../services/atsAnalyzer');

// ---------------- Resume builder ----------------
const emptyResume = (user) => ({
  personal: { name: user.name || '', email: user.email || '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '' },
  education: [], skills: { languages: '', frameworks: '', tools: '', concepts: '' }, experience: [], internships: [], projects: [],
  certifications: [], achievements: [],
});

function validateResume(data) {
  if (!data || typeof data !== 'object') throw new HttpError(400, 'Resume data is missing.');
  if (JSON.stringify(data).length > 100000) throw new HttpError(400, 'Resume is too large.');
  const p = data.personal || {};
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new HttpError(400, 'Please enter a valid email in personal details.');
}

exports.templates = async (req, res) => res.json({ templates: await db.many('SELECT * FROM resume_templates ORDER BY id') });

exports.listResumes = async (req, res) => {
  res.json({ resumes: await db.many('SELECT id, title, template_key, updated_at FROM resume_records WHERE user_id=$1 ORDER BY updated_at DESC', [req.user.id]) });
};

exports.createResume = async (req, res) => {
  const user = await db.one('SELECT name, email FROM users WHERE id=$1', [req.user.id]);
  const tpl = await db.one('SELECT key FROM resume_templates WHERE key=$1', [req.body.template_key || 'fresher']);
  if (!tpl) throw new HttpError(400, 'Unknown template.');
  const data = req.body.data || emptyResume(user);
  validateResume(data);
  const row = await db.one('INSERT INTO resume_records (user_id, title, template_key, data) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.user.id, String(req.body.title || 'My Resume').slice(0, 120), tpl.key, JSON.stringify(data)]);
  res.status(201).json({ resume: row });
};

exports.getResume = async (req, res) => {
  const row = await db.one('SELECT * FROM resume_records WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!row) throw new HttpError(404, 'Resume not found.');
  res.json({ resume: row });
};

exports.updateResume = async (req, res) => {
  validateResume(req.body.data);
  if (req.body.template_key && !(await db.one('SELECT 1 FROM resume_templates WHERE key=$1', [req.body.template_key]))) throw new HttpError(400, 'Unknown template.');
  const row = await db.one(
    `UPDATE resume_records SET data=$3, template_key=COALESCE($4, template_key), title=COALESCE($5, title), updated_at=NOW()
     WHERE id=$1 AND user_id=$2 RETURNING *`,
    [req.params.id, req.user.id, JSON.stringify(req.body.data), req.body.template_key || null, req.body.title ? String(req.body.title).slice(0, 120) : null]);
  if (!row) throw new HttpError(404, 'Resume not found.');
  res.json({ resume: row, message: 'Resume saved.' });
};

exports.deleteResume = async (req, res) => {
  const r = await db.query('DELETE FROM resume_records WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!r.rowCount) throw new HttpError(404, 'Resume not found.');
  res.json({ message: 'Resume deleted.' });
};

// ---------------- ATS analyzer ----------------
exports.analyzeResume = async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Please upload a PDF or DOCX resume.');
  const role = String(req.body.role || 'Software Developer').slice(0, 100);
  let extracted;
  try {
    extracted = await ats.extractText(req.file);
  } catch (err) {
    throw new HttpError(err.status || 400, err.status ? err.message : 'Could not read this file. Make sure it is a valid, non-password-protected PDF or DOCX.');
  }
  if (extracted.text.trim().length < 50) throw new HttpError(400, 'Very little text could be extracted. If this is a scanned/image PDF, ATS systems cannot read it either - export your resume as a text-based PDF.');
  const result = ats.analyze(extracted.text, extracted.pages, { role, jobDescription: req.body.job_description || '' });
  const row = await db.one(
    `INSERT INTO resume_analysis (user_id, file_name, target_role, score, breakdown, missing_keywords, suggestions)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
    [req.user.id, req.file.originalname.slice(0, 255), role, result.score, JSON.stringify(result.breakdown), JSON.stringify(result.missingKeywords), JSON.stringify(result.suggestions)]);
  res.json({ id: row.id, fileName: req.file.originalname, role, ...result, disclaimer: 'Indicative score from BrainBridge rules. Employer ATS systems vary and no score guarantees shortlisting.' });
};

exports.analysisHistory = async (req, res) => {
  res.json({ analyses: await db.many('SELECT id, file_name, target_role, score, created_at FROM resume_analysis WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [req.user.id]) });
};

exports.roles = async (req, res) => res.json({ roles: Object.keys(ats.ROLE_KEYWORDS) });

// ---------------- Portfolio ----------------
const slugify = (s) => String(s || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'student';

exports.getPortfolio = async (req, res) => {
  let row = await db.one('SELECT * FROM portfolio_profiles WHERE user_id=$1', [req.user.id]);
  if (!row) {
    const u = await db.one('SELECT u.name, u.email, p.college, p.branch, p.graduation_year, p.target_role FROM users u JOIN student_profiles p ON p.user_id=u.id WHERE u.id=$1', [req.user.id]);
    const data = {
      name: u.name, headline: u.target_role ? `Aspiring ${u.target_role}` : 'Engineering Student', about: '',
      education: u.college ? [{ institution: u.college, degree: `B.E./B.Tech ${u.branch || ''}`.trim(), year: u.graduation_year ? String(u.graduation_year) : '', score: '' }] : [],
      skills: [], projects: [], internships: [], certifications: [], achievements: [],
      github: '', linkedin: '', email: u.email, phone: '', location: '', theme: 'indigo',
    };
    row = { user_id: req.user.id, slug: `${slugify(u.name)}-${req.user.id}`, is_public: false, data, isNew: true };
  }
  res.json({ portfolio: row });
};

exports.savePortfolio = async (req, res) => {
  const data = req.body.data;
  if (!data || typeof data !== 'object' || !data.name) throw new HttpError(400, 'Name is required.');
  if (JSON.stringify(data).length > 100000) throw new HttpError(400, 'Portfolio is too large.');
  const urls = [data.github, data.linkedin, ...(data.projects || []).flatMap((p) => [p.github, p.live])].filter(Boolean);
  const bad = urls.find((u) => !/^https?:\/\/[^\s]+\.[^\s]+/.test(u));
  if (bad) throw new HttpError(400, `Links must start with http:// or https:// (check "${String(bad).slice(0, 60)}").`);
  let slug = slugify(req.body.slug || `${data.name}-${req.user.id}`);
  const clash = await db.one('SELECT user_id FROM portfolio_profiles WHERE slug=$1 AND user_id<>$2', [slug, req.user.id]);
  if (clash) throw new HttpError(409, 'That portfolio URL is taken - choose another.');
  const row = await db.one(
    `INSERT INTO portfolio_profiles (user_id, slug, is_public, data) VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id) DO UPDATE SET slug=$2, is_public=$3, data=$4, updated_at=NOW() RETURNING *`,
    [req.user.id, slug, !!req.body.is_public, JSON.stringify(data)]);
  res.json({ portfolio: row, message: 'Portfolio saved.' });
};

exports.publicPortfolio = async (req, res) => {
  const row = await db.one('SELECT slug, data, updated_at FROM portfolio_profiles WHERE slug=$1 AND is_public', [req.params.slug]);
  if (!row) throw new HttpError(404, 'This portfolio does not exist or is private.');
  res.json({ portfolio: row });
};

// ---------------- Project ideas ----------------
exports.projects = async (req, res) => {
  const params = [req.user.id];
  const where = [];
  if (req.query.role) { params.push(req.query.role); where.push(`p.role = $${params.length}`); }
  if (['beginner', 'intermediate', 'advanced'].includes(req.query.difficulty)) { params.push(req.query.difficulty); where.push(`p.difficulty = $${params.length}`); }
  if (req.query.search) { params.push(`%${req.query.search}%`); where.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`); }
  const rows = await db.many(
    `SELECT p.*, (b.id IS NOT NULL) bookmarked FROM project_ideas p
     LEFT JOIN user_bookmarks b ON b.user_id=$1 AND b.item_type='project' AND b.item_id=p.id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY p.role, CASE p.difficulty WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 ELSE 3 END, p.id`, params);
  const roles = await db.many('SELECT role, COUNT(*)::int count FROM project_ideas GROUP BY role ORDER BY role');
  res.json({ projects: rows, roles });
};

// ---------------- Companies ----------------
exports.companies = async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.type) { params.push(req.query.type); where = 'WHERE type = $1'; }
  res.json({ companies: await db.many(`SELECT id, slug, name, type, overview, headquarters FROM companies ${where} ORDER BY type, name`, params) });
};

exports.company = async (req, res) => {
  const c = await db.one('SELECT * FROM companies WHERE slug=$1', [req.params.slug]);
  if (!c) throw new HttpError(404, 'Company not found.');
  const sections = await db.many('SELECT section, title, content, verification FROM company_preparation WHERE company_id=$1 ORDER BY sort_order', [c.id]);
  res.json({ company: c, sections });
};

// ---------------- Videos & resources ----------------
exports.resources = async (req, res) => {
  const params = [];
  const where = [];
  if (req.query.category) { params.push(req.query.category); where.push(`category = $${params.length}`); }
  if (req.query.kind) { params.push(req.query.kind); where.push(`kind = $${params.length}`); }
  const rows = await db.many(`SELECT * FROM video_resources ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY category, kind, id`, params);
  const categories = await db.many('SELECT category, COUNT(*)::int count FROM video_resources GROUP BY category ORDER BY category');
  res.json({ resources: rows, categories });
};

// ---------------- Bookmarks ----------------
const BOOKMARK_TYPES = ['coding_problem', 'lesson', 'project', 'company', 'video', 'aptitude_question'];
exports.toggleBookmark = async (req, res) => {
  const type = req.body.item_type;
  const id = toInt(req.body.item_id, 0);
  if (!BOOKMARK_TYPES.includes(type) || !id) throw new HttpError(400, 'Invalid bookmark.');
  const del = await db.query('DELETE FROM user_bookmarks WHERE user_id=$1 AND item_type=$2 AND item_id=$3', [req.user.id, type, id]);
  if (del.rowCount) return res.json({ bookmarked: false });
  await db.query('INSERT INTO user_bookmarks (user_id, item_type, item_id) VALUES ($1,$2,$3)', [req.user.id, type, id]);
  res.json({ bookmarked: true });
};

exports.bookmarks = async (req, res) => {
  const rows = await db.many(
    `SELECT b.item_type, b.item_id, b.created_at,
       CASE b.item_type
         WHEN 'coding_problem' THEN (SELECT title FROM coding_problems WHERE id=b.item_id)
         WHEN 'lesson' THEN (SELECT title FROM lessons WHERE id=b.item_id)
         WHEN 'project' THEN (SELECT title FROM project_ideas WHERE id=b.item_id)
         WHEN 'company' THEN (SELECT name FROM companies WHERE id=b.item_id)
         WHEN 'video' THEN (SELECT title FROM video_resources WHERE id=b.item_id) END AS title,
       CASE b.item_type
         WHEN 'coding_problem' THEN '/coding/' || (SELECT slug FROM coding_problems WHERE id=b.item_id)
         WHEN 'lesson' THEN (SELECT '/learn/' || m.slug || '/' || t.slug FROM lessons l JOIN learning_topics t ON t.id=l.topic_id JOIN learning_modules m ON m.id=t.module_id WHERE l.id=b.item_id)
         WHEN 'project' THEN '/projects'
         WHEN 'company' THEN '/companies/' || (SELECT slug FROM companies WHERE id=b.item_id)
         WHEN 'video' THEN '/videos' END AS link
     FROM user_bookmarks b WHERE b.user_id=$1 ORDER BY b.created_at DESC`, [req.user.id]);
  res.json({ bookmarks: rows });
};
