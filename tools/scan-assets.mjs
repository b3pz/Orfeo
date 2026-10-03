// Scansiona assets/ e scrive assets/manifest.json + assets/manifest.js.
// Il gioco usa SOLO i file elencati nel manifest (niente richieste 404).
// Uso: node tools/scan-assets.mjs
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = join(root, 'assets');
const OK = /\.(png|jpe?g|webp|gif|svg|ogg|mp3|m4a|wav|woff2?)$/i;
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (OK.test(name)) files.push(relative(root, p).split(sep).join('/'));
  }
})(base);
files.sort();
const manifest = { count: files.length, files };
writeFileSync(join(base, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
writeFileSync(join(base, 'manifest.js'), '/* GENERATO da tools/scan-assets.mjs */\nwindow.ORFEO_ASSET_MANIFEST = ' + JSON.stringify(manifest) + ';\n');
console.log(`assets/manifest.json: ${files.length} file`);
