import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';

const FEATURES = [
  ['roadmap', 'indigo', 'Personalised roadmap', 'A four-stage plan built from your year, language, target role and level.'],
  ['calc', 'violet', 'Aptitude & reasoning', '2,100+ quant, logical and verbal questions with timed quizzes and explanations.'],
  ['code', 'teal', 'Coding practice', 'Original problems with an in-browser editor and real execution in Java, Python and C.'],
  ['chat', 'amber', 'Communication', 'Lessons and placement exercises with transparent rubric-based feedback.'],
  ['file', 'indigo','file', 'indigo', 'Resume & ATS check', 'Applicant Tracking System (ATS)-friendly templates, PDF export and a rule-based resume analyzer.'],
  ['mic', 'violet', 'Mock interviews', 'Four role-based tracks with progressive questions and a final report.'],
  ['building', 'teal', 'Company preparation', '27 companies with process guidance clearly separated from unverified facts.'],
  ['calendar', 'amber', 'Daily tracker', 'Goals, streaks, a study calendar and analytics based on real activity.'],
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="landing">
      <header className="land-nav">
        <div className="brand"><img src="/favicon.svg" alt="" />BrainBridge</div>
        <div className="row">
          {user ? <Link className="btn" to="/dashboard">Go to dashboard</Link> : (<>
            <Link className="btn btn-ghost" to="/login">Log in</Link>
            <Link className="btn" to="/register">Get started</Link>
          </>)}
        </div>
      </header>

      <section className="hero">
        <div className="tagline">One Platform. Every Skill. Your Placement Journey.</div>
        <h1>Everything you need to get placement-ready — in one place.</h1>
        <p>BrainBridge brings aptitude, programming, DSA, communication, interviews, resumes, portfolios and company preparation together, and guides you from first year to your first offer.</p>
        <div className="row" style={{ marginTop: 26 }}>
          <Link className="btn btn-lg btn-teal" to={user ? '/dashboard' : '/register'}>Start preparing free <Icon name="arrowRight" /></Link>
          <a className="btn btn-lg btn-secondary" href="#features">Explore features</a>
        </div>
        <div className="hero-stats">
          <div><strong>2,100+</strong><span>Aptitude questions</span></div>
          <div><strong>150+</strong><span>Structured lessons</span></div>
          <div><strong>60</strong><span>Verified coding problems</span></div>
          <div><strong>180</strong><span>Project ideas · 12 roles</span></div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <h2>Stop juggling ten different websites</h2>
          <p>Every module is connected: what you practise updates your daily tracker, streak, roadmap and placement readiness score.</p>
        </div>
        <div className="grid grid-4">
          {FEATURES.map(([icon, tone, title, text]) => (
            <div className="card feature hover" key={title}>
              <div className={`stat-icon tone-${tone}`}><Icon name={icon} /></div>
              <h3>{title}</h3>
              <p className="muted small">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <div className="section-head"><h2>Built for every year of engineering</h2><p>Your roadmap adapts as you grow.</p></div>
        <div className="grid grid-4">
          {[['Stage 1', 'Foundation', 'Programming basics, maths, computer fundamentals, English and logic.'], ['Stage 2', 'Intermediate', 'DSA, OOPs, DBMS, SQL, aptitude and verbal ability.'], ['Stage 3', 'Advanced', 'Advanced DSA, core CS, system design basics and technical interviews.'], ['Stage 4', 'Placement Ready', 'Company prep, resume, portfolio, mock interviews and assessments.']].map(([s, t, d]) => (
            <div className="card" key={s}><span className="badge indigo">{s}</span><h3 className="mt" style={{ marginTop: 10 }}>{t}</h3><p className="muted small">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="section" style={{ textAlign: 'center' }}>
        <h2>Ready to bridge the gap?</h2>
        <p className="muted">Create a free account, complete a 2-minute onboarding and get your personalised plan.</p>
        <Link className="btn btn-lg" to={user ? '/dashboard' : '/register'}>Create my roadmap</Link>
      </section>

      <footer className="footer">
        <div className="brand" style={{ color: '#fff' }}><img src="/favicon.svg" alt="" />BrainBridge</div>
        <div>Academic capstone project · React · Node.js · Express · PostgreSQL</div>
      </footer>
    </div>
  );
}
