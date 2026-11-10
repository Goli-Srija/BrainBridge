// Extra generated logical-reasoning questions: every arrangement puzzle is checked by brute force
// so that the clues lead to exactly ONE valid arrangement.
const { int, pick, shuffle, generateTopic } = require('./lib');

const NAMES = ['Asha', 'Bala', 'Chitra', 'Dev', 'Esha', 'Farhan', 'Gita', 'Hari', 'Isha', 'Jay', 'Kavya', 'Lokesh', 'Meera', 'Nikhil'];
function perms(arr) { if (arr.length <= 1) return [arr]; const out = []; arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p]))); return out; }

// ---- linear row (facing north, index 0 = left end) / vertical floors (index 0 = floor 1) ----
function clueFactory(kind) {
  const left = kind === 'row' ? 'left' : 'below', right = kind === 'row' ? 'right' : 'above';
  return [
    (sol, r) => { const x = pick(r, sol); const i = sol.indexOf(x); return { text: kind === 'row' ? `${x} sits ${i === 0 ? 'at the extreme left end' : i === sol.length - 1 ? 'at the extreme right end' : `${i + 1}th from the left`}` : `${x} lives on floor ${i + 1}`, test: (p) => p.indexOf(x) === i }; },
    (sol, r) => { const i = int(r, 0, sol.length - 2); const a = sol[i], b = sol[i + 1]; return { text: kind === 'row' ? `${a} sits immediately to the left of ${b}` : `${b} lives immediately above ${a}`, test: (p) => p.indexOf(a) + 1 === p.indexOf(b) }; },
    (sol, r) => { const i = int(r, 0, sol.length - 3), j = int(r, i + 2, sol.length - 1); const a = sol[i], b = sol[j]; return { text: kind === 'row' ? `${a} sits somewhere to the left of ${b}` : `${b} lives on a floor ${right} ${a}`, test: (p) => p.indexOf(a) < p.indexOf(b) }; },
    (sol, r) => { const i = int(r, 1, sol.length - 2); const x = sol[i]; const others = [sol[i - 1], sol[i + 1]]; return { text: `${x} ${kind === 'row' ? 'sits' : 'lives'} between ${others[0]} and ${others[1]}`, test: (p) => { const k = p.indexOf(x); return k > 0 && k < p.length - 1 && [p[k - 1], p[k + 1]].sort().join() === [...others].sort().join(); } }; },
    (sol, r) => { const x = pick(r, sol); const i = sol.indexOf(x); let k = int(r, 0, sol.length - 1); if (k === i) k = (k + 1) % sol.length; return { text: kind === 'row' ? `${x} does not sit in position ${k + 1} from the left` : `${x} does not live on floor ${k + 1}`, test: (p) => p.indexOf(x) !== k }; },
    (sol, r) => { const i = int(r, 0, sol.length - 1), j = int(r, 0, sol.length - 1); if (Math.abs(i - j) < 2) return null; const a = sol[i], b = sol[j]; const gap = Math.abs(i - j) - 1; return { text: kind === 'row' ? `Exactly ${gap} ${gap === 1 ? 'person sits' : 'people sit'} between ${a} and ${b}` : `Exactly ${gap} floor${gap === 1 ? '' : 's'} between ${a}'s and ${b}'s floors`, test: (p) => Math.abs(p.indexOf(a) - p.indexOf(b)) - 1 === gap }; },
  ].map((f) => f);
  void left;
}

function arrangementQuestion(r, n, kind) {
  const names = shuffle(r, NAMES).slice(0, n);
  const all = perms(names);
  const sol = shuffle(r, names);
  const factories = clueFactory(kind);
  const clues = [];
  let cands = all;
  let guard = 0;
  while (cands.length > 1 && guard++ < 60) {
    const c = pick(r, factories)(sol, r);
    if (!c || clues.some((x) => x.text === c.text)) continue;
    const next = cands.filter(c.test);
    if (next.length === cands.length) continue; // useless clue
    clues.push(c); cands = next;
  }
  if (cands.length !== 1 || clues.length < 3) return null;
  const askIdx = int(r, 0, n - 1);
  const who = sol[askIdx];
  const q = kind === 'row'
    ? `${n} friends - ${[...names].sort().join(', ')} - sit in a row facing north. ${clues.map((c) => c.text).join('. ')}. Who sits ${askIdx === 0 ? 'at the extreme left end' : askIdx === n - 1 ? 'at the extreme right end' : `${askIdx + 1}th from the left`}?`
    : `${n} people - ${[...names].sort().join(', ')} - live on floors 1 to ${n} of a building (one per floor, floor 1 is the lowest). ${clues.map((c) => c.text).join('. ')}. Who lives on floor ${askIdx + 1}?`;
  const e = `Applying the clues one by one leaves exactly one arrangement (${kind === 'row' ? 'left to right' : 'floor 1 to ' + n}): ${sol.join(', ')}. So the answer is ${who}.`;
  return { q, a: who, d: names.filter((x) => x !== who), e };
}

