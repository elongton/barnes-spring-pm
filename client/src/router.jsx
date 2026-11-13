// A small history-based router: five routes don't justify a dependency.
import { createContext, useContext, useEffect, useState } from 'react';

const RouterCtx = createContext({ path: '/', navigate: () => {} });

export function RouterProvider({ children }) {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (to, { replace = false } = {}) => {
    if (to === window.location.pathname) return;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  };
  return <RouterCtx.Provider value={{ path, navigate }}>{children}</RouterCtx.Provider>;
}

export const useRouter = () => useContext(RouterCtx);

export function Link({ to, className, activeClass, exact, children, ...rest }) {
  const { path, navigate } = useRouter();
  const active = exact ? path === to : path === to || path.startsWith(to + '/');
  const cls = [className, active && activeClass].filter(Boolean).join(' ') || undefined;
  const onClick = e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} className={cls} onClick={onClick} {...rest}>{children}</a>;
}

// Matches "/projects/:id" style patterns. Returns params or null.
export function match(pattern, path) {
  const a = pattern.split('/').filter(Boolean), b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
