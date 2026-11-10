import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Alert } from '../components/ui';
import { BasicFields, GoalFields, validateProfile } from '../modules/ProfileForm';

export default function Onboarding() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user.name, email: user.email, college: user.college || '', branch: user.branch || '', academic_year: user.academic_year || '',
    graduation_year: user.graduation_year || new Date().getFullYear() + 2, preferred_language: user.preferred_language || 'java',
    target_role: user.target_role || '', target_companies: user.target_companies || [], preparation_level: user.preparation_level || 'beginner', daily_goal_minutes: user.daily_goal_minutes || 60,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    const e = validateProfile(form);
    const stepKeys = ['name', 'college', 'branch', 'academic_year', 'graduation_year'];
    const stepErrors = Object.fromEntries(Object.entries(e).filter(([k]) => stepKeys.includes(k)));
    setErrors(stepErrors);
    if (!Object.keys(stepErrors).length) setStep(2);
  };

  const finish = async () => {
    const e = validateProfile(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setError('');
    try {
      const { email, ...payload } = form; // eslint-disable-line no-unused-vars
      const r = await api.put('/profile', { ...payload, graduation_year: Number(form.graduation_year), daily_goal_minutes: Number(form.daily_goal_minutes), complete_onboarding: true });
      setUser(r.user);
      navigate('/dashboard');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '30px 16px', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 720, padding: 30 }}>
        <div className="row between mb"><div className="brand"><img src="/favicon.svg" alt="" />BrainBridge</div><button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button></div>
        <div className="steps"><span className="on" /><span className={step === 2 ? 'on' : ''} /></div>
        <h1>{step === 1 ? `Welcome, ${user.name.split(' ')[0]}! Tell us about you` : 'Set your goals'}</h1>
        <p className="muted">{step === 1 ? 'We use this to tailor your roadmap to your academic year.' : 'Your language, role and companies shape your personalised roadmap. You can change these any time.'}</p>
        {error && <Alert kind="error">{error}</Alert>}
        <div className="mt">{step === 1 ? <BasicFields form={form} set={set} errors={errors} /> : <GoalFields form={form} set={set} errors={errors} />}</div>
        <div className="row between mt">
          {step === 2 ? <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button> : <span />}
          {step === 1 ? <button className="btn" onClick={next}>Continue</button> : <button className="btn btn-teal" disabled={busy} onClick={finish}>{busy ? 'Building your roadmap...' : 'Create my dashboard'}</button>}
        </div>
      </div>
    </div>
  );
}
