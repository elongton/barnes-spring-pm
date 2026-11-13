import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { people as seedPeople, projects as seedProjects } from './seed-data.js';

const projectId = process.env.FIREBASE_PROJECT_ID || 'barnes-spring-pm';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!emulatorHost) {
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccount) {
    console.error('Missing Firebase credentials.');
    console.error('To seed Firestore from your machine, run one of these before retrying:');
    console.error('  gcloud auth application-default login');
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
    console.error('or use the emulator:');
    console.error('  FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:firebase');
    process.exit(1);
  }
}

const app = initializeApp({
  projectId,
  credential: emulatorHost ? undefined : applicationDefault(),
});

const db = getFirestore(app);

async function ensureCollectionEmpty(collectionName) {
  const snap = await db.collection(collectionName).get();
  if (!snap.empty) {
    console.log(`[seed] ${collectionName} already has ${snap.size} documents. Leaving it alone.`);
    return;
  }
}

async function seed() {
  const peopleRef = db.collection('people');
  const peopleMap = {};

  for (const person of seedPeople) {
    const doc = { name: person.name, type: person.type, contact: person.contact || '' };
    const ref = await peopleRef.add(doc);
    peopleMap[person.key] = ref.id;
  }

  const projectRef = db.collection('projects');
  for (const project of seedProjects) {
    const payload = {
      ...project,
      prereqs: [],
      lineItems: (project.lineItems || []).map(item => ({ ...item, id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` })),
      subtasks: (project.subtasks || []).map(task => ({
        ...task,
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        assignee: peopleMap[task.assignee] || null,
        repeat: task.repeat || null,
      })),
    };

    delete payload.key;
    const added = await projectRef.add(payload);

    if (project.prereqs && project.prereqs.length) {
      const ids = [];
      for (const key of project.prereqs) {
        const ref = await db.collection('projects').where('title', '==', seedProjects.find(p => p.key === key)?.title).limit(1).get();
        if (!ref.empty) ids.push(ref.docs[0].id);
      }
      await added.update({ prereqs: ids });
    }
  }

  console.log(`[seed] inserted ${seedPeople.length} people and ${seedProjects.length} projects into Firestore`);
}

try {
  await ensureCollectionEmpty('people');
  await ensureCollectionEmpty('projects');
  await seed();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
