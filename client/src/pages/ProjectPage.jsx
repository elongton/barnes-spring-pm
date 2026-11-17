import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { useStore } from '../store.jsx';
import { BudgetBar, CatPill, LoopIcon, StatusPill, WhoChip } from '../components/Pills.jsx';
import { ProjectFields, validateProject, toPayload } from '../components/ProjectFields.jsx';
import { SubtaskEditor } from '../components/SubtaskEditor.jsx';
import { byDue, dueLabel, fmt, fmtY, repeatShort } from '../lib/dates.js';
import { money, plural } from '../lib/format.js';

export function ProjectPage({ id }) {
  const { projects, loading, updateProject, deleteProject, completeSubtask, addLineItem, updateLineItem, removeLineItem } = useStore();
  const { navigate } = useRouter();
  const p = projects.find(x => x.id === id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [formError, setFormError] = useState(null);
  const [editingSub, setEditingSub] = useState(null); // subtask id, 'new', or null
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [subSort, setSubSort] = useState('due'); // 'due' or 'added'

  // Notes save on a short delay after typing stops.
  const [notes, setNotes] = useState(p?.notes ?? '');
  const notesTimer = useRef(null);
  useEffect(() => { setNotes(p?.notes ?? ''); }, [p?.id]);
  const onNotes = v => {
    setNotes(v);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => updateProject(id, { notes: v }), 600);
  };
  useEffect(() => () => clearTimeout(notesTimer.current), []);

  if (!p) return <div className="empty">{loading ? 'Loading…' : <>Project not found. <Link to="/projects">Back to projects</Link></>}</div>;

  const dependents = projects.filter(x => x.prereqs.includes(p.id));
  // Default sort: open subtasks first, completed ones at the bottom, each group by due date.
  const subtasks = subSort === 'due' ? [...p.subtasks].sort((a, b) => (Number(Boolean(a.done)) - Number(Boolean(b.done))) || byDue(a, b)) : p.subtasks;
  const startEdit = () => { setDraft({ title: p.title, description: p.description, category: p.category, status: p.status, budget: p.budget || '', files: p.files || '', start: p.start, end: p.end, prereqs: p.prereqs }); setFormError(null); setEditing(true); };
  const saveEdit = async () => {
    const err = validateProject(draft); if (err) { setFormError(err); return; }
    try { await updateProject(id, toPayload(draft)); setEditing(false); } catch (e) { setFormError(e.message); }
  };
  const remove = async () => { await deleteProject(id); navigate('/projects'); };

  return (
    <>
      <div className="crumbs"><Link to="/projects">Projects</Link> › <span>{p.title}</span></div>
      <div className="detail-head">
        <div>
          <h1>{p.title}</h1>
          <div className="pills"><CatPill category={p.category} /><StatusPill status={p.status} /><span className="num" style={{ color: 'var(--muted)' }}>{fmtY(p.start)} → {fmtY(p.end)}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!confirmDelete && <button className="btn ghost" onClick={() => setConfirmDelete(true)}>Delete project</button>}
          {confirmDelete && <span className="confirm">Delete this project and all its subtasks? <button className="btn sm danger" onClick={remove}>Yes, delete</button><button className="btn sm ghost" onClick={() => setConfirmDelete(false)}>No</button></span>}
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <h2>Overview</h2>
            {editing
              ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{formError && <span className="form-error">{formError}</span>}<button className="btn sm ghost" onClick={() => setEditing(false)}>Cancel</button><button className="btn sm primary" onClick={saveEdit}>Save</button></div>
              : <button className="btn sm" onClick={startEdit}>Edit</button>}
          </div>
          <div className="card-body">
            <div className="ov-grid">
              {editing ? <ProjectFields value={draft} onChange={setDraft} projects={projects} selfId={p.id} /> : (
                <>
                  <div className="field wide"><span className="label">Description</span><div className="ov-val">{p.description || <span style={{ color: 'var(--faint)' }}>No description</span>}</div></div>
                  <div className="field"><span className="label">Category</span><div className="ov-val"><CatPill category={p.category} /></div></div>
                  <div className="field"><span className="label">Status</span><div className="ov-val"><StatusPill status={p.status} /></div></div>
                  <div className="field"><span className="label">Start date</span><div className="ov-val num">{fmtY(p.start)}</div></div>
                  <div className="field"><span className="label">End date</span><div className="ov-val num">{fmtY(p.end)}</div></div>
                  <div className="field"><span className="label">Total budget</span><div className="ov-val num">{money(p.budget)}</div></div>
                  <div className="field wide"><span className="label">Files</span><div className="ov-val files"><FilesValue value={p.files} /></div></div>
                  <div className="field wide"><span className="label">Prerequisites</span>
                    <div className="prereqs">
                      {p.prereqs.map(pid => projects.find(x => x.id === pid)).filter(Boolean).map(q => (
                        <Link key={q.id} to={`/projects/${q.id}`} className="prereq">{q.title}<StatusPill status={q.status} /></Link>
                      ))}
                      {!p.prereqs.length && <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>None</span>}
                    </div>
                  </div>
                  {dependents.length > 0 && (
                    <div className="field wide"><span className="label">Blocks</span>
                      <div className="prereqs">{dependents.map(q => <Link key={q.id} to={`/projects/${q.id}`} className="prereq">{q.title}<StatusPill status={q.status} /></Link>)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <BudgetCard project={p} addLineItem={addLineItem} updateLineItem={updateLineItem} removeLineItem={removeLineItem} />
      </div>

      <div className="card">
        <div className="card-head"><h2>Subtasks</h2>
          <div className="head-tools">
            <span className="meta">{p.subtasks.filter(s => s.done).length} of {p.subtasks.length} done · click a subtask to edit</span>
            <select className="auto" value={subSort} onChange={e => setSubSort(e.target.value)} aria-label="Sort subtasks">
              <option value="due">Sort: due date</option>
              <option value="added">Sort: order added</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          <div className="subtasks">
            {subtasks.map(s => editingSub === s.id
              ? <SubtaskEditor key={s.id} project={p} subtask={s} onDone={() => setEditingSub(null)} />
              : <SubtaskRow key={s.id} s={s} onEdit={() => setEditingSub(s.id)} onCheck={checked => completeSubtask(p.id, s.id, checked)} />)}
            {editingSub === 'new'
              ? <SubtaskEditor project={p} subtask={null} onDone={() => setEditingSub(null)} />
              : <div className="sub add"><button className="btn sm ghost" style={{ justifySelf: 'start' }} onClick={() => setEditingSub('new')}>+ Add subtask</button></div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Notes</h2></div>
        <div className="card-body">
          <textarea id="project-notes" value={notes} onChange={e => onNotes(e.target.value)} placeholder="Anything worth remembering about this project" aria-label="Project notes" />
        </div>
      </div>
    </>
  );
}

function SubtaskRow({ s, onEdit, onCheck }) {
  const dl = dueLabel(s.due);
  const onKey = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(); } };
  return (
    <div className={`sub clickable ${s.done ? 'done' : ''}`} onClick={onEdit} onKeyDown={onKey} tabIndex={0} role="button" aria-label={`Edit ${s.title}`}>
      <label className="check-wrap" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
        title={s.repeat ? 'Done for now, roll to next occurrence' : 'Mark done'}>
        <input type="checkbox" className="check" checked={s.done} onChange={e => onCheck(e.target.checked)} aria-label="Done" />
      </label>
      <div className="s-title">{s.title}{s.repeat && <LoopIcon />}</div>
      <div className="s-note">{s.note}</div>
      <div className="s-meta">
        <WhoChip personId={s.assignee} />
        <div className={`s-due ${s.done ? '' : dl.cls}`}>
          {s.done ? (s.due ? fmt(s.due) : '') : dl.txt}
          {s.repeat && <span className="rep" title={`Every ${repeatShort(s.repeat)}`}>{repeatShort(s.repeat)}</span>}
        </div>
      </div>
    </div>
  );
}

// Shows the Files value as a link when it is a web address, otherwise as plain text.
function FilesValue({ value }) {
  const v = (value || '').trim();
  if (/^https?:\/\/\S+$/.test(v)) return <a href={v} target="_blank" rel="noopener noreferrer">{v}</a>;
  return v;
}

function BudgetCard({ project, addLineItem, updateLineItem, removeLineItem }) {
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');
  const [err, setErr] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const add = async () => {
    const c = parseFloat(cost);
    if (!desc.trim()) { setErr('Describe the line item'); return; }
    if (Number.isNaN(c) || c < 0) { setErr('Enter a cost'); return; }
    setErr(null);
    await addLineItem(project.id, { desc: desc.trim(), cost: c });
    setDesc(''); setCost('');
  };
  return (
    <div className="card">
      <div className="card-head"><h2>Budget</h2><span className="meta">{plural(project.lineItems.length, 'line item')}{project.lineItems.length > 0 && ' · click a line item to edit'}</span></div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BudgetBar project={project} large />
        <div className="line-items">
          {project.lineItems.map(l => editingId === l.id
            ? <LineItemEditor key={l.id} item={l} onSave={item => updateLineItem(project.id, item)} onDone={() => setEditingId(null)} />
            : (
              <div className="li clickable" key={l.id} onClick={() => setEditingId(l.id)} tabIndex={0} role="button" aria-label={`Edit ${l.desc}`}
                onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setEditingId(l.id); } }}>
                <span>{l.desc}</span><span className="cost">{money(l.cost)}</span>
                <button className="x" onClick={e => { e.stopPropagation(); removeLineItem(project.id, l.id); }} aria-label={`Remove ${l.desc}`}>✕</button>
              </div>
            ))}
          <div className="li add">
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Line item (e.g. permit, lumber, deposit)" aria-label="Line item description" />
            <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="Cost" aria-label="Cost" onKeyDown={e => { if (e.key === 'Enter') add(); }} />
            <button className="btn sm primary" onClick={add}>Add</button>
          </div>
          {err && <div className="form-error" style={{ paddingTop: 6 }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}

// Inline editor for one existing budget line item.
function LineItemEditor({ item, onSave, onDone }) {
  const [desc, setDesc] = useState(item.desc);
  const [cost, setCost] = useState(String(item.cost ?? ''));
  const [err, setErr] = useState(null);
  const descRef = useRef(null);
  useEffect(() => { descRef.current?.focus(); }, []);
  const save = async () => {
    const c = parseFloat(cost);
    if (!desc.trim()) { setErr('Describe the line item'); return; }
    if (Number.isNaN(c) || c < 0) { setErr('Enter a cost'); return; }
    try { await onSave({ id: item.id, desc: desc.trim(), cost: c }); onDone(); } catch (e) { setErr(e.message); }
  };
  const onKey = e => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') onDone(); };
  return (
    <div className="li edit" onKeyDown={onKey}>
      <input ref={descRef} type="text" value={desc} onChange={e => setDesc(e.target.value)} aria-label="Line item description" />
      <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} aria-label="Cost" />
      <button className="btn sm ghost" onClick={onDone}>Cancel</button>
      <button className="btn sm primary" onClick={save}>Save</button>
      {err && <div className="form-error">{err}</div>}
    </div>
  );
}