function circularQuestion(r, n) {
  const names = shuffle(r, NAMES).slice(0, n);
  const fixed = names[0];
  const rest = perms(names.slice(1)).map((p) => [fixed, ...p]); // fix one person (rotations are equivalent)
  const sol = pick(r, rest);
  // seats are clockwise; facing the centre, a person's LEFT neighbour is clockwise (+1) and RIGHT is anticlockwise (-1)
  const at = (p, x, k) => p[(p.indexOf(x) + k + n) % n];
  const factories = [
    () => { const x = pick(r, sol); return { text: `${at(sol, x, 1)} sits immediately to the left of ${x}`, test: (p) => at(p, x, 1) === at(sol, x, 1) }; },
    () => { const x = pick(r, sol); return { text: `${at(sol, x, -1)} sits immediately to the right of ${x}`, test: (p) => at(p, x, -1) === at(sol, x, -1) }; },
    () => { if (n % 2) return null; const x = pick(r, sol); return { text: `${x} sits opposite ${at(sol, x, n / 2)}`, test: (p) => at(p, x, n / 2) === at(sol, x, n / 2) }; },
    () => { const x = pick(r, sol); return { text: `${at(sol, x, 2)} sits second to the left of ${x}`, test: (p) => at(p, x, 2) === at(sol, x, 2) }; },
    () => { const x = pick(r, sol), y = at(sol, x, 1); const z = pick(r, sol.filter((s) => s !== x && s !== y)); return { text: `${z} is not an immediate neighbour of ${x}`, test: (p) => at(p, x, 1) !== z && at(p, x, -1) !== z, valid: at(sol, x, -1) !== z }; },
  ];
  const clues = []; let cands = rest; let guard = 0;
  while (cands.length > 1 && guard++ < 60) {
    const c = pick(r, factories)();
    if (!c || c.valid === false || clues.some((x) => x.text === c.text)) continue;
    const next = cands.filter(c.test);
    if (next.length === cands.length || !next.length) continue;
    clues.push(c); cands = next;
  }
  if (cands.length !== 1 || clues.length < 2) return null;
  const x = pick(r, sol); const side = pick(r, ['left', 'right']);
  const who = at(sol, x, side === 'left' ? 1 : -1);
  return {
    q: `${n} friends - ${[...names].sort().join(', ')} - sit around a circular table facing the centre. ${clues.map((c) => c.text).join('. ')}. Who sits immediately to the ${side} of ${x}?`,
    a: who, d: names.filter((y) => y !== who && y !== x),
    e: `Going clockwise (which is each person's left when facing the centre), the only arrangement that satisfies every clue is: ${sol.join(' → ')} → back to ${sol[0]}. So the person to the ${side} of ${x} is ${who}.`,
  };
}

