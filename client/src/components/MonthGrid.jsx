import { Link } from '../router.jsx';
import { LoopIcon } from './Pills.jsx';
import { daysBetween, fmtY, iso, occurrences, parse, repeatLabel, today } from '../lib/dates.js';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Projects render as spanning bars; maintenance subtasks (and every occurrence
// of a recurring one) render as chips on their day, under the bars.
export function MonthGrid({ year, month, projects }) {
  const first = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - first.getDay());
  const todayIso = iso(today());
  const weeks = [];

  for (let w = 0; w < 6; w++) {
    const ws = new Date(gridStart); ws.setDate(ws.getDate() + w * 7);
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    if (w === 5 && ws.getMonth() !== month) break;

    const days = Array.from({ length: 7 }, (_, i) => { const dt = new Date(ws); dt.setDate(dt.getDate() + i); return dt; });

    const spans = projects.filter(p => parse(p.start) <= we && parse(p.end) >= ws).sort((a, b) => (a.start < b.start ? -1 : 1));
    const lanes = [];
    const bars = spans.map(p => {
      const s = parse(p.start) < ws ? ws : parse(p.start), e = parse(p.end) > we ? we : parse(p.end);
      const c0 = daysBetween(ws, s) + 1, c1 = daysBetween(ws, e) + 2;
      let lane = lanes.findIndex(l => l < c0);
      if (lane < 0) { lane = lanes.length; lanes.push(0); }
      lanes[lane] = c1;
      return { p, c0, c1, lane, contL: parse(p.start) < ws, contR: parse(p.end) > we };
    });

    const chipRow = lanes.length + 2, perDay = Array(7).fill(0);
    const chips = [];
    projects.filter(p => p.category === 'maintenance').forEach(p => p.subtasks.forEach(s => {
      if (s.done) return;
      occurrences(s, ws, we).forEach(day => {
        const col = daysBetween(ws, parse(day));
        chips.push({ key: `${s.id}-${day}`, p, s, col: col + 1, row: chipRow + perDay[col]++ });
      });
    }));

    weeks.push({ key: iso(ws), days, bars, chips });
  }

  return (
    <div className="month">
      <div className="dow">{DOW.map(d => <div key={d}>{d}</div>)}</div>
      {weeks.map(wk => (
        <div className="week" key={wk.key}>
          {wk.days.map((dt, i) => {
            const d = iso(dt);
            return <div key={d} className={`day ${dt.getMonth() !== month ? 'out' : ''} ${d === todayIso ? 'today' : ''}`} style={{ gridColumn: i + 1 }}><span>{dt.getDate()}</span></div>;
          })}
          {wk.bars.map(b => (
            <Link key={b.p.id} to={`/projects/${b.p.id}`} className={`cbar cat-${b.p.category} ${b.contL ? 'cont-l' : ''} ${b.contR ? 'cont-r' : ''} ${b.p.status === 'done' ? 'done' : ''}`}
              style={{ gridColumn: `${b.c0}/${b.c1}`, gridRow: b.lane + 2 }} title={`${b.p.title} · ${fmtY(b.p.start)} to ${fmtY(b.p.end)}`}>{b.p.title}</Link>
          ))}
          {wk.chips.map(c => (
            <Link key={c.key} to={`/projects/${c.p.id}`} className="cchip" style={{ gridColumn: c.col, gridRow: c.row }}
              title={`${c.s.title} · ${c.p.title}${c.s.repeat ? ' · ' + repeatLabel(c.s.repeat) : ''}`}>
              <i />{c.s.title}{c.s.repeat && <LoopIcon />}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
