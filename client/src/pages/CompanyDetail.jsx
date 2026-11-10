import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Alert, Async, PageHead, useToast } from '../components/ui';

const LABEL = { official: 'Official', guidance: 'General guidance', not_verified: 'Not verified' };

export default function CompanyDetail() {
  const { slug } = useParams();
  const state = useApi(`/companies/${slug}`);
  const toast = useToast();
  const bookmark = async (id) => { const r = await api.post('/bookmarks/toggle', { item_type: 'company', item_id: id }); toast(r.bookmarked ? 'Company bookmarked' : 'Bookmark removed'); };
  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead back={{ to: '/companies', label: 'All companies' }} title={d.company.name} subtitle={`${d.company.type === 'product' ? 'Product-based' : 'Service-based'} · Headquarters: ${d.company.headquarters}`}
            actions={<><button className="btn btn-secondary btn-sm" onClick={() => bookmark(d.company.id)}><Icon name="bookmark" />Bookmark</button><a className="btn btn-sm" href={d.company.careers_url} target="_blank" rel="noreferrer"><Icon name="external" />Official careers site</a></>} />
          <Alert kind="warn"><Icon name="target" size={18} /><div><strong>How to read this page:</strong> sections marked <span className="badge guidance">General guidance</span> describe typical preparation and commonly reported processes; <span className="badge not_verified">Not verified</span> means BrainBridge has not confirmed it. Hiring processes change every year — check the official careers site and your placement cell. No previous-year questions are reproduced here.</div></Alert>
          <div className="grid grid-2 mt">
            <div className="card"><h3>Overview</h3><p>{d.company.overview}</p></div>
            <div className="card"><h3>Products & services</h3><p>{d.company.products}</p></div>
          </div>
          <div className="grid grid-2 mt">
            {d.sections.map((s) => (
              <div key={s.section} className="card">
                <div className="card-title"><h3>{s.title}</h3><span className={`badge ${s.verification}`}>{LABEL[s.verification]}</span></div>
                <ul className="prose small" style={{ margin: 0 }}>{s.content.map((c, i) => <li key={i}>{c.startsWith('http') || c.includes('https://') ? <span>{c.split(/(https?:\/\/\S+)/).map((part, j) => (part.startsWith('http') ? <a key={j} href={part} target="_blank" rel="noreferrer">{part}</a> : part))}</span> : c}</li>)}</ul>
              </div>
            ))}
          </div>
        </>
      )}
    </Async>
  );
}
