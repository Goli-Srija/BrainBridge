import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Async, PageHead, Progress as Bar, Ring, fmtDate } from '../components/ui';
import { Breakdown, HBar, TrendLine } from '../components/Charts';


const NAMES = { aptitude: 'Aptitude accuracy × volume', coding: 'Coding (difficulty-weighted)', learning: 'Lessons completed', communication: 'Communication exercises', interview: 'Mock interviews', assessments: 'Assessments', resume: 'Resume & ATS (Applicant Tracking System)' };

export default function ProgressPage() {
  const state = useApi('/progress');
  const bookmarks = useApi('/bookmarks');
  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead title="My Progress" subtitle="A transparent breakdown of your placement readiness and progress in every module." />
          <div className="grid grid-3 mb">
            <div className="card" style={{ display: 'grid', placeItems: 'center' }}><Ring value={d.readiness.score} size={170} label="readiness" /></div>
            <div className="card span-2">
              <h3>How your readiness score is calculated</h3>
              <div className="grid grid-2" style={{ gap: 12 }}>
                {Object.entries(d.readiness.breakdown).map(([k, v]) => (
                  <div key={k}><div className="row between small"><span>{NAMES[k]}</span><span className="bold">{v.score}/{v.max}</span></div><Bar value={(v.score / v.max) * 100} /></div>
                ))}
              </div>
              <p className="tiny muted mt">Each part = weight × quality × coverage. Example: aptitude = 20 × your accuracy × min(1, questions attempted / 200). Practising more AND accurately both matter.</p>
            </div>
          </div>
          <div className="grid grid-2 mb">
            <div className="card"><h3>Readiness over time</h3>{d.history.length > 1 ? <TrendLine series={d.history} keys={[['score', 'Readiness']]} /> : <p className="muted small">Your history builds up day by day as you use BrainBridge.</p>}</div>
            <div className="card"><h3>Score composition</h3><Breakdown breakdown={d.readiness.breakdown} /></div>
          </div>
          <div className="grid grid-2 mb">
            <div className="card">
              <h3>Learning modules</h3>
              {d.modules.map((m) => (
                <div key={m.slug} className="mb"><div className="row between small"><span>{m.title}</span><span className="bold">{m.completed}/{m.total}</span></div><Bar value={(m.completed / m.total) * 100} tone="teal" /></div>
              ))}
            </div>
            <div className="card">
              <h3>Coding by difficulty</h3>
              {d.coding.map((c) => <div key={c.difficulty} className="mb"><div className="row between small"><span style={{ textTransform: 'capitalize' }}>{c.difficulty}</span><span className="bold">{c.solved}/{c.total}</span></div><Bar value={(c.solved / c.total) * 100} /></div>)}
              <h3 className="mt">Coding by topic</h3>
              <HBar labels={d.codingTopics.map((t) => t.topic)} values={d.codingTopics.map((t) => Math.round((t.solved / t.total) * 100))} />
            </div>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3>Assessments (best score)</h3>
              {d.assessments.map((a) => <div key={a.title} className="mb"><div className="row between small"><span>{a.title}</span><span className="bold">{a.best !== null ? `${a.best}%` : 'Not taken'}</span></div><Bar value={a.best || 0} /></div>)}
              <h3 className="mt">Mock interviews</h3>
              {d.mocks.length ? d.mocks.map((m, i) => <div key={i} className="row between small" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}><span>{m.track} · set {m.set_no}</span><span className="bold">{m.overall_score}/100 <span className="muted tiny">{fmtDate(m.completed_at)}</span></span></div>) : <p className="small muted">No mock interviews completed yet. <Link to="/mock-interviews">Start one</Link></p>}
            </div>
            <div className="card">
              <h3>Bookmarks</h3>
              <Async state={bookmarks}>
                {(b) => b.bookmarks.length ? <div className="list">{b.bookmarks.map((x) => <Link key={x.item_type + x.item_id} to={x.link || '/dashboard'} className="list-item" style={{ color: 'inherit', textDecoration: 'none' }}><span className="badge">{x.item_type.replace('_', ' ')}</span><span className="small bold">{x.title}</span></Link>)}</div> : <p className="small muted">Bookmark lessons, problems, projects and companies to find them here.</p>}
              </Async>
            </div>
          </div>
        </>
      )}
    </Async>
  );
}
