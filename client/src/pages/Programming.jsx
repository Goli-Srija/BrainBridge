import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/Icon';
import { Async, PageHead, Progress, Tabs } from '../components/ui';

function TopicGrid({ module }) {
  const state = useApi(`/learn/modules/${module}`);
  return (
    <Async state={state}>
      {(d) => {
        const done = d.topics.filter((t) => t.status === 'completed').length;
        return (
          <>
            <div className="card mb">
              <div className="row between"><div><h3 style={{ margin: 0 }}>{d.module.title}</h3><p className="small muted" style={{ margin: 0 }}>{d.module.description}</p></div><span className="bold">{done}/{d.topics.length} completed</span></div>
              <div className="mt"><Progress value={(done / d.topics.length) * 100} tone="teal" /></div>
            </div>
            <div className="grid grid-auto">
              {d.topics.map((t, i) => (
                <Link key={t.slug} to={`/learn/${module}/${t.slug}`} className="card hover" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <div className="row between"><span className="badge indigo">{String(i + 1).padStart(2, '0')}</span>
                    {t.status === 'completed' ? <span className="badge easy"><Icon name="check" size={12} />Done</span> : t.status === 'started' ? <span className="badge medium">In progress</span> : <span className={`badge ${t.difficulty}`}>{t.difficulty}</span>}
                  </div>
                  <h3 className="mt" style={{ marginTop: 10 }}>{t.title}</h3>
                  <p className="small muted" style={{ margin: 0 }}>{t.summary}</p>
                </Link>
              ))}
            </div>
          </>
        );
      }}
    </Async>
  );
}

export default function Programming() {
  const { user } = useAuth();
  const [tab, setTab] = useState(user?.preferred_language || 'java');
  const coding = useApi('/coding/problems');
  return (
    <>
      <PageHead title="Programming and DSA" subtitle="Independent learning paths for Java, Python and C, plus DSA with code in all three languages."
        actions={<Link className="btn" to="/coding"><Icon name="code" />Coding practice</Link>} />
      <Async state={coding}>
        {(c) => (
          <div className="grid grid-4 mb">
            <div className="card stat"><div className="stat-icon tone-indigo"><Icon name="code" /></div><div><div className="stat-value">{c.totals.total}</div><div className="stat-label">Coding problems</div></div></div>
            <div className="card stat"><div className="stat-icon tone-green"><Icon name="check" /></div><div><div className="stat-value">{c.totals.solved}</div><div className="stat-label">Solved by you</div></div></div>
            <div className="card stat"><div className="stat-icon tone-amber"><Icon name="layers" /></div><div><div className="stat-value">{c.totals.easy}/{c.totals.medium}/{c.totals.hard}</div><div className="stat-label">Easy / Medium / Hard</div></div></div>
            <div className="card stat"><div className="stat-icon tone-violet"><Icon name="sparkle" /></div><div><div className="stat-value">3</div><div className="stat-label">Languages with real execution</div></div></div>
          </div>
        )}
      </Async>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'java', label: 'Java path' }, { value: 'python', label: 'Python path' }, { value: 'c', label: 'C path' }, { value: 'dsa', label: 'Data Structures & Algorithms' }, { value: 'core', label: 'Core CS (OOPs, DBMS, OS, CN)' }]} />
      <TopicGrid key={tab} module={tab} />
    </>
  );
}
