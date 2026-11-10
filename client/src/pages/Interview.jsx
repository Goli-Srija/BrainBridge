import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Async, PageHead, Tabs, useToast } from '../components/ui';
import Feedback from '../modules/Feedback';

const TECH = [['dsa', 'DSA'], ['oops', 'OOPs'], ['dbms', 'DBMS'], ['sql', 'SQL'], ['os', 'Operating Systems'], ['cn', 'Computer Networks'], ['se', 'Software Engineering'], ['system-design', 'System Design basics'], ['project', 'Project explanations']];
const CORE_LESSON = { oops: 'oops', dbms: 'dbms', sql: 'sql', os: 'os', cn: 'cn', se: 'software-engineering', 'system-design': 'system-design', dsa: null, project: null };

function QuestionPractice({ q }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async () => {
    setBusy(true);
    try { const r = await api.post(`/interview/questions/${q.id}/practice`, { answer }); setResult(r); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row between"><div className="bold" style={{ flex: 1 }}>{q.question}</div><span className={`badge ${q.difficulty}`}>{q.difficulty}</span></div>
      <div className="row mt" style={{ marginTop: 10 }}>
        <button className="btn btn-sm btn-secondary" onClick={() => setOpen(!open)}>{open ? 'Hide practice' : 'Practise answering'}</button>
        <details className="qa" style={{ margin: 0, flex: 1 }}><summary className="small">Show model answer</summary><div className="small">{q.model_answer}</div></details>
      </div>
      {open && (
        <div className="stack mt">
          <textarea className="textarea" placeholder="Write your answer as you would say it in the interview..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-sm" disabled={busy || answer.trim().split(/\s+/).length < 5} onClick={submit}>{busy ? 'Evaluating...' : 'Evaluate my answer'}</button></div>
          {result && <Feedback result={result} />}
        </div>
      )}
    </div>
  );
}

function Category({ category }) {
  const state = useApi(`/interview/questions/${category}`);
  return <Async state={state}>{(d) => <div className="stack">{d.questions.map((q) => <QuestionPractice key={q.id} q={q} />)}</div>}</Async>;
}

export default function Interview() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'technical';
  const [cat, setCat] = useState('dsa');
  const etiquette = useApi('/learn/modules/interview');
  return (
    <>
      <PageHead title="Interview Preparation" subtitle="Technical and HR question banks with model answers, practice evaluation and interview etiquette."
        actions={<Link className="btn" to="/mock-interviews"><Icon name="mic" />Take a mock interview</Link>} />
      <Tabs value={tab} onChange={(v) => setParams({ tab: v })} tabs={[{ value: 'technical', label: 'Technical' }, { value: 'hr', label: 'HR' }, { value: 'etiquette', label: 'Interview etiquette' }]} />
      {tab === 'technical' && (
        <>
          <div className="row mb" style={{ gap: 6 }}>{TECH.map(([v, l]) => <button key={v} className={`chip ${cat === v ? 'active' : ''}`} onClick={() => setCat(v)}>{l}</button>)}</div>
          {CORE_LESSON[cat] && <div className="alert alert-info mb"><Icon name="book" size={18} /><div>Need a refresher first? <Link to={`/learn/core/${CORE_LESSON[cat]}`}>Read the {TECH.find((t) => t[0] === cat)[1]} lesson</Link>.</div></div>}
          {cat === 'dsa' && <div className="alert alert-info mb"><Icon name="code" size={18} /><div>DSA lessons with code in Java, Python and C are in <Link to="/programming">Programming and DSA</Link>.</div></div>}
          <Category key={cat} category={cat} />
        </>
      )}
      {tab === 'hr' && <Category category="hr" />}
      {tab === 'etiquette' && (
        <>
          <Async state={etiquette}>
            {(d) => (
              <div className="grid grid-auto mb">
                {d.topics.map((t) => (
                  <Link key={t.slug} to={`/learn/interview/${t.slug}`} className="card hover" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <h3>{t.title}</h3><p className="small muted" style={{ margin: 0 }}>{t.summary}</p>
                  </Link>
                ))}
              </div>
            )}
          </Async>
          <Category category="etiquette" />
        </>
      )}
    </>
  );
}
