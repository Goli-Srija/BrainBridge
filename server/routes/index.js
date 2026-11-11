// All REST API routes. Every route except /auth/register, /auth/login, /health and public
// portfolio pages requires a valid JWT (requireAuth), and every query is filtered by req.user.id.
const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler: h } = require('../utils/http');

const auth = require('../controllers/authController');
const dashboard = require('../controllers/dashboardController');
const learn = require('../controllers/learnController');
const roadmap = require('../controllers/roadmapController');
const aptitude = require('../controllers/aptitudeController');
const coding = require('../controllers/codingController');
const tracker = require('../controllers/trackerController');
const practice = require('../controllers/practiceController');
const mock = require('../controllers/mockController');
const assessment = require('../controllers/assessmentController');
const career = require('../controllers/careerController');
const db = require('../database/db');
const brainBuddy = require('../controllers/brainBuddyController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const r = express.Router();

// ---------- public ----------
r.get('/health', h(async (req, res) => {
  const t = await db.one('SELECT NOW() AS now');
  res.json({ status: 'ok', database: 'connected', time: t.now });
}));
r.post('/auth/register', h(auth.register));
r.post('/auth/login', h(auth.login));
r.get('/portfolio/public/:slug', h(career.publicPortfolio));

// ---------- protected ----------
r.use(requireAuth);
r.post('/brainbuddy/chat', h(brainBuddy.chat));
r.get('/brainbuddy/conversations', h(brainBuddy.listConversations));
r.get('/brainbuddy/conversations/:id', h(brainBuddy.getConversation));
r.delete('/brainbuddy/conversations/:id', h(brainBuddy.deleteConversation));

r.get('/auth/me', h(auth.me));
r.put('/profile', h(auth.updateProfile));
r.post('/auth/change-password', h(auth.changePassword));
r.delete('/auth/account', h(auth.deleteAccount));

r.get('/dashboard', h(dashboard.dashboard));
r.get('/progress', h(dashboard.progress));

r.get('/roadmap', h(roadmap.get));
r.post('/roadmap/regenerate', h(roadmap.regenerate));
r.patch('/roadmap/items/:id/toggle', h(roadmap.toggleItem));

r.get('/learn/modules', h(learn.listModules));
r.get('/learn/modules/:module', h(learn.getModule));
r.get('/learn/topic/:module/:topic', h(learn.getTopic));
r.post('/learn/lessons/:id/start', h(learn.startLesson));
r.post('/learn/lessons/:id/complete', h(learn.completeLesson));
r.post('/learn/lessons/:id/uncomplete', h(learn.uncompleteLesson));

r.get('/aptitude/summary/:section', h(aptitude.summary));
r.get('/aptitude/quiz', h(aptitude.quiz));
r.post('/aptitude/submit', h(aptitude.submit));
r.get('/aptitude/attempts', h(aptitude.attempts));
r.get('/aptitude/attempts/:id', h(aptitude.attemptDetail));

r.get('/coding/runtime', h(coding.runtimeStatus));
r.get('/coding/problems', h(coding.list));
r.get('/coding/problems/:slug', h(coding.detail));
r.post('/coding/run', h(coding.run));
r.post('/coding/submit', h(coding.submit));
r.post('/coding/draft', h(coding.saveDraft));
r.get('/coding/submissions', h(coding.submissions));

r.get('/tracker/today', h(tracker.today));
r.put('/tracker/goals', h(tracker.updateGoals));
r.post('/tracker/log', h(tracker.logSession));
r.post('/tracker/heartbeat', h(tracker.heartbeat));
r.get('/tracker/calendar', h(tracker.calendar));
r.get('/tracker/analytics', h(tracker.analytics));
r.get('/tracker/recommendations', h(tracker.recommendations));

r.get('/communication/exercises', h(practice.listExercises));
r.get('/communication/exercises/:slug', h(practice.getExercise));
r.post('/communication/exercises/:slug/submit', h(practice.submitExercise));

r.get('/interview/categories', h(practice.prepCategories));
r.get('/interview/questions/:category', h(practice.prepQuestions));
r.post('/interview/questions/:id/practice', h(practice.prepPractice));

r.get('/mock/tracks', h(mock.tracks));
r.post('/mock/start', h(mock.start));
r.get('/mock/:id', h(mock.session));
r.post('/mock/:id/answer', h(mock.answer));
r.post('/mock/:id/finish', h(mock.finish));

r.get('/assessments', h(assessment.list));
r.get('/assessments/attempts', h(assessment.attempts));
r.get('/assessments/:slug', h(assessment.start));
r.post('/assessments/:slug/submit', h(assessment.submit));

r.get('/resume/templates', h(career.templates));
r.get('/resume/roles', h(career.roles));
r.get('/resume', h(career.listResumes));
r.post('/resume', h(career.createResume));
r.get('/resume/analysis', h(career.analysisHistory));
r.post('/resume/analyze', upload.single('file'), h(career.analyzeResume));
r.get('/resume/:id', h(career.getResume));
r.put('/resume/:id', h(career.updateResume));
r.delete('/resume/:id', h(career.deleteResume));

r.get('/portfolio', h(career.getPortfolio));
r.put('/portfolio', h(career.savePortfolio));

r.get('/projects', h(career.projects));
r.get('/companies', h(career.companies));
r.get('/companies/:slug', h(career.company));
r.get('/resources', h(career.resources));
r.get('/resources/guides', (req, res) => res.json({ guides: require('../database/content/resources').GUIDES }));
r.get('/bookmarks', h(career.bookmarks));
r.post('/bookmarks/toggle', h(career.toggleBookmark));

module.exports = r;
