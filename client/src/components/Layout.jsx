import { useEffect, useState } from 'react';
import { Link } from '../router.jsx';
import { useStore } from '../store.jsx';

const ICONS = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  projects: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h7" /></svg>,
  people: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  moon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>,
};

const NAV = [
  { to: '/', key: 'home', label: 'Home', exact: true },
  { to: '/calendar', key: 'calendar', label: 'Calendar' },
  { to: '/projects', key: 'projects', label: 'Projects' },
  { to: '/people', key: 'people', label: 'People' },
];

function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);
  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))];
}

export function Layout({ children }) {
  const [theme, toggleTheme] = useTheme();
  const { error, clearError } = useStore();
  const links = NAV.map(n => <Link key={n.key} to={n.to} exact={n.exact} activeClass="active">{ICONS[n.key]}<span>{n.label}</span></Link>);
  const themeIcon = theme === 'dark' ? ICONS.sun : ICONS.moon;
  const themeLabel = theme === 'dark' ? 'Light mode' : 'Dark mode';

  return (
    <div className="app">
      <aside className="rail">
        <Link to="/" className="brand">
          <div className="brand-mark">BS</div>
          <div><div className="brand-name">Barnes Spring</div><div className="brand-sub">Renovations</div></div>
        </Link>
        <nav className="nav">{links}</nav>
        <div className="rail-foot">
          <span>13904 Barnes Spring Rd<br />Built 1979</span>
          <button className="btn sm ghost" onClick={toggleTheme} style={{ justifyContent: 'flex-start', marginLeft: -10 }}>
            <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{themeIcon}</span>{themeLabel}
          </button>
        </div>
      </aside>
      <main><div className="page">{children}</div></main>
      <nav className="tabbar">
        {links}
        <button onClick={toggleTheme} aria-label={themeLabel}>{themeIcon}<span>Theme</span></button>
      </nav>
      {error && <div className="banner" role="alert">{error}<button onClick={clearError} aria-label="Dismiss">✕</button></div>}
    </div>
  );
}