// ---- syllogisms from fixed valid/invalid conclusion tables ----
const TERMS = [['students', 'readers', 'thinkers'], ['pens', 'tools', 'objects'], ['coders', 'engineers', 'graduates'], ['roses', 'flowers', 'plants'], ['cars', 'vehicles', 'machines'], ['apples', 'fruits', 'foods'], ['teachers', 'mentors', 'leaders'], ['laptops', 'computers', 'devices'], ['doctors', 'scientists', 'researchers'], ['singers', 'artists', 'performers'], ['chairs', 'tables', 'furniture'], ['birds', 'animals', 'creatures'], ['rivers', 'lakes', 'water bodies'], ['phones', 'gadgets', 'products']];
const FORMS = [
  { level: 'easy', st: (A, B, C) => [`All ${A} are ${B}`, `All ${B} are ${C}`], valid: (A, B, C) => [`All ${A} are ${C}`, `Some ${C} are ${A}`, `Some ${B} are ${A}`, `Some ${A} are ${C}`], invalid: (A, B, C) => [`All ${C} are ${A}`, `Some ${A} are not ${C}`, `All ${C} are ${B}`, `No ${C} is ${A}`] },
  { level: 'easy', st: (A, B, C) => [`All ${A} are ${B}`, `No ${B} is ${C}`], valid: (A, B, C) => [`No ${A} is ${C}`, `No ${C} is ${A}`, `Some ${B} are not ${C}`, `Some ${A} are not ${C}`], invalid: (A, B, C) => [`Some ${A} are ${C}`, `All ${C} are ${B}`, `Some ${C} are ${B}`, `All ${B} are ${A}`] },
  { level: 'medium', st: (A, B, C) => [`Some ${A} are ${B}`, `All ${B} are ${C}`], valid: (A, B, C) => [`Some ${A} are ${C}`, `Some ${C} are ${A}`, `Some ${C} are ${B}`], invalid: (A, B, C) => [`All ${A} are ${C}`, `All ${C} are ${A}`, `All ${B} are ${A}`, `Some ${A} are not ${C}`] },
  { level: 'medium', st: (A, B, C) => [`Some ${A} are ${B}`, `No ${B} is ${C}`], valid: (A, B, C) => [`Some ${A} are not ${C}`, `No ${C} is ${B}`, `Some ${B} are ${A}`], invalid: (A, B, C) => [`No ${A} is ${C}`, `All ${A} are ${C}`, `Some ${C} are ${B}`, `All ${B} are ${A}`] },
  { level: 'hard', st: (A, B, C) => [`No ${A} is ${B}`, `All ${C} are ${B}`], valid: (A, B, C) => [`No ${C} is ${A}`, `No ${A} is ${C}`, `Some ${B} are ${C}`], invalid: (A, B, C) => [`Some ${A} are ${C}`, `All ${B} are ${C}`, `Some ${C} are ${A}`, `All ${A} are ${C}`] },
  { level: 'hard', st: (A, B, C) => [`All ${A} are ${B}`, `Some ${B} are ${C}`], valid: (A, B, C) => [`Some ${B} are ${A}`, `Some ${C} are ${B}`], invalid: (A, B, C) => [`Some ${A} are ${C}`, `All ${A} are ${C}`, `All ${C} are ${A}`, `All ${B} are ${A}`] },
  { level: 'hard', st: (A, B, C) => [`Some ${A} are ${B}`, `Some ${B} are ${C}`], valid: (A, B, C) => [`Some ${B} are ${A}`, `Some ${C} are ${B}`], invalid: (A, B, C) => [`Some ${A} are ${C}`, `All ${A} are ${C}`, `All ${C} are ${A}`, `Some ${C} are ${A}`] },
];
const SYL_OPTS = ['Only conclusion I follows', 'Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'];
function syllogism(level) {
  return (r) => {
    const f = pick(r, FORMS.filter((x) => x.level === level));
    const [A, B, C] = pick(r, TERMS);
    const v = f.valid(A, B, C), inv = f.invalid(A, B, C);
    const c1v = r() < 0.5, c2v = r() < 0.5;
    const c1 = c1v ? pick(r, v) : pick(r, inv), c2 = c2v ? pick(r, v.filter((x) => x !== c1)) || pick(r, inv) : pick(r, inv.filter((x) => x !== c1));
    if (!c1 || !c2 || c1 === c2) return null;
    const v2 = v.includes(c2);
    const ans = c1v && v2 ? SYL_OPTS[2] : c1v ? SYL_OPTS[0] : v2 ? SYL_OPTS[1] : SYL_OPTS[3];
    const [s1, s2] = f.st(A, B, C);
    return { q: `Statements: ${s1}. ${s2}. Conclusions: I. ${c1}. II. ${c2}.`, a: ans, d: SYL_OPTS.filter((o) => o !== ans), e: `Draw the Venn diagram for "${s1}" and "${s2}". Conclusion I ${c1v ? 'is true in every possible diagram' : 'is not true in every possible diagram'}; conclusion II ${v2 ? 'is true in every possible diagram' : 'is not true in every possible diagram'}.` };
  };
}

