// Locates the tools the preview needs without hardcoding one machine's paths.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');

// First folder that holds every needed package wins. Set PREVIEW_NODE_MODULES to force one.
const CANDIDATES = [
  process.env.PREVIEW_NODE_MODULES,
  path.join(ROOT, 'client', 'node_modules'),
  path.join(ROOT, 'node_modules'),
  '/opt/npm-tools/node_modules',
].filter(Boolean);

export function toolchain(needs) {
  const dir = CANDIDATES.find(d => needs.every(n => fs.existsSync(path.join(d, n, 'package.json'))));
  if (!dir) {
    throw new Error(
      `Preview toolchain not found. Need ${needs.join(', ')} in one node_modules folder.\n` +
      `Looked in:\n  ${CANDIDATES.join('\n  ')}\n` +
      'Set PREVIEW_NODE_MODULES to a folder that has them.',
    );
  }
  return { dir, require: createRequire(dir + path.sep) };
}

export function chromePath() {
  const found = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean).find(p => fs.existsSync(p));
  if (!found) throw new Error('No Chrome or Chromium found. Set CHROME_PATH.');
  return found;
}
