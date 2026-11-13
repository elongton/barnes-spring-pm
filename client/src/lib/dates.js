// All dates in the app are plain YYYY-MM-DD strings interpreted in local time.
// Keeping them as strings avoids timezone shifts between the browser and the database.

export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
export const todayIso = () => iso(today());
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);
export const fmt = s => parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const fmtY = s => parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtLong = dt => dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const REPEATS = [
  ['', 'Does not repeat'], ['1:week', 'Every week'], ['2:week', 'Every 2 weeks'], ['1:month', 'Every month'],
  ['3:month', 'Every 3 months'], ['6:month', 'Every 6 months'], ['1:year', 'Every year'],
];
export const repeatKey = r => (r ? `${r.n}:${r.unit}` : '');
export const repeatFromKey = k => (k ? { n: Number(k.split(':')[0]), unit: k.split(':')[1] } : null);
export const repeatLabel = r => {
  if (!r) return '';
  const known = REPEATS.find(x => x[0] === repeatKey(r));
  return known ? known[1] : `Every ${r.n} ${r.unit}${r.n === 1 ? '' : 's'}`;
};
export const repeatShort = r => repeatLabel(r).replace(/^Every /, '');

export function addInterval(s, r, k = 1) {
  const dt = parse(s);
  if (r.unit === 'week') dt.setDate(dt.getDate() + 7 * r.n * k);
  else if (r.unit === 'month') dt.setMonth(dt.getMonth() + r.n * k);
  else dt.setFullYear(dt.getFullYear() + r.n * k);
  return iso(dt);
}

// Every occurrence of a subtask between two Date objects (inclusive).
export function occurrences(s, from, to) {
  if (!s.repeat) return parse(s.due) >= from && parse(s.due) <= to ? [s.due] : [];
  const out = [];
  let k = 0, cur = s.due;
  while (parse(cur) <= to && k < 200) {
    if (parse(cur) >= from) out.push(cur);
    k += 1;
    cur = addInterval(s.due, s.repeat, k);
  }
  return out;
}

// Checking off a recurring subtask rolls it forward instead of closing it.
export function completed(s) {
  return s.repeat ? { ...s, due: addInterval(s.due, s.repeat), done: false } : { ...s, done: true };
}

export function dueLabel(due) {
  const n = daysBetween(today(), parse(due));
  if (n < 0) return { cls: 'over', txt: `${-n}d overdue`, n };
  if (n === 0) return { cls: 'soon', txt: 'Today', n };
  if (n === 1) return { cls: 'soon', txt: 'Tomorrow', n };
  if (n <= 7) return { cls: 'soon', txt: `in ${n}d`, n };
  return { cls: '', txt: fmt(due), n };
}
