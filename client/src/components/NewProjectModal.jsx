import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { ProjectFields, emptyProject, validateProject, toPayload } from './ProjectFields.jsx';
import { useStore } from '../store.jsx';
import { useRouter } from '../router.jsx';
import { iso, today, todayIso } from '../lib/dates.js';

export function NewProjectModal({ onClose }) {
  const { projects, createProject } = useStore();
  const { navigate } = useRouter();
  const t = today();
  const [value, setValue] = useState(emptyProject(todayIso(), iso(new Date(t.getFullYear(), t.getMonth() + 1, t.getDate()))));
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
      <ProjectFields value={value} onChange={setValue} projects={projects} />
    </Modal>
  );
}
