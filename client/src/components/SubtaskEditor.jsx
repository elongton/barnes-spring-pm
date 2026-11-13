import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { REPEATS, repeatFromKey, repeatKey, todayIso } from '../lib/dates.js';

// Inline editor for one subtask. `subtask` is null for a new one.
export function SubtaskEditor({ project, subtask, onDone }) {
  const { people, saveSubtask, deleteSubtask } = useStore();
  const [v, setV] = useState(() => subtask
    ? { ...subtask, repeat: repeatKey(subtask.repeat) }
    : { title: '', note: '', assignee: '', due: todayIso(), done: false, repeat: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef(null);
  useEffect(() => { const el = titleRef.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, []);

  const set = (k, val) => setV(x => ({ ...x, [k]: val }));
  const isMaintenance = project.category === 'maintenance';

  const save = async () => {
    if (!v.title.trim()) { setError('Subtask needs a title'); titleRef.current?.focus(); return; }
    if (!v.due) { setError('Pick a due date'); return; }
    const repeat = isMaintenance ? repeatFromKey(v.repeat) : null;
    setBusy(true);
    try {
      await saveSubtask(project.id, { id: v.id, title: v.title.trim(), note: v.note.trim(), assignee: v.assignee || null, due: v.due, done: repeat ? false : v.done, repeat });
      onDone();
    } catch (e) { setError(e.message); setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await deleteSubtask(project.id, v.id); onDone(); } catch (e) { setError(e.message); setBusy(false); } };
  const onKey = e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); save(); } if (e.key === 'Escape') onDone(); };

  return (
    <div className="sub editing" onKeyDown={onKey}>
      <input type="checkbox" className="check" checked={v.done} onChange={e => set('done', e.target.checked)} aria-label="Done"
        disabled={Boolean(v.repeat)} title={v.repeat ? 'Recurring subtasks roll forward when checked' : 'Done'} />
      <div className="sub-form">
        <div className="field wide"><label className="label" htmlFor="se-title">Subtask</label>
          <input id="se-title" ref={titleRef} type="text" value={v.title} onChange={e => set('title', e.target.value)} placeholder="What needs to happen" /></div>
        <div className="field wide"><label className="label" htmlFor="se-note">Note</label>
          <input id="se-note" type="text" value={v.note} onChange={e => set('note', e.target.value)} placeholder="Optional" /></div>
        <div className="field"><label className="label" htmlFor="se-who">Assigned to</label>
          <select id="se-who" value={v.assignee || ''} onChange={e => set('assignee', e.target.value)}>
            <option value="">Unassigned</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></div>
        <div className="field"><label className="label" htmlFor="se-due">{v.repeat ? 'Next due' : 'Due date'}</label>
          <input id="se-due" type="date" value={v.due} onChange={e => set('due', e.target.value)} /></div>
        {isMaintenance && (
          <div className="field wide"><label className="label" htmlFor="se-repeat">Repeat</label>
            <select id="se-repeat" value={v.repeat} onChange={e => set('repeat', e.target.value)}>
              {REPEATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select></div>
        )}
        {error && <div className="form-error wide">{error}</div>}
        <div className="actions">
          {subtask && !confirmDelete && <button className="btn sm ghost danger" onClick={() => setConfirmDelete(true)} disabled={busy}>Delete</button>}
          {subtask && confirmDelete && <span className="confirm danger">Delete this subtask? <button className="btn sm danger" onClick={remove} disabled={busy}>Yes, delete</button><button className="btn sm ghost" onClick={() => setConfirmDelete(false)}>No</button></span>}
          <button className="btn sm ghost" onClick={onDone} disabled={busy}>Cancel</button>
          <button className="btn sm primary" onClick={save} disabled={busy}>{subtask ? 'Save' : 'Add subtask'}</button>
        </div>
      </div>
    </div>
  );
}
