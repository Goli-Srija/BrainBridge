// Portfolio renderer — used both for the live preview and the public page (/p/:slug).
const list = (s) => (Array.isArray(s) ? s : String(s || '').split(',').map((x) => x.trim()).filter(Boolean));

export default function PortfolioView({ data, compact }) {
  const d = data || {};
  return (
    <div style={{ background: '#fff', borderRadius: compact ? 14 : 0, overflow: 'hidden', border: compact ? '1px solid var(--border)' : 'none' }}>
      <div className="pf-hero" style={compact ? { padding: '36px 28px' } : undefined}>
        <h1 style={compact ? { fontSize: '1.8rem' } : undefined}>{d.name || 'Your Name'}</h1>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#5eead4' }}>{d.headline}</p>
        {d.about && <p style={{ maxWidth: 720 }}>{d.about}</p>}
        <div className="row" style={{ marginTop: 14 }}>
          {d.github && <a className="btn btn-sm btn-secondary" href={d.github} target="_blank" rel="noreferrer">GitHub</a>}
          {d.linkedin && <a className="btn btn-sm btn-secondary" href={d.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
          {d.email && <a className="btn btn-sm btn-teal" href={`mailto:${d.email}`}>Contact me</a>}
        </div>
      </div>
      <div style={{ padding: compact ? 24 : '40px 6vw' }} className="stack">
        {list(d.skills).length > 0 && <section><h2>Skills</h2><div className="row" style={{ gap: 6 }}>{list(d.skills).map((s) => <span key={s} className="badge indigo" style={{ fontSize: '0.8rem' }}>{s}</span>)}</div></section>}
        {d.projects?.length > 0 && (
          <section><h2>Projects</h2>
            <div className="grid grid-2">{d.projects.map((p, i) => (
              <div key={i} className="card"><h3>{p.title}</h3><p className="small muted">{p.tech}</p><p className="small">{p.description}</p>
                <div className="row">{p.github && <a href={p.github} target="_blank" rel="noreferrer" className="small">Source code ↗</a>}{p.live && <a href={p.live} target="_blank" rel="noreferrer" className="small">Live demo ↗</a>}</div></div>
            ))}</div>
          </section>
        )}
        {d.internships?.length > 0 && <section><h2>Internships & Experience</h2>{d.internships.map((x, i) => <div key={i} className="mb"><div className="bold">{x.role} — {x.company}</div><div className="small muted">{x.duration}</div><p className="small">{x.description}</p></div>)}</section>}
        {d.education?.length > 0 && <section><h2>Education</h2>{d.education.map((e, i) => <div key={i} className="mb"><div className="bold">{e.degree}</div><div className="small muted">{e.institution} {e.year && `· ${e.year}`} {e.score && `· ${e.score}`}</div></div>)}</section>}
        {d.certifications?.length > 0 && <section><h2>Certifications</h2><ul>{d.certifications.map((c, i) => <li key={i}>{c.name}{c.issuer && ` — ${c.issuer}`}</li>)}</ul></section>}
        {d.achievements?.length > 0 && <section><h2>Achievements</h2><ul>{d.achievements.map((a, i) => <li key={i}>{a.text}</li>)}</ul></section>}
        <section><h2>Contact</h2><p className="small">{[d.email, d.phone, d.location].filter(Boolean).join(' · ')}</p></section>
      </div>
    </div>
  );
}
