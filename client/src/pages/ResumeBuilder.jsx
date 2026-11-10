import { useEffect, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Alert, Async, Field, PageHead, Ring, Tabs, fmtDateTime, useToast } from '../components/ui';
import { SECTION_TITLES, downloadResumePdf, hasContent, lines } from '../modules/resumePdf';

const REPEAT = {
  education: [['institution', 'Institution'], ['degree', 'Degree / Branch'], ['year', 'Years (e.g. 2022 - 2026)'], ['score', 'CGPA / Percentage']],
  experience: [['role', 'Role'], ['company', 'Company'], ['duration', 'Duration'], ['description', 'Bullet points (one per line)', true]],
  internships: [['role', 'Role'], ['company', 'Company'], ['duration', 'Duration'], ['description', 'Bullet points (one per line)', true]],
  projects: [['name', 'Project name'], ['tech', 'Tech stack'], ['link', 'GitHub / live link'], ['description', 'Bullet points (one per line)', true]],
  certifications: [['name', 'Certification'], ['issuer', 'Issuer'], ['year', 'Year']],
  achievements: [['text', 'Achievement']],
};

function Repeat({ k, items, onChange }) {
  const fields = REPEAT[k];
  const update = (i, f, v) => onChange(items.map((x, j) => (j === i ? { ...x, [f]: v } : x)));
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} className="repeat-item">
          <div className="form-grid">
            {fields.map(([f, label, multi]) => (
              <Field key={f} label={label}>{multi ? <textarea className="textarea full" style={{ minHeight: 80 }} value={it[f] || ''} onChange={(e) => update(i, f, e.target.value)} /> : <input className="input" value={it[f] || ''} onChange={(e) => update(i, f, e.target.value)} />}</Field>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            {i > 0 && <button className="btn btn-ghost btn-sm" onClick={() => { const c = [...items]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; onChange(c); }}>Move up</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="trash" />Remove</button>
          </div>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" onClick={() => onChange([...items, Object.fromEntries(fields.map(([f]) => [f, '']))])}><Icon name="plus" />Add {SECTION_TITLES[k].toLowerCase().replace(/s$/, '')}</button>
    </div>
  );
}

function Preview({ data, template }) {
  const p = data.personal || {};
  const accent = template?.accent || '#1e293b';
  return (
    <div className="resume-paper">
      <h1 style={{ color: accent }}>{p.name || 'Your Name'}</h1>
      <div className="r-contact">{[p.email, p.phone, p.location].filter(Boolean).join(' | ')}<br />{[p.linkedin, p.github, p.portfolio].filter(Boolean).join(' | ')}</div>
      {(template?.section_order || []).filter((k) => hasContent(data, k)).map((k) => (
        <div key={k} className="r-section">
          <h4 style={{ color: accent }}>{SECTION_TITLES[k]}</h4>
          {k === 'summary' && <div>{p.summary}</div>}
          {k === 'skills' && [['Languages', data.skills.languages], ['Frameworks & Libraries', data.skills.frameworks], ['Tools & Platforms', data.skills.tools], ['Core Concepts', data.skills.concepts]].filter(([, v]) => v).map(([l, v]) => <div key={l}><strong>{l}:</strong> {v}</div>)}
          {k === 'education' && data.education.map((e, i) => <div key={i} style={{ marginBottom: 4 }}><strong>{e.degree}</strong>{e.institution && ` — ${e.institution}`}<div style={{ color: '#4b5563' }}>{[e.year, e.score].filter(Boolean).join(' | ')}</div></div>)}
          {(k === 'experience' || k === 'internships') && data[k].map((e, i) => <div key={i}><strong>{e.role}</strong>{e.company && ` — ${e.company}`}<span style={{ color: '#4b5563', float: 'right' }}>{e.duration}</span><ul>{lines(e.description).map((l, j) => <li key={j}>{l}</li>)}</ul></div>)}
          {k === 'projects' && data.projects.map((pr, i) => <div key={i}><strong>{pr.name}</strong>{pr.tech && ` | ${pr.tech}`}{pr.link && <div style={{ color: '#4b5563' }}>{pr.link}</div>}<ul>{lines(pr.description).map((l, j) => <li key={j}>{l}</li>)}</ul></div>)}
          {k === 'certifications' && <ul>{data.certifications.map((c, i) => <li key={i}>{[c.name, c.issuer, c.year].filter(Boolean).join(' — ')}</li>)}</ul>}
          {k === 'achievements' && <ul>{data.achievements.filter((a) => a.text).map((a, i) => <li key={i}>{a.text}</li>)}</ul>}
        </div>
      ))}
    </div>
  );
}

function Builder() {
  const list = useApi('/resume');
  const templates = useApi('/resume/templates');
  const toast = useToast();
  const [current, setCurrent] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState('personal');
  const saveTimer = useRef(null);

  const open = async (id) => { const r = await api.get(`/resume/${id}`); setCurrent(r.resume); setDirty(false); };
  useEffect(() => { if (list.data?.resumes.length && !current) open(list.data.resumes[0].id); }, [list.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (template_key = 'fresher') => {
    setBusy(true);
    try { const r = await api.post('/resume', { template_key, title: `Resume ${(list.data?.resumes.length || 0) + 1}` }); setCurrent(r.resume); list.reload(); toast('New resume created.'); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const save = async (silent) => {
    if (!current) return;
    try { const r = await api.put(`/resume/${current.id}`, { data: current.data, template_key: current.template_key, title: current.title }); setDirty(false); if (!silent) toast('Resume saved.'); list.reload(); return r; }
    catch (e) { toast(e.message, 'error'); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this resume permanently?')) return;
    await api.del(`/resume/${current.id}`); setCurrent(null); list.reload(); toast('Resume deleted.');
  };
  const update = (fn) => { setCurrent((c) => ({ ...c, data: fn(c.data) })); setDirty(true); };
  // Autosave 2 seconds after the last change.
  useEffect(() => { if (!dirty) return undefined; clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => save(true), 2000); return () => clearTimeout(saveTimer.current); }, [current, dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const tpl = templates.data?.templates.find((t) => t.key === current?.template_key);

  return (
    <Async state={list}>
      {(l) => !l.resumes.length && !current ? (
        <div className="card center-state">
          <h3>Create your first resume</h3><p>Pick a template — you can switch any time without losing content.</p>
          <div className="grid grid-auto mt">{templates.data?.templates.map((t) => (
            <button key={t.key} className="card hover" style={{ textAlign: 'left', cursor: 'pointer', borderTop: `4px solid ${t.accent}` }} disabled={busy} onClick={() => create(t.key)}><h3>{t.name}</h3><p className="small muted">{t.description}</p></button>
          ))}</div>
        </div>
      ) : current && (
        <>
          <div className="card mb">
            <div className="row">
              <select className="select" style={{ width: 200 }} value={current.id} onChange={(e) => open(e.target.value)} aria-label="Select resume">{l.resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select>
              <input className="input" style={{ width: 200 }} value={current.title} onChange={(e) => { setCurrent({ ...current, title: e.target.value }); setDirty(true); }} aria-label="Resume title" />
              <select className="select" style={{ width: 220 }} value={current.template_key} onChange={(e) => { setCurrent({ ...current, template_key: e.target.value }); setDirty(true); }} aria-label="Template">{templates.data?.templates.map((t) => <option key={t.key} value={t.key}>Template: {t.name}</option>)}</select>
              <div style={{ flex: 1 }} />
              <span className="tiny muted">{dirty ? 'Unsaved changes…' : 'All changes saved'}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => save(false)}>Save</button>
              <button className="btn btn-sm" onClick={() => tpl && downloadResumePdf(current.data, tpl, `${(current.data.personal.name || 'resume').replace(/\s+/g, '_')}.pdf`)}><Icon name="download" />Download PDF</button>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Print</button>
              <button className="btn btn-ghost btn-sm" onClick={() => create(current.template_key)} disabled={busy}><Icon name="plus" />New</button>
              <button className="btn btn-ghost btn-sm" onClick={remove}><Icon name="trash" /></button>
            </div>
          </div>
          <div className="resume-layout">
            <div className="card">
              <div className="row mb" style={{ gap: 6 }}>{['personal', 'education', 'skills', 'experience', 'internships', 'projects', 'certifications', 'achievements'].map((s) => <button key={s} className={`chip ${section === s ? 'active' : ''}`} onClick={() => setSection(s)} style={{ textTransform: 'capitalize' }}>{s}</button>)}</div>
              {section === 'personal' && (
                <div className="form-grid">
                  {[['name', 'Full name'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'City, State'], ['linkedin', 'LinkedIn URL'], ['github', 'GitHub URL'], ['portfolio', 'Portfolio URL']].map(([f, label]) => (
                    <Field key={f} label={label}><input className="input" value={current.data.personal[f] || ''} onChange={(e) => update((d) => ({ ...d, personal: { ...d.personal, [f]: e.target.value } }))} /></Field>
                  ))}
                  <div className="full"><Field label="Professional summary" hint="2-3 lines: who you are, key skills, what role you want."><textarea className="textarea" value={current.data.personal.summary || ''} onChange={(e) => update((d) => ({ ...d, personal: { ...d.personal, summary: e.target.value } }))} /></Field></div>
                </div>
              )}
              {section === 'skills' && (
                <div className="stack">
                  {[['languages', 'Programming languages', 'Java, Python, C, SQL'], ['frameworks', 'Frameworks & libraries', 'Spring Boot, React, Express'], ['tools', 'Tools & platforms', 'Git, GitHub, VS Code, PostgreSQL, Docker'], ['concepts', 'Core concepts', 'DSA, OOP, DBMS, Operating Systems, REST APIs']].map(([f, label, ph]) => (
                    <Field key={f} label={label}><input className="input" placeholder={ph} value={current.data.skills[f] || ''} onChange={(e) => update((d) => ({ ...d, skills: { ...d.skills, [f]: e.target.value } }))} /></Field>
                  ))}
                </div>
              )}
              {REPEAT[section] && <Repeat k={section} items={current.data[section] || []} onChange={(v) => update((d) => ({ ...d, [section]: v }))} />}
              <div className="alert alert-info mt"><div className="small"><strong>ATS tips:</strong> start bullets with action verbs (Built, Implemented, Optimised), add numbers ("used by 200 students"), keep it to one page, and avoid tables/images — this builder exports plain, selectable text.</div></div>
            </div>
            <Preview data={current.data} template={tpl} />
          </div>
        </>
      )}
    </Async>
  );
}

function Analyzer() {
  const roles = useApi('/resume/roles');
  const history = useApi('/resume/analysis');
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('Software Developer');
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const analyze = async (e) => {
    e.preventDefault();
    if (!file) return toast('Choose a PDF or DOCX file first.', 'error');
    if (!/\.(pdf|docx)$/i.test(file.name)) return toast('Only PDF and DOCX files are supported.', 'error');
    if (file.size > 5 * 1024 * 1024) return toast('File must be under 5 MB.', 'error');
    const form = new FormData(); form.append('file', file); form.append('role', role); form.append('job_description', jd);
    setBusy(true);
    try { const r = await api.post('/resume/analyze', form); setResult(r); history.reload(); }
    catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="stack">
        <form className="card stack" onSubmit={analyze}>
          <h3>Upload your resume</h3>
          <Field label="Resume file (PDF or DOCX, max 5 MB)"><input className="input" type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0] || null)} /></Field>
          <Field label="Target role"><select className="select" value={role} onChange={(e) => setRole(e.target.value)}>{roles.data?.roles.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Job description (optional)" hint="Paste a job post to also check its most frequent keywords."><textarea className="textarea" value={jd} onChange={(e) => setJd(e.target.value)} /></Field>
          <button className="btn" disabled={busy}>{busy ? 'Analysing...' : 'Analyse resume'}</button>
          <p className="tiny muted" style={{ margin: 0 }}>The file is parsed on the server (real text extraction) and scored with fixed rules. Only the score and feedback are stored, not the file.</p>
        </form>
        <div className="card"><h3>Previous analyses</h3>
          <Async state={history}>{(h) => h.analyses.length ? <div className="list">{h.analyses.map((a) => <div key={a.id} className="list-item small"><span className="bold" style={{ flex: 1 }}>{a.file_name}</span><span className="muted">{a.target_role}</span><span className="badge indigo">{a.score}</span><span className="tiny muted">{fmtDateTime(a.created_at)}</span></div>)}</div> : <p className="small muted">No analyses yet.</p>}</Async>
        </div>
      </div>
      <div className="card">
        {!result ? <div className="center-state"><h3>Your ATS report appears here</h3><p>Checks contact details, sections, keywords, impact, formatting and language.</p></div> : (
          <div className="stack">
            <div className="row" style={{ gap: 20 }}><Ring value={result.score} size={130} label="ATS score" /><div><h3>{result.fileName}</h3><p className="small muted">{result.wordCount} words · {result.pages} page(s) · role: {result.role}</p></div></div>
            <Alert kind="warn"><div className="small">{result.disclaimer}</div></Alert>
            {Object.entries(result.breakdown).map(([k, v]) => (
              <div key={k}><div className="row between small"><span className="bold" style={{ textTransform: 'capitalize' }}>{k}</span><span>{v.score}/{v.max}</span></div><div className="progress"><span style={{ width: `${(v.score / v.max) * 100}%` }} /></div><ul className="tiny muted" style={{ margin: '4px 0 0', paddingLeft: 16 }}>{v.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
            ))}
            {result.missingKeywords.length > 0 && <div><h4>Missing keywords</h4><div className="row" style={{ gap: 6 }}>{result.missingKeywords.map((k) => <span key={k} className="badge hard">{k}</span>)}</div><p className="tiny muted">Only add keywords for skills you genuinely have.</p></div>}
            {result.suggestions.length > 0 && <div><h4>Suggestions</h4><ul className="small">{result.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumeBuilder() {
  const [tab, setTab] = useState('builder');
  return (
    <>
      <PageHead title="Resume Builder & ATS Analyzer" subtitle="Build ATS-friendly resumes from five templates, export real text PDFs and check any resume against role keywords." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'builder', label: 'Resume builder' }, { value: 'ats', label: 'ATS analyzer' }]} />
      {tab === 'builder' ? <Builder /> : <Analyzer />}
    </>
  );
}
