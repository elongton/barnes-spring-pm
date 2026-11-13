import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { ensureSignedIn, db } from './firebase.js';

const projectCol = () => collection(db, 'projects');
const personCol = () => collection(db, 'people');

const normalize = row => (row && typeof row === 'object' ? { ...row, id: row.id || row._id || '' } : row);

const withAuth = async fn => {
  await ensureSignedIn();
  return fn();
};

const listDocs = async col => {
  const q = query(col, orderBy('start', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => normalize({ ...d.data(), id: d.id }));
};

const listPeople = async col => {
  const q = query(col, orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => normalize({ ...d.data(), id: d.id }));
};

const createDoc = async (col, data) => {
  const ref = doc(col);
  await setDoc(ref, data);
  return normalize({ ...data, id: ref.id });
};

const updateDocById = async (col, id, patch) => {
  const ref = doc(col, id);
  await updateDoc(ref, patch);
  const snap = await getDocs(query(col));
  const match = snap.docs.find(d => d.id === id);
  return match ? normalize({ ...match.data(), id: match.id }) : null;
};

const deleteDocById = async (col, id) => {
  await deleteDoc(doc(col, id));
};

export const api = {
  async listProjects() {
    return withAuth(() => listDocs(projectCol()));
  },
  async createProject(body) {
    return withAuth(() => createDoc(projectCol(), body));
  },
  async updateProject(id, body) {
    return withAuth(() => updateDocById(projectCol(), id, body));
  },
  async deleteProject(id) {
    return withAuth(() => deleteDocById(projectCol(), id));
  },
  async listPeople() {
    return withAuth(() => listPeople(personCol()));
  },
  async createPerson(body) {
    return withAuth(() => createDoc(personCol(), body));
  },
  async updatePerson(id, body) {
    return withAuth(() => updateDocById(personCol(), id, body));
  },
  async deletePerson(id) {
    return withAuth(() => deleteDocById(personCol(), id));
  },
};
