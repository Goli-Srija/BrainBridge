// Logical reasoning: generated questions where answers can be computed + hand-written reasoning questions.
const { int, pick, near, generateTopic, handwritten, shuffle, rng } = require('./lib');

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const L = (i) => A[((i % 26) + 26) % 26];
const pos = (c) => A.indexOf(c);

const G = {};
G['number-series'] = {
  easy: [
    (r) => { const a = int(r, 1, 30), d = int(r, 2, 15); const s = [0, 1, 2, 3, 4].map((i) => a + i * d); return { q: `Find the next term: ${s.join(', ')}, ?`, a: a + 5 * d, d: near(r, a + 5 * d), e: `Each term increases by ${d}. ${s[4]} + ${d} = ${a + 5 * d}.` }; },
    (r) => { const a = int(r, 1, 6), m = pick(r, [2, 3]); const s = [0, 1, 2, 3, 4].map((i) => a * m ** i); return { q: `Find the next term: ${s.join(', ')}, ?`, a: a * m ** 5, d: [a * m ** 5 + m, a * m ** 4 * (m + 1), a * m ** 5 - a, s[4] * 2 + 1], e: `Each term is multiplied by ${m}. ${s[4]} × ${m} = ${a * m ** 5}.` }; },
    (r) => { const st = int(r, 1, 8), k = int(r, 0, 3); const s = [0, 1, 2, 3, 4].map((i) => (st + i) ** 2 + k); return { q: `Find the next term: ${s.join(', ')}, ?`, a: (st + 5) ** 2 + k, d: near(r, (st + 5) ** 2 + k), e: `Terms are n² ${k ? `+ ${k} ` : ''}for n = ${st}, ${st + 1}, ... Next: ${st + 5}² ${k ? `+ ${k} ` : ''}= ${(st + 5) ** 2 + k}.` }; },
  ],
  medium: [
    (r) => { const a = int(r, 2, 20), d = int(r, 1, 6), k = int(r, 1, 4); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + d + (i - 1) * k); return { q: `Find the next term: ${s.slice(0, 5).join(', ')}, ?`, a: s[5], d: near(r, s[5]), e: `Differences are ${d}, ${d + k}, ${d + 2 * k}, ${d + 3 * k} (increasing by ${k}). Next difference ${d + 4 * k}: ${s[4]} + ${d + 4 * k} = ${s[5]}.` }; },
    (r) => { const a = int(r, 1, 6), m = pick(r, [2, 3]), c = int(r, 1, 4) * pick(r, [1, -1]); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * m + c); if (s.some((x) => x <= 0)) return null; return { q: `Find the next term: ${s.slice(0, 5).join(', ')}, ?`, a: s[5], d: near(r, s[5]), e: `Rule: next = previous × ${m} ${c > 0 ? '+' : '-'} ${Math.abs(c)}. ${s[4]} × ${m} ${c > 0 ? '+' : '-'} ${Math.abs(c)} = ${s[5]}.` }; },
    (r) => { const st = int(r, 1, 5); const s = [0, 1, 2, 3, 4].map((i) => (st + i) ** 3); return { q: `Find the next term: ${s.join(', ')}, ?`, a: (st + 5) ** 3, d: near(r, (st + 5) ** 3), e: `Cubes of consecutive numbers: next is ${st + 5}³ = ${(st + 5) ** 3}.` }; },
    (r) => { const a = int(r, 1, 5), b = int(r, 1, 5); const s = [a, b]; for (let i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2]); return { q: `Find the next term: ${s.slice(0, 6).join(', ')}, ?`, a: s[6], d: near(r, s[6]), e: `Each term is the sum of the previous two: ${s[4]} + ${s[5]} = ${s[6]}.` }; },
  ],
  hard: [
    (r) => { const a = int(r, 2, 10), d1 = int(r, 2, 5), b = int(r, 20, 40), d2 = int(r, 2, 6); const s = []; for (let i = 0; i < 4; i++) { s.push(a + i * d1); s.push(b - i * d2); } return { q: `Find the next term: ${s.slice(0, 7).join(', ')}, ?`, a: s[7], d: near(r, s[7]).concat([String(s[6] + d1)]), e: `Two interleaved series: ${s.filter((_, i) => i % 2 === 0).join(', ')} (+${d1}) and ${s.filter((_, i) => i % 2 === 1).join(', ')} (-${d2}). Next term is ${s[7]}.` }; },
    (r) => { const st = int(r, 2, 6); const s = [0, 1, 2, 3, 4].map((i) => (st + i) ** 3 - (st + i)); return { q: `Find the next term: ${s.join(', ')}, ?`, a: (st + 5) ** 3 - (st + 5), d: near(r, (st + 5) ** 3 - (st + 5)), e: `Terms are n³ - n for n = ${st}...${st + 4}. Next: ${st + 5}³ - ${st + 5} = ${(st + 5) ** 3 - (st + 5)}.` }; },
    (r) => { const a = int(r, 1, 5); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * (i + 1)); return { q: `Find the next term: ${s.slice(0, 5).join(', ')}, ?`, a: s[5], d: near(r, s[5]), e: `Multiply by 2, 3, 4, 5, then 6: ${s[4]} × 6 = ${s[5]}.` }; },
    (r) => { const a = int(r, 10, 40), d = int(r, 2, 6); const s = [0, 1, 2, 3, 4, 5].map((i) => a + i * d); const wrongIdx = int(r, 1, 4); const shown = [...s]; shown[wrongIdx] += pick(r, [1, 2, -1]); return { q: `Find the wrong term in the series: ${shown.join(', ')}`, a: shown[wrongIdx], d: shown.filter((_, i) => i !== wrongIdx).slice(0, 4), e: `The series should increase by ${d}: ${s.join(', ')}. ${shown[wrongIdx]} should be ${s[wrongIdx]}.` }; },
  ],
};

