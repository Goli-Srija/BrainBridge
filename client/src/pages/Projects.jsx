import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Async, Empty, PageHead, useToast } from '../components/ui';

function ProjectCard({ p, onBookmark }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <div className="row between"><div className="row" style={{ gap: 6 }}><span className={`badge ${p.difficulty}`}>{p.difficulty}</span><span className="badge">{p.role}</span></div>
        <button className="icon-btn" title={p.bookmarked ? 'Remove bookmark' : 'Bookmark'} style={{ color: p.bookmarked ? 'var(--violet)' : undefined }} onClick={() => onBookmark(p)}><Icon name="bookmark" /></button></div>
      <h3 className="mt" style={{ marginTop: 10 }}>{p.title}</h3>
      <p className="small"><strong>Problem:</strong> {p.problem_statement}</p>
      <div className="row" style={{ gap: 4 }}>{p.tech_stack.map((t) => <span key={t} className="badge indigo">{t}</span>)}</div>
      {open && (
        <div className="prose small mt">
          <p>{p.description}</p>
          <h4>Features</h4><ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
          <h4>Suggested architecture</h4><p>{p.architecture}</p>
          <h4>Expected output</h4><p>{p.expected_output}</p>
          <h4>Skills demonstrated</h4><p>{p.skills.join(', ')}</p>
          <h4>Resume line</h4><div className="alert alert-success"><div>{p.resume_description}</div></div>
          <h4>Interview questions to prepare</h4><ul>{p.interview_questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
      )}
      <button className="link-btn small mt" onClick={() => setOpen(!open)}>{open ? 'Show less' : 'View full project plan →'}</button>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const role = params.get('role') ?? user?.target_role ?? '';
  const difficulty = params.get('difficulty') || '';
  const state = useApi(`/projects?role=${encodeURIComponent(role)}&difficulty=${difficulty}`, [role, difficulty]);
  const toast = useToast();
  const set = (k, v) => { const p = new URLSearchParams(params); p.set(k, v); setParams(p); };
  const bookmark = async (p) => { const r = await api.post('/bookmarks/toggle', { item_type: 'project', item_id: p.id }); toast(r.bookmarked ? 'Project bookmarked' : 'Bookmark removed'); state.reload(); };

  return (
    <>
      <PageHead title="Project Guidance" subtitle="15 project ideas for each of 12 roles — beginner to advanced — with architecture, features, resume lines and interview questions." />
      <div className="card mb">
        <div className="row">
          <select className="select" style={{ width: 260 }} value={role} onChange={(e) => set('role', e.target.value)} aria-label="Role">
            <option value="">All roles</option>{state.data?.roles.map((r) => <option key={r.role} value={r.role}>{r.role} ({r.count})</option>)}
          </select>
          {['', 'beginner', 'intermediate', 'advanced'].map((d) => <button key={d} className={`chip ${difficulty === d ? 'active' : ''}`} onClick={() => set('difficulty', d)}>{d || 'All levels'}</button>)}
          {user?.target_role && role !== user.target_role && <button className="btn btn-ghost btn-sm" onClick={() => set('role', user.target_role)}>Show my target role</button>}
        </div>
      </div>
      <Async state={state}>
        {(d) => d.projects.length ? <div className="grid grid-2">{d.projects.map((p) => <ProjectCard key={p.id} p={p} onBookmark={bookmark} />)}</div> : <Empty title="No projects found" />}
      </Async>
    </>
  );
}
