import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Async, Badge, PageHead, Progress, useToast } from '../components/ui';
import { useState } from 'react';

export default function Roadmap() {
  const state = useApi('/roadmap');
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const toggle = async (item) => {
    try {
      await api.patch(`/roadmap/items/${item.id}/toggle`);
      state.reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const regenerate = async () => {
    setBusy(true);
    try { await api.post('/roadmap/regenerate'); toast('Roadmap regenerated from your latest profile.'); state.reload(); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead title="Learning Roadmap" subtitle={`${d.roadmap.title} · personalised for ${d.roadmap.based_on.year === 'graduate' ? 'graduates' : `year ${d.roadmap.based_on.year}`}, ${d.roadmap.based_on.level} level`}
            actions={<><Link className="btn btn-secondary" to="/profile">Change preferences</Link><button className="btn btn-secondary" disabled={busy} onClick={regenerate}><Icon name="refresh" />Regenerate</button></>} />
          <div className="card mb">
            <div className="row between"><h3 style={{ margin: 0 }}>Overall progress</h3><span className="bold">{d.completed}/{d.total} steps · {d.percent}%</span></div>
            <div className="mt"><Progress value={d.percent} tone="teal" /></div>
            <p className="small muted mt" style={{ marginBottom: 0 }}>Steps linked to lessons are ticked automatically when you complete the lesson. You can also tick any step manually.</p>
          </div>
          <div className="stack" style={{ gap: 18 }}>
            {d.stages.map((s) => (
              <div key={s.stage} className={`stage ${s.percent === 100 ? 'done' : ''}`}>
                <div className="stage-dot" />
                <div className="card">
                  <div className="row between">
                    <div><span className="badge indigo">Stage {s.stage}</span><h2 style={{ marginTop: 6 }}>{s.name}</h2><p className="muted small" style={{ margin: 0 }}>{s.blurb}</p></div>
                    <div style={{ minWidth: 160 }}><div className="small bold" style={{ textAlign: 'right' }}>{s.completed}/{s.total}</div><Progress value={s.percent} /></div>
                  </div>
                  <div className="list mt">
                    {s.items.map((it) => (
                      <div key={it.id} className="list-item">
                        <button className={`check ${it.completed ? 'on' : ''}`} aria-label={it.completed ? 'Mark as not done' : 'Mark as done'} onClick={() => toggle(it)}>{it.completed && <Icon name="check" />}</button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="bold small" style={{ textDecoration: it.completed ? 'line-through' : 'none', color: it.completed ? 'var(--muted)' : undefined, textTransform: 'capitalize' }}>{it.title}</div>
                          <div className="tiny muted">{it.description}</div>
                        </div>
                        {it.priority !== 'normal' && <Badge kind={it.priority === 'high' ? 'violet' : ''}>{it.priority}</Badge>}
                        {it.link && <Link className="btn btn-sm btn-secondary" to={it.link}>{it.completed ? 'Revisit' : 'Start'}</Link>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Async>
  );
}
