// Real code execution for the coding practice module.
//
// Modes (CODE_RUNNER in .env):
//   judge0 - sends code to a Judge0 server (JUDGE0_URL, optional JUDGE0_API_KEY for RapidAPI).
//   local  - compiles/runs code on THIS computer with the installed python / javac+java / gcc.
//            Default in development so the demo works on a student laptop. Never enable on a public server.
//   none   - execution disabled; the editor still works and code can be saved, but nothing is "run".
// Results are NEVER fabricated: if a language is not installed the API says so.
const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const MAX_OUTPUT = 64 * 1024;
const RUN_TIMEOUT = Number(process.env.CODE_TIMEOUT_MS || 5000);
const isWin = process.platform === 'win32';

function mode() {
  if (process.env.CODE_RUNNER) return process.env.CODE_RUNNER;
  if (process.env.JUDGE0_URL) return 'judge0';
  return process.env.NODE_ENV === 'production' ? 'none' : 'local';
}

function runProcess(cmd, args, { cwd, input = '', timeoutMs = RUN_TIMEOUT } = {}) {
  return new Promise((resolve) => {
    let stdout = '', stderr = '', timedOut = false, finished = false;
    let child;
    try {
      child = spawn(cmd, args, { cwd, windowsHide: true });
    } catch (err) {
      return resolve({ code: -1, stdout: '', stderr: err.message, timedOut: false, notFound: true });
    }
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    child.stdout.on('data', (d) => { if (stdout.length < MAX_OUTPUT) stdout += d; });
    child.stderr.on('data', (d) => { if (stderr.length < MAX_OUTPUT) stderr += d; });
    child.on('error', (err) => {
      if (finished) return; finished = true; clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: err.message, timedOut, notFound: err.code === 'ENOENT' });
    });
    child.on('close', (code) => {
      if (finished) return; finished = true; clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

// ---------- detect which compilers/interpreters exist on this machine ----------
let detected = null;
async function detectLocal() {
  if (detected) return detected;
  const tryCmd = async (cmd, args, check) => {
    const r = await runProcess(cmd, args, { timeoutMs: 8000 });
    return !r.notFound && r.code === 0 && check((r.stdout + r.stderr));
  };
  const pythonCandidates = isWin ? ['python', 'py'] : ['python3', 'python'];
  let python = null;
  for (const p of pythonCandidates) if (await tryCmd(p, ['--version'], (o) => /Python 3/.test(o))) { python = p; break; }
  const java = (await tryCmd('javac', ['-version'], (o) => /javac/.test(o))) && (await tryCmd('java', ['-version'], () => true));
  const c = await tryCmd('gcc', ['--version'], (o) => /gcc|GCC|clang/.test(o));
  detected = { python, java, c };
  return detected;
}

async function status() {
  const m = mode();
  if (m === 'judge0') return { mode: 'judge0', languages: { java: true, python: true, c: true }, message: 'Code runs on the configured Judge0 server.' };
  if (m === 'local') {
    const d = await detectLocal();
    const languages = { java: !!d.java, python: !!d.python, c: !!d.c };
    const missing = Object.entries(languages).filter(([, v]) => !v).map(([k]) => k);
    return {
      mode: 'local', languages,
      message: missing.length
        ? `Running code on this computer. Not installed here: ${missing.join(', ')} (install it or configure Judge0 to run those languages).`
        : 'Running code on this computer using installed compilers.',
    };
  }
  return { mode: 'none', languages: { java: false, python: false, c: false }, message: 'Code execution is not configured. Set JUDGE0_URL (or CODE_RUNNER=local for local development) in .env.' };
}

const normalize = (s) => String(s ?? '').replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trim();

// ---------- local execution ----------
async function runLocal(language, code, inputs) {
  const d = await detectLocal();
  if ((language === 'python' && !d.python) || (language === 'java' && !d.java) || (language === 'c' && !d.c)) {
    return { error: 'not_available', message: `${language} is not installed on the server computer, so this code cannot be executed.` };
  }
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bb-run-'));
  try {
    let cmd, args;
    if (language === 'python') {
      await fs.writeFile(path.join(dir, 'main.py'), code);
      cmd = d.python; args = ['main.py'];
    } else if (language === 'java') {
      if (!/class\s+Main\b/.test(code)) return { error: 'compile_error', message: 'Your Java program must contain "public class Main".' };
      await fs.writeFile(path.join(dir, 'Main.java'), code);
      const comp = await runProcess('javac', ['-encoding', 'UTF-8', 'Main.java'], { cwd: dir, timeoutMs: 20000 });
      if (comp.code !== 0) return { error: 'compile_error', message: (comp.stderr || comp.stdout).replace(new RegExp(dir.replace(/\\/g, '\\\\'), 'g'), '') };
      cmd = 'java'; args = ['-Xss64m', '-cp', '.', 'Main'];
    } else {
      await fs.writeFile(path.join(dir, 'main.c'), code);
      const exe = isWin ? 'main.exe' : 'main';
      const comp = await runProcess('gcc', ['-O2', '-std=c11', 'main.c', '-o', exe, '-lm'], { cwd: dir, timeoutMs: 20000 });
      if (comp.code !== 0) return { error: 'compile_error', message: comp.stderr || comp.stdout };
      cmd = path.join(dir, exe); args = [];
    }
    const results = [];
    for (const input of inputs) {
      const t0 = Date.now();
      const r = await runProcess(cmd, args, { cwd: dir, input });
      results.push({ stdout: r.stdout, stderr: r.stderr, exitCode: r.code, timedOut: r.timedOut, timeMs: Date.now() - t0 });
    }
    return { results };
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// ---------- Judge0 execution ----------
const JUDGE0_LANG = { java: 62, python: 71, c: 50 };
const b64 = (s) => Buffer.from(String(s ?? ''), 'utf8').toString('base64');
const unb64 = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');

async function runJudge0(language, code, inputs) {
  const base = process.env.JUDGE0_URL.replace(/\/$/, '');
  const headers = { 'content-type': 'application/json' };
  if (process.env.JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST || new URL(base).host;
  }
  const results = [];
  for (const input of inputs) {
    const res = await fetch(`${base}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST', headers,
      body: JSON.stringify({ language_id: JUDGE0_LANG[language], source_code: b64(code), stdin: b64(input) }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { error: 'runner_error', message: `Judge0 returned HTTP ${res.status}. Check JUDGE0_URL / JUDGE0_API_KEY.` };
    const j = await res.json();
    if (j.status && j.status.id === 6) return { error: 'compile_error', message: unb64(j.compile_output) };
    results.push({
      stdout: unb64(j.stdout), stderr: unb64(j.stderr) || unb64(j.message), exitCode: j.status && j.status.id <= 4 ? 0 : 1,
      timedOut: j.status && j.status.id === 5, timeMs: j.time ? Math.round(Number(j.time) * 1000) : null,
    });
  }
  return { results };
}

/** Run code against tests [{input, output}] and grade each one. */
async function runTests(language, code, tests) {
  const m = mode();
  if (m === 'none') return { runner: 'none', status: 'not_executed', message: (await status()).message, tests: [] };
  let out;
  try {
    out = m === 'judge0' ? await runJudge0(language, code, tests.map((t) => t.input)) : await runLocal(language, code, tests.map((t) => t.input));
  } catch (err) {
    return { runner: m, status: 'runner_error', message: `Execution service error: ${err.message}`, tests: [] };
  }
  if (out.error === 'not_available') return { runner: m, status: 'not_executed', message: out.message, tests: [] };
  if (out.error) return { runner: m, status: out.error, message: out.message, tests: [] };

  const graded = out.results.map((r, i) => {
    const t = tests[i];
    let verdict = 'passed';
    if (r.timedOut) verdict = 'time_limit';
    else if (r.exitCode !== 0) verdict = 'runtime_error';
    else if (t.output !== undefined && normalize(r.stdout) !== normalize(t.output)) verdict = 'wrong_answer';
    return {
      input: t.hidden ? null : t.input, expected: t.hidden ? null : t.output, actual: t.hidden ? null : r.stdout.slice(0, 4000),
      stderr: r.stderr ? r.stderr.slice(0, 2000) : '', verdict, hidden: !!t.hidden, timeMs: r.timeMs,
    };
  });
  const passed = graded.filter((g) => g.verdict === 'passed').length;
  const firstFail = graded.find((g) => g.verdict !== 'passed');
  return { runner: m, status: firstFail ? firstFail.verdict : 'accepted', passed, total: graded.length, tests: graded };
}

/** Run with custom input only (no grading). */
async function runCustom(language, code, input) {
  const m = mode();
  if (m === 'none') return { runner: 'none', status: 'not_executed', message: (await status()).message };
  const out = m === 'judge0' ? await runJudge0(language, code, [input]) : await runLocal(language, code, [input]);
  if (out.error) return { runner: m, status: out.error === 'not_available' ? 'not_executed' : out.error, message: out.message };
  const r = out.results[0];
  return { runner: m, status: r.timedOut ? 'time_limit' : r.exitCode !== 0 ? 'runtime_error' : 'ok', stdout: r.stdout, stderr: r.stderr, timeMs: r.timeMs };
}

module.exports = { runTests, runCustom, status, normalize, runProcess };
