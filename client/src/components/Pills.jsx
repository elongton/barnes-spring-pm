import { CATS, STATUSES, initials, money, spent } from '../lib/format.js';
import { useStore } from '../store.jsx';

export const CatPill = ({ category }) => <span className={`pill cat-${category}`}>{CATS[category] || category}</span>;
export const StatusPill = ({ status }) => <span className={`pill st-${status}`}>{STATUSES[status] || status}</span>;

export function WhoChip({ personId }) {
  const { people } = useStore();
  const p = people.find(x => x.id === personId);
  if (!p) return <span className="who">Unassigned</span>;
  return <span className="who"><span className={`avatar ${p.type}`}>{initials(p.name)}</span>{p.name}</span>;
}

export const LoopIcon = ({ title = 'Recurring' }) => (
  <svg className="loop" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label={title}>
    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5" />
    <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5" />
  </svg>
);

export const Chevron = () => (
  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
);

export function BudgetBar({ project, large }) {
  const s = spent(project);
  const pct = project.budget ? (s / project.budget) * 100 : 0;
  const cls = pct > 100 ? 'over' : pct >= 80 ? 'warn' : '';
  return (
    <div className={`budget ${large ? 'lg' : ''}`}>
      <div className="bar"><div className={`fill ${cls}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
      <div className="nums">
        <span><b>{money(s)}</b> spent of {money(project.budget)}</span>
        <span className="num">{Math.round(pct)}%{pct > 100 ? ` · over by ${money(s - project.budget)}` : ''}</span>
      </div>
    </div>
  );
}
