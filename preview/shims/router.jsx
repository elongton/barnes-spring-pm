// Preview-only router. Same exports as client/src/router.jsx, but the current path
// lives in React state instead of the address bar, because the published page is
// sandboxed and cannot use pushState paths. If client/src/router.jsx changes its
// exports, mirror them here.
import { createContext, useContext, useState } from 'react';

const RouterCtx = createContext({ path: '/', navigate: () => {} });

export function RouterProvider({ children }) {
  const [path, setPath] = useState('/');
  const navigate = to => {
    if (to === path) return;
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
  const onClick = e => { e.preventDefault(); navigate(to); };
  return <a href="#" className={cls} onClick={onClick} {...rest}>{children}</a>;
}

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
