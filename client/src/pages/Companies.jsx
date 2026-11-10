import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Async, Empty, PageHead } from '../components/ui';

export default function Companies() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [type, setType] = useState('');
  const state = useApi(`/companies${type ? `?type=${type}` : ''}`, [type]);
  const targets = (user?.target_companies || []).map((c) => c.toLowerCase());

  return (
    <>
      <PageHead title="Company Preparation" subtitle="Preparation guides for 27 product and service companies. Unverified facts are clearly labelled — always confirm on official career pages." />
      <div className="card mb"><div className="row">
        <input className="input" style={{ flex: '1 1 220px' }} placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {[['', 'All'], ['product', 'Product-based'], ['service', 'Service-based']].map(([v, l]) => <button key={v} className={`chip ${type === v ? 'active' : ''}`} onClick={() => setType(v)}>{l}</button>)}
      </div></div>
      <Async state={state}>
        {(d) => {
          const list = d.companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
          return list.length ? (
            <div className="grid grid-auto">
              {list.map((c) => (
                <Link key={c.slug} to={`/companies/${c.slug}`} className="card hover stack" style={{ color: 'inherit', textDecoration: 'none', gap: 8 }}>
                  <div className="row between">
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: c.type === 'product' ? 'var(--violet-50)' : 'var(--teal-50)', color: c.type === 'product' ? 'var(--violet)' : 'var(--teal)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{c.name[0]}</div>
                    <div className="row" style={{ gap: 4 }}>{targets.some((t) => c.name.toLowerCase().includes(t)) && <span className="badge violet">Your target</span>}<span className="badge">{c.type}</span></div>
                  </div>
                  <h3 style={{ margin: 0 }}>{c.name}</h3>
                  <p className="small muted" style={{ margin: 0 }}>{c.overview}</p>
                  <span className="tiny muted">HQ: {c.headquarters}</span>
                </Link>
              ))}
            </div>
          ) : <Empty title="No companies match your search" />;
        }}
      </Async>
    </>
  );
}
