// Shared form fields for creating a project (modal) and editing its overview (inline).
import { CATS, STATUSES } from '../lib/format.js';
import { StatusPill } from './Pills.jsx';

export const emptyProject = (start, end) => ({
  title: '', description: '', category: 'refurbish', status: 'planned', budget: '', start, end, prereqs: [],
});

export function ProjectFields({ value, onChange, projects, selfId }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const togglePrereq = id => set('prereqs', value.prereqs.includes(id) ? value.prereqs.filter(x => x !== id) : [...value.prereqs, id]);
  const options = projects.filter(p => p.id !== selfId);
  return (
    <>
      <div className="field wide"><label className="label" htmlFor="pf-title">Title</label>
        <input id="pf-title" type="text" value={value.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Replace basement windows" /></div>
      <div className="field wide"><label className="label" htmlFor="pf-desc">Description</label>
        <textarea id="pf-desc" value={value.description} onChange={e => set('description', e.target.value)} placeholder="What this project is and why" /></div>
      <div className="field"><label className="label" htmlFor="pf-cat">Category</label>
        <select id="pf-cat" value={value.category} onChange={e => set('category', e.target.value)}>
          {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="field"><label className="label" htmlFor="pf-status">Status</label>
        <select id="pf-status" value={value.status} onChange={e => set('status', e.target.value)}>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="field"><label className="label" htmlFor="pf-start">Start date</label>
        <input id="pf-start" type="date" value={value.start} onChange={e => set('start', e.target.value)} /></div>
      <div className="field"><label className="label" htmlFor="pf-end">End date</label>
        <input id="pf-end" type="date" value={value.end} onChange={e => set('end', e.target.value)} /></div>
      <div className="field"><label className="label" htmlFor="pf-budget">Total budget</label>
        <input id="pf-budget" type="number" min="0" step="50" value={value.budget} onChange={e => set('budget', e.target.value)} placeholder="0" /></div>
      <div className="field wide"><span className="label">Prerequisites</span>
        {options.length ? (
          <div className="checks">
            {options.map(p => (
              <label key={p.id}><input type="checkbox" className="check" checked={value.prereqs.includes(p.id)} onChange={() => togglePrereq(p.id)} />{p.title} <StatusPill status={p.status} /></label>
            ))}
          </div>
        ) : <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>No other projects yet</span>}
      </div>
    </>
  );
}

export function validateProject(v) {
  if (!v.title.trim()) return 'Title is required';
  if (!v.start || !v.end) return 'Start and end dates are required';
  if (v.end < v.start) return 'End date must be on or after the start date';
  if (v.budget !== '' && Number(v.budget) < 0) return 'Budget cannot be negative';
  return null;
}

export const toPayload = v => ({
  title: v.title.trim(), description: v.description.trim(), category: v.category, status: v.status,
  budget: Number(v.budget) || 0, start: v.start, end: v.end, prereqs: v.prereqs,
});
