import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { useHeartbeat } from '../hooks/useHeartbeat';

// The 17 required sidebar items (+ Video Learning & Settings), grouped for readability.
export const NAV = [
  { group: 'Overview', items: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/roadmap', label: 'Learning Roadmap', icon: 'roadmap' },
  ] },
  { group: 'Aptitude', items: [
    { to: '/aptitude', label: 'Aptitude', icon: 'calc' },
    { to: '/logical', label: 'Logical Reasoning', icon: 'puzzle' },
    { to: '/verbal', label: 'Verbal Ability', icon: 'book' },
  ] },
  { group: 'Skills', items: [
    { to: '/programming', label: 'Programming and DSA', icon: 'code' },
    { to: '/communication', label: 'Communication', icon: 'chat' },
    { to: '/brainbuddy', label: 'BrainBuddy', icon: 'chat' },
    { to: '/interview', label: 'Interview Preparation', icon: 'briefcase' },
    { to: '/videos', label: 'Video Learning', icon: 'video' },
  ] },
  { group: 'Career', items: [
    { to: '/resume', label: 'Resume Builder', icon: 'file' },
    { to: '/portfolio', label: 'Portfolio Builder', icon: 'globe' },
    { to: '/projects', label: 'Project Guidance', icon: 'bulb' },
    { to: '/companies', label: 'Company Preparation', icon: 'building' },
    { to: '/mock-interviews', label: 'Mock Interviews', icon: 'mic' },
  ] },
  { group: 'Track', items: [
    { to: '/tracker', label: 'Daily Tracker', icon: 'calendar' },
    { to: '/assessments', label: 'Assessments', icon: 'clipboard' },
    { to: '/progress', label: 'My Progress', icon: 'chart' },
    { to: '/profile', label: 'Profile', icon: 'user' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  useHeartbeat(Boolean(user), setMinutes);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  const initials = (user?.name || '?').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand"><img src="/favicon.svg" alt="" />BrainBridge</div>
        <nav>
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="nav-group">{g.group}</div>
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon name={i.icon} />{i.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="row" style={{ gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#0d9488)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ color: '#fff', fontWeight: 600 }}>{user?.name}</div>
              <div className="truncate tiny" style={{ color: '#8b93c7' }}>{user?.target_role || 'Student'}</div>
            </div>
            <button className="icon-btn" title="Log out" style={{ color: '#c7d2fe' }} onClick={() => { logout(); navigate('/login'); }}><Icon name="logout" /></button>
          </div>
        </div>
      </aside>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}><Icon name="menu" /></button>
          <span className="muted small">One Platform. Every Skill. Your Placement Journey.</span>
          <div className="spacer" />
          {minutes !== null && <span className="badge teal" title="Active study time tracked today"><Icon name="clock" size={13} />{minutes} min today</span>}
        </header>
      
        <main className="content"><Outlet /></main>
      </div>

      {location.pathname !== '/brainbuddy' && (
        <button
          onClick={() => navigate('/brainbuddy')}
          title="Chat with BrainBuddy"
          style={{
            position: 'fixed',
            right: 28,
            bottom: 28,
            zIndex: 1000,
            padding: '14px 20px',
            border: 'none',
            borderRadius: 30,
            background: 'linear-gradient(135deg,#7c3aed,#0d9488)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 5px 20px rgba(124,58,237,.3)',
          }}
        >
          ✨ Ask BrainBuddy
        </button>
      )}
    </div>
  );
}

