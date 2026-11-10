import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import Icon from '../components/Icon';
import { Async, PageHead, Tabs } from '../components/ui';

function VideoCard({ v }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="card stack" style={{ gap: 8 }}>
      {play ? (
        <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${v.embed_id}?autoplay=1`} title={v.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
      ) : (
        <button onClick={() => setPlay(true)} style={{ border: 'none', padding: 0, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#000' }} aria-label={`Play ${v.title}`}>
          <img src={`https://i.ytimg.com/vi/${v.embed_id}/hqdefault.jpg`} alt="" style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover', opacity: 0.85 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff' }}><Icon name="play" size={44} /></span>
        </button>
      )}
      <div className="row between"><span className="badge indigo">{v.category}</span><span className="tiny muted">{v.source}</span></div>
      <h4 style={{ margin: 0 }}>{v.title}</h4>
      <p className="small muted" style={{ margin: 0 }}>{v.description}</p>
      <a className="small" href={v.url} target="_blank" rel="noreferrer">Open on YouTube ↗</a>
    </div>
  );
}

export default function Videos() {
  const state = useApi('/resources');
  const guides = useApi('/resources/guides');
  const [cat, setCat] = useState('');
  const [tab, setTab] = useState('videos');
  return (
    <>
      <PageHead title="Video Learning & Resources" subtitle="Hand-picked free videos, official documentation, practice platforms and career guidance. Written lessons remain available in every module." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'videos', label: 'Videos' }, { value: 'links', label: 'Courses, docs & platforms' }, { value: 'guides', label: 'Career guidance' }]} />
      {tab !== 'guides' ? (
        <Async state={state}>
          {(d) => {
            const items = d.resources.filter((r) => (tab === 'videos' ? r.kind === 'video' : r.kind !== 'video') && (!cat || r.category === cat));
            const cats = [...new Set(d.resources.filter((r) => (tab === 'videos' ? r.kind === 'video' : r.kind !== 'video')).map((r) => r.category))].sort();
            return (
              <>
                <div className="row mb" style={{ gap: 6 }}><button className={`chip ${!cat ? 'active' : ''}`} onClick={() => setCat('')}>All</button>{cats.map((c) => <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>
                {tab === 'videos' && <p className="small muted">Videos play in a privacy-enhanced YouTube embed. Categories without a verified video (e.g. aptitude, verbal, communication) are covered under "Courses, docs & platforms".</p>}
                {tab === 'videos' ? (
                  <div className="grid grid-3">{items.map((v) => <VideoCard key={v.id} v={v} />)}</div>
                ) : (
                  <div className="grid grid-2">{items.map((r) => (
                    <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="card hover" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <div className="row between"><span className="badge indigo">{r.category}</span><span className="badge">{r.kind}</span></div>
                      <h4 className="mt" style={{ marginTop: 8 }}>{r.title} <Icon name="external" size={13} /></h4>
                      <p className="small muted" style={{ margin: 0 }}>{r.description}</p><span className="tiny muted">{r.source}</span>
                    </a>
                  ))}</div>
                )}
              </>
            );
          }}
        </Async>
      ) : (
        <Async state={guides}>{(g) => <div className="grid grid-2">{g.guides.map((x) => <div key={x.key} className="card"><h3>{x.title}</h3><ul className="prose small" style={{ margin: 0 }}>{x.points.map((p) => <li key={p}>{p}</li>)}</ul></div>)}</div>}</Async>
      )}
    </>
  );
}
