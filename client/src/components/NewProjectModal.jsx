import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { ProjectFields, emptyProject, validateProject, toPayload } from './ProjectFields.jsx';
import { useStore } from '../store.jsx';
import { useRouter } from '../router.jsx';
import { addDays, todayIso } from '../lib/dates.js';

export function NewProjectModal({ onClose }) {
  const { projects, createProject } = useStore();
  const { navigate } = useRouter();
  const [value, setValue] = useState(() => emptyProject(todayIso(), addDays(todayIso(), 14)));
  // The end date defaults to two weeks after the start date and follows it until the end date is set by hand.
  const [endSet, setEndSet] = useState(false);
  const onChange = next => {
    if (next.end !== value.end) setEndSet(true);
    else if (!endSet && next.start && next.start !== value.start) next = { ...next, end: addDays(next.start, 14) };
    setValue(next);
  };
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const err = validateProject(value); if (err) { setError(err); return; }
    setSaving(true);
    try {
      const created = await createProject({ ...toPayload(value), lineItems: [], subtasks: [], notes: '' });
      onClose(); navigate(`/projects/${created.id}`);
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <Modal title="New project" onClose={onClose} footer={<>
      {error && <span className="form-error" style={{ marginRight: 'auto' }}>{error}</span>}
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn primary" onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create project'}</button>
    </>}>
      <ProjectFields value={value} onChange={onChange} projects={projects} />
    </Modal>
  );
}
