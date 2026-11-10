import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Icon from '../components/Icon';
import { Async, Empty, PageHead } from '../components/ui';

export default function CodingList() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const qs = new URLSearchParams(params);
  const state = useApi(`/coding/problems?${qs.toString()}`, [params.toString()]);
  const runtime = useApi('/coding/runtime');
  const setFilter = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p); };

  useEffect(() => { const t = setTimeout(() => setFilter('search', search.trim()), 350); return () => clearTimeout(t); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHead title="Coding Practice" subtitle="Original problems on standard interview patterns. Each has hints, an explanation, test cases and reference solutions in Java, Python and C."
        back={{ to: '/programming', label: 'Programming and DSA' }} />
      {runtime.data && (
        <div className={`alert ${runtime.data.mode === 'none' ? 'alert-warn' : 'alert-info'} mb`}>
          <Icon name="sparkle" size={18} /><div><strong>Code execution: {runtime.data.mode === 'judge0' ? 'Judge0' : runtime.data.mode === 'local' ? 'local compilers' : 'not configured'}.</strong> {runtime.data.message}</div>
        </div>
      )}
      <div className="card mb">
        <div className="row">
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <input className="input" placeholder="Search problems or topics..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            <span style={{ position: 'absolute', left: 11, top: 10, color: 'var(--muted)' }}><Icon name="search" size={17} /></span>
          </div>
          <select className="select" style={{ width: 150 }} value={params.get('difficulty') || ''} onChange={(e) => setFilter('difficulty', e.target.value)} aria-label="Difficulty"><option value="">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
          <select className="select" style={{ width: 180 }} value={params.get('topic') || ''} onChange={(e) => setFilter('topic', e.target.value)} aria-label="Topic"><option value="">All topics</option>{state.data?.topics.map((t) => <option key={t.topic} value={t.topic}>{t.topic} ({t.count})</option>)}</select>
          <select className="select" style={{ width: 140 }} value={params.get('status') || ''} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status"><option value="">Any status</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option></select>
          <button className={`chip ${params.get('bookmarked') ? 'active' : ''}`} onClick={() => setFilter('bookmarked', params.get('bookmarked') ? '' : 'true')}><Icon name="bookmark" size={14} />&nbsp;Bookmarked</button>
        </div>
      </div>
      <Async state={state}>
        {(d) => d.problems.length ? (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th style={{ width: 40 }}></th><th>Problem</th><th>Topic</th><th>Difficulty</th><th>Attempts</th><th></th></tr></thead>
              <tbody>{d.problems.map((p) => (
                <tr key={p.id}>
                  <td>{p.solved ? <span style={{ color: 'var(--green)' }} title="Solved"><Icon name="check" size={18} /></span> : <span className="muted">—</span>}</td>
                  <td><Link to={`/coding/${p.slug}`} className="bold">{p.title}</Link>{p.bookmarked && <span style={{ color: 'var(--violet)', marginLeft: 6 }}><Icon name="bookmark" size={13} /></span>}</td>
                  <td className="muted">{p.topic}</td>
                  <td><span className={`badge ${p.difficulty}`}>{p.difficulty}</span></td>
                  <td className="muted">{p.attempts}</td>
                  <td><Link className="btn btn-sm btn-secondary" to={`/coding/${p.slug}`}>{p.solved ? 'Review' : 'Solve'}</Link></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        ) : <Empty title="No problems match your filters" text="Try clearing a filter." />}
      </Async>
    </>
  );
}
