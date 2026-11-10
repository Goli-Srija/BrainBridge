import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api, localDate } from '../services/api';
import Icon from '../components/Icon';
import { Async, Field, PageHead, Progress, Stat, useToast } from '../components/ui';
import { HBar, MonthlyBars, SkillRadar, StudyBar, TrendLine } from '../components/Charts';

const GOAL_FIELDS = [['coding_problems', 'Coding problems', 50], ['aptitude_questions', 'Aptitude questions', 200], ['communication_exercises', 'Communication exercises', 20], ['lessons', 'Lessons', 20], ['interview_questions', 'Interview questions', 50], ['study_minutes', 'Study minutes', 720]];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Calendar() {
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const state = useApi(`/tracker/calendar?month=${month}`);
  const shift = (n) => { const d = new Date(month + '-01T00:00:00'); d.setMonth(d.getMonth() + n); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const label = new Date(month + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return (
    <div className="card">
      <div className="card-title"><h3>Study calendar</h3><div className="row" style={{ gap: 4 }}><button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><Icon name="arrowLeft" /></button><span className="bold small" style={{ minWidth: 120, textAlign: 'center' }}>{label}</span><button className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><Icon name="arrowRight" /></button></div></div>
      <Async state={state}>
        {(d) => {
          const first = new Date(d.days[0].date + 'T00:00:00').getDay();
          return (
            <>
              <div className="cal">
                {DOW.map((x) => <div key={x} className="cal-head">{x}</div>)}
                {Array.from({ length: first }).map((_, i) => <div key={'b' + i} />)}
                {d.days.map((day) => (
                  <div key={day.date} className={`cal-day ${day.status} ${day.isToday ? 'today' : ''}`} title={`${day.date}: ${day.status.replace('_', ' ')}${day.minutes ? ` · ${day.minutes} min · ${day.percent}% of goals` : ''}`}>
                    {Number(day.date.slice(8))}{day.minutes > 0 && <span style={{ fontSize: 9, opacity: 0.85 }}>{day.minutes}m</span>}
                  </div>
                ))}
              </div>
              <div className="legend mt"><span><i style={{ background: 'var(--teal)' }} />Completed (100% of goals)</span><span><i style={{ background: '#99f6e4' }} />Partially completed</span><span><i style={{ background: '#fee2e2' }} />Missed</span><span><i style={{ background: 'var(--indigo-50)', boxShadow: '0 0 0 2px var(--indigo-600)' }} />Today</span></div>
            </>
          );
        }}
      </Async>
    </div>
  );
}

export default function Tracker() {
  const today = useApi('/tracker/today');
  const analytics = useApi('/tracker/analytics');
  const recs = useApi('/tracker/recommendations');
  const toast = useToast();
  const [editGoals, setEditGoals] = useState(null);
  const [session, setSession] = useState({ minutes: 30, topic: '', notes: '' });
  const [busy, setBusy] = useState(false);

  const saveGoals = async () => {
    setBusy(true);
    try { await api.put('/tracker/goals', Object.fromEntries(Object.entries(editGoals).map(([k, v]) => [k, Number(v)]))); toast('Daily goals updated.'); setEditGoals(null); today.reload(); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const logSession = async (e) => {
    e.preventDefault();
    const m = Number(session.minutes);
    if (!m || m < 1 || m > 600) return toast('Minutes must be between 1 and 600.', 'error');
    setBusy(true);
    try { const r = await api.post('/tracker/log', { ...session, minutes: m }); toast(r.message); setSession({ minutes: 30, topic: '', notes: '' }); today.reload(); analytics.reload(); }
    catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Daily Tracker" subtitle="Your goals, streak, calendar and analytics — all calculated from your real activity using your local date." />
      <Async state={today}>
        {(t) => (
          <>
            <div className="grid grid-4 mb">
              <Stat icon="flame" tone="amber" value={t.streak.current} label="Current streak (days)" />
              <Stat icon="trophy" tone="violet" value={t.streak.longest} label="Longest streak" />
              <Stat icon="target" tone="indigo" value={`${t.completion.percent}%`} label="Today's completion" />
              <Stat icon="clock" tone="teal" value={t.log?.study_minutes || 0} label="Study minutes today" />
            </div>
            <div className="grid grid-2 mb">
              <div className="card">
                <div className="card-title"><h3>Today's goals</h3>{!editGoals ? <button className="btn btn-sm btn-secondary" onClick={() => setEditGoals({ ...t.goals })}>Edit goals</button> : <div className="row"><button className="btn btn-sm btn-ghost" onClick={() => setEditGoals(null)}>Cancel</button><button className="btn btn-sm" disabled={busy} onClick={saveGoals}>Save</button></div>}</div>
                {!editGoals ? (
                  <div className="stack">
                    {t.completion.items.map((i) => (
                      <div key={i.key}><div className="row between small"><span>{i.label}</span><span className="bold">{i.done}/{i.target}</span></div><Progress value={i.percent} tone={i.percent >= 100 ? 'teal' : ''} /></div>
                    ))}
                  </div>
                ) : (
                  <div className="form-grid">{GOAL_FIELDS.map(([k, l, max]) => <Field key={k} label={l} hint={`0-${max}${k === 'study_minutes' ? ' (min 10)' : ''}`}><input className="input" type="number" min={k === 'study_minutes' ? 10 : 0} max={max} value={editGoals[k]} onChange={(e) => setEditGoals({ ...editGoals, [k]: e.target.value })} /></Field>)}</div>
                )}
              </div>
              <div className="card">
                <div className="card-title"><h3>Today's activity</h3><span className="tiny muted">{t.date}</span></div>
                {t.log ? (
                  <div className="grid grid-2" style={{ gap: 10 }}>
                    {[['Lessons completed', t.log.lessons_completed], ['Coding attempted', t.log.coding_attempted], ['Coding solved', t.log.coding_solved], ['Aptitude attempted', t.log.aptitude_attempted], ['Assessments', t.log.assessments_completed], ['Mock interviews', t.log.mock_interviews_attempted], ['Communication', t.log.communication_completed], ['Interview answers', t.log.interview_answered]].map(([l, v]) => (
                      <div key={l} className="row between small" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}><span className="muted">{l}</span><span className="bold">{v}</span></div>
                    ))}
                    <div className="span-2 small" style={{ gridColumn: '1/-1' }}><span className="muted">Topics studied: </span>{t.log.topics_studied.length ? t.log.topics_studied.map((x) => <span key={x} className="badge" style={{ margin: 2 }}>{x}</span>) : '—'}</div>
                    {t.log.notes && <div className="small" style={{ gridColumn: '1/-1', whiteSpace: 'pre-wrap' }}><span className="muted">Notes: </span>{t.log.notes}</div>}
                  </div>
                ) : <p className="muted small">No activity recorded today yet. Study time is tracked automatically while you use BrainBridge, and every quiz, lesson or problem is logged here.</p>}
                <form className="stack mt" onSubmit={logSession}>
                  <div className="bold small">Log offline study (books, classes, videos elsewhere)</div>
                  <div className="row"><input className="input" style={{ width: 100 }} type="number" min="1" max="600" value={session.minutes} onChange={(e) => setSession({ ...session, minutes: e.target.value })} aria-label="Minutes" /><input className="input" style={{ flex: 1, minWidth: 140 }} placeholder="Topic (e.g. Operating Systems)" value={session.topic} onChange={(e) => setSession({ ...session, topic: e.target.value })} /></div>
                  <input className="input" placeholder="Notes (optional)" value={session.notes} onChange={(e) => setSession({ ...session, notes: e.target.value })} />
                  <button className="btn btn-sm btn-secondary" disabled={busy} style={{ alignSelf: 'flex-start' }}><Icon name="plus" />Log study session</button>
                </form>
              </div>
            </div>
          </>
        )}
      </Async>
      <div className="grid grid-2 mb">
        <Calendar />
        <div className="card">
          <div className="card-title"><h3>Recommended for you</h3><span className="badge violet">Based on your data</span></div>
          <Async state={recs}>
            {(r) => <div className="list">{r.recommendations.map((x, i) => <Link key={i} to={x.link || '/roadmap'} className="list-item" style={{ color: 'inherit', textDecoration: 'none' }}><Icon name="sparkle" size={18} /><div style={{ flex: 1 }}><div className="small bold">{x.title}</div><div className="tiny muted">{x.reason}</div></div><Icon name="arrowRight" size={16} /></Link>)}</div>}
          </Async>
        </div>
      </div>
      <Async state={analytics}>
        {(a) => (
          <>
            <div className="grid grid-2 mb">
              <div className="card"><div className="card-title"><h3>Daily study minutes (this week)</h3></div><StudyBar series={a.weekly} /></div>
              <div className="card"><div className="card-title"><h3>Last 30 days</h3></div><TrendLine series={a.daily} keys={[['minutes', 'Study minutes'], ['aptitude', 'Aptitude Qs'], ['codingSolved', 'Problems solved']]} /></div>
            </div>
            <div className="grid grid-3 mb">
              <div className="card"><h3>Accuracy</h3>
                <div className="stack mt">
                  <div><div className="row between small"><span>Aptitude ({a.accuracy.aptitudeCorrect}/{a.accuracy.aptitudeAttempted})</span><span className="bold">{a.accuracy.aptitude}%</span></div><Progress value={a.accuracy.aptitude} /></div>
                  <div><div className="row between small"><span>Coding submissions accepted ({a.accuracy.codingSubmissions})</span><span className="bold">{a.accuracy.coding}%</span></div><Progress value={a.accuracy.coding} tone="teal" /></div>
                </div>
              </div>
              <div className="card span-2"><h3>Monthly totals</h3>{a.monthly.length ? <MonthlyBars months={a.monthly} /> : <p className="muted small">No monthly data yet.</p>}</div>
            </div>
            <div className="grid grid-2">
              <div className="card"><h3>Skill-wise progress</h3><SkillRadar skills={a.skills} /></div>
              <div className="card"><h3>Topic-wise performance (aptitude accuracy)</h3>
                {a.topics.length ? <HBar labels={a.topics.map((t) => t.title)} values={a.topics.map((t) => Math.round((t.correct / t.attempted) * 100))} /> : <p className="muted small">Take aptitude quizzes to see topic-wise accuracy.</p>}
              </div>
            </div>
          </>
        )}
      </Async>
    </>
  );
}
