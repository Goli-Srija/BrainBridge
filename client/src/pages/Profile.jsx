import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { PageHead, useToast } from '../components/ui';
import { BasicFields, GoalFields, validateProfile } from '../modules/ProfileForm';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ ...user, target_companies: user.target_companies || [] });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const e = validateProfile(form);
    setErrors(e);
    if (Object.keys(e).length) return toast('Please fix the highlighted fields.', 'error');
    setBusy(true);
    try {
      const r = await api.put('/profile', {
        name: form.name, college: form.college, branch: form.branch, academic_year: form.academic_year, graduation_year: Number(form.graduation_year),
        preferred_language: form.preferred_language, target_role: form.target_role, target_companies: form.target_companies, preparation_level: form.preparation_level, daily_goal_minutes: Number(form.daily_goal_minutes),
      });
      setUser(r.user);
      toast(r.roadmapUpdated ? 'Profile saved — your roadmap was updated for your new preferences.' : 'Profile saved.');
    } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Profile" subtitle={`Member since ${new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`} actions={<button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save changes'}</button>} />
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card"><h3>Personal & academic details</h3><BasicFields form={form} set={set} errors={errors} /></div>
        <div className="card"><h3>Preferences & goals</h3><p className="small muted">Changing language, role, year, level or companies regenerates your roadmap (completed steps are kept).</p><GoalFields form={form} set={set} errors={errors} /></div>
      </div>
    </>
  );
}
