import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Alert, Async, PageHead, fmtDateTime, useToast } from '../components/ui';

const LEVEL = ['Foundation', 'Intermediate', 'Advanced', 'Expert'];

export default function MockInterviews() {
  const state = useApi('/mock/tracks');
  const navigate = useNavigate();
  const toast = useToast();
  const start = async (track, set_no) => {
    try { const r = await api.post('/mock/start', { track, set_no }); navigate(`/mock-interviews/${r.interviewId}`); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead title="Mock Interviews" subtitle="Four role-based tracks, four interview sets each. Every set runs Introduction → Technical → Coding → Project → HR with increasing difficulty." />
          <Alert kind={d.aiEnabled ? 'success' : 'info'}>
            <Icon name="sparkle" size={18} />
            <div>{d.aiEnabled
              ? 'Scores use a transparent rule-based rubric. An AI model is configured on the server, so you will also see extra feedback clearly labelled "AI-generated".'
              : 'Evaluation is rule-based (keyword coverage, depth, structure and specificity). No AI model is connected, so no feedback is presented as AI-generated.'}</div>
          </Alert>
          <div className="grid grid-2 mt">
            {d.tracks.map((t) => (
              <div key={t.key} className="card">
                <div className="row" style={{ gap: 12 }}><div className="stat-icon tone-violet"><Icon name="mic" /></div><div><h3 style={{ margin: 0 }}>{t.name}</h3><p className="small muted" style={{ margin: 0 }}>{t.description}</p></div></div>
                <div className="list mt">
                  {t.sets.map((s) => (
                    <div key={s.set_no} className="list-item">
                      <div style={{ flex: 1 }}><div className="bold small">Interview {s.set_no} · {LEVEL[s.set_no - 1]}</div><div className="tiny muted">{s.questions} questions · {s.attempts} attempt(s){s.best ? ` · best ${s.best}/100` : ''}</div></div>
                      <button className={`btn btn-sm ${s.inProgress ? 'btn-secondary' : ''}`} onClick={() => start(t.key, s.set_no)}>{s.inProgress ? 'Resume' : s.attempts ? 'Retake' : 'Start'}</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {d.history.filter((h) => h.status === 'completed').length > 0 && (
            <div className="card mt">
              <h3>Completed interviews</h3>
              <div className="table-wrap"><table className="table"><thead><tr><th>Track</th><th>Set</th><th>Score</th><th>Completed</th><th></th></tr></thead>
                <tbody>{d.history.filter((h) => h.status === 'completed').map((h) => (
                  <tr key={h.id}><td>{d.tracks.find((t) => t.key === h.track)?.name}</td><td>{h.set_no}</td><td className="bold">{h.overall_score}/100</td><td className="muted small">{fmtDateTime(h.completed_at)}</td><td><button className="btn btn-sm btn-ghost" onClick={() => navigate(`/mock-interviews/${h.id}`)}>View report</button></td></tr>
                ))}</tbody></table></div>
            </div>
          )}
        </>
      )}
    </Async>
  );
}
