// ATS (Applicant Tracking System) compatibility analyzer.
// 1. Extracts real text from the uploaded PDF (pdf-parse) or DOCX (mammoth).
// 2. Scores it with fixed, documented rules. The score is INDICATIVE only - real employer ATS systems differ.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const mammoth = require('mammoth');

const ROLE_KEYWORDS = {
  'Software Developer': ['data structures', 'algorithms', 'git', 'sql', 'oop', 'rest api', 'java|python|c++|javascript', 'testing', 'problem solving', 'agile'],
  'Java Developer': ['java', 'spring|spring boot', 'oop', 'collections', 'jdbc|hibernate', 'sql', 'rest api', 'maven|gradle', 'git', 'multithreading'],
  'Full Stack Developer': ['javascript', 'react|angular|vue', 'node|express', 'html', 'css', 'sql|mongodb|postgresql', 'rest api', 'git', 'deployment|deployed', 'responsive'],
  'Frontend Developer': ['html', 'css', 'javascript', 'react|angular|vue', 'responsive', 'git', 'ui|ux', 'accessibility', 'api', 'typescript'],
  'Backend Developer': ['node|express|spring|django|flask', 'rest api', 'sql|postgresql|mysql', 'authentication|jwt', 'git', 'caching|redis', 'docker', 'testing', 'microservices', 'database'],
  'Data Analyst': ['sql', 'excel', 'python', 'pandas', 'power bi|tableau', 'statistics', 'data visualization|visualisation', 'dashboard', 'data cleaning', 'insights'],
  'AI/ML Engineer': ['python', 'machine learning', 'numpy', 'pandas', 'scikit-learn|sklearn', 'tensorflow|pytorch', 'deep learning', 'model', 'statistics', 'nlp|computer vision'],
  'Data Scientist': ['python', 'statistics', 'machine learning', 'pandas', 'sql', 'visualization|visualisation', 'regression', 'classification', 'hypothesis', 'model'],
  'Python Developer': ['python', 'django|flask|fastapi', 'oop', 'rest api', 'sql', 'git', 'testing|pytest', 'automation', 'data structures', 'linux'],
  'Cloud Engineer': ['aws|azure|gcp', 'linux', 'networking', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'monitoring', 'security', 'scripting|bash|python'],
  'DevOps Engineer': ['ci/cd', 'docker', 'kubernetes', 'jenkins|github actions', 'linux', 'aws|azure|gcp', 'terraform|ansible', 'git', 'monitoring', 'scripting|bash'],
  'Cybersecurity Analyst': ['network security', 'linux', 'siem', 'vulnerability', 'firewall', 'incident response', 'owasp', 'wireshark|nmap', 'cryptography', 'risk'],
};
ROLE_KEYWORDS['Software Development Engineer'] = ROLE_KEYWORDS['Software Developer'];

const SECTIONS = {
  education: /\b(education|academic|qualification)s?\b/i,
  skills: /\b(skills|technical skills|technologies|tech stack)\b/i,
  projects: /\bprojects?\b/i,
  experience: /\b(experience|internships?|work history|employment)\b/i,
  certifications: /\b(certifications?|certificates?|courses)\b/i,
  achievements: /\b(achievements?|awards?|accomplishments|honou?rs)\b/i,
  summary: /\b(summary|objective|profile|about me)\b/i,
};
const ACTION_VERBS = /\b(developed|built|designed|implemented|led|created|improved|reduced|increased|optimi[sz]ed|automated|deployed|managed|analy[sz]ed|engineered|launched|integrated|achieved|collaborated)\b/gi;
const STOP = new Set('the and for with you are our will your this that from have has who able work team must should strong good knowledge experience years year using use etc job role candidate skills ability including such any across within more other well also into their them they about required preferred plus'.split(' '));

async function extractText(file) {
  const name = file.originalname.toLowerCase();
  if (name.endsWith('.pdf') || file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return { text: data.text || '', pages: data.numpages || 1 };
  }
  if (name.endsWith('.docx')) {
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    return { text: value || '', pages: Math.max(1, Math.ceil((value || '').split(/\s+/).length / 500)) };
  }
  throw Object.assign(new Error('Only PDF and DOCX files are supported.'), { status: 400 });
}

