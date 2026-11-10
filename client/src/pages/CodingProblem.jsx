import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Icon from '../components/Icon';
import CodeEditor from '../components/CodeEditor';
import { Async, PageHead, Tabs, fmtDateTime, useToast } from '../components/ui';
import { CodeTabs } from '../components/LessonContent';

const VERDICT = { accepted: 'Accepted', passed: 'Passed', wrong_answer: 'Wrong answer', compile_error: 'Compilation error', runtime_error: 'Runtime error', time_limit: 'Time limit exceeded', not_executed: 'Not executed', runner_error: 'Execution service error', ok: 'Ran successfully' };

function Output({ result }) {
  if (!result) return <div className="output muted">Run your code to see output here. "Run" uses the sample tests; "Submit" runs all tests (including hidden ones) and saves your submission.</div>;
  if (result.loading) return <div className="output"><span className="spinner sm" style={{ display: 'inline-block', marginRight: 8 }} />Running...</div>;
  const good = ['accepted', 'ok'].includes(result.status);
  return (
    <div className="output">
      <div className={`verdict ${good ? 'accepted' : 'fail'}`}>{VERDICT[result.status] || result.status}{result.total ? ` — ${result.passed}/${result.total} tests passed` : ''}</div>
      <div className="tiny" style={{ color: '#94a3b8', margin: '4px 0 10px' }}>Runner: {result.runner}{result.status === 'not_executed' ? ' (no result is shown because the code was not actually run)' : ''}</div>
      {result.message && <div style={{ color: '#fca5a5' }}>{result.message}</div>}
      {result.custom && result.stdout !== undefined && <><div style={{ color: '#a5b4fc' }}>stdout:</div>{result.stdout || '(empty)'}{result.stderr && <><div style={{ color: '#fca5a5' }}>stderr:</div>{result.stderr}</>}</>}
      {(result.tests || []).map((t, i) => (
        <div key={i} style={{ borderTop: '1px solid #1e293b', padding: '8px 0' }}>
          <span className={t.verdict === 'passed' ? 'verdict passed' : 'verdict fail'} style={{ fontSize: '0.85rem' }}>Test {i + 1}{t.hidden ? ' (hidden)' : ''}: {VERDICT[t.verdict] || t.verdict}</span>{t.timeMs != null && <span style={{ color: '#64748b' }}> · {t.timeMs} ms</span>}
          {!t.hidden && t.verdict !== 'passed' && (
            <><div style={{ color: '#a5b4fc' }}>Input:</div>{t.input}<div style={{ color: '#a5b4fc' }}>Expected:</div>{t.expected}<div style={{ color: '#a5b4fc' }}>Your output:</div>{t.actual || '(empty)'}</>
          )}
          {t.stderr && t.verdict !== 'passed' && <><div style={{ color: '#fca5a5' }}>Error:</div>{t.stderr.slice(0, 600)}</>}
        </div>
      ))}
    </div>
  );
}

