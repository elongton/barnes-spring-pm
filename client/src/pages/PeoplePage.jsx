import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Modal } from '../components/Modal.jsx';
import { initials, plural } from '../lib/format.js';

const TYPES = { household: 'Household', contractor: 'Contractor' };

export function PeoplePage() {
  const { people, projects } = useStore();
  const [editing, setEditing] = useState(null); // person object, 'new', or null
  const openCount = id => projects.reduce((a, p) => a + p.subtasks.filter(s => s.assignee === id && !s.done).length, 0);

  return (
    <>
      <div className="page-head">
        <div><h1>People and companies</h1><p>Who subtasks can be assigned to. Household members and contractors.</p></div>
        <button className="btn primary" onClick={() => setEditing('new')}>+ Add</button>
      </div>
      <div className="people">
        {people.map(x => (
          <div key={x.id} className="card person" onClick={() => setEditing(x)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEditing(x); }}>
            <span className={`avatar ${x.type}`}>{initials(x.name)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="p-name">{x.name}</div>
              <div className="p-sub">{TYPES[x.type]} · {plural(openCount(x.id), 'open subtask')}</div>
              {x.contact && <div className="p-contact">{x.contact}</div>}
            </div>
          </div>
        ))}
        {!people.length && <div className="card empty" style={{ gridColumn: '1/-1' }}>No one yet. Add yourselves first, then contractors as you hire them.</div>}
      </div>
      {editing && <PersonModal person={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function PersonModal({ person, onClose }) {
  const { createPerson, updatePerson, deletePerson } = useStore();
  const [v, setV] = useState(person ? { name: person.name, type: person.type, contact: person.contact || '' } : { name: '', type: 'household', contact: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const set = (k, val) => setV(x => ({ ...x, [k]: val }));

  const save = async () => {
    if (!v.name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    try {
      const payload = { name: v.name.trim(), type: v.type, contact: v.contact.trim() };
      if (person) await updatePerson(person.id, payload); else await createPerson(payload);
      onClose();
    } catch (e) { setError(e.message); setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await deletePerson(person.id); onClose(); } catch (e) { setError(e.message); setBusy(false); } };

  return (
    <Modal title={person ? 'Edit person or company' : 'Add a person or company'} onClose={onClose} footer={<>
      {person && !confirm && <button className="btn ghost danger" onClick={() => setConfirm(true)} disabled={busy}>Remove</button>}
      {person && confirm && <span className="confirm danger">Remove? Their subtasks become unassigned. <button className="btn sm danger" onClick={remove} disabled={busy}>Yes, remove</button><button className="btn sm ghost" onClick={() => setConfirm(false)}>No</button></span>}
      {error && <span className="form-error">{error}</span>}
      <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
      <button className="btn primary" onClick={save} disabled={busy}>{person ? 'Save' : 'Add'}</button>
    </>}>
      <div className="field wide"><label className="label" htmlFor="pm-name">Name</label>
        <input id="pm-name" type="text" value={v.name} onChange={e => set('name', e.target.value)} placeholder="Person or company name" onKeyDown={e => { if (e.key === 'Enter') save(); }} /></div>
      <div className="field"><label className="label" htmlFor="pm-type">Type</label>
        <select id="pm-type" value={v.type} onChange={e => set('type', e.target.value)}>
          {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div className="field"><label className="label" htmlFor="pm-contact">Contact (optional)</label>
        <input id="pm-contact" type="text" value={v.contact} onChange={e => set('contact', e.target.value)} placeholder="Phone or email" /></div>
    </Modal>
  );
}
