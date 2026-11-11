
import { useEffect, useRef, useState } from 'react';
import { PageHead } from '../components/ui';

export default function FocusMode() {
  const [duration, setDuration] = useState(30);
  const [custom, setCustom] = useState(45);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [leftTab, setLeftTab] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [history, setHistory] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('brainbridge_focus_history') || '[]');
  } catch {
    return [];
  }
});
  const endTime = useRef(null);
  const timerRef = useRef(null);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  useEffect(() => {
    if (!running || paused) return;

    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime.current - Date.now()) / 1000));
      setRemaining(left);

      if (left <= 0) {
  clearInterval(timerRef.current);
  setRunning(false);
  setCompleted(true);

  const completedMinutes = duration === 'custom'
    ? Number(custom)
    : Number(duration);

  setSessionMinutes(completedMinutes);

  const newSession = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    duration: completedMinutes,
    status: 'Completed'
  };

  setHistory((previous) => {
    const updated = [newSession, ...previous].slice(0, 20);
    localStorage.setItem('brainbridge_focus_history', JSON.stringify(updated));
    return updated;
  });
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }, 500);

    return () => clearInterval(timerRef.current);
  }, [running, paused, duration, custom]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && running && !paused) {
        setLeftTab(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [running, paused]);

  const startSession = async () => {
    const minutes = duration === 'custom' ? Number(custom) : duration;

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 480) {
      alert('Choose a duration between 1 and 480 minutes.');
      return;
    }

    const seconds = minutes * 60;
    setRemaining(seconds);
    setSessionMinutes(minutes);
    setCompleted(false);
    setPaused(false);
    setLeftTab(false);
    setRunning(true);
    endTime.current = Date.now() + seconds * 1000;

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen may be unavailable; the timer can still run.
    }
  };

  const pauseSession = () => {
    endTime.current = Date.now() + remaining * 1000;
    setPaused(true);
  };

  const resumeSession = () => {
    endTime.current = Date.now() + remaining * 1000;
    setPaused(false);
  };

  const endSession = () => {
    if (!window.confirm('Are you sure you want to end your focus session?')) return;

    clearInterval(timerRef.current);
    setRunning(false);
    setPaused(false);
    setCompleted(false);
    setRemaining(0);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="stack">
      <PageHead
        title="Focus Mode"
        subtitle="Stay focused, avoid distractions and make every study session count."
      />

      <div className="card stack" style={{ alignItems: 'center', padding: 28 }}>
        <div style={{ fontSize: 48 }}>🎯</div>
        <h2 style={{ margin: 0 }}>Your Distraction-Free Study Space</h2>
        <p className="muted small" style={{ textAlign: 'center' }}>
          Choose your study duration and concentrate on your placement preparation.
        </p>

        {!running && !completed && (
          <div className="stack" style={{ width: '100%', maxWidth: 420 }}>
            <h3 style={{ textAlign: 'center' }}>Choose your duration</h3>

            <div className="grid grid-2">
              {[30, 60, 120].map((minutes) => (
                <button
                  key={minutes}
                  className={`btn ${duration === minutes ? '' : 'btn-secondary'}`}
                  onClick={() => setDuration(minutes)}
                >
                  {minutes === 30 ? '30 Minutes' : minutes === 60 ? '1 Hour' : '2 Hours'}
                </button>
              ))}
              <button
                className={`btn ${duration === 'custom' ? '' : 'btn-secondary'}`}
                onClick={() => setDuration('custom')}
              >
                Custom
              </button>
            </div>

            {duration === 'custom' && (
              <label className="stack">
                Custom duration (minutes)
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="480"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
              </label>
            )}

            <button className="btn btn-lg" onClick={startSession}>
              Start Focus Session
            </button>
          </div>
        )}

        {running && (
          <div className="stack" style={{ alignItems: 'center' }}>
            <p className="badge indigo">
              {paused ? 'Session Paused' : 'Focus Session Active'}
            </p>

            <div style={{
              fontSize: 'clamp(42px, 9vw, 76px)',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {formatTime(remaining)}
            </div>

            <p className="muted">Stay focused. You are making progress!</p>

            <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {paused ? (
                <button className="btn" onClick={resumeSession}>Resume</button>
              ) : (
                <button className="btn btn-secondary" onClick={pauseSession}>Pause</button>
              )}
              <button className="btn btn-ghost" onClick={endSession}>End Session</button>
            </div>

            {leftTab && (
              <div className="alert alert-info">
                You left the BrainBridge tab. Welcome back! Try to stay focused.
                <button className="btn btn-sm mt" onClick={() => setLeftTab(false)}>
                  Got it
                </button>
              </div>
            )}
          </div>
        )}

        {completed && (
          <div className="stack" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 56 }}>🏆</div>
            <h2>Focus Session Completed!</h2>
            <p>You completed {sessionMinutes} minutes of focused study.</p>
            <p className="badge teal">Great work!</p>
            <button className="btn" onClick={() => {
              setCompleted(false);
              setRemaining(0);
            }}>
              Start Another Session
            </button>
          </div>
        )}

        {!running && !completed && (
          <p className="tiny muted" style={{ textAlign: 'center' }}>
            Focus Mode uses fullscreen and tab-switch reminders. It does not block
            other websites or applications.
          </p>
        )}
      </div>

      <div className="card stack">
        <h3>Previous Focus Sessions</h3>

        {history.length === 0 ? (
          <p className="small muted">
            No completed focus sessions yet. Start your first session!
          </p>
        ) : (
          <div className="list">
            {history.map((session) => (
              <div key={session.id} className="list-item row between">
                <div>
                  <div className="bold small">
                    {session.duration} minutes
                  </div>
                  <div className="tiny muted">{session.date}</div>
                </div>
                <span className="badge teal">{session.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