const has = (text, kw) => kw.split('|').some((k) => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()[\]\\/]/g, '\\$&')}([^a-z]|$)`, 'i').test(text));

function jdKeywords(jd) {
  if (!jd || jd.trim().length < 30) return [];
  const freq = {};
  jd.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
    .forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w]) => w);
}

function analyze(text, pages, { role, jobDescription } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const feedback = {};
  const suggestions = [];

  // 1. Contact details (15)
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const phone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  const linkedin = /linkedin\.com\//i.test(text);
  const github = /github\.com\//i.test(text);
  const contact = (email ? 5 : 0) + (phone ? 4 : 0) + (linkedin ? 3 : 0) + (github ? 3 : 0);
  feedback.contact = { score: contact, max: 15, notes: [email ? 'Email found' : 'Email missing', phone ? 'Phone found' : 'Phone missing', linkedin ? 'LinkedIn found' : 'Add LinkedIn URL', github ? 'GitHub found' : 'Add GitHub URL'] };
  if (!email || !phone) suggestions.push('Add both email and phone number in the header.');
  if (!linkedin || !github) suggestions.push('Add full LinkedIn and GitHub profile links (linkedin.com/in/..., github.com/...).');

  // 2. Section completeness (25)
  const found = Object.fromEntries(Object.entries(SECTIONS).map(([k, re]) => [k, re.test(text)]));
  const sectionPts = { education: 5, skills: 5, projects: 5, experience: 4, certifications: 2, achievements: 2, summary: 2 };
  const sectionScore = Object.entries(sectionPts).reduce((s, [k, p]) => s + (found[k] ? p : 0), 0);
  const missingSections = Object.keys(sectionPts).filter((k) => !found[k]);
  feedback.sections = { score: sectionScore, max: 25, notes: Object.keys(sectionPts).map((k) => `${k[0].toUpperCase() + k.slice(1)}: ${found[k] ? 'present' : 'missing'}`) };
  if (missingSections.length) suggestions.push(`Add clearly titled sections: ${missingSections.join(', ')}.`);

  // 3. Keywords (25): role keywords (and job-description keywords if provided)
  const roleKws = ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Software Developer'];
  const jdKws = jdKeywords(jobDescription);
  const allKws = [...roleKws, ...jdKws.filter((k) => !roleKws.some((r) => r.split('|').includes(k)))];
  const matched = allKws.filter((k) => has(text, k));
  const missingKeywords = allKws.filter((k) => !has(text, k)).map((k) => k.split('|')[0]);
  const keywordScore = Math.round(25 * (matched.length / allKws.length));
  feedback.keywords = { score: keywordScore, max: 25, notes: [`Matched ${matched.length} of ${allKws.length} keywords for ${role || 'Software Developer'}${jdKws.length ? ' + job description' : ''}.`] };
  if (missingKeywords.length) suggestions.push(`Include relevant keywords you genuinely know: ${missingKeywords.slice(0, 8).join(', ')}.`);

  // 4. Impact: action verbs + numbers in project/experience bullets (15)
  const verbs = (text.match(ACTION_VERBS) || []).length;
  const numbers = (text.match(/\b\d+(\.\d+)?\s?(%|percent|users|ms|x|k|\+)/gi) || []).length;
  const impact = Math.min(9, verbs) + Math.min(6, numbers * 2);
  feedback.impact = { score: impact, max: 15, notes: [`${verbs} action verbs`, `${numbers} quantified results`] };
  if (verbs < 6) suggestions.push('Start bullet points with action verbs (Developed, Implemented, Optimised ...).');
  if (numbers < 2) suggestions.push('Quantify results, e.g. "reduced query time by 40%" or "used by 200+ students".');

  // 5. Formatting / length (10)
  let formatting = 10; const fnotes = [];
  if (wc < 200) { formatting -= 4; fnotes.push(`Only ${wc} words - too short.`); suggestions.push('Your resume looks thin; add projects, skills and achievements (aim for 350-800 words).'); }
  if (wc > 1000) { formatting -= 3; fnotes.push(`${wc} words - too long for a fresher.`); suggestions.push('Keep a fresher resume to one page (about 350-800 words).'); }
  if (pages > 2) { formatting -= 3; fnotes.push(`${pages} pages.`); }
  const oddChars = (text.match(/[■●◆★✓✔→►▪]/g) || []).length;
  if (oddChars > 15) { formatting -= 2; fnotes.push('Many decorative symbols - some ATS cannot read them.'); }
  if (!fnotes.length) fnotes.push(`${wc} words across ${pages} page(s) - good length.`);
  feedback.formatting = { score: Math.max(0, formatting), max: 10, notes: fnotes };

  // 6. Grammar & language heuristics (10)
  let grammar = 10; const gnotes = [];
  const repeated = (text.match(/\b(\w+)\s+\1\b/gi) || []).filter((w) => !/^\d/.test(w));
  if (repeated.length) { grammar -= Math.min(3, repeated.length); gnotes.push(`Repeated words: ${repeated.slice(0, 3).join('; ')}`); }
  const firstPerson = (text.match(/\b(I|me|my)\b/g) || []).length;
  if (firstPerson > 5) { grammar -= 3; gnotes.push(`"I/me/my" used ${firstPerson} times - resumes normally omit pronouns.`); suggestions.push('Remove first-person pronouns ("I developed" -> "Developed").'); }
  const doubleSpace = (text.match(/[a-z] {2,}[a-z]/g) || []).length;
  if (doubleSpace > 5) { grammar -= 1; gnotes.push('Irregular spacing detected.'); }
  const lowerStart = (text.match(/[.!?]\s+[a-z]/g) || []).length;
  if (lowerStart > 3) { grammar -= 2; gnotes.push('Some sentences start with a lowercase letter.'); }
  if (!gnotes.length) gnotes.push('No common language issues detected (automatic check - still proofread manually).');
  feedback.grammar = { score: Math.max(0, grammar), max: 10, notes: gnotes };

  const score = Math.max(0, Math.min(100, contact + sectionScore + keywordScore + impact + feedback.formatting.score + feedback.grammar.score));
  return { score, breakdown: feedback, missingKeywords: missingKeywords.slice(0, 15), suggestions, wordCount: wc, pages };
}

module.exports = { extractText, analyze, ROLE_KEYWORDS };
