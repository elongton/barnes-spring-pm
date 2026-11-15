// Bundles the real client source with sample data into one self-contained HTML page.
// Usage: node preview/build.mjs      Output: preview/dist/index.html
import fs from 'node:fs';
import path from 'node:path';
import { HERE, ROOT, toolchain } from './toolchain.mjs';

const { dir: modules, require } = toolchain(['esbuild', 'react', 'react-dom']);
const esbuild = require('esbuild');

const CLIENT_SRC = path.join(ROOT, 'client', 'src');
const SHIMS = path.join(HERE, 'shims');
const OUT = path.join(HERE, 'dist');

// The real api.js (Firebase) and router.jsx (address bar) are swapped for the shims.
const shim = {
  name: 'preview-shims',
  setup(b) {
    b.onResolve({ filter: /(^|\/)api\.js$/ }, a => (a.importer.startsWith(CLIENT_SRC) ? { path: path.join(SHIMS, 'api.js') } : null));
    b.onResolve({ filter: /(^|\/)router\.jsx$/ }, a => (a.importer.startsWith(CLIENT_SRC) ? { path: path.join(SHIMS, 'router.jsx') } : null));
  },
};

fs.rmSync(OUT, { recursive: true, force: true });
await esbuild.build({
  entryPoints: [path.join(CLIENT_SRC, 'main.jsx')],
  bundle: true, minify: true, format: 'iife', target: 'es2020',
  jsx: 'automatic', legalComments: 'none',
  nodePaths: [modules],
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [shim],
  outdir: OUT,
});

const js = fs.readFileSync(path.join(OUT, 'main.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(OUT, 'main.css'), 'utf8');
const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Barnes Spring Renovations (preview)</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
<script>try { document.documentElement.dataset.theme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark'; } catch (e) {}</script>
<style>${css}
.preview-pill{position:fixed;right:12px;bottom:12px;z-index:9999;padding:4px 10px;border:0;border-radius:999px;cursor:pointer;font:500 11px/1.4 'IBM Plex Sans',system-ui,sans-serif;background:rgba(0,0,0,.7);color:#e8eaee}
@media (max-width:860px){.preview-pill{bottom:76px}}
</style>
</head>
<body>
<div id="root"></div>
<button class="preview-pill" onclick="this.remove()" title="Dismiss">Preview: sample data, changes are not saved &nbsp;&#10005;</button>
<script>setTimeout(function(){var p=document.querySelector(".preview-pill");if(p)p.remove();},15000)</script>
<script>${js}</script>
</body>
</html>`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`built ${path.relative(ROOT, path.join(OUT, 'index.html'))} (${(html.length / 1024).toFixed(0)} KB), toolchain: ${modules}`);
