import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Async } from '../components/ui';
import PortfolioView from '../modules/PortfolioView';

export default function PublicPortfolio() {
  const { slug } = useParams();
  const state = useApi(`/portfolio/public/${slug}`);
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Async state={state}>{(d) => <PortfolioView data={d.portfolio.data} />}</Async>
      <footer className="footer"><span>Built with <Link to="/" style={{ color: '#5eead4' }}>BrainBridge</Link></span></footer>
    </div>
  );
}
