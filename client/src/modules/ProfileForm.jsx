// Profile / preferences form, shared by Onboarding (step by step) and the Profile page.
import { Field } from '../components/ui';
import { BRANCHES, COMPANIES, LANGS, LEVELS, ROLES, YEARS } from './constants';

export function validateProfile(f) {
  const e = {};
  if (!f.name || f.name.trim().length < 2) e.name = 'Enter your name.';
  if (!f.college || f.college.trim().length < 2) e.college = 'Enter your college.';
  if (!f.branch) e.branch = 'Select your branch.';
  if (!f.academic_year) e.academic_year = 'Select your academic year.';
  const gy = Number(f.graduation_year);
  if (!gy || gy < 2000 || gy > 2100) e.graduation_year = 'Enter a valid graduation year.';
  if (!f.preferred_language) e.preferred_language = 'Choose a language.';
  if (!f.target_role) e.target_role = 'Choose a target role.';
  if (!f.preparation_level) e.preparation_level = 'Choose your level.';
  const m = Number(f.daily_goal_minutes);
  if (!m || m < 10 || m > 720) e.daily_goal_minutes = 'Between 10 and 720 minutes.';
  return e;
}

export function BasicFields({ form, set, errors }) {
  return (
    <div className="form-grid">
      <Field label="Full name" error={errors.name}><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
      <Field label="Email"><input className="input" value={form.email || ''} disabled /></Field>
      <Field label="College" error={errors.college}><input className="input" value={form.college || ''} onChange={(e) => set('college', e.target.value)} placeholder="e.g. Andhra University College of Engineering" /></Field>
      <Field label="Branch" error={errors.branch}>
        <select className="select" value={form.branch || ''} onChange={(e) => set('branch', e.target.value)}><option value="">Select branch</option>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select>
      </Field>
      <Field label="Academic year" error={errors.academic_year}>
        <select className="select" value={form.academic_year || ''} onChange={(e) => set('academic_year', e.target.value)}><option value="">Select year</option>{YEARS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </Field>
      <Field label="Graduation year" error={errors.graduation_year}><input className="input" type="number" min="2000" max="2100" value={form.graduation_year || ''} onChange={(e) => set('graduation_year', e.target.value)} /></Field>
    </div>
  );
}

export function GoalFields({ form, set, errors }) {
  const companies = form.target_companies || [];
  const toggle = (c) => set('target_companies', companies.includes(c) ? companies.filter((x) => x !== c) : [...companies, c].slice(0, 15));
  return (
    <div className="stack">
      <Field label="Programming language preference" error={errors.preferred_language}>
        <div className="row">{LANGS.map(([v, l]) => <button type="button" key={v} className={`chip ${form.preferred_language === v ? 'active' : ''}`} onClick={() => set('preferred_language', v)}>{l}</button>)}</div>
      </Field>
      <Field label="Target job role" error={errors.target_role}>
        <select className="select" value={form.target_role || ''} onChange={(e) => set('target_role', e.target.value)}><option value="">Select role</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
      </Field>
      <Field label="Target companies" hint="Pick up to 15 — your roadmap adds preparation steps for the first five.">
        <div className="row" style={{ gap: 6 }}>{COMPANIES.map((c) => <button type="button" key={c} className={`chip ${companies.includes(c) ? 'active' : ''}`} onClick={() => toggle(c)}>{c}</button>)}</div>
      </Field>
      <div className="form-grid">
        <Field label="Preparation level" error={errors.preparation_level}>
          <select className="select" value={form.preparation_level || ''} onChange={(e) => set('preparation_level', e.target.value)}>{LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Field>
        <Field label="Daily study goal (minutes)" error={errors.daily_goal_minutes}><input className="input" type="number" min="10" max="720" value={form.daily_goal_minutes || ''} onChange={(e) => set('daily_goal_minutes', e.target.value)} /></Field>
      </div>
    </div>
  );
}
