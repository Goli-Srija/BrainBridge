// Shared UI building blocks used across pages.
import { createContext, useCallback, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

export function Loading({ text = 'Loading...' }) {
  return <div className="center-state"><div className="spinner" />{text}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="center-state">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}><Icon name="refresh" />Try again</button>}
    </div>
  );
}

export function Empty({ title, text, action }) {
  return (
    <div className="center-state">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

/** Wraps a useApi() result: shows loading/error, otherwise renders children(data). */
export function Async({ state, children, loadingText }) {
  if (state.loading && !state.data) return <Loading text={loadingText} />;
  if (state.error && !state.data) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return children(state.data);
}

export function PageHead({ title, subtitle, actions, back }) {
  return (
    <div className="page-head">
      <div>
        {back && <Link to={back.to} className="small row" style={{ marginBottom: 6 }}><Icon name="arrowLeft" size={14} />{back.label}</Link>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Stat({ icon, tone = 'indigo', value, label, sub }) {
  return (
    <div className="card stat">
      <div className={`stat-icon tone-${tone}`}><Icon name={icon} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="tiny muted">{sub}</div>}
      </div>
    </div>
  );
}

export function Progress({ value, tone }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className={`progress ${tone || ''}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${v}%` }} /></div>;
}

export function Ring({ value, size = 150, stroke = 12, label = '', color = 'url(#ringGrad)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs><linearGradient id="ringGrad" x1="0" x2="1"><stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#0d9488" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#edf0f7" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="ring-label"><strong>{Math.round(v)}</strong><span className="tiny muted">{label}</span></div>
    </div>
  );
}

export function Badge({ children, kind }) {
  return <span className={`badge ${kind || ''}`}>{children}</span>;
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} className={`tab ${value === t.value ? 'active' : ''}`} onClick={() => onChange(t.value)}>{t.label}</button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export function Alert({ kind = 'info', children }) {
  return <div className={`alert alert-${kind}`}>{children}</div>;
}

// ---------- toasts ----------
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, kind = 'success') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.message}</div>)}</div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
