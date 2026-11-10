// Helpers for building seed content deterministically (same seed -> same questions every time).

function rng(seed) { // mulberry32 PRNG
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const shuffle = (r, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const nCr = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const round2 = (x) => Math.round(x * 100) / 100;
const fmtNum = (x) => (Number.isInteger(x) ? String(x) : String(round2(x)));
const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };

/** Build MCQ options: correct answer + 3 distinct distractors, shuffled. */
function options(r, answer, distractors) {
  const ans = String(answer);
  const pool = [...new Set(distractors.map(String))].filter((d) => d !== ans && d !== 'NaN' && d !== 'Infinity');
  const chosen = shuffle(r, pool).slice(0, 3);
  let k = 1;
  while (chosen.length < 3) { // fallback distractors for numeric answers
    const n = Number(ans);
    const cand = Number.isFinite(n) ? fmtNum(n + k * (n >= 10 ? Math.ceil(n / 10) : 1)) : `None of these ${k}`;
    if (cand !== ans && !chosen.includes(cand)) chosen.push(cand);
    k++;
  }
  const opts = shuffle(r, [ans, ...chosen]);
  return { options: opts, answer_index: opts.indexOf(ans) };
}

/** Numeric distractors near the answer. */
function near(r, ans, { unit = '', pct = false } = {}) {
  const n = Number(ans);
  const d = Math.max(1, Math.round(Math.abs(n) * 0.1));
  const list = [n + d, n - d, n + 2 * d, n * 2, n / 2, n + int(r, 1, 3) * d, n - 2 * d].filter((x) => x > 0 || n <= 0);
  return list.map((x) => fmtNum(x) + unit + (pct ? '%' : ''));
}

/**
 * Generate unique questions for one topic.
 * gens = { easy: [fn...], medium: [...], hard: [...] }, each fn(r) -> {q, a, d:[distractors], e}
 */
function generateTopic(section, topic, gens, perLevel = 18, seed = 1) {
  const out = [];
  const seen = new Set();
  ['easy', 'medium', 'hard'].forEach((level, li) => {
    const r = rng(seed * 1000 + li * 97 + topic.length);
    const fns = gens[level];
    let made = 0, tries = 0;
    while (made < perLevel && tries < perLevel * 60) {
      tries++;
      const fn = fns[tries % fns.length];
      const g = fn(r);
      if (!g || seen.has(g.q)) continue;
      seen.add(g.q);
      const { options: opts, answer_index } = options(r, g.a, g.d);
      out.push({ section, topic_slug: topic, question: g.q, options: opts, answer_index, explanation: g.e, difficulty: level });
      made++;
    }
  });
  return out;
}

/** Hand-written questions: [q, [opt0..opt3], correctIndex, explanation, difficulty] */
function handwritten(section, topic, list) {
  return list.map(([q, opts, ai, e, diff]) => ({ section, topic_slug: topic, question: q, options: opts, answer_index: ai, explanation: e, difficulty: diff || 'easy' }));
}

module.exports = { rng, int, pick, shuffle, gcd, lcm, fact, nCr, round2, fmtNum, frac, options, near, generateTopic, handwritten };
