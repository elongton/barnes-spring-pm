// Holds projects and people in memory, applies changes optimistically, and
// syncs each change to the API. On a failed save it reloads from the server
// and shows the error so the screen never drifts from what's stored.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { completed } from './lib/dates.js';

const StoreCtx = createContext(null);
// Ids for embedded rows are minted here so optimistic rows render with stable keys; the API keeps them.
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function StoreProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const reload = useCallback(async () => {
    try {
      const [p, pe] = await Promise.all([api.listProjects(), api.listPeople()]);
      setProjects(p); setPeople(pe); setError(null);
    } catch (e) {
      setError(`Could not load data from Firebase: ${e.message}`);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Runs an API call; on failure, surfaces the error and resyncs from the server.
  const sync = useCallback(async fn => {
    try { return await fn(); } catch (e) { setError(e.message); reload(); throw e; }
  }, [reload]);

  const actions = useMemo(() => ({
    reload,
    clearError: () => setError(null),

    async createProject(data) {
      const created = await sync(() => api.createProject(data));
      setProjects(ps => [...ps, created].sort((a, b) => (a.start < b.start ? -1 : 1)));
      return created;
    },
    async updateProject(id, patch) {
      setProjects(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
      const saved = await sync(() => api.updateProject(id, patch));
      setProjects(ps => ps.map(p => (p.id === id ? saved : p)));
      return saved;
    },
    async deleteProject(id) {
      setProjects(ps => ps.filter(p => p.id !== id).map(p => ({ ...p, prereqs: p.prereqs.filter(x => x !== id) })));
      await sync(() => api.deleteProject(id));
    },

    // Subtask helpers all go through updateProject with a new subtasks array.
    setSubtasks(projectId, subtasks) { return actions.updateProject(projectId, { subtasks }); },
    completeSubtask(projectId, subtaskId, checked = true) {
      const p = projectsRef.current.find(x => x.id === projectId); if (!p) return;
      const subtasks = p.subtasks.map(s => (s.id !== subtaskId ? s : checked ? completed(s) : { ...s, done: false }));
      return actions.updateProject(projectId, { subtasks });
    },
    saveSubtask(projectId, subtask) {
      const p = projectsRef.current.find(x => x.id === projectId); if (!p) return;
      const exists = subtask.id && p.subtasks.some(s => s.id === subtask.id);
      const next = exists ? subtask : { ...subtask, id: newId() };
      const subtasks = exists ? p.subtasks.map(s => (s.id === subtask.id ? next : s)) : [...p.subtasks, next];
      return actions.updateProject(projectId, { subtasks });
    },
    deleteSubtask(projectId, subtaskId) {
      const p = projectsRef.current.find(x => x.id === projectId); if (!p) return;
      return actions.updateProject(projectId, { subtasks: p.subtasks.filter(s => s.id !== subtaskId) });
    },
    addLineItem(projectId, item) {
      const p = projectsRef.current.find(x => x.id === projectId); if (!p) return;
      return actions.updateProject(projectId, { lineItems: [...p.lineItems, { ...item, id: newId() }] });
    },
    removeLineItem(projectId, itemId) {
      const p = projectsRef.current.find(x => x.id === projectId); if (!p) return;
      return actions.updateProject(projectId, { lineItems: p.lineItems.filter(l => l.id !== itemId) });
    },

    async createPerson(data) {
      const created = await sync(() => api.createPerson(data));
      setPeople(ps => [...ps, created]);
      return created;
    },
    async updatePerson(id, patch) {
      setPeople(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
      const saved = await sync(() => api.updatePerson(id, patch));
      setPeople(ps => ps.map(p => (p.id === id ? saved : p)));
    },
    async deletePerson(id) {
      setPeople(ps => ps.filter(p => p.id !== id));
      setProjects(ps => ps.map(p => ({ ...p, subtasks: p.subtasks.map(s => (s.assignee === id ? { ...s, assignee: null } : s)) })));
      await sync(() => api.deletePerson(id));
    },
  }), [reload, sync]);

  const value = useMemo(() => ({ projects, people, loading, error, ...actions }), [projects, people, loading, error, actions]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
