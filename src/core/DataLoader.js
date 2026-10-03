/* DataLoader — loads data/*.json (HTTP) or data/bundle.js (file:// fallback). */
(function () {
  'use strict';
  const O = window.Orfeo;

  const FILES = ['chapters', 'scenes', 'dialogues', 'items', 'puzzles', 'characters', 'collectibles', 'endings', 'cutscenes'];

  O.Data = {};

  O.loadData = async function (onProgress) {
    const bundle = window.ORFEO_DATA_BUNDLE || null;
    const useFetch = location.protocol !== 'file:';
    let done = 0;
    await Promise.all(
      FILES.map(async (name) => {
        let data = null;
        if (useFetch) {
          try {
            const res = await fetch('data/' + name + '.json', { cache: 'no-cache' });
            if (res.ok) data = await res.json();
          } catch (e) {
            console.warn('[Orfeo] impossibile leggere data/' + name + '.json, uso il bundle', e);
          }
        }
        if (!data && bundle) data = bundle[name];
        if (!data) throw new Error('Dati mancanti: ' + name);
        O.Data[name] = data;
        done++;
        if (onProgress) onProgress(done / FILES.length);
      })
    );
    return O.Data;
  };
})();