G['alphabet-series'] = {
  easy: [
    (r) => { const s = int(r, 0, 10), d = int(r, 2, 4); const seq = [0, 1, 2, 3].map((i) => L(s + i * d)); return { q: `Find the next letter: ${seq.join(', ')}, ?`, a: L(s + 4 * d), d: [L(s + 4 * d + 1), L(s + 4 * d - 1), L(s + 5 * d), L(s + 3 * d + 2)], e: `Each letter moves ${d} places forward. ${seq[3]} + ${d} = ${L(s + 4 * d)}.` }; },
    (r) => { const s = int(r, 0, 5); const seq = [0, 1, 2].map((i) => L(s + i) + L(25 - s - i)); return { q: `Find the next term: ${seq.join(', ')}, ?`, a: L(s + 3) + L(22 - s), d: [L(s + 3) + L(23 - s), L(s + 4) + L(22 - s), L(s + 2) + L(21 - s), L(22 - s) + L(s + 3)], e: `First letters move forward (${seq.map((x) => x[0]).join(', ')}), second letters move backward from Z (${seq.map((x) => x[1]).join(', ')}). Next = ${L(s + 3)}${L(22 - s)}.` }; },
  ],
  medium: [
    (r) => { const s = int(r, 0, 6); let p = s; const seq = [L(p)]; for (let i = 1; i <= 4; i++) { p += i; seq.push(L(p)); } return { q: `Find the next letter: ${seq.join(', ')}, ?`, a: L(p + 5), d: [L(p + 4), L(p + 6), L(p + 3), L(p + 7)], e: `Gaps increase by one: +1, +2, +3, +4, so next is +5 → ${L(p + 5)}.` }; },
    (r) => { const s = int(r, 0, 8), d = int(r, 1, 3); const grp = (i) => L(s + i * 3 * d) + L(s + i * 3 * d + d) + L(s + i * 3 * d + 2 * d); return { q: `Find the next group: ${grp(0)}, ${grp(1)}, ${grp(2)}, ?`, a: grp(3), d: [grp(3).split('').reverse().join(''), L(s + 9 * d + 1) + L(s + 9 * d + d + 1) + L(s + 9 * d + 2 * d + 1), grp(4), L(s + 9 * d) + L(s + 9 * d + d) + L(s + 9 * d + 2 * d + 1)], e: `Each group continues the alphabet with step ${d}. Next group: ${grp(3)}.` }; },
  ],
  hard: [
    (r) => { const a = int(r, 0, 8), b = int(r, 14, 20); const seq = []; for (let i = 0; i < 3; i++) seq.push(L(a + 2 * i) + L(b - 3 * i) + (i + 1) * 2); return { q: `Find the next term: ${seq.join(', ')}, ?`, a: L(a + 6) + L(b - 9) + 8, d: [L(a + 6) + L(b - 8) + 8, L(a + 7) + L(b - 9) + 8, L(a + 6) + L(b - 9) + 6, L(a + 8) + L(b - 9) + 10], e: `First letter +2, second letter -3, number +2. Next: ${L(a + 6)}${L(b - 9)}8.` }; },
    (r) => { const s = int(r, 1, 6); const seq = [0, 1, 2, 3].map((i) => L((s + i) ** 2 % 26 - 1)); void seq; const word = [0, 1, 2, 3].map((i) => L(s * (i + 1) - 1)); return { q: `Find the next letter: ${word.join(', ')}, ? (letters are at positions that are multiples of ${s})`, a: L(s * 5 - 1), d: [L(s * 5), L(s * 5 - 2), L(s * 6 - 1), L(s * 4)], e: `Positions ${[1, 2, 3, 4].map((i) => s * i).join(', ')} → next position ${s * 5} = ${L(s * 5 - 1)}.` }; },
  ],
};

G['coding-and-decoding'] = (() => {
  const words = ['CAT', 'DOG', 'MILK', 'BOOK', 'PEN', 'TREE', 'FISH', 'LAMP', 'ROAD', 'KING', 'GOLD', 'SALT', 'BIRD', 'COLD', 'FARM', 'HELP', 'JUMP', 'NEST', 'PLAY', 'RAIN', 'SHIP', 'WIND', 'TEAM', 'CODE', 'DATA', 'GAME', 'MIND', 'WORK'];
  const shift = (w, k) => w.split('').map((c) => L(pos(c) + k)).join('');
  return {
    easy: [
      (r) => { const k = pick(r, [1, 2, 3, -1]); const [w1, w2] = shuffle(r, words).slice(0, 2); return { q: `If ${w1} is coded as ${shift(w1, k)}, how is ${w2} coded?`, a: shift(w2, k), d: [shift(w2, k + 1), shift(w2, -k), shift(w2, k).split('').reverse().join(''), shift(w2, k - 1 || 2)], e: `Each letter is shifted ${Math.abs(k)} place(s) ${k > 0 ? 'forward' : 'backward'}. ${w2} → ${shift(w2, k)}.` }; },
      (r) => { const [w1, w2] = shuffle(r, words).slice(0, 2); const rev = (w) => w.split('').reverse().join(''); if (rev(w2) === w2) return null; return { q: `If ${w1} is written as ${rev(w1)}, how is ${w2} written?`, a: rev(w2), d: [shift(w2, 1), w2, shift(rev(w2), 1), rev(shift(w2, -1))], e: `The letters are written in reverse order: ${w2} → ${rev(w2)}.` }; },
    ],
    medium: [
      (r) => { const [w1, w2] = shuffle(r, words).slice(0, 2); const sum = (w) => w.split('').reduce((s, c) => s + pos(c) + 1, 0); return { q: `If ${w1} = ${sum(w1)} (A = 1, B = 2, ...), what is ${w2}?`, a: sum(w2), d: near(r, sum(w2)), e: `Add the alphabet positions: ${w2.split('').map((c) => `${c}=${pos(c) + 1}`).join(', ')} → ${sum(w2)}.` }; },
      (r) => { const [w1, w2] = shuffle(r, words).slice(0, 2); const alt = (w) => w.split('').map((c, i) => L(pos(c) + (i % 2 === 0 ? 1 : -1))).join(''); return { q: `If ${w1} is coded as ${alt(w1)}, how is ${w2} coded?`, a: alt(w2), d: [shift(w2, 1), shift(w2, -1), w2.split('').map((c, i) => L(pos(c) + (i % 2 === 0 ? -1 : 1))).join(''), alt(w2).split('').reverse().join('')], e: `Letters in odd positions move +1, letters in even positions move -1. ${w2} → ${alt(w2)}.` }; },
    ],
    hard: [
      (r) => { const [w1, w2] = shuffle(r, words).slice(0, 2); const opp = (w) => w.split('').map((c) => L(25 - pos(c))).join(''); return { q: `In a code language, ${w1} is written as ${opp(w1)}. How is ${w2} written?`, a: opp(w2), d: [shift(w2, 13), opp(w2).split('').reverse().join(''), shift(opp(w2), 1), shift(w2, -2)], e: `Each letter is replaced by its opposite (A↔Z, B↔Y, ...): ${w2} → ${opp(w2)}.` }; },
      (r) => { const [w1, w2] = shuffle(r, words).slice(0, 2); const f = (w) => w.split('').map((c, i) => L(pos(c) + i + 1)).join(''); return { q: `If ${w1} is coded as ${f(w1)}, how is ${w2} coded?`, a: f(w2), d: [shift(w2, 1), shift(w2, 2), w2.split('').map((c, i) => L(pos(c) + i)).join(''), f(w2).split('').reverse().join('')], e: `The 1st letter moves +1, 2nd +2, 3rd +3, and so on. ${w2} → ${f(w2)}.` }; },
      (r) => { const [w1, w2] = shuffle(r, words).slice(0, 2); const f = (w) => w.split('').map((c) => (pos(c) + 1) * 2).join('-'); return { q: `If ${w1} is coded as ${f(w1)}, what is the code for ${w2}?`, a: f(w2), d: [w2.split('').map((c) => pos(c) + 2).join('-'), w2.split('').map((c) => (pos(c) + 1) * 3).join('-'), w2.split('').map((c) => (pos(c) + 1) * 2 + 1).join('-'), f(w2).split('-').reverse().join('-')], e: `Each letter's position is doubled: ${w2.split('').map((c) => `${c}(${pos(c) + 1})→${(pos(c) + 1) * 2}`).join(', ')}.` }; },
    ],
  };
})();

