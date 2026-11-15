// Preview-only data layer. Same interface as client/src/api.js, but backed by the
// sample records in scripts/seed-data.js and held in memory. Nothing is saved.
// If client/src/api.js gains or changes a method, mirror it here.
import { people as seedPeople, projects as seedProjects } from '../../scripts/seed-data.js';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const clone = v => structuredClone(v);
const tick = () => new Promise(r => setTimeout(r, 30));

const personIds = {};
let people = seedPeople.map(p => {
  const id = `person-${p.key}`;
  personIds[p.key] = id;
  return { id, name: p.name, type: p.type, contact: p.contact || '' };
});

const projectIds = {};
seedProjects.forEach(p => { projectIds[p.key] = `project-${p.key}`; });
let projects = seedProjects.map(p => {
  const { key, ...rest } = p;
  return {
    ...rest,
    id: projectIds[key],
    prereqs: (p.prereqs || []).map(k => projectIds[k]).filter(Boolean),
    lineItems: (p.lineItems || []).map(i => ({ ...i, id: uid() })),
    subtasks: (p.subtasks || []).map(t => ({ ...t, id: uid(), assignee: personIds[t.assignee] || null, repeat: t.repeat || null })),
  };
});

const byStart = (a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
const byName = (a, b) => a.name.localeCompare(b.name);

export const api = {
  async listProjects() { await tick(); return clone([...projects].sort(byStart)); },
  async createProject(body) { await tick(); const row = { ...clone(body), id: uid() }; projects.push(row); return clone(row); },
  async updateProject(id, body) {
    await tick();
    projects = projects.map(p => (p.id === id ? { ...p, ...clone(body) } : p));
    return clone(projects.find(p => p.id === id) || null);
  },
  async deleteProject(id) { await tick(); projects = projects.filter(p => p.id !== id); },
  async listPeople() { await tick(); return clone([...people].sort(byName)); },
  async createPerson(body) { await tick(); const row = { ...clone(body), id: uid() }; people.push(row); return clone(row); },
  async updatePerson(id, body) {
    await tick();
    people = people.map(p => (p.id === id ? { ...p, ...clone(body) } : p));
    return clone(people.find(p => p.id === id) || null);
  },
  async deletePerson(id) { await tick(); people = people.filter(p => p.id !== id); },
};
