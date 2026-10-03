/* AssetManager — knows which real asset files exist (assets/manifest.json),
 * preloads them, and lets every system fall back to procedural art when a
 * file is missing. Missing files are never requested, so no 404 noise. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Assets = {
    files: new Set(),
    images: {},
    missingRequested: new Set(),
    probe: /[?&]probe=1/.test(location.search),

    async init() {
      let manifest = null;
      if (location.protocol !== 'file:') {
        try {
          const res = await fetch('assets/manifest.json', { cache: 'no-cache' });
          if (res.ok) manifest = await res.json();
        } catch (e) {
          /* offline */
        }
      }
      if (!manifest && window.ORFEO_ASSET_MANIFEST) manifest = window.ORFEO_ASSET_MANIFEST;
      if (manifest && Array.isArray(manifest.files)) manifest.files.forEach((f) => this.files.add(f));
    },

    /** true if the file is known to exist (or probing is enabled) */
    has(path) {
      if (!path) return false;
      if (this.files.has(path)) return true;
      if (this.probe) return true;
      this.missingRequested.add(path);
      return false;
    },

    /** Return the first existing path among candidates, else null. */
    first(...paths) {
      for (const p of paths.flat()) if (p && this.files.has(p)) return p;
      if (this.probe) return paths.flat().find(Boolean) || null;
      paths.flat().forEach((p) => p && this.missingRequested.add(p));
      return null;
    },

    /** Load an image if present; resolves to HTMLImageElement or null. */
    image(path) {
      if (!this.has(path)) return Promise.resolve(null);
      if (this.images[path]) return this.images[path];
      this.images[path] = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          this.files.delete(path);
          resolve(null);
        };
        img.src = path;
      });
      return this.images[path];
    },

    async preload(paths, onProgress) {
      const list = paths.filter((p) => this.files.has(p));
      let done = 0;
      await Promise.all(
        list.map((p) =>
          this.image(p).then(() => {
            done++;
            if (onProgress) onProgress(done / list.length);
          })
        )
      );
      if (onProgress) onProgress(1);
    },

    report() {
      return { present: Array.from(this.files).sort(), missingRequested: Array.from(this.missingRequested).sort() };
    }
  };

  O.Assets = Assets;
})();