const DIRS8 = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
const dirName = (dx, dy) => {
  if (dx === 0 && dy === 0) return 'starting point';
  const ns = dy > 0 ? 'North' : dy < 0 ? 'South' : '';
  const ew = dx > 0 ? 'East' : dx < 0 ? 'West' : '';
  return ns && ew ? `${ns}-${ew}` : ns || ew;
};
G['direction-sense'] = {
  easy: [
    (r) => { const s = pick(r, [0, 2, 4, 6]); const turns = [pick(r, ['right', 'left']), pick(r, ['right', 'left'])]; let d = s; turns.forEach((t) => { d = (d + (t === 'right' ? 2 : -2) + 8) % 8; }); return { q: `Ravi is facing ${DIRS8[s]}. He turns ${turns[0]}, then turns ${turns[1]}. Which direction is he facing now?`, a: DIRS8[d], d: [0, 2, 4, 6].map((i) => DIRS8[i]).filter((x) => x !== DIRS8[d]), e: `Each right turn = 90° clockwise, left = 90° anticlockwise. ${DIRS8[s]} → ${DIRS8[(s + (turns[0] === 'right' ? 2 : -2) + 8) % 8]} → ${DIRS8[d]}.` }; },
    (r) => { const a = int(r, 2, 15) * 5, b = int(r, 2, 15) * 5; if (a === b) return null; return { q: `Meena walks ${a} m North, then turns back and walks ${b} m. How far is she from the starting point?`, a: `${Math.abs(a - b)} m`, d: [`${a + b} m`, `${Math.abs(a - b) + 5} m`, `${a} m`, `${b} m`], e: `Both movements are on the same line in opposite directions: |${a} - ${b}| = ${Math.abs(a - b)} m.` }; },
  ],
  medium: [
    (r) => { const k = int(r, 1, 6); const [p, q2] = pick(r, [[3, 4], [6, 8], [5, 12], [8, 6], [4, 3]]); const a = p * k, b = q2 * k; const sy = pick(r, [1, -1]), sx = pick(r, [1, -1]); const dist = Math.round(Math.hypot(a, b)); const first = sy > 0 ? 'North' : 'South'; const turn = (sy > 0 && sx > 0) || (sy < 0 && sx < 0) ? 'right' : 'left'; return { q: `A man walks ${a} m ${first}, then turns ${turn} and walks ${b} m. How far is he from the starting point?`, a: `${dist} m`, d: [`${a + b} m`, `${Math.abs(a - b)} m`, `${dist + 5} m`, `${dist - 2} m`], e: `The two walks are perpendicular: √(${a}² + ${b}²) = ${dist} m.` }; },
    (r) => { const s = int(r, 0, 7); const turns = [[pick(r, [45, 90, 135]), pick(r, ['clockwise', 'anticlockwise'])], [pick(r, [45, 90, 135, 180]), pick(r, ['clockwise', 'anticlockwise'])]]; let d = s; turns.forEach(([deg, w]) => { d = (d + (w === 'clockwise' ? 1 : -1) * (deg / 45) + 16) % 8; }); return { q: `A person facing ${DIRS8[s]} turns ${turns[0][0]}° ${turns[0][1]} and then ${turns[1][0]}° ${turns[1][1]}. Which direction is he facing now?`, a: DIRS8[d], d: DIRS8.filter((x) => x !== DIRS8[d]).slice(0, 7), e: `Net rotation = ${turns.map(([deg, w]) => (w === 'clockwise' ? '+' : '-') + deg).join(' ')}° from ${DIRS8[s]} gives ${DIRS8[d]}.` }; },
  ],
  hard: [
    (r) => { const steps = int(r, 3, 4); let dir = 0, x = 0, y = 0; const parts = []; const vec = [[0, 1], [1, 0], [0, -1], [-1, 0]]; for (let i = 0; i < steps; i++) { const m = int(r, 1, 8) * 5; if (i > 0) { const t = pick(r, ['right', 'left']); dir = (dir + (t === 'right' ? 1 : 3)) % 4; parts.push(`turns ${t} and walks ${m} m`); } else parts.push(`walks ${m} m North`); x += vec[dir][0] * m; y += vec[dir][1] * m; } if (x !== 0 && y !== 0 && !Number.isInteger(Math.hypot(x, y))) { const ans = dirName(x, y); return { q: `Starting from point P, Sunil ${parts.join(', then ')}. In which direction is he from P?`, a: ans, d: DIRS8.filter((d2) => d2 !== ans), e: `Net displacement: ${Math.abs(x)} m ${x >= 0 ? 'East' : 'West'} and ${Math.abs(y)} m ${y >= 0 ? 'North' : 'South'} → ${ans} of P.` }; } const dist = Math.hypot(x, y); if (dist === 0) return null; const ans = `${dist} m ${dirName(x, y)}`; return { q: `Starting from point P, Sunil ${parts.join(', then ')}. How far and in which direction is he from P?`, a: ans, d: [`${dist} m ${dirName(-x, -y)}`, `${dist + 5} m ${dirName(x, y)}`, `${Math.abs(x) + Math.abs(y)} m ${dirName(x, y)}`, `${dist} m ${dirName(y, x) || 'North'}`], e: `Net displacement: ${Math.abs(x)} m ${x >= 0 ? 'East' : 'West'}, ${Math.abs(y)} m ${y >= 0 ? 'North' : 'South'} → ${ans}.` }; },
  ],
};

