import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Alert, Field } from '../components/ui';

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <Link to="/" className="brand" style={{ color: '#fff' }}><img src="/favicon.svg" alt="" />BrainBridge</Link>
        <div>
          <h2>One Platform. Every Skill. Your Placement Journey.</h2>
          <p>Aptitude, coding, communication, interviews, resumes and company preparation — tracked in one personalised dashboard.</p>
        </div>
        <p className="small">Your data is stored securely; passwords are hashed with bcrypt.</p>
      </div>
      <div className="auth-form">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email)) return setError('Please enter a valid email address.');
    if (!form.password) return setError('Please enter your password.');
    setBusy(true); setError('');
    try {
      const u = await login(form.email, form.password);
      navigate(u.onboarding_complete ? location.state?.from || '/dashboard' : '/onboarding');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your placement journey.">
      <form className="stack mt" onSubmit={submit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Email"><input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        <p className="small muted" style={{ textAlign: 'center' }}>New to BrainBridge? <Link to="/register">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'At least 8 characters with letters and numbers.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true); setError('');
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/onboarding');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell title="Create your account" subtitle="It takes less than two minutes.">
      <form className="stack mt" onSubmit={submit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Full name" error={errors.name}><input className={`input ${errors.name ? 'invalid' : ''}`} value={form.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email" error={errors.email}><input className={`input ${errors.email ? 'invalid' : ''}`} type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters, with letters and numbers."><input className={`input ${errors.password ? 'invalid' : ''}`} type="password" value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Confirm password" error={errors.confirm}><input className={`input ${errors.confirm ? 'invalid' : ''}`} type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
        <p className="small muted" style={{ textAlign: 'center' }}>Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
