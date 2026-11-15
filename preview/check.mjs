// Smoke test for the built preview, run in headless Chrome at desktop and phone width.
// Usage: node preview/check.mjs      (run build.mjs first). Screenshots go to preview/dist/shots.
// It checks generic behavior (pages open, a subtask can be checked off, a project can be created,
// no runtime errors). Add ad-hoc checks for the specific change you just made.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HERE, ROOT, chromePath, toolchain } from './toolchain.mjs';

const { require } = toolchain(['playwright-core']);
const { chromium } = require('playwright-core');
const { projects: seedProjects } = await import(pathToFileURL(path.join(ROOT, 'scripts', 'seed-data.js')).href);

const PAGE = pathToFileURL(path.join(HERE, 'dist', 'index.html')).href;
const SHOTS = path.join(HERE, 'dist', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

async function run(label, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // External requests (Google Fonts) are blocked on purpose, so their load failures are not app errors.
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/^https?:/, r => r.abort());
  await page.goto(PAGE);
  await page.waitForSelector('h1');

  const container = label === 'mobile' ? '.tabbar' : '.nav';
  const labels = await page.$$eval(`${container} a span`, els => els.map(e => e.textContent.trim()));
  const link = name => page.locator(`${container} a`, { hasText: name }).first();
  const goto = async name => {
    await link(name).click();
    await page.waitForSelector(`${container} a.active span:has-text("${name}")`);
    await page.waitForSelector('h1');
  };

  const homeHeading = (await page.textContent('h1')).trim();
  check(`${label}: first page renders a heading`, homeHeading.length > 0, `"${homeHeading}"`);
  await page.screenshot({ path: path.join(SHOTS, `${label}-home.png`) });

  for (const name of labels.slice(1)) {
    await goto(name);
    check(`${label}: "${name}" page opens`, true);
    await page.screenshot({ path: path.join(SHOTS, `${label}-${name.toLowerCase().replace(/\W+/g, '-')}.png`) });
  }

  // Open the first sample project from the projects list.
  const projectsLabel = labels.find(l => /project/i.test(l));
  if (projectsLabel) {
    await goto(projectsLabel);
    const title = seedProjects[0].title;
    await page.getByText(title).first().click();
    await page.waitForSelector(`h1:has-text("${title}")`);
    check(`${label}: project detail opens`, true, title);
    await page.screenshot({ path: path.join(SHOTS, `${label}-project.png`) });
  }

  await goto(labels[0]);

  if (label === 'desktop') {
    const count = async () => {
      const text = (await page.locator('.card-head .meta').first().textContent()).trim();
      const m = text.match(/^(\d+) open/);
      return m ? Number(m[1]) : null;
    };
    const before = await count();
    if (before) {
      await page.locator('input.check').first().click();
      await page.waitForFunction(n => {
        const m = (document.querySelector('.card-head .meta')?.textContent || '').trim().match(/^(\d+) open/);
        return m && Number(m[1]) === n;
      }, before - 1);
      check('desktop: checking a subtask lowers the open count by one', true, `${before} to ${before - 1}`);
    } else {
      console.log('SKIP  desktop: no open subtasks in the next 30 days, so the check-off test did not run');
    }

    await page.getByRole('button', { name: '+ New project' }).click();
    await page.locator('input[type=text]:visible, input:not([type]):visible').first().fill('Preview smoke test project');
    await page.getByRole('button', { name: 'Create project' }).click();
    await page.waitForSelector('h1:has-text("Preview smoke test project")');
    check('desktop: a new project can be created', true);
    await goto(labels[0]);
  }

  check(`${label}: no runtime errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

await run('desktop', { width: 1280, height: 800 });
await run('mobile', { width: 390, height: 780 });
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
