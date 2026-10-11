// Build: bündelt src/main.js (+ three.js, clipper) zu EINER eigenständigen dist/index.html
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const dev = process.argv.includes('--dev');
const outArg = (process.argv.find((a) => a.startsWith('--out=')) || '').slice(6);
const entryArg = (process.argv.find((a) => a.startsWith('--entry=')) || '').slice(8) || 'src/main.js';

const result = await build({
  entryPoints: [entryArg], bundle: true, write: false, format: 'iife',
  target: ['es2020', 'safari15'], minify: !dev, sourcemap: false, legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning', loader: { '.json': 'json', '.glb': 'binary' },
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync('src/style.css', 'utf8');
const tpl = fs.readFileSync('src/index.template.html', 'utf8');
const html = tpl.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
const file = outArg || 'dist/index.html';
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, html);
console.log(`${file}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
