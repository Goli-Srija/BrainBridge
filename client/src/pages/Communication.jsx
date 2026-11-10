import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Icon from '../components/Icon';
import { Async, PageHead, Progress, Tabs } from '../components/ui';

export default function Communication() {
  const [tab, setTab] = useState('exercises');
  const lessons = useApi('/learn/modules/communication');
  const ex = useApi('/communication/exercises');
  return (
    <>
      <PageHead title="Communication & Soft Skills" subtitle="Lessons on professional English and workplace skills, plus placement exercises with instant rubric feedback." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'exercises', label: 'Placement exercises' }, { value: 'lessons', label: 'Lessons (18)' }]} />
      {tab === 'exercises' ? (
        <Async state={ex}>
          {(d) => {
            const done = d.exercises.filter((e) => e.attempts > 0).length;
            return (
              <>
                <div className="card mb"><div className="row between"><h3 style={{ margin: 0 }}>Exercise progress</h3><span className="bold">{done}/{d.exercises.length} attempted</span></div><div className="mt"><Progress value={(done / d.exercises.length) * 100} tone="teal" /></div></div>
                <div className="grid grid-auto">
                  {d.exercises.map((e) => (
                    <Link key={e.slug} to={`/communication/${e.slug}`} className="card hover stack" style={{ color: 'inherit', textDecoration: 'none', gap: 8 }}>
                      <div className="row between"><span className="badge violet">{e.category}</span>{e.best_score !== null && <span className={`badge ${e.best_score >= 75 ? 'easy' : e.best_score >= 50 ? 'medium' : 'hard'}`}>Best {e.best_score}</span>}</div>
                      <h3 style={{ margin: 0 }}>{e.title}</h3>
                      <p className="small muted" style={{ margin: 0 }}>{e.prompt}</p>
                      <span className="small" style={{ color: 'var(--indigo)', fontWeight: 600 }}>{e.attempts ? `${e.attempts} attempt(s) · Practise again` : 'Start exercise'} →</span>
                    </Link>
                  ))}
                </div>
              </>
            );
          }}
        </Async>
      ) : (
        <Async state={lessons}>
          {(d) => (
            <div className="grid grid-auto">
              {d.topics.map((t) => (
                <Link key={t.slug} to={`/learn/communication/${t.slug}`} className="card hover" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <div className="row between"><Icon name="chat" size={20} />{t.status === 'completed' && <span className="badge easy">Done</span>}</div>
                  <h3 className="mt" style={{ marginTop: 8 }}>{t.title}</h3><p className="small muted" style={{ margin: 0 }}>{t.summary}</p>
                </Link>
              ))}
            </div>
          )}
        </Async>
      )}
    </>
  );
}
