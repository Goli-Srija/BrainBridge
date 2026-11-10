import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Icon from '../components/Icon';
import { Async, Progress, Ring, Stat, fmtDateTime } from '../components/ui';
import { StudyBar, TrendLine } from '../components/Charts';

const YEAR_LABEL = { 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year', graduate: 'Graduate' };
const ACT_ICON = { aptitude: 'calc', coding: 'code', lesson: 'book', mock: 'mic', assessment: 'clipboard', communication: 'chat' };

export default function Dashboard() {
  const state = useApi('/dashboard');
  return (
    <Async state={state} loadingText="Loading your dashboard...">
      {(d) => {
        const hour = new Date().getHours();
        const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const p = d.profile;
        return (
          <>
            <div className="page-head">
              <div>
                <h1>{greet}, {p.name.split(' ')[0]} 👋</h1>
                <p>{YEAR_LABEL[p.academic_year] || ''} · {p.branch} · {p.college} · Target: <strong>{p.target_role}</strong> · Language: <strong>{p.preferred_language?.toUpperCase()}</strong></p>
              </div>
              <div className="row"><Link className="btn btn-secondary" to="/tracker"><Icon name="calendar" />Daily tracker</Link><Link className="btn" to="/roadmap"><Icon name="roadmap" />Continue roadmap</Link></div>
            </div>

            <div className="grid grid-3 mb">
              <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <Ring value={d.readiness.score} label="/ 100" />
                <div>
                  <h3>Placement readiness</h3>
                  <p className="small muted">Calculated from aptitude accuracy, coding, lessons, communication, interviews, assessments and resume.</p>
                  <Link to="/progress" className="small">See breakdown →</Link>
                </div>
              </div>
              <div className="card">
                <div className="card-title"><h3>Today's goal</h3><span className="badge indigo">{d.todayCompletion.percent}% done</span></div>
                <Progress value={d.todayCompletion.percent} />
                <div className="stack mt" style={{ gap: 8 }}>
                  {d.todayCompletion.items.slice(0, 4).map((i) => (
                    <div key={i.key} className="row between small"><span className="muted">{i.label}</span><span className="bold">{i.done}/{i.target}</span></div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title"><h3>Study streak</h3><Icon name="flame" size={22} className="" /></div>
                <div className="row" style={{ gap: 24 }}>
                  <div><div className="stat-value" style={{ fontSize: '2.2rem', color: 'var(--amber)' }}>{d.streak.current}</div><div className="stat-label">current (days)</div></div>
                  <div><div className="stat-value" style={{ fontSize: '2.2rem' }}>{d.streak.longest}</div><div className="stat-label">longest</div></div>
                </div>
                <p className="small muted mt">Daily goal: {p.daily_goal_minutes} minutes · {d.weekly.activeDays}/7 active days this week</p>
              </div>
            </div>

            <div className="grid grid-4 mb">
              <Stat icon="clock" tone="indigo" value={d.stats.studyHours} label="Total study hours" />
              <Stat icon="code" tone="teal" value={d.stats.codingSolved} label="Coding problems solved" />
              <Stat icon="calc" tone="violet" value={d.stats.aptitudeAttempted} label="Aptitude questions attempted" sub={d.stats.aptitudeAttempted ? `${d.stats.aptitudeAccuracy}% accuracy` : null} />
              <Stat icon="layers" tone="amber" value={d.stats.lessonsCompleted} label="Lessons completed" sub={`${d.stats.modulesCompleted} modules fully completed`} />
            </div>

            <div className="grid grid-2 mb">
              <div className="card">
                <div className="card-title"><h3>Weekly progress</h3><span className="small muted">{d.weekly.minutes} min · {d.weekly.solved} solved · {d.weekly.aptitude} aptitude Qs</span></div>
                <StudyBar series={d.weekly.series} />
              </div>
              <div className="card">
                <div className="card-title"><h3>Monthly progress</h3><span className="small muted">{Math.round(d.monthly.minutes / 6) / 10} h · {d.monthly.activeDays} active days</span></div>
                <TrendLine series={d.monthly.series} keys={[['completion', 'Daily goal %'], ['aptitude', 'Aptitude Qs']]} />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <div className="card-title"><h3>Recommended next</h3><span className="badge violet">Personalised</span></div>
                {d.recommendations.length ? (
                  <div className="list">
                    {d.recommendations.map((r, i) => (
                      <Link key={i} to={r.link || '/roadmap'} className="list-item" style={{ color: 'inherit', textDecoration: 'none' }}>
                        <div className="stat-icon tone-indigo" style={{ width: 36, height: 36 }}><Icon name={r.type === 'weak' ? 'target' : r.type === 'goal' ? 'flame' : r.type === 'roadmap' ? 'roadmap' : 'sparkle'} /></div>
                        <div style={{ flex: 1 }}><div className="bold small">{r.title}</div><div className="tiny muted">{r.reason}</div></div>
                        <Icon name="arrowRight" size={16} />
                      </Link>
                    ))}
                  </div>
                ) : <p className="muted">You are all caught up — great work!</p>}
              </div>
              <div className="card">
                <div className="card-title"><h3>Recent activity</h3><Link to="/tracker" className="small">View tracker</Link></div>
                {d.recent.length ? (
                  <div className="list">
                    {d.recent.map((a, i) => (
                      <div key={i} className="list-item">
                        <div className="stat-icon tone-teal" style={{ width: 36, height: 36 }}><Icon name={ACT_ICON[a.type] || 'check'} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}><div className="small bold truncate">{a.title}</div><div className="tiny muted">{a.detail}</div></div>
                        <span className="tiny muted">{fmtDateTime(a.at)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="center-state" style={{ padding: 20 }}><p>No activity yet. Start with your roadmap or a quick aptitude quiz.</p><Link className="btn btn-sm" to="/aptitude">Take a quiz</Link></div>}
              </div>
            </div>
          </>
        );
      }}
    </Async>
  );
}
