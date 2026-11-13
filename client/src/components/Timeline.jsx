import { Link } from '../router.jsx';
import { daysBetween, fmtY, parse, today } from '../lib/dates.js';

// Gantt-style view: one row per project, bar from start to end. No subtasks here by design.
export function Timeline({ projects }) {
  if (!projects.length) return <div className="card"><div className="empty">No projects to show.</div></div>;
  const sorted = [...projects].sort((a, b) => (a.start < b.start ? -1 : 1));
  const minStart = parse(sorted[0].start);
  const maxEnd = parse(sorted.reduce((m, p) => (p.end > m.end ? p : m)).end);
  const r0 = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
  const r1 = new Date(maxEnd.getFullYear(), maxEnd.getMonth() + 1, 0);
  const total = daysBetween(r0, r1) + 1;
  const months = [];
  for (let dt = new Date(r0); dt <= r1; dt = new Date(dt.getFullYear(), dt.getMonth() + 1, 1)) {
    const mEnd = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
    months.push({ label: dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), w: daysBetween(dt, mEnd) + 1 });
  }
  const pct = n => `${((n / total) * 100).toFixed(2)}%`;
  const t = today();
  const showToday = t >= r0 && t <= r1;

  return (
    <div className="gantt-wrap">
      <div className="gantt" style={{ '--tx': pct(daysBetween(r0, t) + 0.5) }}>
        <div className="g-months" style={{ gridTemplateColumns: months.map(m => `${m.w}fr`).join(' ') }}>
          {months.map(m => <div key={m.label}>{m.label}</div>)}
        </div>
        {sorted.map(p => (
          <div className="g-row" key={p.id}>
            <Link to={`/projects/${p.id}`} className="g-label">{p.title}</Link>
            <div className="g-track">
              <Link to={`/projects/${p.id}`} className={`g-bar ${p.status === 'done' ? 'done' : ''}`}
                style={{ left: pct(daysBetween(r0, parse(p.start))), width: pct(daysBetween(parse(p.start), parse(p.end)) + 1), background: `var(--cat-${p.category})` }}
                title={`${fmtY(p.start)} to ${fmtY(p.end)}`}>{p.title}</Link>
            </div>
          </div>
        ))}
        {showToday && <div className="g-today" />}
      </div>
    </div>
  );
}
