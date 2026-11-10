import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Icon from '../components/Icon';
import { Async, PageHead, Progress, fmtDateTime } from '../components/ui';
import { SECTION_META } from '../modules/constants';

export default function AptitudeSection({ section }) {
  const meta = SECTION_META[section];
  const state = useApi(`/aptitude/summary/${section}`);
  const attempts = useApi(`/aptitude/attempts?section=${section}`);
  const navigate = useNavigate();
  const [mixed, setMixed] = useState({ difficulty: '', count: 15 });

  return (
    <>
      <PageHead title={meta.title} subtitle={meta.subtitle} actions={
        <div className="row">
          <select className="select" style={{ width: 140 }} value={mixed.difficulty} onChange={(e) => setMixed({ ...mixed, difficulty: e.target.value })} aria-label="Difficulty">
            <option value="">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <button className="btn" onClick={() => navigate(`/quiz?section=${section}&topic=mixed&count=${mixed.count}${mixed.difficulty ? `&difficulty=${mixed.difficulty}` : ''}`)}><Icon name="play" />Mixed timed quiz</button>
        </div>} />
      <Async state={state}>
        {(d) => (
          <div className="grid grid-auto">
            {d.topics.map((t) => (
              <div key={t.slug} className="card hover stack" style={{ gap: 8 }}>
                <div className="row between"><h3 style={{ margin: 0 }}>{t.title}</h3>{t.accuracy !== null && <span className={`badge ${t.accuracy >= 70 ? 'easy' : t.accuracy >= 50 ? 'medium' : 'hard'}`}>{t.accuracy}%</span>}</div>
                <p className="small muted" style={{ margin: 0 }}>{t.summary}</p>
                <div className="row tiny muted" style={{ gap: 8 }}><span>{t.total} questions</span><span>· E {t.easy} / M {t.medium} / H {t.hard}</span></div>
                {t.attempted > 0 && <><Progress value={t.accuracy} tone="teal" /><span className="tiny muted">{t.attempted} attempted · best {t.best}% · {t.quizzes} quiz{t.quizzes > 1 ? 'zes' : ''}</span></>}
                <div className="row mt" style={{ marginTop: 'auto', paddingTop: 6 }}>
                  <Link className="btn btn-sm btn-secondary" to={`/learn/${section}/${t.slug}`}><Icon name="book" />Learn</Link>
                  {['easy', 'medium', 'hard'].map((lv) => (
                    <Link key={lv} className="btn btn-sm btn-ghost" to={`/quiz?section=${section}&topic=${t.slug}&difficulty=${lv}&count=10`} style={{ textTransform: 'capitalize' }}>{lv}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Async>
      <div className="card mt">
        <div className="card-title"><h3>Your recent quizzes</h3></div>
        <Async state={attempts}>
          {(a) => a.attempts.length ? (
            <div className="table-wrap"><table className="table"><thead><tr><th>Topic</th><th>Level</th><th>Score</th><th>Time</th><th>Date</th></tr></thead>
              <tbody>{a.attempts.slice(0, 10).map((x) => (
                <tr key={x.id}><td>{x.topic_title || 'Mixed'}</td><td style={{ textTransform: 'capitalize' }}>{x.difficulty || 'All'}</td><td className="bold">{x.correct}/{x.total}</td><td>{Math.round(x.time_taken_s / 60)} min</td><td className="muted">{fmtDateTime(x.created_at)}</td></tr>
              ))}</tbody></table></div>
          ) : <p className="muted small">No quizzes yet — pick a topic above to start.</p>}
        </Async>
      </div>
    </>
  );
}