G['order-and-ranking'] = {
  easy: [
    (r) => { const k = int(r, 3, 25), m = int(r, 3, 25); return { q: `In a row of students, Anu is ${k}th from the left and ${m}th from the right. How many students are there in the row?`, a: k + m - 1, d: [k + m, k + m + 1, k + m - 2, Math.abs(k - m) + 1].map(String), e: `Total = left position + right position - 1 = ${k} + ${m} - 1 = ${k + m - 1}.` }; },
    (r) => { const n = int(r, 20, 60), k = int(r, 3, n - 3); return { q: `In a class of ${n} students, Rahul's rank is ${k} from the top. What is his rank from the bottom?`, a: n - k + 1, d: [n - k, n - k + 2, k, n - k - 1].map(String), e: `Rank from bottom = total - rank from top + 1 = ${n} - ${k} + 1 = ${n - k + 1}.` }; },
  ],
  medium: [
    (r) => { const n = int(r, 30, 70), k = int(r, 5, 20), m = int(r, 5, 20); if (k + m >= n) return null; return { q: `In a row of ${n} people, A is ${k}th from the left and B is ${m}th from the right. How many people are between A and B?`, a: n - k - m, d: [n - k - m + 1, n - k - m - 1, n - k - m + 2, k + m].map(String), e: `People between = ${n} - ${k} - ${m} = ${n - k - m} (A and B do not overlap).` }; },
    (r) => { const a = int(r, 5, 15), b = int(r, 5, 15), sw = int(r, 3, 10); return { q: `A is ${a}th from the left in a row. After swapping places with B, A becomes ${a + sw}th from the left. B was ${b}th from the right before the swap. How many people are in the row?`, a: a + sw + b - 1, d: [a + b - 1, a + sw + b, a + sw + b - 2, a + b + sw + 1].map(String), e: `After swapping, A is at B's old position: ${a + sw}th from left and ${b}th from right. Total = ${a + sw} + ${b} - 1 = ${a + sw + b - 1}.` }; },
  ],
  hard: [
    (r) => { const names = shuffle(r, ['P', 'Q', 'R', 'S', 'T']); const facts = []; for (let i = 0; i < 4; i++) facts.push(`${names[i]} is taller than ${names[i + 1]}`); const shown = shuffle(r, facts); const ask = pick(r, [['tallest', names[0]], ['shortest', names[4]], ['third tallest', names[2]], ['second shortest', names[3]]]); return { q: `${shown.join('. ')}. Who is the ${ask[0]}?`, a: ask[1], d: names.filter((n) => n !== ask[1]), e: `Order from tallest: ${names.join(' > ')}. The ${ask[0]} is ${ask[1]}.` }; },
  ],
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
G['calendars'] = {
  easy: [
    (r) => { const d = pick(r, [0, 1, 2, 3, 4, 5, 6]), n = int(r, 8, 100); return { q: `If today is ${DAYS[d]}, what day will it be after ${n} days?`, a: DAYS[(d + n) % 7], d: DAYS.filter((x) => x !== DAYS[(d + n) % 7]), e: `${n} mod 7 = ${n % 7} odd days. ${DAYS[d]} + ${n % 7} = ${DAYS[(d + n) % 7]}.` }; },
    (r) => { const y = int(r, 1990, 2040); const leap = isLeap(y); return { q: `Is ${y} a leap year, and how many days does it have?`, a: leap ? 'Yes, 366 days' : 'No, 365 days', d: [leap ? 'No, 365 days' : 'Yes, 366 days', 'Yes, 365 days', 'No, 366 days'], e: `${y} ${leap ? 'is' : 'is not'} divisible by 4${y % 100 === 0 ? ' (century years must be divisible by 400)' : ''}, so it ${leap ? 'is' : 'is not'} a leap year.` }; },
  ],
  medium: [
    (r) => { const y = int(r, 1995, 2035); const d = new Date(Date.UTC(y, 0, 1)).getUTCDay(); const n = new Date(Date.UTC(y + 1, 0, 1)).getUTCDay(); return { q: `1 January ${y} was a ${DAYS[d]}. What day of the week was 1 January ${y + 1}?`, a: DAYS[n], d: DAYS.filter((x) => x !== DAYS[n]), e: `${y} has ${isLeap(y) ? '366 days = 2 odd days' : '365 days = 1 odd day'}. ${DAYS[d]} + ${isLeap(y) ? 2 : 1} = ${DAYS[n]}.` }; },
    (r) => { const m = int(r, 0, 11), y = int(r, 2000, 2030), dd = int(r, 1, 28); const day = new Date(Date.UTC(y, m, dd)).getUTCDay(); const first = new Date(Date.UTC(y, m, 1)).getUTCDay(); return { q: `If 1 ${MONTHS[m]} ${y} is a ${DAYS[first]}, what day is ${dd} ${MONTHS[m]} ${y}?`, a: DAYS[day], d: DAYS.filter((x) => x !== DAYS[day]), e: `${dd - 1} days after the 1st: (${dd - 1}) mod 7 = ${(dd - 1) % 7}. ${DAYS[first]} + ${(dd - 1) % 7} = ${DAYS[day]}.` }; },
  ],
  hard: [
    (r) => { const y = int(r, 1950, 2030), m = int(r, 0, 11), dd = int(r, 1, 28); const day = new Date(Date.UTC(y, m, dd)).getUTCDay(); return { q: `What day of the week was ${dd} ${MONTHS[m]} ${y}?`, a: DAYS[day], d: DAYS.filter((x) => x !== DAYS[day]), e: `Count odd days: years before ${y}, months before ${MONTHS[m]}, then ${dd} days. Total odd days mod 7 = ${day} → ${DAYS[day]} (0 = Sunday).` }; },
    (r) => { const y = int(r, 2001, 2040); let k = y + 1; const d0 = new Date(Date.UTC(y, 0, 1)).getUTCDay(); while (!(new Date(Date.UTC(k, 0, 1)).getUTCDay() === d0 && isLeap(k) === isLeap(y))) k++; return { q: `The calendar of the year ${y} can be used again in which year?`, a: String(k), d: [k + 1, k - 1, y + 7, y + 11, y + 6].filter((x) => x !== k).map(String), e: `We need a year starting on the same day (${DAYS[d0]}) with the same leap status. Counting odd days forward, the first such year is ${k}.` }; },
  ],
};

const clockAngle = (h, m) => { const a = Math.abs(30 * (h % 12) - 5.5 * m); return Math.min(a, 360 - a); };
G['clocks'] = {
  easy: [
    (r) => { const h = int(r, 1, 12); return { q: `What is the angle between the hands of a clock at ${h}:00?`, a: `${clockAngle(h, 0)}°`, d: [`${(h * 30) % 360 === clockAngle(h, 0) ? 360 - clockAngle(h, 0) : h * 30}°`, `${clockAngle(h, 0) + 15}°`, `${h * 6}°`, `${Math.abs(clockAngle(h, 0) - 30)}°`], e: `Each hour mark is 30°. At ${h}:00 the angle is ${clockAngle(h, 0)}°.` }; },
  ],
  medium: [
    (r) => { const h = int(r, 1, 11), m = pick(r, [10, 15, 20, 25, 30, 35, 40, 45, 50]); const ang = clockAngle(h, m); return { q: `What is the angle between the hour and minute hands at ${h}:${String(m).padStart(2, '0')}?`, a: `${ang}°`, d: [`${Math.abs(30 * h - 6 * m)}°`, `${ang + 5}°`, `${Math.abs(ang - 7.5)}°`, `${360 - ang}°`].filter((x) => x !== `${ang}°`), e: `Angle = |30H - 5.5M| = |30×${h} - 5.5×${m}| = ${Math.abs(30 * h - 5.5 * m)}°${ang !== Math.abs(30 * h - 5.5 * m) ? `; the smaller angle is ${ang}°` : ''}.` }; },
  ],
  hard: [
    (r) => { const h = int(r, 1, 10); const num = 60 * h; const w = Math.floor(num / 11), f = num % 11; return { q: `At what time between ${h} and ${h + 1} o'clock will the hands of a clock coincide?`, a: `${w} ${f}/11 minutes past ${h}`, d: [`${5 * h} minutes past ${h}`, `${w + 1} ${f}/11 minutes past ${h}`, `${w} ${(f + 3) % 11 || 1}/11 minutes past ${h}`, `${Math.floor((60 * h + 30) / 11)} minutes past ${h}`], e: `Hands coincide at 60H/11 = ${num}/11 = ${w} ${f}/11 minutes past ${h}.` }; },
    (r) => { const h = int(r, 1, 10); const num = 60 * h + 180; const ans = num / 11; if (ans >= 60) return null; const w = Math.floor(ans), f = num % 11; return { q: `At what time between ${h} and ${h + 1} o'clock are the hands of a clock at right angles for the first time after ${h}:00?`, a: `${w} ${f}/11 minutes past ${h}`, d: [`${5 * h + 15} minutes past ${h}`, `${w + 2} ${f}/11 minutes past ${h}`, `${Math.floor((60 * h) / 11)} minutes past ${h}`, `${w} ${(f + 4) % 11 || 2}/11 minutes past ${h}`], e: `Use 5.5M = 30H ± 90. First time: M = (30×${h} - 90)/5.5 if positive, otherwise (30×${h} + 90)/5.5. Here the valid first time is ${w} ${f}/11 minutes.` }; },
  ],
};
// Correct the "first right angle" generator: compute properly instead of assuming the + case.
G['clocks'].hard[1] = (r) => {
  const h = int(r, 1, 10);
  const cands = [(60 * h - 180) / 11, (60 * h + 180) / 11].filter((m) => m >= 0 && m < 60).sort((a, b) => a - b);
  if (!cands.length) return null;
  const m = cands[0]; const num = Math.round(m * 11); const w = Math.floor(num / 11), f = num % 11;
  const ans = f ? `${w} ${f}/11 minutes past ${h}` : `${w} minutes past ${h}`;
  return { q: `At what time between ${h} and ${h + 1} o'clock are the hands of a clock at right angles for the first time?`, a: ans, d: [`${5 * h + 15} minutes past ${h}`, `${w + 2} ${f || 5}/11 minutes past ${h}`, `${Math.floor((60 * h) / 11)} minutes past ${h}`, `${w + 1} minutes past ${h}`], e: `Right angle when |30H - 5.5M| = 90 → M = (60H ± 180)/11. For H = ${h} the smallest valid value is ${ans.replace(` past ${h}`, '')}.` };
};

G['analogies'] = {
  easy: [
    (r) => { const a = int(r, 2, 12), b = int(r, 2, 15); if (a === b) return null; return { q: `${a} : ${a * a} :: ${b} : ?`, a: b * b, d: [b * b + 1, b * 2, b ** 3, b * b - b].map(String), e: `Second number is the square of the first: ${b}² = ${b * b}.` }; },
    (r) => { const a = int(r, 2, 9), b = int(r, 2, 9); if (a === b) return null; return { q: `${a} : ${a ** 3} :: ${b} : ?`, a: b ** 3, d: [b * b, b ** 3 + b, b ** 3 - 1, b * 3].map(String), e: `Second number is the cube of the first: ${b}³ = ${b ** 3}.` }; },
  ],
  medium: [
    (r) => { const k = int(r, 1, 4); const a = int(r, 0, 10), b = int(r, 0, 15); const p = (s) => L(s) + L(s + k) + L(s + 2 * k); const q2 = (s) => L(s + 3) + L(s + k + 3) + L(s + 2 * k + 3); return { q: `${p(a)} : ${q2(a)} :: ${p(b)} : ?`, a: q2(b), d: [L(b + 2) + L(b + k + 2) + L(b + 2 * k + 2), L(b + 3) + L(b + k + 4) + L(b + 2 * k + 3), q2(b).split('').reverse().join(''), L(b + 4) + L(b + k + 4) + L(b + 2 * k + 4)], e: `Each letter moves 3 places forward: ${p(b)} → ${q2(b)}.` }; },
    (r) => { const a = int(r, 3, 15), b = int(r, 3, 15); const m = pick(r, [2, 3]), c = pick(r, [1, 2, 3]); if (a === b) return null; return { q: `${a} : ${a * m + c} :: ${b} : ?`, a: b * m + c, d: [b * m, b * m + c + 1, b * m - c, b + m + c].map(String), e: `Rule: second = first × ${m} + ${c}. ${b} × ${m} + ${c} = ${b * m + c}.` }; },
  ],
  hard: [
    (r) => { const a = int(r, 2, 9), b = int(r, 2, 9); if (a === b) return null; return { q: `${a} : ${a * a + a} :: ${b} : ?`, a: b * b + b, d: [b * b, b * b - b, b * b + 1, (b + 1) * (b + 2)].map(String), e: `Rule: n² + n. ${b}² + ${b} = ${b * b + b}.` }; },
    (r) => { const w1 = pick(r, ['MOTHER', 'GARDEN', 'PLANET', 'SILVER', 'BRIDGE']), w2 = pick(r, ['FOREST', 'WINDOW', 'MARKET', 'POCKET', 'CASTLE']); const rev = (w) => w.slice(0, 3).split('').reverse().join('') + w.slice(3).split('').reverse().join(''); return { q: `${w1} : ${rev(w1)} :: ${w2} : ?`, a: rev(w2), d: [w2.split('').reverse().join(''), w2.slice(3) + w2.slice(0, 3), rev(w2).split('').reverse().join(''), w2.slice(0, 3).split('').reverse().join('') + w2.slice(3)], e: `Each half of the word is reversed separately: ${w2.slice(0, 3)}|${w2.slice(3)} → ${rev(w2)}.` }; },
  ],
};

const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const comps = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95];
G['classification'] = {
  easy: [
    (r) => { const ps = shuffle(r, primes.filter((p) => p > 10)).slice(0, 3); const c = pick(r, comps); return { q: `Find the odd one out: ${shuffle(r, [...ps, c]).join(', ')}`, a: c, d: ps.map(String), e: `${ps.join(', ')} are prime; ${c} is not (${c} has factors other than 1 and itself).` }; },
    (r) => { const sq = shuffle(r, [16, 25, 36, 49, 64, 81, 100, 121, 144, 169]).slice(0, 3); const x = pick(r, [18, 27, 50, 63, 80, 99, 120, 150]); return { q: `Find the odd one out: ${shuffle(r, [...sq, x]).join(', ')}`, a: x, d: sq.map(String), e: `${sq.join(', ')} are perfect squares; ${x} is not.` }; },
  ],
  medium: [
    (r) => { const k = pick(r, [6, 7, 8, 9, 11, 13]); const ms = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).map((x) => x * k); let o = ms[0] + int(r, 1, k - 1); return { q: `Find the odd one out: ${shuffle(r, [...ms, o]).join(', ')}`, a: o, d: ms.map(String), e: `${ms.join(', ')} are multiples of ${k}; ${o} is not.` }; },
    (r) => { const k = int(r, 1, 4); const pairs = shuffle(r, [0, 3, 6, 9, 12, 15, 18]).slice(0, 3).map((s) => L(s) + L(s + k)); const odd = (() => { const s = pick(r, [1, 4, 7, 10, 20]); return L(s) + L(s + k + 1); })(); return { q: `Find the odd one out: ${shuffle(r, [...pairs, odd]).join(', ')}`, a: odd, d: pairs, e: `In ${pairs.join(', ')} the second letter is ${k} place(s) after the first. In ${odd} the gap is ${k + 1}.` }; },
  ],
  hard: [
    (r) => { const nums = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).map((n) => `${n}-${n ** 2}`); const n = int(r, 3, 9); const odd = `${n}-${n ** 2 + 1}`; return { q: `Find the odd pair: ${shuffle(r, [...nums, odd]).join(', ')}`, a: odd, d: nums, e: `In ${nums.join(', ')} the second number is the square of the first. ${odd} breaks the rule.` }; },
  ],
};

