# Barnes Spring Renovations: working notes for Claude

Home renovation tracker for 13904 Barnes Spring Rd, used by Laurel and Max. React (Vite) client that talks straight to Firebase Auth (anonymous sign-in) and Cloud Firestore. There is no server. Pushing to `main` runs the Build and Deploy workflow (Docker image to GHCR, then deploy to the VPS), so a push goes live.

## How Laurel develops with Claude

Laurel does not keep a local clone and does not run a dev server. Claude edits the repo, shows her a clickable preview, and pushes only when she says to.

For each change:

1. Edit the files under `client/src`. Do not commit yet.
2. Build the preview: `node preview/build.mjs`
3. Test it: `node preview/check.mjs`. Add ad-hoc checks for the specific change, and look at a screenshot from `preview/dist/shots`.
4. Publish the preview (see below), then tell her what changed in a sentence or two.
5. Wait. She may ask for more changes. Keep building and republishing.
6. When she says "push", commit and push straight to `main` (no pull request). Commit only the files for the change she approved. Remind her that the push triggers the deploy. The workflow's result cannot be seen from here.

Do not push the preview tooling changes along with an app change unless she asked for that.

## The preview

`preview/build.mjs` bundles the real client source with esbuild into one HTML file. Two modules are swapped for shims in `preview/shims`: `api.js` (in-memory sample data from `scripts/seed-data.js` instead of Firestore) and `router.jsx` (path kept in state, because the published page is sandboxed and cannot use pushState paths). If `client/src/api.js` or `client/src/router.jsx` changes its exports, update the matching shim.

Publishing: the preview is one private artifact titled "Barnes Spring Renovations (preview)". Look for it with the artifact list tool first and republish the same artifact with `publish_files` (its slug and current version), sending only `preview/dist/index.html` as `index.html`. Create a new artifact only if none exists. Do not share it or change who can see it.

Limits to state to Laurel when she first sees the preview in a session:
- It shows sample data, not her Firestore data. Edits work while she clicks around and reset on reload.
- It does not exercise real Firebase behavior (sign-in, security rules, saving).
- It is built with esbuild, not Vite, so a Vite-only build problem would not show until after a push deploys.
- It was checked in headless Chrome as a local file, not inside the published page's frame.

Tooling needs `esbuild`, `react`, `react-dom` and `playwright-core` in one `node_modules` folder, plus Chrome. `preview/toolchain.mjs` looks in `PREVIEW_NODE_MODULES`, `client/node_modules`, `node_modules`, then `/opt/npm-tools/node_modules`. Chrome comes from `CHROME_PATH` or the usual Linux paths. If none are found, say so at the start of the task. Package installs may be blocked, so do not count on `npm install`.

## Other rules

- Never run `npm run seed:firebase`. It writes to her real Firestore data.
- `client/.env` holds the Firebase web config and is not in the repo. Claude does not have it.
- Her saved preferences apply to anything written for her: short and direct, no em dashes in drafted text, and flag tool limits before attempting a task.