export default function CodingProblem() {
  const { slug } = useParams();
  const { user } = useAuth();
  const state = useApi(`/coding/problems/${slug}`);
  const toast = useToast();
  const [lang, setLang] = useState(user?.preferred_language || 'java');
  const [codes, setCodes] = useState({});
  const [tab, setTab] = useState('problem');
  const [result, setResult] = useState(null);
  const [custom, setCustom] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [hints, setHints] = useState(0);
  const subs = useApi(state.data ? `/coding/submissions?problem_id=${state.data.problem.id}` : null);

  // Initial code per language: saved draft → local unsaved copy → starter template
  useEffect(() => {
    if (!state.data) return;
    const init = {};
    ['java', 'python', 'c'].forEach((l) => {
      let local = null; try { local = localStorage.getItem(`bb_code_${slug}_${l}`); } catch { /* ignore */ }
      const draft = state.data.drafts.find((d) => d.language === l);
      init[l] = local ?? draft?.code ?? state.data.starters[l];
    });
    setCodes(init);
  }, [state.data, slug]);

  const code = codes[lang] ?? '';
  const setCode = (v) => { setCodes((c) => ({ ...c, [lang]: v })); try { localStorage.setItem(`bb_code_${slug}_${lang}`, v); } catch { /* ignore */ } };
  const p = state.data?.problem;

  const run = async (submit) => {
    setResult({ loading: true });
    try {
      const body = { problem_id: p.id, language: lang, code };
      if (!submit && custom !== null) body.custom_input = custom;
      const r = await api.post(submit ? '/coding/submit' : '/coding/run', body);
      setResult(r);
      if (submit) {
        if (r.status === 'accepted') toast('Accepted! All tests passed 🎉');
        subs.reload(); state.reload();
      }
    } catch (e) { setResult(null); toast(e.message, 'error'); }
  };
  const save = async () => { try { await api.post('/coding/draft', { problem_id: p.id, language: lang, code }); toast('Code saved to your account.'); } catch (e) { toast(e.message, 'error'); } };
  const bookmark = async () => { const r = await api.post('/bookmarks/toggle', { item_type: 'coding_problem', item_id: p.id }); toast(r.bookmarked ? 'Problem bookmarked' : 'Bookmark removed'); state.reload(); };
  const reset = () => { if (window.confirm('Replace your code with the starter template?')) setCode(state.data.starters[lang]); };

  const examples = useMemo(() => p?.examples || [], [p]);

  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead back={{ to: '/coding', label: 'All problems' }} title={d.problem.title}
            subtitle={<span className="row" style={{ gap: 8 }}><span className={`badge ${d.problem.difficulty}`}>{d.problem.difficulty}</span><span className="badge">{d.problem.topic}</span>{d.solved && <span className="badge easy"><Icon name="check" size={12} />Solved</span>}</span>}
            actions={<button className="btn btn-secondary btn-sm" onClick={bookmark}><Icon name="bookmark" />{d.bookmarked ? 'Bookmarked' : 'Bookmark'}</button>} />
          <div className="coding-layout">
            <div className="card">
              <Tabs value={tab} onChange={setTab} tabs={[{ value: 'problem', label: 'Problem' }, { value: 'solution', label: 'Explanation & solutions' }, { value: 'submissions', label: 'My submissions' }]} />
              {tab === 'problem' && (
                <div className="prose">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{d.problem.description}</p>
                  <h4>Input format</h4><p>{d.problem.input_format}</p>
                  <h4>Output format</h4><p>{d.problem.output_format}</p>
                  <h4>Constraints</h4><p className="mono small">{d.problem.constraints}</p>
                  {examples.map((e, i) => (
                    <div key={i} className="mb"><h4>Example {i + 1}</h4>
                      <div className="grid grid-2" style={{ gap: 10 }}><div><div className="tiny muted">Input</div><pre className="code">{e.input}</pre></div><div><div className="tiny muted">Output</div><pre className="code">{e.output}</pre></div></div>
                      {e.explanation && <p className="small">{e.explanation}</p>}
                    </div>
                  ))}
                  <h4>Hints</h4>
                  {d.problem.hints.slice(0, hints).map((h, i) => <div key={i} className="alert alert-info mb">💡 {h}</div>)}
                  {hints < d.problem.hints.length ? <button className="btn btn-secondary btn-sm" onClick={() => setHints(hints + 1)}>Show hint {hints + 1}</button> : <p className="tiny muted">No more hints.</p>}
                  <p className="tiny muted mt">Tests: {d.problem.sample_tests.length} sample + {d.problem.hidden_count} hidden.</p>
                </div>
              )}
              {tab === 'solution' && (
                <div className="prose">
                  <h4>Approach</h4><p>{d.problem.explanation}</p>
                  {!showSolution ? (
                    <div className="alert alert-warn"><div>Try solving it yourself first. <button className="link-btn" onClick={() => setShowSolution(true)}>Reveal reference solutions</button></div></div>
                  ) : <CodeTabs code={d.problem.solutions} preferred={lang} />}
                </div>
              )}
              {tab === 'submissions' && (
                <Async state={subs}>
                  {(s) => s.submissions.length ? (
                    <div className="table-wrap"><table className="table"><thead><tr><th>Status</th><th>Language</th><th>Tests</th><th>When</th><th></th></tr></thead>
                      <tbody>{s.submissions.map((x) => (
                        <tr key={x.id}><td><span className={`badge ${x.status === 'accepted' ? 'easy' : 'hard'}`}>{VERDICT[x.status] || x.status}</span></td><td>{x.language}</td><td>{x.passed}/{x.total}</td><td className="muted small">{fmtDateTime(x.created_at)}</td>
                          <td><button className="btn btn-sm btn-ghost" onClick={() => { setLang(x.language); setCodes((c) => ({ ...c, [x.language]: x.code })); toast('Loaded this submission into the editor'); }}>Load code</button></td></tr>
                      ))}</tbody></table></div>
                  ) : <p className="muted small">No submissions yet.</p>}
                </Async>
              )}
            </div>
            <div className="stack">
              <div className="card" style={{ padding: 14 }}>
                <div className="row between mb">
                  <div className="row" style={{ gap: 6 }}>{['java', 'python', 'c'].map((l) => <button key={l} className={`chip ${l === lang ? 'active' : ''}`} onClick={() => setLang(l)}>{l === 'c' ? 'C' : l[0].toUpperCase() + l.slice(1)}</button>)}</div>
                  <div className="row" style={{ gap: 6 }}><button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button><button className="btn btn-secondary btn-sm" onClick={save}><Icon name="download" />Save</button></div>
                </div>
                {lang === 'java' && <p className="tiny muted" style={{ margin: '0 0 6px' }}>Java: keep the class name <span className="kbd">Main</span>.</p>}
                <CodeEditor language={lang} value={code} onChange={setCode} />
                <div className="mt">
                  <label className="checkbox"><input type="checkbox" checked={custom !== null} onChange={(e) => setCustom(e.target.checked ? (examples[0]?.input || '') : null)} />Run with custom input</label>
                  {custom !== null && <textarea className="textarea mt mono" style={{ minHeight: 80 }} value={custom} onChange={(e) => setCustom(e.target.value)} />}
                </div>
                <div className="row mt" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" disabled={result?.loading} onClick={() => run(false)}><Icon name="play" />Run</button>
                  <button className="btn btn-teal" disabled={result?.loading} onClick={() => run(true)}><Icon name="upload" />Submit</button>
                </div>
              </div>
              <Output result={result} />
            </div>
          </div>
        </>
      )}
    </Async>
  );
}
