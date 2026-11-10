import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Async, Field, PageHead, Tabs, useToast } from '../components/ui';
import PortfolioView from '../modules/PortfolioView';

const GUIDE = [
  ['What is a portfolio?', 'A portfolio is a personal web page that shows who you are, what you can build and how to contact you. Unlike a resume, it lets recruiters see and try your work.'],
  ['Why recruiters need it', 'Recruiters screen hundreds of candidates. Working links to projects and clean GitHub repositories prove your skills faster than claims on a resume.'],
  ['How to build one', 'Fill in each section here, keep the About short (3-4 lines), and pick your 3-4 best projects. Publish it and add the link to your resume and LinkedIn.'],
  ['How to present projects', 'For each project: the problem, what you built, the tech stack, your role, and a measurable result. Add screenshots or a demo video in the repository README.'],
  ['How to connect GitHub', 'Add your GitHub profile URL. Pin your best repositories, write a profile README, and make sure every project repo has a clear README with setup steps.'],
  ['How to add live project links', 'Deploy frontends on static hosting (e.g. Render static sites) and APIs on a web service. Paste the live URL in the project\'s "Live link" field — test it in a private browser window first.'],
  ['How to showcase skills', 'List skills you can discuss confidently in an interview. Group them by languages, frameworks and tools, and make sure each appears in at least one project.'],
];

const blank = { projects: { title: '', tech: '', description: '', github: '', live: '' }, internships: { role: '', company: '', duration: '', description: '' }, education: { institution: '', degree: '', year: '', score: '' }, certifications: { name: '', issuer: '' }, achievements: { text: '' } };

function Items({ k, items, set, fields }) {
  const upd = (i, f, v) => set(items.map((x, j) => (j === i ? { ...x, [f]: v } : x)));
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} className="repeat-item">
          <div className="form-grid">{fields.map(([f, l, multi]) => <Field key={f} label={l}>{multi ? <textarea className="textarea" style={{ minHeight: 70 }} value={it[f] || ''} onChange={(e) => upd(i, f, e.target.value)} /> : <input className="input" value={it[f] || ''} onChange={(e) => upd(i, f, e.target.value)} />}</Field>)}</div>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}><button className="btn btn-ghost btn-sm" onClick={() => set(items.filter((_, j) => j !== i))}><Icon name="trash" />Remove</button></div>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" onClick={() => set([...items, { ...blank[k] }])}><Icon name="plus" />Add</button>
    </div>
  );
}

