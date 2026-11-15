import { useState } from 'react';
import { Link } from '../router.jsx';
import { useStore } from '../store.jsx';
import { Chevron, LoopIcon, WhoChip } from '../components/Pills.jsx';
import { MonthGrid } from '../components/MonthGrid.jsx';
import { NewProjectModal } from '../components/NewProjectModal.jsx';
import { daysBetween, dueLabel, fmtLong, parse, today } from '../lib/dates.js';
import { plural } from '../lib/format.js';

const GROUPS = [
  { key: 'grp-overdue', label: 'Overdue', test: n => n < 0 },
  { key: 'grp-week', label: 'Due this week', test: n => n >= 0 && n <= 7 },
  { key: 'grp-later', label: 'Next 30 days', test: n => n > 7 && n <= 30 },
];

const readOpen = key => { try { return localStorage.getItem(key) !== 'closed'; } catch { return true; } };

function Group({ group, items }) {
  const [open, setOpen] = useState(() => readOpen(group.key));
  const { completeSubtask } = useStore();
  const toggle = () => { setOpen(o => { try { localStorage.setItem(group.key, o ? 'closed' : 'open'); } catch {} return !o; }); };
  if (!items.length) return null;
  return (
    <>
      <button className={`group-label ${group.key}`} onClick={toggle} aria-expanded={open}>
        <Chevron />{group.label} <span className="count">{items.length}</span>
      </button>
      {open && items.map(({ p, s }) => {
        const dl = dueLabel(s.due);
        return (
          <div className="task" key={`${p.id}-${s.id}`}>
            <label className="check-wrap" title={s.repeat ? 'Done for now, roll to next occurrence' : 'Mark done'}>
              <input type="checkbox" className="check" checked={false} onChange={() => completeSubtask(p.id, s.id)} aria-label={`Mark ${s.title} done`} />
            </label>
            <div>
              <div className="t-title">{s.title}{s.repeat && <LoopIcon />}</div>
              <div className="t-proj"><Link to={`/projects/${p.id}`}>{p.title}</Link></div>
            </div>
            <div className="t-meta"><WhoChip personId={s.assignee} /><div className={`t-due ${dl.cls}`}>{dl.txt}</div></div>
          </div>
        );
      })}
    </>
  );
}

export function Home() {
  const { projects } = useStore();
  const [showNew, setShowNew] = useState(false);
  const t = today();

  const items = [];
  projects.forEach(p => p.subtasks.forEach(s => { if (!s.done) items.push({ p, s, n: daysBetween(t, parse(s.due)) }); }));
  items.sort((a, b) => a.n - b.n);
  const upcoming = items.filter(x => x.n <= 30);

  return (
    <>
      <div className="page-head">
        <div><h1>Home</h1><p>{fmtLong(t)}</p></div>
        <button className="btn primary" onClick={() => setShowNew(true)}>+ New project</button>
      </div>
      <div className="card">
        <div className="card-head"><h2>Up next</h2><span className="meta">{plural(upcoming.length, 'open subtask')} in the next 30 days</span></div>
        <div className="task-group">
          {GROUPS.map(g => <Group key={g.key} group={g} items={upcoming.filter(x => g.test(x.n))} />)}
          {!upcoming.length && <div className="empty">Nothing due in the next 30 days.</div>}
        </div>
      </div>
      <div className="cal-head">
        <div className="section-title"><h2>This month</h2><span className="count"><Link to="/calendar">Full calendar and timeline</Link></span></div>
      </div>
      <MonthGrid year={t.getFullYear()} month={t.getMonth()} projects={projects} />
      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </>
  );
}
