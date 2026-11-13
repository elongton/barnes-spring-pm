# Barnes Spring Renovations

Project tracker for the house at 13904 Barnes Spring Rd. React frontend backed directly by Firebase Authentication and Cloud Firestore.

## What's in it

- **Home**: open subtasks across all projects grouped Overdue / Due this week / Next 30 days (each group collapses), then the current month.
- **Calendar**: month grid with projects as spanning bars and maintenance subtasks as day chips, or a timeline (Gantt) with one row per project.
- **Projects**: filterable list; each project has a locked Overview (Edit to change title, description, category, status, dates, budget, prerequisites), a Budget tracker (line items rolled into a planned-vs-actual bar), Subtasks (assignee, due date, note, click a row to edit), and free-text Notes that autosave.
- **People**: household members and contractors that subtasks can be assigned to.
- **Recurring subtasks**: only on Maintenance projects. Checking one off rolls its due date forward one interval instead of closing it. Each occurrence appears on the month calendar.

Dark theme by default; toggle in the sidebar (or the Theme tab on phones). Works at phone width.

## Requirements

- Node 22 or newer
- A Firebase project with Cloud Firestore enabled
- Anonymous sign-in enabled in Firebase Authentication

## First run

```bash
npm run install:all
Copy-Item client/.env.example client/.env  # fill in the Firebase web app config
npm run dev                                  # starts Vite at http://localhost:5173
```

The frontend connects directly to Firestore. Configure Firebase values in `client/.env`; Vite exposes only `VITE_` variables to the browser. Enable Anonymous sign-in in Firebase Authentication and deploy the rules with `firebase deploy --only firestore:rules`.

To load the sample records, authenticate the local Firebase Admin SDK using Application Default Credentials (`gcloud auth application-default login`) or set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON file, then run `npm run seed:firebase`. The seed script writes to the `people` and `projects` collections. Do not run it again against collections that already contain data.

Build and preview the frontend with `npm run build` and `npm start`.

## Layout

```
client/src/firebase.js  Firebase app, Auth, and Firestore initialization
client/src/api.js       Firestore CRUD operations
client/src/store.jsx    In-memory UI state and optimistic updates
scripts/seed-data.js    Sample data; edit freely
scripts/seed-firestore.js  Loads sample data using Firebase Admin SDK
firestore.rules         Firestore access rules
```

## Data model

Two collections. Subtasks and line items are embedded in the project document. Dates are `YYYY-MM-DD` strings (no timezone math anywhere).

```
Project { id, title, description, category: refurbish|build|purchase|maintenance,
          status: planned|in-progress|on-hold|done, budget, start, end,
          prereqs: [projectId], notes,
          lineItems: [{ id, desc, cost }],
          subtasks:  [{ id, title, note, assignee: personId|null, due, done,
                        repeat: null | { n, unit: week|month|year } }] }
Person  { id, name, type: household|contractor, contact }
```

## Firebase data

Firestore has `projects` and `people` collections. Subtasks and line items are embedded in project documents, and dates are `YYYY-MM-DD` strings. The document shapes are shown above. The client signs users in anonymously; access is controlled by `firestore.rules`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run install:all` | install root and client dependencies |
| `npm run dev` | start the Vite development server |
| `npm run seed:firebase` | load sample projects and people into Firestore (requires Admin SDK credentials) |
| `npm run build` | build the client |
| `npm start` | preview the production build |

Firebase web config is stored in the ignored `client/.env` file. The seed script uses `FIREBASE_PROJECT_ID` (defaults to `barnes-spring-pm`) and Google Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS`.
