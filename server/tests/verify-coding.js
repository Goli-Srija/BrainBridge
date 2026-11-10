// Verifies every coding problem: runs the Python, Java and C reference solutions on all test inputs
// and checks that they agree. With --write it (re)generates database/content/coding_tests.json,
// which stores the expected outputs used by the seed.
// Usage: node tests/verify-coding.js [--write] [--only=slug]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { rng } = require('../database/content/lib');

const problems = require('../database/content/coding');
const OUT = path.join(__dirname, '..', 'database', 'content', 'coding_tests.json');
const write = process.argv.includes('--write');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const py = process.platform === 'win32' ? 'python' : 'python3';
const norm = (s) => s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trim();

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-verify-'));
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
let failures = 0;

for (const p of problems) {
  if (only && p.slug !== only) continue;
  const dir = path.join(work, p.slug); fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'main.py'), p.py);
  fs.writeFileSync(path.join(dir, 'Main.java'), p.java);
  fs.writeFileSync(path.join(dir, 'main.c'), p.c);
  try {
    execFileSync('javac', ['Main.java'], { cwd: dir, stdio: 'pipe' });
    execFileSync('gcc', ['-O2', '-std=c11', 'main.c', '-o', 'main', '-lm'], { cwd: dir, stdio: 'pipe' });
  } catch (e) { failures++; console.log(`COMPILE FAIL ${p.slug}: ${String(e.stderr).slice(0, 600)}`); continue; }

  const r = rng(p.slug.length * 7919 + p.slug.charCodeAt(0));
  const inputs = [...p.examples.map((e) => ({ input: e.input, hidden: false, example: true })), ...(p.edge || []).map((x) => ({ input: x, hidden: true }))];
  const seen = new Set(inputs.map((i) => i.input));
  let guard = 0;
  while (inputs.length < p.examples.length + (p.edge || []).length + 8 && guard++ < 200) {
    const x = p.gen(r); if (!seen.has(x)) { seen.add(x); inputs.push({ input: x, hidden: true }); }
  }
  const tests = [];
  let bad = false;
  for (const t of inputs) {
    const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, input: t.input, stdio: 'pipe', timeout: 20000 }).toString();
    let o1, o2, o3;
    try { o1 = run(py, ['main.py']); o2 = run('java', ['-Xss64m', 'Main']); o3 = run(path.join(dir, 'main'), []); }
    catch (e) { bad = true; console.log(`RUNTIME FAIL ${p.slug} on input ${JSON.stringify(t.input).slice(0, 80)}: ${String(e.stderr).slice(0, 300)}`); break; }
    if (norm(o1) !== norm(o2) || norm(o1) !== norm(o3)) {
      bad = true;
      console.log(`MISMATCH ${p.slug} input=${JSON.stringify(t.input).slice(0, 100)}\n  py=${JSON.stringify(norm(o1)).slice(0, 120)}\n  java=${JSON.stringify(norm(o2)).slice(0, 120)}\n  c=${JSON.stringify(norm(o3)).slice(0, 120)}`);
      break;
    }
    tests.push({ input: t.input, output: norm(o1) + '\n', hidden: t.hidden });
  }
  if (bad) { failures++; continue; }
  existing[p.slug] = tests;
  console.log(`ok  ${p.difficulty.padEnd(6)} ${p.slug} (${tests.length} tests)`);
}
fs.rmSync(work, { recursive: true, force: true });
if (write) { fs.writeFileSync(OUT, JSON.stringify(existing, null, 0)); console.log('wrote', OUT); }
console.log(failures ? `\n${failures} problem(s) FAILED` : '\nAll problems verified: Python, Java and C agree on every test.');
process.exitCode = failures ? 1 : 0;
