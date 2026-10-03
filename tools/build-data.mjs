// Genera data/bundle.js (fallback per l'apertura da file://) a partire da data/*.json
// Uso: node tools/build-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['chapters', 'scenes', 'dialogues', 'items', 'puzzles', 'characters', 'collectibles', 'endings', 'cutscenes'];
const bundle = {};
for (const f of FILES) bundle[f] = JSON.parse(readFileSync(join(root, 'data', f + '.json'), 'utf8'));
const out = '/* GENERATO da tools/build-data.mjs — non modificare a mano. Modifica data/*.json e rilancia lo script. */\n' +
  'window.ORFEO_DATA_BUNDLE = ' + JSON.stringify(bundle) + ';\n';
writeFileSync(join(root, 'data', 'bundle.js'), out);
console.log('data/bundle.js aggiornato (' + Math.round(out.length / 1024) + ' KB)');