export default function Portfolio() {
  const state = useApi('/portfolio');
  const toast = useToast();
  const [pf, setPf] = useState(null);
  const [tab, setTab] = useState('edit');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (state.data) setPf({ ...state.data.portfolio, data: { ...state.data.portfolio.data, skills: Array.isArray(state.data.portfolio.data.skills) ? state.data.portfolio.data.skills.join(', ') : state.data.portfolio.data.skills || '' } }); }, [state.data]);
  const set = (k, v) => setPf((p) => ({ ...p, data: { ...p.data, [k]: v } }));

  const save = async () => {
    setBusy(true);
    try {
      const data = { ...pf.data, skills: String(pf.data.skills || '').split(',').map((s) => s.trim()).filter(Boolean) };
      const r = await api.put('/portfolio', { data, is_public: pf.is_public, slug: pf.slug });
      setPf({ ...r.portfolio, data: { ...r.portfolio.data, skills: r.portfolio.data.skills.join(', ') } });
      toast(r.message);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const publicUrl = pf ? `${window.location.origin}/p/${pf.slug}` : '';

  return (
    <Async state={state}>
      {() => pf && (
        <>
          <PageHead title="Portfolio Builder" subtitle="Create a personal portfolio page that you can share with recruiters." actions={<button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save portfolio'}</button>} />
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview' }, { value: 'guide', label: 'Portfolio guide' }]} />
          {tab === 'edit' && (
            <div className="grid grid-2" style={{ alignItems: 'start' }}>
              <div className="stack">
                <div className="card stack">
                  <h3>About me</h3>
                  <div className="form-grid">
                    <Field label="Name"><input className="input" value={pf.data.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
                    <Field label="Headline"><input className="input" value={pf.data.headline || ''} onChange={(e) => set('headline', e.target.value)} placeholder="Aspiring Java Developer" /></Field>
                    <div className="full"><Field label="About"><textarea className="textarea" value={pf.data.about || ''} onChange={(e) => set('about', e.target.value)} /></Field></div>
                    <div className="full"><Field label="Skills (comma separated)"><input className="input" value={pf.data.skills || ''} onChange={(e) => set('skills', e.target.value)} placeholder="Java, Spring Boot, SQL, React" /></Field></div>
                  </div>
                </div>
                <div className="card"><h3>Projects</h3><Items k="projects" items={pf.data.projects || []} set={(v) => set('projects', v)} fields={[['title', 'Title'], ['tech', 'Tech stack'], ['github', 'GitHub URL'], ['live', 'Live link'], ['description', 'Description', true]]} /></div>
                <div className="card"><h3>Internships</h3><Items k="internships" items={pf.data.internships || []} set={(v) => set('internships', v)} fields={[['role', 'Role'], ['company', 'Company'], ['duration', 'Duration'], ['description', 'What you did', true]]} /></div>
              </div>
              <div className="stack">
                <div className="card stack">
                  <h3>Links & contact</h3>
                  <div className="form-grid">
                    <Field label="GitHub URL"><input className="input" value={pf.data.github || ''} onChange={(e) => set('github', e.target.value)} placeholder="https://github.com/username" /></Field>
                    <Field label="LinkedIn URL"><input className="input" value={pf.data.linkedin || ''} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/username" /></Field>
                    <Field label="Email"><input className="input" value={pf.data.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
                    <Field label="Phone"><input className="input" value={pf.data.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
                    <Field label="Location"><input className="input" value={pf.data.location || ''} onChange={(e) => set('location', e.target.value)} /></Field>
                  </div>
                </div>
                <div className="card"><h3>Education</h3><Items k="education" items={pf.data.education || []} set={(v) => set('education', v)} fields={[['institution', 'Institution'], ['degree', 'Degree'], ['year', 'Year'], ['score', 'CGPA']]} /></div>
                <div className="card"><h3>Certifications</h3><Items k="certifications" items={pf.data.certifications || []} set={(v) => set('certifications', v)} fields={[['name', 'Name'], ['issuer', 'Issuer']]} /></div>
                <div className="card"><h3>Achievements</h3><Items k="achievements" items={pf.data.achievements || []} set={(v) => set('achievements', v)} fields={[['text', 'Achievement']]} /></div>
                <div className="card stack">
                  <h3>Publishing</h3>
                  <Field label="Portfolio URL name" hint="Lowercase letters, numbers and dashes."><input className="input" value={pf.slug} onChange={(e) => setPf({ ...pf, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Field>
                  <label className="checkbox"><input type="checkbox" checked={pf.is_public} onChange={(e) => setPf({ ...pf, is_public: e.target.checked })} />Make my portfolio public</label>
                  {pf.is_public && !pf.isNew && <div className="small">Public link (after saving): <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a> <button className="link-btn small" onClick={() => { navigator.clipboard?.writeText(publicUrl); toast('Link copied'); }}>Copy</button></div>}
                </div>
              </div>
            </div>
          )}
          {tab === 'preview' && <PortfolioView data={{ ...pf.data, skills: String(pf.data.skills || '').split(',').map((s) => s.trim()).filter(Boolean) }} compact />}
          {tab === 'guide' && <div className="grid grid-2">{GUIDE.map(([t, d]) => <div key={t} className="card"><h3>{t}</h3><p className="small muted" style={{ margin: 0 }}>{d}</p></div>)}</div>}
        </>
      )}
    </Async>
  );
}