// ---- data sufficiency from small equation systems ----
const DS_OPTS = ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both statements together are sufficient', 'Neither statement is sufficient, even together'];
const DS = {
  easy: [
    (r) => { const x = int(r, 2, 20), a = int(r, 2, 9), b = int(r, 1, 30); return { q: `What is the value of x? I. ${a}x + ${b} = ${a * x + b}. II. x is a positive integer less than ${x + int(r, 5, 20)}.`, a: DS_OPTS[0], d: DS_OPTS.slice(1), e: `From I, x = (${a * x + b} - ${b})/${a} = ${x}. II only gives a range.` }; },
    (r) => { const x = int(r, 2, 20), y = int(r, 2, 20); return { q: `What is the value of y? I. x + y = ${x + y}. II. y = ${y * 2}/2.`, a: DS_OPTS[1], d: [DS_OPTS[0], DS_OPTS[2], DS_OPTS[3]], e: `II directly gives y = ${y}. I has two unknowns.` }; },
  ],
  medium: [
    (r) => { const x = int(r, 5, 30), y = int(r, 1, x - 1); return { q: `What is the value of x? I. x + y = ${x + y}. II. x - y = ${x - y}.`, a: DS_OPTS[2], d: [DS_OPTS[0], DS_OPTS[1], DS_OPTS[3]], e: `Adding the equations: 2x = ${2 * x} → x = ${x}. Each alone has two unknowns.` }; },
    (r) => { const s = int(r, 10, 40), d = int(r, 2, 10); return { q: `What is A's present age? I. A is ${d} years older than B. II. The sum of A's and B's ages is ${s * 2 + d}.`, a: DS_OPTS[2], d: [DS_OPTS[0], DS_OPTS[1], DS_OPTS[3]], e: `Together: A + (A - ${d}) = ${s * 2 + d} → A = ${s + d}.` }; },
  ],
  hard: [
    (r) => { const s = int(r, 10, 40); return { q: `What is the value of x? I. x + y = ${s}. II. 3x + 3y = ${3 * s}.`, a: DS_OPTS[3], d: DS_OPTS.slice(0, 3), e: `II is just I multiplied by 3, so together they are still one equation in two unknowns.` }; },
    (r) => { const L = int(r, 10, 30) * 10, v = int(r, 10, 30); const t1 = L / v; if (!Number.isInteger(t1)) return null; const P = int(r, 10, 30) * 10; return { q: `What is the length of the train? I. It crosses a pole in ${t1} seconds. II. It crosses a ${P} m platform in ${(L + P) / v} seconds.`, a: DS_OPTS[2], d: [DS_OPTS[0], DS_OPTS[1], DS_OPTS[3]], e: `Together: L = ${t1}v and L + ${P} = ${(L + P) / v}v → v = ${v} m/s, L = ${L} m. Alone, each has two unknowns.` }; },
    (r) => { const n = int(r, 4, 30); return { q: `Is ${n % 2 ? 'N' : 'M'} divisible by 6? I. It is divisible by 3. II. It is divisible by 2.`, a: DS_OPTS[2], d: [DS_OPTS[0], DS_OPTS[1], DS_OPTS[3]], e: `Divisible by both 2 and 3 ⇒ divisible by 6. Either alone is not enough.` }; },
  ],
};

function build() {
  const seating = { easy: [(r) => arrangementQuestion(r, 4, 'row')], medium: [(r) => arrangementQuestion(r, 5, 'row'), (r) => circularQuestion(r, 5)], hard: [(r) => arrangementQuestion(r, 6, 'row'), (r) => circularQuestion(r, 6)] };
  const puzzles = { easy: [(r) => arrangementQuestion(r, 4, 'floor')], medium: [(r) => arrangementQuestion(r, 5, 'floor')], hard: [(r) => arrangementQuestion(r, 6, 'floor')] };
  const syl = { easy: [syllogism('easy')], medium: [syllogism('medium')], hard: [syllogism('hard')] };
  return [
    ...generateTopic('logical', 'seating-arrangements', seating, 15, 901),
    ...generateTopic('logical', 'puzzles', puzzles, 15, 902),
    ...generateTopic('logical', 'syllogisms', syl, 15, 903),
    ...generateTopic('logical', 'data-sufficiency', DS, 14, 904),
  ];
}
module.exports = { build };