// ---------------- hand-written questions ----------------
const HW = {};
HW['analogies'] = [
  ['Doctor : Hospital :: Teacher : ?', ['School', 'Book', 'Student', 'Library'], 0, 'A doctor works in a hospital; a teacher works in a school (worker : workplace).', 'easy'],
  ['Pen : Write :: Knife : ?', ['Cut', 'Sharp', 'Steel', 'Kitchen'], 0, 'Tool : its function.', 'easy'],
  ['Bird : Flock :: Fish : ?', ['School', 'Herd', 'Pack', 'Swarm'], 0, 'A group of fish is called a school.', 'medium'],
  ['Thermometer : Temperature :: Barometer : ?', ['Pressure', 'Humidity', 'Wind', 'Rain'], 0, 'Instrument : what it measures.', 'medium'],
  ['Cub : Lion :: Calf : ?', ['Cow', 'Goat', 'Horse', 'Dog'], 0, 'Young one : adult animal.', 'easy'],
  ['Compiler : Source code :: Translator : ?', ['Language', 'Speech', 'Book', 'Dictionary'], 0, 'A compiler converts source code; a translator converts language.', 'hard'],
  ['Sculptor : Statue :: Architect : ?', ['Blueprint', 'Building', 'Brick', 'Cement'], 1, 'Creator : creation. An architect designs buildings.', 'medium'],
  ['Drought : Water :: Famine : ?', ['Food', 'Rain', 'Death', 'Crop'], 0, 'Drought is a lack of water; famine is a lack of food.', 'hard'],
];
HW['classification'] = [
  ['Find the odd one out: Java, Python, Oracle, C++', ['Oracle', 'Java', 'Python', 'C++'], 0, 'Java, Python and C++ are programming languages; Oracle is a database/company.', 'easy'],
  ['Find the odd one out: Mercury, Venus, Moon, Mars', ['Moon', 'Mercury', 'Venus', 'Mars'], 0, 'The Moon is a satellite; the others are planets.', 'easy'],
  ['Find the odd one out: Keyboard, Mouse, Monitor, Scanner', ['Monitor', 'Keyboard', 'Mouse', 'Scanner'], 0, 'Monitor is an output device; the others are input devices.', 'medium'],
  ['Find the odd one out: TCP, UDP, HTTP, RAM', ['RAM', 'TCP', 'UDP', 'HTTP'], 0, 'RAM is hardware memory; the rest are network protocols.', 'medium'],
  ['Find the odd one out: Stack, Queue, Linked List, Compiler', ['Compiler', 'Stack', 'Queue', 'Linked List'], 0, 'Compiler is a program; the others are data structures.', 'easy'],
  ['Find the odd one out: Rose, Lotus, Jasmine, Mango', ['Mango', 'Rose', 'Lotus', 'Jasmine'], 0, 'Mango is a fruit; the others are flowers.', 'easy'],
  ['Find the odd one out: Ruby, Sapphire, Emerald, Granite', ['Granite', 'Ruby', 'Sapphire', 'Emerald'], 0, 'Granite is a rock; the others are gemstones.', 'hard'],
];
HW['blood-relations'] = [
  ['Pointing to a man, Neha says, "He is the son of my grandfather\'s only son." How is the man related to Neha?', ['Brother', 'Cousin', 'Uncle', 'Father'], 0, 'Grandfather\'s only son is Neha\'s father; his son is Neha\'s brother.', 'easy'],
  ['A is the father of B. C is the mother of A. How is C related to B?', ['Grandmother', 'Mother', 'Aunt', 'Sister'], 0, 'C is A\'s mother and A is B\'s father, so C is B\'s grandmother.', 'easy'],
  ['P is the brother of Q. Q is the sister of R. R is the son of S. How is P related to S?', ['Son', 'Daughter', 'Brother', 'Nephew'], 0, 'P, Q and R are siblings and children of S. P is male (brother), so P is S\'s son.', 'medium'],
  ['Introducing a woman, Arun says, "Her mother is the only daughter of my mother." How is the woman related to Arun?', ['Niece', 'Sister', 'Daughter', 'Cousin'], 0, 'The only daughter of Arun\'s mother is Arun\'s sister. The woman is his sister\'s daughter, i.e. his niece.', 'medium'],
  ['If X is the husband of Y, and Z is the daughter of Y, how is X related to Z?', ['Father', 'Uncle', 'Brother', 'Grandfather'], 0, 'X is married to Y, Z is Y\'s daughter, so X is Z\'s father.', 'easy'],
  ['M is the son of N. N is the daughter of O. O is the husband of P. How is P related to M?', ['Grandmother', 'Mother', 'Aunt', 'Sister'], 0, 'N\'s parents are O and P. P is N\'s mother, so P is M\'s grandmother.', 'medium'],
  ['A + B means A is the mother of B; A - B means A is the brother of B; A × B means A is the father of B. What does P × Q - R mean?', ['P is the father of R', 'P is the brother of R', 'P is the uncle of R', 'R is the father of P'], 0, 'P is the father of Q, Q is the brother of R, so P is also the father of R.', 'hard'],
  ['Rita\'s father\'s only brother\'s wife is Rita\'s:', ['Aunt', 'Mother', 'Sister', 'Grandmother'], 0, 'Father\'s brother is uncle; his wife is aunt.', 'easy'],
  ['Kiran is the son of Mohan\'s father\'s sister. How is Kiran related to Mohan?', ['Cousin', 'Brother', 'Nephew', 'Uncle'], 0, 'Mohan\'s father\'s sister is Mohan\'s aunt; her son is Mohan\'s cousin.', 'medium'],
  ['A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. How is A related to D?', ['Granddaughter', 'Daughter', 'Grandmother', 'Niece'], 0, 'A is a daughter of C, and C is D\'s child, so A is D\'s granddaughter.', 'hard'],
  ['Looking at a photo, Ajay says, "Her father is the only son of my father." How is the girl in the photo related to Ajay?', ['Daughter', 'Sister', 'Niece', 'Cousin'], 0, 'The only son of Ajay\'s father is Ajay himself, so the girl is his daughter.', 'medium'],
];
HW['seating-arrangements'] = [
  ['Five friends A, B, C, D, E sit in a row facing north. C is in the middle. A is to the immediate left of C. E is at the right end. B is to the left of A. Who sits between C and E?', ['D', 'A', 'B', 'None'], 0, 'Order from left: B, A, C, D, E. D sits between C and E.', 'medium'],
  ['In a row of 5 chairs, Amit sits at one end, Bina sits next to Amit, Chetan sits in the middle and Deepa sits at the other end. Where does Esha sit?', ['Between Chetan and Deepa', 'Next to Amit', 'At an end', 'Between Amit and Bina'], 0, 'Order: Amit, Bina, Chetan, Esha, Deepa.', 'easy'],
  ['A, B, C, D sit around a square table facing the centre. A is opposite C. B is to the right of A. Who is to the left of A?', ['D', 'B', 'C', 'Cannot be determined'], 0, 'On a square table, A\'s neighbours are B and D. B is on A\'s right, so D is on A\'s left.', 'easy'],
  ['Seven people sit in a row. G is third from the left. F is to the immediate right of G. H is at the extreme right. Only two people sit between F and H. Who sits immediately to the right of F?', ['One of the two between F and H', 'G', 'H', 'Nobody'], 0, 'Positions: G=3, F=4, H=7, so seats 5 and 6 are between F and H; the person at seat 5 is immediately right of F.', 'medium'],
  ['Eight friends sit around a circular table facing the centre. If each person is opposite exactly one person, how many pairs of opposite people are there?', ['4', '8', '2', '6'], 0, '8 people → 8/2 = 4 opposite pairs.', 'easy'],
  ['P, Q, R, S, T sit in a row. R is between P and S. Q is at one end, to the left of P. T is at the right end. What is the order from left?', ['Q P R S T', 'P R S Q T', 'Q S R P T', 'Q R P S T'], 0, 'Q at the left end, then P, R (between P and S), S, then T at the right end.', 'medium'],
  ['In a circular arrangement of 6 people facing the centre, A is second to the left of B. C is opposite B. Who sits between A and C (taking the shorter side)?', ['Nobody - they are adjacent', 'B', 'Cannot be determined', 'Two people'], 0, 'Number the seats with B at 0. Second to the left of B is seat 2 (left = clockwise when facing centre); opposite B is seat 3. Seats 2 and 3 are adjacent.', 'hard'],
];
HW['puzzles'] = [
  ['Four students - Asha, Bala, Chitra and Dev - like different subjects: Maths, Physics, Chemistry, Biology. Asha does not like Maths or Biology. Bala likes Physics. Dev likes Biology. What does Asha like?', ['Chemistry', 'Maths', 'Physics', 'Biology'], 0, 'Bala = Physics, Dev = Biology. Asha cannot be Maths, so Asha = Chemistry and Chitra = Maths.', 'easy'],
  ['A, B, C and D have different heights. A is taller than B but shorter than C. D is shorter than B. Who is the shortest?', ['D', 'B', 'A', 'C'], 0, 'Order: C > A > B > D.', 'easy'],
  ['Five boxes P, Q, R, S, T are stacked. Q is directly above S. P is at the bottom. T is directly below R. S is directly above P. Which box is at the top?', ['R', 'Q', 'T', 'S'], 0, 'From bottom: P, S, Q. T is below R, so the stack is P, S, Q, T, R → R is on top.', 'medium'],
  ['Three people (X, Y, Z) work in three cities (Pune, Delhi, Chennai). X does not work in Pune. Y works in Chennai. Where does Z work?', ['Pune', 'Delhi', 'Chennai', 'Cannot be determined'], 0, 'Y = Chennai. X cannot be Pune, so X = Delhi, leaving Pune for Z.', 'easy'],
  ['A lecture series runs Monday to Friday with one subject per day: DBMS, OS, CN, DSA, OOP. DSA is on Wednesday. OS is the day after DBMS. CN is on Friday. OOP is not on Monday. Which subject is on Monday?', ['DBMS', 'OS', 'OOP', 'DSA'], 0, 'Wed = DSA, Fri = CN. OS follows DBMS, so DBMS-OS must be Mon-Tue. Thursday = OOP.', 'medium'],
  ['Among P, Q, R, S, T, each scored differently. P scored more than Q and R. S scored less than R but more than Q. T scored the highest. Who scored the lowest?', ['Q', 'S', 'R', 'P'], 0, 'T > P > R > S > Q.', 'medium'],
  ['A clock gains 5 minutes every hour. If it is set right at 8:00 AM, what time will it show at 2:00 PM the same day?', ['2:30 PM', '2:25 PM', '2:05 PM', '2:35 PM'], 0, '6 hours × 5 minutes = 30 minutes gained → 2:30 PM.', 'hard'],
];
HW['syllogisms'] = [
  ['Statements: All cats are animals. All animals are living beings. Conclusions: I. All cats are living beings. II. Some living beings are cats.', ['Both I and II follow', 'Only I follows', 'Only II follows', 'Neither follows'], 0, 'All cats ⊂ animals ⊂ living beings → I follows. Since cats exist within living beings, II also follows.', 'easy'],
  ['Statements: Some books are pens. All pens are pencils. Conclusions: I. Some books are pencils. II. All pencils are books.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Books that are pens are also pencils → I follows. II is an unjustified reversal.', 'medium'],
  ['Statements: No doctor is a lawyer. All lawyers are teachers. Conclusions: I. No teacher is a doctor. II. Some teachers are not doctors.', ['Only II follows', 'Only I follows', 'Both follow', 'Neither follows'], 0, 'Teachers who are lawyers are not doctors → II follows. Other teachers may be doctors, so I does not follow.', 'hard'],
  ['Statements: All engineers are graduates. Some graduates are managers. Conclusions: I. Some engineers are managers. II. Some managers are graduates.', ['Only II follows', 'Only I follows', 'Both follow', 'Neither follows'], 0, 'II is the conversion of "Some graduates are managers". I is not certain.', 'medium'],
  ['Statements: Some apples are red. Some red things are cars. Conclusions: I. Some apples are cars. II. No apple is a car.', ['Either I or II follows', 'Only I follows', 'Only II follows', 'Neither follows'], 0, 'Neither is definite on its own, but they form a complementary pair (some / none), so either I or II is true.', 'hard'],
  ['Statements: All roses are flowers. No flower is a tree. Conclusions: I. No rose is a tree. II. Some flowers are roses.', ['Both follow', 'Only I follows', 'Only II follows', 'Neither follows'], 0, 'Roses are inside flowers, which never overlap trees → I. Roses exist in flowers → II.', 'easy'],
  ['Statements: All coders are thinkers. All thinkers are readers. Conclusion: All readers are coders.', ['Does not follow', 'Follows', 'Partly follows', 'Cannot be determined'], 0, 'Coders ⊂ thinkers ⊂ readers; the reverse is not implied.', 'easy'],
  ['Statements: Some students are athletes. No athlete is lazy. Conclusions: I. Some students are not lazy. II. All students are lazy.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Students who are athletes are not lazy → I follows; II contradicts it.', 'medium'],
];
HW['statement-and-conclusions'] = [
  ['Statement: "Regular practice of aptitude tests improves speed." Conclusions: I. Practice helps in exams. II. Without practice, nobody can pass.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'I is directly supported. II is an extreme claim not implied.', 'easy'],
  ['Statement: "The company has decided to hire only candidates with a CGPA of 7 or above." Conclusions: I. Candidates with CGPA 6.5 will not be hired. II. All candidates above 7 CGPA will be hired.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'The rule excludes below-7 candidates (I), but meeting the cutoff does not guarantee hiring (II).', 'medium'],
  ['Statement: "Most accidents on this road happen at night." Conclusions: I. Street lighting should be improved. II. The road should be closed permanently.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Improving lighting is a reasonable inference; permanent closure is extreme.', 'medium'],
  ['Statement: "Online learning platforms have grown rapidly since 2020." Conclusions: I. More people are learning online now than before 2020. II. Classroom teaching has ended.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Growth implies more learners (I). II is not supported.', 'easy'],
  ['Statement: "Smoking is injurious to health" is printed on every cigarette pack. Assumptions: I. People read the warning. II. Some people may be discouraged from smoking.', ['Both are implicit', 'Only I is implicit', 'Only II is implicit', 'Neither is implicit'], 0, 'The warning is printed assuming people read it and that it may influence some of them.', 'hard'],
  ['Statement: "If you want to clear the interview, prepare your projects well." Assumptions: I. Interviewers ask about projects. II. Preparation affects interview results.', ['Both are implicit', 'Only I is implicit', 'Only II is implicit', 'Neither is implicit'], 0, 'The advice assumes projects are discussed and that preparation matters.', 'medium'],
  ['Statement: "All employees must complete security training by Friday." Course of action: I. Send a reminder to employees who have not completed it. II. Cancel the training.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'A reminder supports the instruction; cancelling contradicts it.', 'easy'],
  ['Statement: "The new metro line has reduced travel time between the two cities by 40 minutes." Conclusions: I. The metro is faster than earlier options. II. Everyone now uses the metro.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Reduced travel time implies it is faster (I); usage by everyone is not stated.', 'medium'],
];
HW['data-sufficiency'] = [
  ['What is the value of x? I. 2x + 3 = 11. II. x is a positive integer.', ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are needed', 'Neither is sufficient'], 0, 'From I, x = 4. II alone gives no value.', 'easy'],
  ['Is N an even number? I. N is divisible by 4. II. N is divisible by 3.', ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are needed', 'Neither is sufficient'], 0, 'Divisible by 4 → even. Divisible by 3 could be odd or even.', 'easy'],
  ['How old is Ravi? I. Ravi is 5 years older than Sita. II. Sita is 20 years old.', ['Both together are needed', 'Statement I alone is sufficient', 'Statement II alone is sufficient', 'Neither is sufficient'], 0, 'Together: Ravi = 25. Individually neither gives his age.', 'easy'],
  ['What is the area of the rectangle? I. Perimeter is 30 cm. II. Length is twice the breadth.', ['Both together are needed', 'Statement I alone is sufficient', 'Statement II alone is sufficient', 'Neither is sufficient'], 0, 'Together: 2(2b + b) = 30 → b = 5, l = 10 → area 50 cm².', 'medium'],
  ['On which day of the week was Meena born? I. Her brother was born on Tuesday. II. Meena was born two days after her brother.', ['Both together are needed', 'Statement I alone is sufficient', 'Statement II alone is sufficient', 'Neither is sufficient'], 0, 'Together: Tuesday + 2 = Thursday.', 'medium'],
  ['What is the speed of the train? I. It crosses a pole in 10 seconds. II. It crosses a 200 m platform in 20 seconds.', ['Both together are needed', 'Statement I alone is sufficient', 'Statement II alone is sufficient', 'Neither is sufficient'], 0, 'Let length L and speed v: L = 10v and L + 200 = 20v → v = 20 m/s. Each alone has two unknowns.', 'hard'],
  ['Is x > y? I. x - y = 4. II. x + y = 10.', ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are needed', 'Neither is sufficient'], 0, 'x - y = 4 > 0 directly answers the question.', 'medium'],
  ['How many students are in the class? I. Rohan is 12th from the top and 18th from the bottom. II. There are 10 more boys than girls.', ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are needed', 'Neither is sufficient'], 0, 'From I: 12 + 18 - 1 = 29 students.', 'hard'],
];

const LESSONS = {
  'number-series': ['Number Series', 'Find the rule that generates the sequence, then apply it to find the next or the wrong term.', ['Check differences first, then ratios', 'Look for squares/cubes (n², n³, n² ± 1)', 'Check differences of differences', 'Try alternate terms (two interleaved series)', 'Combined rules: ×2 + 1, ×3 - 2'], [['2, 6, 12, 20, 30, ?', 'Differences 4, 6, 8, 10 → next 12 → 42 (n(n+1)).']]],
  'alphabet-series': ['Alphabet Series', 'Letters follow position-based patterns. Convert letters to positions (A = 1 ... Z = 26).', ['Remember EJOTY: E5, J10, O15, T20, Y25', 'Opposite letters sum to 27 (A-Z, B-Y)', 'Check forward/backward jumps and growing gaps'], [['AZ, BY, CX, ?', 'First letters forward, second letters backward → DW.']]],
  'coding-and-decoding': ['Coding and Decoding', 'A word is converted to a code using a hidden rule (letter shift, reversal, opposite letters or number values).', ['Compare the first letter of the word and the code to find the shift', 'Check if the code is the reverse', 'Opposite letter: position 27 - n', 'Number codes often use positions or their sums'], [['CAT → DBU; DOG → ?', '+1 shift → EPH.']]],
  'blood-relations': ['Blood Relations', 'Draw a family tree with symbols: + for male, - for female, = for couples, vertical lines for generations.', ['Start from the end of a long statement ("my grandfather\'s only son" = father)', 'Do not assume gender unless stated', 'Coded relations (A + B) → translate one symbol at a time'], [['Pointing to a man, X says "His mother is my mother\'s only daughter."', 'Mother\'s only daughter = X herself → the man is X\'s son.']]],
  'direction-sense': ['Direction Sense', 'Track each movement on a rough sketch. Right turn = 90° clockwise, left = 90° anticlockwise.', ['Use a coordinate grid: North +y, East +x', 'Shortest distance = √(dx² + dy²)', 'At sunrise, shadows fall West; at sunset, East'], [['Walk 3 km N, turn right 4 km. Distance?', '√(9 + 16) = 5 km, towards North-East.']]],
  'seating-arrangements': ['Seating Arrangements', 'Linear and circular arrangements. Place the most definite clue first, then fill in the rest.', ['Facing the centre: left = clockwise, right = anticlockwise', 'Facing north in a row: your left is the viewer\'s left', 'Fix one person in circular problems'], [['A is opposite C; B on A\'s right (square table). Who is on A\'s left?', 'D.']]],
  'puzzles': ['Puzzles', 'Organise clues in a table (people × attributes). Mark definite facts first, then eliminate.', ['Start with clues that fix an exact position or pair', 'Use negative clues to eliminate', 'Check the final answer against every clue'], [['A taller than B, shorter than C; D shorter than B. Shortest?', 'C > A > B > D → D.']]],
  'syllogisms': ['Syllogisms', 'Use Venn diagrams to test whether a conclusion is definitely true for every possible diagram.', ['All A are B → Some B are A (conversion)', 'No A is B → No B is A', '"Some" + "Some" gives no definite conclusion', 'Complementary pair (some / no) → either-or'], [['All A are B, all B are C. Then?', 'All A are C; some C are A.']]],
  'statement-and-conclusions': ['Statement and Conclusions / Assumptions', 'A conclusion must follow directly from the statement; an assumption is something the speaker takes for granted.', ['Reject extreme words: only, always, never, all (unless stated)', 'Do not use outside knowledge', 'Courses of action must be practical and solve the stated problem'], [['"Prices will rise next month." Conclusion: People may buy now.', 'Follows as a reasonable inference.']]],
  'analogies': ['Analogies', 'Identify the relationship in the first pair and apply it to the second.', ['Common relations: worker-tool, product-raw material, young one-adult, instrument-measurement', 'Number analogies: squares, cubes, ×k + c', 'Letter analogies: constant shifts'], [['3 : 27 :: 4 : ?', 'Cube → 64.']]],
  'classification': ['Classification (Odd One Out)', 'Three items share a property; find the one that does not.', ['Check prime/composite, even/odd, squares, multiples', 'For words: category, function, origin', 'For letter pairs: gap between letters'], [['17, 23, 27, 31', '27 is not prime.']]],
  'order-and-ranking': ['Order and Ranking', 'Questions about positions in a row or ranks in a class.', ['Total = left + right - 1', 'Rank from bottom = total - rank from top + 1', 'People between = total - (pos1 + pos2) when they do not overlap'], [['10th from left, 15th from right. Total?', '24.']]],
  'calendars': ['Calendars', 'Use odd days (remainder after dividing days by 7) to find days of the week.', ['Ordinary year = 1 odd day, leap year = 2', '100 years = 5 odd days, 200 = 3, 300 = 1, 400 = 0', 'Century years are leap only if divisible by 400', 'Month odd days: Jan 3, Feb 0/1, Mar 3, Apr 2 ...'], [['1 Jan 2023 was Sunday. 1 Jan 2024?', '2023 has 1 odd day → Monday.']]],
  'clocks': ['Clocks', 'The minute hand moves 6°/min and the hour hand 0.5°/min, so the relative speed is 5.5°/min.', ['Angle = |30H - 5.5M|', 'Hands coincide 11 times in 12 hours', 'Hands coincide at 60H/11 minutes past H', 'Right angle 22 times in 12 hours'], [['Angle at 3:40?', '|90 - 220| = 130°.']]],
  'data-sufficiency': ['Data Sufficiency', 'Decide whether the given statements are enough to answer the question — you do not need the final value.', ['Check each statement alone first, then together', 'For yes/no questions, a definite "no" is also sufficient', 'Count unknowns vs independent equations'], [['x? I: x + y = 5. II: x - y = 1.', 'Both together needed → x = 3.']]],
};

function build() {
  const questions = [];
  const order = Object.keys(LESSONS);
  order.forEach((slug, i) => {
    if (G[slug]) questions.push(...generateTopic('logical', slug, G[slug], 18, 300 + i));
    if (HW[slug]) questions.push(...handwritten('logical', slug, HW[slug]));
    const extra = require('./logical_hw2')[slug];
    if (extra) questions.push(...handwritten('logical', slug, extra));
  });
  questions.push(...require('./logical_extra').build());
  const topics = order.map((slug, i) => {
    const [title, explanation, tips, examples] = LESSONS[slug];
    return {
      slug, title, summary: explanation.split('.')[0] + '.', sort: i,
      lesson: { title, difficulty: 'easy', minutes: 20, content: { explanation, shortcuts: tips, solved_examples: examples.map(([q, s]) => ({ question: q, solution: s })), practice_note: 'Practise with timed quizzes below.' } },
    };
  });
  return { topics, questions };
}
void rng;
module.exports = { build };
