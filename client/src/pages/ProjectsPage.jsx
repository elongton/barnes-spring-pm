import { useState } from 'react';
import { Link } from '../router.jsx';
import { useStore } from '../store.jsx';
import { BudgetBar, CatPill, StatusPill } from '../components/Pills.jsx';
import { NewProjectModal } from '../components/NewProjectModal.jsx';
import { CATS, STATUSES, plural } from '../lib/format.js';
import { fmt, fmtY } from '../lib/dates.js';

export function ProjectsPage() {
  const { projects } = useStore();
  const [cat, setCat] = useState('all');
  const [st, setSt] = useState('open');
  const [showNew, setShowNew] = useState(false);

  const list = projects
    .filter(p => (cat === 'all' || p.category === cat) && (st === 'all' || (st === 'open' ? p.status !== 'done' : p.status === st)))
    .sort((a, b) => (a.start < b.start ? -1 : 1));

  return (
    <>
      <div className="page-head">
        <div><h1>Projects</h1><p>{projects.length} total · {projects.filter(p => p.status !== 'done').length} open</p></div>
        <button className="btn primary" onClick={() => setShowNew(true)}>+ New project</button>
      </div>
      <div className="filters">
        <select className="auto" value={cat} onChange={e => setCat(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="auto" value={st} onChange={e => setSt(e.target.value)} aria-label="Filter by status">
          <option value="open">Open (not done)</option>
          <option value="all">All statuses</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="proj-list">
          {list.map(p => {
            const open = p.subtasks.filter(s => !s.done).length;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="proj-row">
                <div><div className="p-title">{p.title}</div><div className="t-proj">{plural(open, 'open subtask')}</div></div>
                <CatPill category={p.category} />
                <StatusPill status={p.status} />
                <div className="p-dates">{fmt(p.start)} → {fmtY(p.end)}</div>
                <div className="full"><BudgetBar project={p} /></div>
              </Link>
            );
          })}
          {!list.length && <div className="empty">{projects.length ? 'No projects match these filters.' : 'No projects yet. Create the first one.'}</div>}
        </div>
      </div>
      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </>
  );
}
