// Rule-based rubric used for communication exercises, interview practice and mock interviews.
// It is deterministic: the same answer always gets the same score, and every point is explained.
//
// Rubric (100 points):
//   Content coverage  50  - expected key ideas found in the answer (keywords may list synonyms "a|b")
//   Depth / length    20  - answer is long enough to explain the idea, not padded
//   Structure         15  - several sentences + linking words (first, because, for example, finally ...)
//   Specificity       15  - concrete details: numbers, examples, "I built / implemented / led"
//   Filler penalty   -10  - excessive "um", "like", "basically", "actually"

const CONNECTORS = ['first', 'second', 'then', 'because', 'therefore', 'for example', 'for instance', 'however', 'finally', 'as a result', 'also', 'in addition', 'so that', 'which means', 'such as', 'whereas', 'on the other hand'];
const ACTION_VERBS = ['built', 'developed', 'designed', 'implemented', 'led', 'created', 'improved', 'reduced', 'increased', 'optimized', 'optimised', 'managed', 'solved', 'learned', 'deployed', 'analysed', 'analyzed', 'organized', 'organised', 'achieved', 'used', 'wrote', 'tested'];
const FILLERS = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'kind of', 'sort of'];

const norm = (s) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ').replace(/\s+/g, ' ')} `;
const countOf = (text, phrase) => text.split(` ${phrase} `).length - 1;

function evaluateAnswer(answer, { keywords = [], minWords = 40 } = {}) {
  const raw = String(answer || '').trim();
  const text = norm(raw);
  const words = raw.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const sentences = raw.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 3);

  // 1. Content coverage
  const matched = [], missing = [];
  keywords.forEach((k) => {
    const options = String(k).toLowerCase().split('|').map((x) => x.trim()).filter(Boolean);
    const hit = options.some((o) => text.includes(` ${o}`) || text.includes(`${o} `));
    (hit ? matched : missing).push(options[0]);
  });
  const coverage = keywords.length ? matched.length / keywords.length : Math.min(1, wc / Math.max(minWords, 1));
  const contentScore = Math.round(50 * Math.min(1, coverage * 1.15)); // small tolerance: ~87% coverage = full marks

  // 2. Depth
  const ratio = wc / Math.max(minWords, 1);
  let depthScore = ratio >= 1 ? 20 : Math.round(20 * ratio);
  if (ratio > 5) depthScore -= 5; // overly long answers lose focus

  // 3. Structure
  const connectorHits = CONNECTORS.filter((c) => text.includes(` ${c} `)).length;
  const structureScore = Math.min(15, Math.min(sentences.length, 4) * 2.5 + Math.min(connectorHits, 2) * 2.5);

  // 4. Specificity
  const hasNumber = /\d/.test(raw);
  const verbHits = ACTION_VERBS.filter((v) => text.includes(` ${v} `)).length;
  const hasExample = /for example|for instance|such as|e\.g\./i.test(raw);
  const specificityScore = (hasNumber ? 5 : 0) + Math.min(verbHits, 2) * 2.5 + (hasExample ? 5 : 0);

  // 5. Filler penalty
  const fillerCount = FILLERS.reduce((s, f) => s + countOf(text, f), 0);
  const fillerPenalty = fillerCount > 3 ? Math.min(10, fillerCount - 3) * 2 : 0;

  const score = wc === 0 ? 0 : Math.max(0, Math.min(100, Math.round(contentScore + depthScore + structureScore + specificityScore - fillerPenalty)));

  const strengths = [], improvements = [];
  if (coverage >= 0.7) strengths.push('Covers most of the key ideas interviewers look for.');
  else if (keywords.length) improvements.push(`Mention these key ideas: ${missing.slice(0, 6).join(', ')}.`);
  if (ratio >= 1 && ratio <= 5) strengths.push('Good length - detailed without rambling.');
  if (ratio < 1) improvements.push(`Expand your answer (you wrote ${wc} words; aim for at least ${minWords}).`);
  if (ratio > 5) improvements.push('Answer is very long - keep it focused (60-120 seconds when spoken).');
  if (sentences.length >= 3 && connectorHits >= 1) strengths.push('Well-structured with clear linking words.');
  else improvements.push('Structure your answer: point -> explanation -> example -> conclusion.');
  if (hasNumber || hasExample) strengths.push('Uses concrete examples or numbers.');
  else improvements.push('Add a specific example or a measurable result (e.g. "reduced load time by 30%").');
  if (fillerPenalty) improvements.push(`Reduce filler words (found ${fillerCount}).`);

  return {
    score,
    evaluator: 'rule-based',
    rubric: [
      { criterion: 'Content coverage', score: contentScore, max: 50 },
      { criterion: 'Depth', score: Math.max(0, depthScore), max: 20 },
      { criterion: 'Structure', score: Math.round(structureScore), max: 15 },
      { criterion: 'Specificity', score: Math.round(specificityScore), max: 15 },
      ...(fillerPenalty ? [{ criterion: 'Filler words penalty', score: -fillerPenalty, max: 0 }] : []),
    ],
    matchedKeywords: matched,
    missingKeywords: missing,
    wordCount: wc,
    strengths,
    improvements,
  };
}

module.exports = { evaluateAnswer };
