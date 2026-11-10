const db = require('../database/db');
const { HttpError } = require('../utils/http');
const roadmapService = require('../services/roadmapService');

const STAGES = [
  { stage: 1, name: 'Foundation', blurb: 'Programming basics, mathematics, computer fundamentals, English and logical thinking.' },
  { stage: 2, name: 'Intermediate', blurb: 'DSA, OOPs, DBMS, SQL, aptitude and verbal ability.' },
  { stage: 3, name: 'Advanced', blurb: 'Advanced DSA, core CS, problem-solving, system design and technical interviews.' },
  { stage: 4, name: 'Placement Ready', blurb: 'Company preparation, resume, portfolio, mock interviews, HR and assessments.' },
];

exports.get = async (req, res) => {
  let roadmap = await db.one('SELECT * FROM learning_roadmaps WHERE user_id = $1', [req.user.id]);
  if (!roadmap) {
    const id = await roadmapService.generate(req.user.id);
    if (!id) throw new HttpError(400, 'Complete onboarding first.');
    roadmap = await db.one('SELECT * FROM learning_roadmaps WHERE user_id = $1', [req.user.id]);
  }
  const items = await db.many('SELECT * FROM roadmap_items WHERE roadmap_id = $1 ORDER BY stage, sort_order', [roadmap.id]);
  const stages = STAGES.map((s) => {
    const its = items.filter((i) => i.stage === s.stage);
    const done = its.filter((i) => i.completed).length;
    return { ...s, items: its, total: its.length, completed: done, percent: its.length ? Math.round((done / its.length) * 100) : 0 };
  });
  const total = items.length, done = items.filter((i) => i.completed).length;
  res.json({ roadmap, stages, total, completed: done, percent: total ? Math.round((done / total) * 100) : 0 });
};

exports.toggleItem = async (req, res) => {
  const item = await db.one(
    `UPDATE roadmap_items SET completed = NOT completed, completed_at = CASE WHEN completed THEN NULL ELSE NOW() END
     WHERE id = $1 AND roadmap_id IN (SELECT id FROM learning_roadmaps WHERE user_id = $2) RETURNING *`,
    [req.params.id, req.user.id]);
  if (!item) throw new HttpError(404, 'Roadmap item not found.');
  res.json({ item });
};

exports.regenerate = async (req, res) => {
  await roadmapService.generate(req.user.id);
  res.json({ message: 'Roadmap regenerated from your latest profile.' });
};
