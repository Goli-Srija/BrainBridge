import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Icon from '../components/Icon';
import { Async, PageHead, fmtDateTime } from '../components/ui';

export default function Assessments() {
  const list = useApi('/assessments');
  const attempts = useApi('/assessments/attempts');
  return (
    <>
      <PageHead title="Assessments" subtitle="Timed placement-style tests with automatic scoring, topic-wise breakdown and full review." />
      <Async state={list}>
        {(d) => (
          <div className="grid grid-auto mb">
            {d.assessments.map((a) => (
              <div key={a.slug} className="card hover stack" style={{ gap: 8 }}>
                <div className="row between"><span className="badge indigo">{a.category}</span>{a.best !== null && <span className={`badge ${a.best >= a.pass_percent ? 'easy' : 'hard'}`}>Best {a.best}%</span>}</div>
                <h3 style={{ margin: 0 }}>{a.title}</h3>
                <p className="small muted" style={{ margin: 0 }}>{a.description}</p>
                <div className="row small muted"><Icon name="clipboard" size={14} />{a.question_count} questions <Icon name="clock" size={14} />{a.duration_min} min · pass {a.pass_percent}%</div>
                <Link className="btn btn-sm" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} to={`/assessments/${a.slug}`}>{a.attempts ? 'Retake test' : 'Start test'}</Link>
              </div>
            ))}
          </div>
        )}
      </Async>
      <div className="card">
        <h3>Attempt history</h3>
        <Async state={attempts}>
          {(d) => d.attempts.length ? (
            <div className="table-wrap"><table className="table"><thead><tr><th>Assessment</th><th>Score</th><th>Result</th><th>Weakest topic</th><th>Date</th></tr></thead>
              <tbody>{d.attempts.map((a) => {
                const weak = [...a.topic_breakdown].sort((x, y) => x.percent - y.percent)[0];
                return <tr key={a.id}><td>{a.title}</td><td className="bold">{a.score}/{a.total} ({a.percent}%)</td><td><span className={`badge ${a.passed ? 'easy' : 'hard'}`}>{a.passed ? 'Passed' : 'Not passed'}</span></td><td className="small">{weak ? `${weak.topic.replace(/-/g, ' ')} (${weak.percent}%)` : '—'}</td><td className="muted small">{fmtDateTime(a.created_at)}</td></tr>;
              })}</tbody></table></div>
          ) : <p className="muted small">No attempts yet.</p>}
        </Async>
      </div>
    </>
  );
}
