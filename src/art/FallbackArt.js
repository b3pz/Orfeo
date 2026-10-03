/* FallbackArt — procedural SVG art used whenever a final asset is missing.
 * Everything here is TEMPORARY placeholder art: the real files listed in
 * docs/ASSET_REQUIREMENTS.md replace it automatically when present. */
(function () {
  'use strict';
  const O = window.Orfeo;

  /* ---------------- helpers ---------------- */
  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    return function () {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shade(hex, amt) {
    let c = (hex || '#777777').replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => O.clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  const A = (attrs) => Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
  const rect = (x, y, w, h, fill, extra) => `<rect ${A({ x, y, width: Math.max(0, w), height: Math.max(0, h), fill })} ${extra || ''}/>`;
  const poly = (pts, fill, extra) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" ${extra || ''}/>`;
  const circ = (cx, cy, r, fill, extra) => `<circle ${A({ cx, cy, r, fill })} ${extra || ''}/>`;
  const ell = (cx, cy, rx, ry, fill, extra) => `<ellipse ${A({ cx, cy, rx, ry, fill })} ${extra || ''}/>`;
  const line = (x1, y1, x2, y2, stroke, w, extra) => `<line ${A({ x1, y1, x2, y2, stroke, 'stroke-width': w || 2 })} ${extra || ''}/>`;
  const path = (d, fill, extra) => `<path d="${d}" fill="${fill}" ${extra || ''}/>`;
  const text = (x, y, s, size, fill, extra) =>
    `<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${size}" fill="${fill}" ${extra || ''}>${s}</text>`;

  let gradId = 0;
  function lin(stops, x2, y2) {
    const id = 'g' + gradId++;
    return {
      id,
      def: `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 == null ? 0 : x2}" y2="${y2 == null ? 1 : y2}">${stops
        .map((s, i) => (typeof s === 'string' ? [s] : s))
        .map((s, i) => `<stop offset="${s[1] != null ? s[1] : i / (stops.length - 1)}" stop-color="${s[0]}" ${s[2] != null ? `stop-opacity="${s[2]}"` : ''}/>`)
        .join('')}</linearGradient>`
    };
  }
  function rad(c, a) {
    const id = 'r' + gradId++;
    return {
      id,
      def: `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
    };
  }

  const TIMES = {
    day: { sky: ['#8fb3cf', '#d9c9a8'], amb: 0, tint: '#ffffff' },
    dawn: { sky: ['#4f5d85', '#e8a77a'], amb: 0.1, tint: '#ffd2a8' },
    dusk: { sky: ['#2b2f55', '#c9744c'], amb: 0.15, tint: '#ffb27a' },
    evening: { sky: ['#1b2238', '#6d4a52'], amb: 0.25, tint: '#ffc98a' },
    night: { sky: ['#070b16', '#1d2840'], amb: 0.45, tint: '#9fb4ff' },
    rain: { sky: ['#1a2029', '#3c4652'], amb: 0.35, tint: '#a9c0d6' }
  };

  /* ---------------- props ---------------- */
  // Each prop draws inside (0,0,w,h). opts: {c: base colour, a: accent, label}
  const PROPS = {
    desk(w, h, o) {
      const c = o.c || '#5a4130';
      return rect(0, h * 0.18, w, h * 0.14, shade(c, 0.12)) + rect(0, h * 0.3, w, h * 0.05, shade(c, -0.3)) +
        rect(w * 0.04, h * 0.35, w * 0.3, h * 0.65, shade(c, -0.1)) + rect(w * 0.08, h * 0.45, w * 0.22, h * 0.02, shade(c, 0.3)) +
        rect(w * 0.08, h * 0.65, w * 0.22, h * 0.02, shade(c, 0.3)) + rect(w * 0.9, h * 0.35, w * 0.06, h * 0.65, shade(c, -0.25)) +
        (o.items === false ? '' : rect(w * 0.55, h * 0.1, w * 0.18, h * 0.08, '#d8ccb0') + rect(w * 0.6, h * 0.06, w * 0.16, h * 0.08, '#efe6cf', 'transform="rotate(-6 0 0)"'));
    },
    table(w, h, o) {
      const c = o.c || '#5e4633';
      return ell(w / 2, h * 0.25, w / 2, h * 0.12, shade(c, 0.1)) + rect(w * 0.46, h * 0.3, w * 0.08, h * 0.65, shade(c, -0.3)) + ell(w / 2, h * 0.96, w * 0.22, h * 0.04, shade(c, -0.4));
    },
    computer(w, h, o) {
      const glow = o.on === false ? '#20261f' : '#5fd18a';
      return rect(w * 0.1, 0, w * 0.8, h * 0.62, '#cfc4a8') + rect(w * 0.17, h * 0.07, w * 0.66, h * 0.46, '#0c120e') +
        rect(w * 0.2, h * 0.1, w * 0.6, h * 0.4, glow, 'opacity="0.25"') + text(w * 0.24, h * 0.25, 'ORFEO_', h * 0.09, glow, 'font-family="monospace"') +
        rect(w * 0.35, h * 0.62, w * 0.3, h * 0.12, '#b7ab8f') + rect(0, h * 0.8, w, h * 0.2, '#c9bc9f') + rect(w * 0.05, h * 0.84, w * 0.9, h * 0.04, '#9b8f75');
    },
    laptop(w, h) {
      return poly([[w * 0.15, 0], [w * 0.85, 0], [w * 0.8, h * 0.65], [w * 0.2, h * 0.65]], '#2b2d33') + rect(w * 0.22, h * 0.06, w * 0.56, h * 0.5, '#7fa7c9', 'opacity=".8"') +
        poly([[0, h * 0.7], [w, h * 0.7], [w * 0.9, h], [w * 0.1, h]], '#3a3d44');
    },
    shelves(w, h, o) {
      const c = o.c || '#4a3526';
      const r = rng('sh' + w + h + (o.seed || ''));
      let s = rect(0, 0, w, h, shade(c, -0.25)) + rect(w * 0.03, h * 0.02, w * 0.94, h * 0.96, shade(c, -0.55));
      const rows = o.rows || Math.max(3, Math.round(h / 90));
      for (let i = 0; i < rows; i++) {
        const y = h * 0.02 + (i + 1) * (h * 0.96 / rows);
        s += rect(0, y - 8, w, 10, shade(c, 0.05));
        let x = w * 0.05;
        while (x < w * 0.93) {
          const bw = 8 + r() * 16;
          const bh = (h * 0.96 / rows) * (0.55 + r() * 0.35);
          const cols = o.paper ? ['#cdbf9d', '#b9aa86', '#ddd2b6', '#a99773'] : ['#6b2a22', '#2f4a3a', '#7a5a2a', '#3a3f5a', '#8a7a5a', '#5a2f3f', '#c2b28a'];
          if (r() > 0.1) s += rect(x, y - 8 - bh, bw, bh, cols[Math.floor(r() * cols.length)], r() > 0.85 ? `transform="rotate(${-8} ${x} ${y - 8})"` : '');
          x += bw + 1 + (r() > 0.85 ? 14 : 0);
        }
      }
      return s;
    },
    cabinet(w, h, o) {
      // card-catalogue drawers
      const c = o.c || '#6b4a2e';
      const cols = o.cols || 4, rows = o.rows || 5;
      let s = rect(0, 0, w, h, shade(c, -0.2)) + rect(-6, -10, w + 12, 14, shade(c, 0.1));
      const dw = (w - 12) / cols, dh = (h - 12) / rows;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const x = 6 + i * dw, y = 6 + j * dh;
          s += rect(x + 2, y + 2, dw - 4, dh - 4, shade(c, (i + j) % 2 ? 0.05 : 0)) + rect(x + dw / 2 - 10, y + dh * 0.3, 20, 7, '#c9b27a') + rect(x + dw / 2 - 4, y + dh * 0.55, 8, 6, '#2a1f14');
        }
      return s;
    },
    door(w, h, o) {
      const c = o.c || '#4b3423';
      return rect(-8, -8, w + 16, h + 8, shade(c, -0.35)) + rect(0, 0, w, h, c) + rect(w * 0.1, h * 0.06, w * 0.8, h * 0.38, shade(c, 0.08)) +
        rect(w * 0.1, h * 0.5, w * 0.8, h * 0.44, shade(c, 0.08)) + circ(w * 0.82, h * 0.52, Math.max(4, w * 0.04), '#c9a85a') +
        (o.open ? rect(0, 0, w, h, '#000', 'opacity=".55"') : '') + (o.label ? text(w * 0.1, h * 0.04, o.label, Math.min(22, w * 0.12), '#d9c79b') : '');
    },
    window(w, h, o) {
      const t = TIMES[o.time || 'evening'];
      const g = lin(t.sky);
      return `<defs>${g.def}</defs>` + rect(-10, -10, w + 20, h + 26, o.frame || '#3a2c20') + rect(0, 0, w, h, `url(#${g.id})`) +
        (o.city !== false ? cityRow(w, h, 'win' + w, t) : '') + rect(w / 2 - 4, 0, 8, h, o.frame || '#3a2c20') + rect(0, h * 0.45, w, 8, o.frame || '#3a2c20') +
        (o.rain ? rainLines(w, h, 'w' + w) : '') + rect(-16, h + 4, w + 32, 14, shade(o.frame || '#3a2c20', 0.15));
    },
    arch(w, h, o) {
      const c = o.c || '#6a5a48';
      return path(`M0 ${h} L0 ${w / 2} A${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2} L${w} ${h} L${w * 0.85} ${h} L${w * 0.85} ${w / 2} A${w * 0.35} ${w * 0.35} 0 0 0 ${w * 0.15} ${w / 2} L${w * 0.15} ${h} Z`, c) +
        path(`M${w * 0.15} ${h} L${w * 0.15} ${w / 2} A${w * 0.35} ${w * 0.35} 0 0 1 ${w * 0.85} ${w / 2} L${w * 0.85} ${h} Z`, o.inner || '#0d0b09', 'opacity=".85"');
    },
    painting(w, h, o) {
      const r = rng('p' + (o.seed || w));
      let s = rect(-8, -8, w + 16, h + 16, '#8a6a33') + rect(0, 0, w, h, o.c || '#3b4a3f');
      for (let i = 0; i < 6; i++) s += ell(r() * w, r() * h, w * (0.1 + r() * 0.3), h * (0.05 + r() * 0.2), ['#6a7a5a', '#a08a5a', '#2a3a4a', '#7a4a3a'][i % 4], 'opacity=".6"');
      return s;
    },
    frame(w, h, o) {
      return rect(-5, -5, w + 10, h + 10, '#2a2018') + rect(0, 0, w, h, o.c || '#cbbd9a') + (o.label ? text(6, h / 2, o.label, Math.min(18, h / 3), '#3a2a1a') : '');
    },
    poster(w, h, o) {
      return rect(0, 0, w, h, o.c || '#c9b58c') + rect(w * 0.1, h * 0.1, w * 0.8, h * 0.45, shade(o.c || '#c9b58c', -0.35)) + rect(w * 0.1, h * 0.65, w * 0.8, h * 0.06, '#3a2a1a') + rect(w * 0.1, h * 0.76, w * 0.5, h * 0.05, '#3a2a1a');
    },
    plant(w, h) {
      let s = poly([[w * 0.3, h * 0.7], [w * 0.7, h * 0.7], [w * 0.62, h], [w * 0.38, h]], '#7a4a2a');
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.33;
        s += ell(w / 2 + Math.cos(a) * w * 0.25, h * 0.45 + Math.sin(a) * h * 0.3, w * 0.12, h * 0.07, i % 2 ? '#2f5a35' : '#3e7044', `transform="rotate(${(a * 180) / Math.PI} ${w / 2 + Math.cos(a) * w * 0.25} ${h * 0.45 + Math.sin(a) * h * 0.3})"`);
      }
      return s;
    },
    crate(w, h, o) {
      const c = o.c || '#8a6a40';
      return rect(0, 0, w, h, c) + rect(0, 0, w, h * 0.12, shade(c, 0.2)) + line(0, 0, w, h, shade(c, -0.3), 6) + line(w, 0, 0, h, shade(c, -0.3), 6) + rect(0, 0, w, h, 'none', `stroke="${shade(c, -0.4)}" stroke-width="6"`) +
        (o.label ? text(w * 0.1, h * 0.55, o.label, Math.min(20, w * 0.15), '#2a1a0a') : '');
    },
    boxes(w, h, o) {
      return PROPS.crate(w * 0.55, h * 0.5, o).replace(/^/, `<g transform="translate(0 ${h * 0.5})">`) + '</g>' +
        `<g transform="translate(${w * 0.45} ${h * 0.55})">${PROPS.crate(w * 0.5, h * 0.45, { c: '#a8865a' })}</g>` +
        `<g transform="translate(${w * 0.12} ${h * 0.05})">${PROPS.crate(w * 0.45, h * 0.45, { c: '#9a7a4a', label: o.label })}</g>`;
    },
    rug(w, h, o) {
      return ell(w / 2, h / 2, w / 2, h / 2, o.c || '#6a2a22') + ell(w / 2, h / 2, w * 0.42, h * 0.38, 'none', `stroke="#c9a85a" stroke-width="4" opacity=".6"`);
    },
    curtain(w, h, o) {
      let s = '';
      for (let i = 0; i < 6; i++) s += rect((i * w) / 6, 0, w / 6 + 2, h, shade(o.c || '#5a1f22', i % 2 ? -0.15 : 0.05));
      return s + rect(-6, -10, w + 12, 14, '#8a6a33');
    },
    pillar(w, h, o) {
      const c = o.c || '#8a7b66';
      return rect(-w * 0.1, 0, w * 1.2, h * 0.06, shade(c, 0.1)) + rect(0, h * 0.06, w, h * 0.88, c) + rect(w * 0.15, h * 0.06, w * 0.1, h * 0.88, shade(c, 0.15)) +
        rect(w * 0.75, h * 0.06, w * 0.12, h * 0.88, shade(c, -0.2)) + rect(-w * 0.1, h * 0.94, w * 1.2, h * 0.06, shade(c, -0.1));
    },
    stairs(w, h, o) {
      const c = o.c || '#5a4a3a';
      let s = '';
      const n = o.steps || 8;
      for (let i = 0; i < n; i++) s += rect((i * w * 0.4) / n, h - ((i + 1) * h) / n, w - (i * w * 0.4) / n, h / n, shade(c, i % 2 ? -0.1 : 0.05));
      return s + (o.down ? rect(0, 0, w, h, '#000', 'opacity=".35"') : '');
    },
    railing(w, h, o) {
      let s = rect(0, 0, w, h * 0.1, o.c || '#2a2a2a');
      for (let x = 0; x < w; x += 22) s += rect(x, 0, 5, h, o.c || '#2a2a2a');
      return s + rect(0, h * 0.9, w, h * 0.1, o.c || '#2a2a2a');
    },
    bench(w, h, o) {
      const c = o.c || '#5a3f28';
      return rect(0, h * 0.35, w, h * 0.12, c) + rect(0, h * 0.05, w, h * 0.08, c) + rect(0, h * 0.18, w, h * 0.08, c) + rect(w * 0.06, h * 0.47, w * 0.05, h * 0.53, '#222') + rect(w * 0.89, h * 0.47, w * 0.05, h * 0.53, '#222');
    },
    streetlamp(w, h, o) {
      const g = rad('#ffd890', 0.55);
      return `<defs>${g.def}</defs>` + circ(w / 2, h * 0.1, w * 1.4, `url(#${g.id})`) + rect(w * 0.44, h * 0.12, w * 0.12, h * 0.88, '#1d1d1d') + poly([[w * 0.2, h * 0.04], [w * 0.8, h * 0.04], [w * 0.68, h * 0.15], [w * 0.32, h * 0.15]], '#1d1d1d') + rect(w * 0.34, h * 0.06, w * 0.32, h * 0.07, '#ffe1a0');
    },
    lamp(w, h) {
      const g = rad('#ffcf88', 0.5);
      return `<defs>${g.def}</defs>` + circ(w / 2, h * 0.15, w * 1.6, `url(#${g.id})`) + poly([[w * 0.2, h * 0.25], [w * 0.8, h * 0.25], [w * 0.65, 0], [w * 0.35, 0]], '#e0c48a') + rect(w * 0.46, h * 0.25, w * 0.08, h * 0.7, '#3a2c1c') + ell(w / 2, h * 0.97, w * 0.3, h * 0.03, '#3a2c1c');
    },
    hanglamp(w, h) {
      const g = rad('#ffd79a', 0.45);
      return `<defs>${g.def}</defs>` + circ(w / 2, h * 0.85, w * 2, `url(#${g.id})`) + line(w / 2, 0, w / 2, h * 0.7, '#111', 3) + poly([[w * 0.1, h], [w * 0.9, h], [w * 0.65, h * 0.7], [w * 0.35, h * 0.7]], '#2a2a22');
    },
    chandelier(w, h) {
      const g = rad('#ffe0a0', 0.4);
      let s = `<defs>${g.def}</defs>` + circ(w / 2, h * 0.6, w, `url(#${g.id})`) + line(w / 2, 0, w / 2, h * 0.5, '#6a5530', 3) + ell(w / 2, h * 0.6, w * 0.45, h * 0.1, 'none', 'stroke="#b8963c" stroke-width="5"');
      for (let i = 0; i < 5; i++) s += circ(w * 0.1 + i * w * 0.2, h * 0.55, 6, '#ffe7b0');
      return s;
    },
    candle(w, h) {
      const g = rad('#ffcf70', 0.6);
      return `<defs>${g.def}</defs>` + circ(w / 2, h * 0.15, w * 2.5, `url(#${g.id})`) + rect(w * 0.3, h * 0.25, w * 0.4, h * 0.75, '#e8dcc0') + ell(w / 2, h * 0.15, w * 0.15, h * 0.12, '#ffb84a');
    },
    building(w, h, o) {
      const r = rng('b' + (o.seed || w + h));
      const c = o.c || '#7a6a55';
      let s = rect(0, 0, w, h, c) + rect(0, 0, w, h * 0.04, shade(c, -0.3));
      const cols = Math.max(2, Math.round(w / 70)), rows = Math.max(2, Math.round(h / 110));
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const lit = r() > (o.lit != null ? o.lit : 0.6);
          s += rect(w * 0.06 + (i * w * 0.9) / cols, h * 0.08 + (j * h * 0.85) / rows, ((w * 0.9) / cols) * 0.55, ((h * 0.85) / rows) * 0.6, lit ? '#f2c77a' : shade(c, -0.45));
        }
      return s;
    },
    bridge(w, h, o) {
      const c = o.c || '#8a7a5e';
      let s = rect(0, 0, w, h * 0.25, c) + rect(0, -h * 0.06, w, h * 0.06, shade(c, 0.15));
      const n = o.arches || 3;
      for (let i = 0; i < n; i++) s += path(`M${(i * w) / n + w * 0.03} ${h} L${(i * w) / n + w * 0.03} ${h * 0.55} A${w / n / 2 - w * 0.03} ${h * 0.3} 0 0 1 ${((i + 1) * w) / n - w * 0.03} ${h * 0.55} L${((i + 1) * w) / n - w * 0.03} ${h} Z`, 'none') +
        rect((i * w) / n, h * 0.25, w * 0.04, h * 0.75, shade(c, -0.15));
      if (o.shops) for (let i = 0; i < 9; i++) s += rect(w * 0.02 + i * w * 0.108, -h * 0.4, w * 0.1, h * 0.36, ['#b07a3a', '#c99a5a', '#9a6a3a'][i % 3]) + rect(w * 0.04 + i * w * 0.108, -h * 0.32, w * 0.03, h * 0.08, '#f2c77a');
      return s;
    },
    river(w, h, o) {
      const g = lin([o.c || '#22323f', shade(o.c || '#22323f', -0.4)]);
      let s = `<defs>${g.def}</defs>` + rect(0, 0, w, h, `url(#${g.id})`);
      const r = rng('river' + w);
      for (let i = 0; i < 40; i++) s += rect(r() * w, r() * h, 30 + r() * 120, 2, '#ffd9a0', `opacity="${0.1 + r() * 0.3}"`);
      return s;
    },
    boat(w, h, o) {
      return path(`M0 ${h * 0.4} L${w} ${h * 0.4} L${w * 0.85} ${h} L${w * 0.12} ${h} Z`, o.c || '#3b2a1c') + rect(w * 0.2, h * 0.3, w * 0.6, h * 0.1, shade(o.c || '#3b2a1c', 0.2));
    },
    stall(w, h, o) {
      const c = o.c || '#2f4a35';
      let s = rect(0, h * 0.35, w, h * 0.65, c) + poly([[0, h * 0.35], [w, h * 0.35], [w * 0.95, h * 0.08], [w * 0.05, h * 0.08]], shade(c, 0.15));
      const r = rng('stall' + w);
      for (let i = 0; i < 10; i++) s += rect(w * 0.06 + i * w * 0.09, h * 0.22 - r() * 6, w * 0.07, h * 0.14, ['#c9b58c', '#8a3a2a', '#d8c7a0', '#5a6a8a'][i % 4]);
      return s;
    },
    counter(w, h, o) {
      const c = o.c || '#5a3a24';
      return rect(0, 0, w, h * 0.12, shade(c, 0.2)) + rect(w * 0.02, h * 0.12, w * 0.96, h * 0.88, c) + rect(w * 0.08, h * 0.25, w * 0.84, h * 0.6, shade(c, -0.15));
    },
    safe(w, h, o) {
      const c = o.c || '#3a3f45';
      return rect(0, 0, w, h, c) + rect(w * 0.08, h * 0.08, w * 0.84, h * 0.84, shade(c, 0.12)) + circ(w * 0.5, h * 0.45, Math.min(w, h) * 0.18, shade(c, -0.3)) + circ(w * 0.5, h * 0.45, Math.min(w, h) * 0.05, '#c9a85a') + rect(w * 0.78, h * 0.35, w * 0.06, h * 0.25, '#c9a85a');
    },
    deposit(w, h, o) {
      // wall of safe-deposit boxes
      const c = o.c || '#7a6a4a';
      let s = rect(0, 0, w, h, shade(c, -0.4));
      const cols = o.cols || 6, rows = o.rows || 5;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) s += rect(4 + (i * (w - 8)) / cols, 4 + (j * (h - 8)) / rows, (w - 8) / cols - 4, (h - 8) / rows - 4, (i + j) % 3 ? c : shade(c, 0.1)) + circ(4 + (i + 0.5) * ((w - 8) / cols), 4 + (j + 0.5) * ((h - 8) / rows), 4, '#2a2014');
      return s;
    },
    clock(w, h) {
      return circ(w / 2, h / 2, Math.min(w, h) / 2, '#6a4a28') + circ(w / 2, h / 2, Math.min(w, h) * 0.42, '#efe3c4') + line(w / 2, h / 2, w / 2, h * 0.2, '#111', 3) + line(w / 2, h / 2, w * 0.7, h / 2, '#111', 3);
    },
    mirror(w, h) {
      const g = lin(['#c8d5dc', '#6f7f8a', '#b4c3cc'], 1, 1);
      return `<defs>${g.def}</defs>` + ell(w / 2, h / 2, w / 2, h / 2, '#8a6a33') + ell(w / 2, h / 2, w * 0.42, h * 0.44, `url(#${g.id})`);
    },
    statue(w, h, o) {
      const c = o.c || '#bdb5a5';
      return rect(w * 0.15, h * 0.8, w * 0.7, h * 0.2, shade(c, -0.2)) + ell(w / 2, h * 0.13, w * 0.13, h * 0.08, c) + path(`M${w * 0.35} ${h * 0.2} Q${w / 2} ${h * 0.17} ${w * 0.65} ${h * 0.2} L${w * 0.72} ${h * 0.8} L${w * 0.28} ${h * 0.8} Z`, c) + line(w * 0.65, h * 0.28, w * 0.85, h * 0.12, c, 10);
    },
    fountain(w, h) {
      return ell(w / 2, h * 0.85, w / 2, h * 0.15, '#7a7468') + ell(w / 2, h * 0.82, w * 0.44, h * 0.1, '#30485a') + rect(w * 0.45, h * 0.3, w * 0.1, h * 0.5, '#8a8474') + ell(w / 2, h * 0.3, w * 0.2, h * 0.06, '#8a8474') + path(`M${w / 2} ${h * 0.25} Q${w * 0.3} ${h * 0.1} ${w * 0.25} ${h * 0.75}`, 'none', 'stroke="#9fc4dc" stroke-width="3" opacity=".7"') + path(`M${w / 2} ${h * 0.25} Q${w * 0.7} ${h * 0.1} ${w * 0.75} ${h * 0.75}`, 'none', 'stroke="#9fc4dc" stroke-width="3" opacity=".7"');
    },
    gate(w, h, o) {
      let s = '';
      const open = o.open;
      for (let x = 0; x <= w; x += w / 9) s += rect(open ? x * 0.15 : x, 0, 6, h, '#1d1b18');
      return s + rect(0, h * 0.1, open ? w * 0.15 : w, 8, '#1d1b18') + rect(0, h * 0.9, open ? w * 0.15 : w, 8, '#1d1b18');
    },
    lever(w, h, o) {
      const ang = o.down ? 40 : -40;
      return rect(w * 0.3, h * 0.6, w * 0.4, h * 0.4, '#3a3530') + `<g transform="rotate(${ang} ${w / 2} ${h * 0.65})">${rect(w * 0.45, 0, w * 0.1, h * 0.65, '#6a5a40')}${circ(w / 2, 0, w * 0.12, '#8a2a20')}</g>`;
    },
    vent(w, h) {
      let s = rect(0, 0, w, h, '#2a2a2a') + rect(4, 4, w - 8, h - 8, '#0e0e0e');
      for (let y = 10; y < h - 6; y += 10) s += rect(6, y, w - 12, 4, '#4a4a4a');
      return s;
    },
    machine(w, h, o) {
      const c = o.c || '#5a4a32';
      let s = rect(0, h * 0.15, w, h * 0.85, shade(c, -0.2)) + rect(w * 0.05, h * 0.2, w * 0.9, h * 0.6, c);
      for (let i = 0; i < 4; i++) s += circ(w * (0.2 + i * 0.2), h * 0.45, Math.min(w, h) * 0.08, '#b8963c') + circ(w * (0.2 + i * 0.2), h * 0.45, Math.min(w, h) * 0.03, '#2a2014');
      return s + rect(w * 0.3, 0, w * 0.4, h * 0.15, shade(c, 0.1));
    },
    rings(w, h) {
      let s = '';
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
      ['#6a5030', '#8a6a3a', '#a8864a', '#c9a85a'].forEach((c, i) => (s += circ(cx, cy, R * (1 - i * 0.22), c) + circ(cx, cy, R * (1 - i * 0.22) - 6, 'none', 'stroke="#2a1f10" stroke-width="3"')));
      return s + circ(cx, cy, R * 0.2, '#2a1f10');
    },
    projector(w, h) {
      return rect(w * 0.1, h * 0.35, w * 0.6, h * 0.35, '#2a2a2e') + circ(w * 0.3, h * 0.25, h * 0.18, '#3a3a40') + circ(w * 0.55, h * 0.25, h * 0.18, '#3a3a40') + rect(w * 0.7, h * 0.45, w * 0.25, h * 0.15, '#555') + rect(w * 0.3, h * 0.7, w * 0.06, h * 0.3, '#222') + rect(w * 0.5, h * 0.7, w * 0.06, h * 0.3, '#222');
    },
    phonograph(w, h) {
      return rect(w * 0.1, h * 0.6, w * 0.8, h * 0.4, '#5a3a20') + ell(w * 0.45, h * 0.6, w * 0.3, h * 0.05, '#111') + path(`M${w * 0.55} ${h * 0.55} Q${w * 0.6} ${h * 0.2} ${w * 0.9} ${h * 0.05} L${w} ${h * 0.35} Q${w * 0.7} ${h * 0.35} ${w * 0.6} ${h * 0.58} Z`, '#b8963c');
    },
    phone(w, h) {
      return rect(w * 0.1, h * 0.3, w * 0.8, h * 0.6, '#1a1a1a') + path(`M${w * 0.05} ${h * 0.25} Q${w / 2} ${h * 0.05} ${w * 0.95} ${h * 0.25} L${w * 0.85} ${h * 0.35} L${w * 0.15} ${h * 0.35} Z`, '#222') + circ(w / 2, h * 0.6, w * 0.2, '#ddd');
    },
    sign(w, h, o) {
      return rect(0, 0, w, h, o.c || '#2a2a2a') + rect(4, 4, w - 8, h - 8, 'none', 'stroke="#c9a85a" stroke-width="2"') + text(w * 0.07, h * 0.65, o.label || '', Math.min(h * 0.5, 34), '#e8d9b0');
    },
    car(w, h, o) {
      const c = o.c || '#5a1f1f';
      return path(`M0 ${h * 0.75} L0 ${h * 0.45} L${w * 0.2} ${h * 0.4} L${w * 0.32} ${h * 0.1} L${w * 0.7} ${h * 0.1} L${w * 0.85} ${h * 0.4} L${w} ${h * 0.5} L${w} ${h * 0.75} Z`, c) + rect(w * 0.36, h * 0.16, w * 0.3, h * 0.22, '#8fb3cf', 'opacity=".6"') + circ(w * 0.22, h * 0.78, h * 0.17, '#111') + circ(w * 0.78, h * 0.78, h * 0.17, '#111');
    },
    tree(w, h, o) {
      return rect(w * 0.45, h * 0.5, w * 0.1, h * 0.5, '#3a2a1a') + ell(w / 2, h * 0.35, w * 0.45, h * 0.32, o.c || '#2f4a2f') + ell(w * 0.35, h * 0.25, w * 0.25, h * 0.2, shade(o.c || '#2f4a2f', 0.1));
    },
    cypress(w, h) {
      return rect(w * 0.45, h * 0.85, w * 0.1, h * 0.15, '#3a2a1a') + ell(w / 2, h * 0.45, w * 0.3, h * 0.45, '#1f3324');
    },
    dome(w, h, o) {
      const c = o.c || '#a8562f';
      return rect(w * 0.1, h * 0.6, w * 0.8, h * 0.4, '#d6c8a8') + path(`M${w * 0.12} ${h * 0.6} Q${w * 0.12} ${h * 0.05} ${w / 2} ${h * 0.05} Q${w * 0.88} ${h * 0.05} ${w * 0.88} ${h * 0.6} Z`, c) + rect(w * 0.46, 0, w * 0.08, h * 0.08, '#d6c8a8');
    },
    minaret(w, h) {
      return rect(w * 0.3, h * 0.1, w * 0.4, h * 0.9, '#cfc2a2') + poly([[w * 0.3, h * 0.1], [w * 0.7, h * 0.1], [w / 2, 0]], '#7a8a9a') + rect(w * 0.2, h * 0.35, w * 0.6, h * 0.04, '#bfb292');
    },
    tower(w, h, o) {
      return rect(0, h * 0.12, w, h * 0.88, o.c || '#9a8a72') + poly([[0, h * 0.12], [w, h * 0.12], [w / 2, 0]], shade(o.c || '#9a8a72', -0.3)) + rect(w * 0.35, h * 0.3, w * 0.3, h * 0.12, '#1a1410');
    },
    trunk(w, h, o) {
      const c = o.c || '#5a3a22';
      return rect(0, h * 0.25, w, h * 0.75, c) + path(`M0 ${h * 0.3} Q${w / 2} ${-h * 0.05} ${w} ${h * 0.3} Z`, shade(c, 0.15)) + rect(w * 0.45, h * 0.3, w * 0.1, h * 0.15, '#c9a85a') + rect(0, h * 0.55, w, h * 0.05, shade(c, -0.3));
    },
    sofa(w, h, o) {
      const c = o.c || '#5a2f2f';
      return rect(0, h * 0.1, w, h * 0.5, shade(c, -0.1)) + rect(-w * 0.03, h * 0.35, w * 1.06, h * 0.4, c) + rect(-w * 0.05, h * 0.3, w * 0.1, h * 0.55, shade(c, 0.1)) + rect(w * 0.95, h * 0.3, w * 0.1, h * 0.55, shade(c, 0.1)) + rect(w * 0.05, h * 0.75, w * 0.04, h * 0.25, '#222') + rect(w * 0.91, h * 0.75, w * 0.04, h * 0.25, '#222');
    },
    corkboard(w, h) {
      const r = rng('cork' + w);
      let s = rect(-6, -6, w + 12, h + 12, '#5a3a22') + rect(0, 0, w, h, '#b88a55');
      const pts = [];
      for (let i = 0; i < 7; i++) {
        const x = r() * (w - 60) + 10, y = r() * (h - 60) + 10;
        pts.push([x + 25, y + 5]);
        s += rect(x, y, 50, 38, ['#efe6cf', '#d8ccb0', '#c9b58c'][i % 3], `transform="rotate(${r() * 10 - 5} ${x} ${y})"`) + circ(x + 25, y + 5, 4, '#a8231f');
      }
      for (let i = 0; i < pts.length - 1; i++) s += line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#a8231f', 2);
      return s;
    },
    easel(w, h) {
      return line(w * 0.2, h, w * 0.5, 0, '#5a3a22', 8) + line(w * 0.8, h, w * 0.5, 0, '#5a3a22', 8) + rect(w * 0.1, h * 0.15, w * 0.8, h * 0.5, '#e8dfc8') + rect(w * 0.15, h * 0.2, w * 0.7, h * 0.4, '#8a9aa8', 'opacity=".5"');
    },
    scaffold(w, h) {
      let s = '';
      for (let x = 0; x <= w; x += w / 3) s += rect(x, 0, 8, h, '#8a8a8a');
      for (let y = h * 0.1; y <= h; y += h / 3) s += rect(0, y, w, 8, '#8a8a8a') + rect(0, y - 14, w, 12, '#7a5a30');
      return s + line(0, 0, w, h / 3, '#8a8a8a', 5);
    },
    brickwall(w, h, o) {
      let s = rect(0, 0, w, h, '#4a2f25');
      for (let y = 0; y < h; y += 26)
        for (let x = (y / 26) % 2 ? -30 : 0; x < w; x += 60) s += rect(x + 2, y + 2, 56, 22, (x + y) % 3 ? '#7a4a38' : '#6a3e30');
      if (o.hole) s += path(`M${w * 0.3} ${h * 0.25} L${w * 0.7} ${h * 0.2} L${w * 0.75} ${h * 0.75} L${w * 0.25} ${h * 0.8} Z`, '#0a0806');
      return s;
    },
    hole(w, h) {
      return ell(w / 2, h / 2, w / 2, h / 2, '#050403') + ell(w / 2, h / 2, w * 0.4, h * 0.4, '#000');
    },
    papers(w, h) {
      const r = rng('pp' + w);
      let s = '';
      for (let i = 0; i < 6; i++) s += rect(r() * w * 0.6, r() * h * 0.5, w * 0.4, h * 0.5, ['#efe6cf', '#ddd2b6', '#cdbf9d'][i % 3], `transform="rotate(${r() * 30 - 15} ${w / 2} ${h / 2})"`);
      return s;
    },
    book(w, h, o) {
      return rect(0, h * 0.2, w, h * 0.8, o.c || '#5a2a22') + rect(w * 0.05, h * 0.25, w * 0.9, h * 0.08, '#c9a85a') + rect(w * 0.08, h * 0.12, w * 0.9, h * 0.1, '#efe6cf');
    },
    bed(w, h) {
      return rect(0, h * 0.4, w, h * 0.4, '#d8ccb0') + rect(0, h * 0.1, w * 0.06, h * 0.9, '#5a3a22') + rect(w * 0.06, h * 0.35, w * 0.2, h * 0.12, '#efe6cf') + rect(w * 0.3, h * 0.4, w * 0.7, h * 0.4, '#5a6a7a');
    },
    column_row(w, h) {
      let s = '';
      for (let i = 0; i < 5; i++) s += `<g transform="translate(${(i * w) / 5 + w * 0.04} 0)">${PROPS.pillar(w * 0.08, h, { c: '#6a6458' })}</g>`;
      return s;
    },
    water(w, h, o) {
      return PROPS.river(w, h, { c: o.c || '#1a2a2a' });
    },
    figure(w, h, o) {
      // distant silhouette, e.g. the woman in the photographs
      const c = o.c || '#111';
      return ell(w / 2, h * 0.1, w * 0.18, h * 0.08, c) + path(`M${w * 0.3} ${h * 0.18} L${w * 0.7} ${h * 0.18} L${w * 0.85} ${h} L${w * 0.15} ${h} Z`, c) + (o.hat ? ell(w / 2, h * 0.05, w * 0.32, h * 0.03, c) : '');
    },
    symbol(w, h, o) {
      // Orfeo symbol: lyre in a circle
      const c = o.c || '#c9a85a';
      return circ(w / 2, h / 2, Math.min(w, h) * 0.45, 'none', `stroke="${c}" stroke-width="${Math.max(2, w * 0.05)}" opacity="${o.a || 0.8}"`) + lyre(w / 2, h / 2, Math.min(w, h) * 0.3, c, o.a || 0.8);
    },
    glint(w, h) {
      // subtle sparkle for collectibles
      return path(`M${w / 2} 0 L${w * 0.58} ${h * 0.42} L${w} ${h / 2} L${w * 0.58} ${h * 0.58} L${w / 2} ${h} L${w * 0.42} ${h * 0.58} L0 ${h / 2} L${w * 0.42} ${h * 0.42} Z`, '#ffe9b0', 'opacity=".75" class="glint"');
    },
    exit(w, h, o) {
      // darkened passage; arrow drawn by UI
      return rect(0, 0, w, h, o.c || '#000', 'opacity=".25"');
    },
    none() {
      return '';
    },
    generic(w, h, o) {
      return rect(0, 0, w, h, o.c || '#5a4a3a', 'opacity=".7"') + rect(0, 0, w, h, 'none', 'stroke="#c9a85a" stroke-width="2" opacity=".4"');
    }
  };

  function lyre(cx, cy, s, c, a) {
    return `<g opacity="${a == null ? 1 : a}" stroke="${c}" stroke-width="${Math.max(2, s * 0.08)}" fill="none"><path d="M${cx - s * 0.6} ${cy - s * 0.8} Q${cx - s * 0.9} ${cy + s * 0.2} ${cx - s * 0.25} ${cy + s * 0.7} L${cx + s * 0.25} ${cy + s * 0.7} Q${cx + s * 0.9} ${cy + s * 0.2} ${cx + s * 0.6} ${cy - s * 0.8}"/><line x1="${cx - s * 0.55}" y1="${cy - s * 0.45}" x2="${cx + s * 0.55}" y2="${cy - s * 0.45}"/><line x1="${cx - s * 0.15}" y1="${cy - s * 0.45}" x2="${cx - s * 0.15}" y2="${cy + s * 0.7}"/><line x1="${cx + s * 0.15}" y1="${cy - s * 0.45}" x2="${cx + s * 0.15}" y2="${cy + s * 0.7}"/></g>`;
  }

  function cityRow(w, h, seed, t) {
    const r = rng(seed);
    let s = '';
    let x = -10;
    while (x < w) {
      const bw = 30 + r() * 60, bh = h * (0.25 + r() * 0.35);
      s += rect(x, h - bh, bw, bh, shade('#1a1814', t.amb > 0.3 ? -0.3 : 0.2));
      for (let i = 0; i < 4; i++) if (r() > 0.5) s += rect(x + 5 + r() * (bw - 12), h - bh + 6 + r() * (bh - 14), 5, 7, '#f2c77a', 'opacity=".8"');
      x += bw;
    }
    return s;
  }
  function rainLines(w, h, seed) {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < Math.round((w * h) / 4000); i++) {
      const x = r() * w, y = r() * h;
      s += line(x, y, x - 6, y + 22, '#c9d6e6', 1, 'opacity=".35"');
    }
    return s;
  }

  function drawProp(kind, w, h, opts) {
    const fn = PROPS[kind] || PROPS.generic;
    try {
      return fn(w, h, opts || {});
    } catch (e) {
      console.warn('[Orfeo] prop fallback error', kind, e);
      return PROPS.generic(w, h, {});
    }
  }

  /* ---------------- backgrounds ---------------- */
  function background(scene) {

    const art = scene.art || {};
    const W = O.W, H = O.H;
    const hz = art.horizon || 640;
    const t = TIMES[art.time || 'evening'] || TIMES.evening;
    const defs = [];
    let body = '';
    const type = art.type || 'interior';

    if (type === 'interior' || type === 'underground') {
      const wall = art.wall || (type === 'underground' ? '#3a342c' : '#4a3a2c');
      const floor = art.floor || shade(wall, -0.35);
      const gw = lin([shade(wall, 0.1), shade(wall, -0.25)]);
      const gf = lin([shade(floor, 0.05), shade(floor, -0.4)]);
      defs.push(gw.def, gf.def);
      body += rect(0, 0, W, hz, `url(#${gw.id})`);
      if (type === 'underground') {
        const r = rng(scene.id || 'u');
        for (let y = 0; y < hz; y += 46)
          for (let x = (y / 46) % 2 ? -50 : 0; x < W; x += 100) body += rect(x + 3, y + 3, 94, 40, shade(wall, (r() - 0.5) * 0.25), 'opacity=".9"');
        body += path(`M0 0 L0 ${hz * 0.5} Q${W / 2} ${-hz * 0.3} ${W} ${hz * 0.5} L${W} 0 Z`, '#0b0907', 'opacity=".85"');
      } else {
        if (art.wainscot !== false) body += rect(0, hz - 170, W, 170, shade(wall, -0.2)) + rect(0, hz - 176, W, 8, shade(wall, 0.15));
        if (art.wallpaper) for (let x = 0; x < W; x += 64) body += rect(x, 0, 2, hz - 176, shade(wall, 0.12), 'opacity=".5"');
        if (art.beams) for (let x = 60; x < W; x += 260) body += rect(x, 0, 40, 60, shade(wall, -0.45));
      }
      body += rect(0, hz, W, H - hz, `url(#${gf.id})`);
      // perspective floor lines
      const vx = art.vanish || W / 2;
      for (let i = -12; i <= 12; i++) body += line(vx + i * 40, hz, vx + i * 260, H, shade(floor, -0.25), 2, 'opacity=".5"');
      for (let j = 1; j < 7; j++) {
        const y = hz + (H - hz) * Math.pow(j / 7, 1.7);
        body += line(0, y, W, y, shade(floor, -0.25), 2, 'opacity=".35"');
      }
      body += rect(0, hz - 4, W, 8, shade(wall, -0.5));
    } else {
      // exterior
      const sky = art.sky || t.sky;
      const gs = lin(sky);
      defs.push(gs.def);
      body += rect(0, 0, W, hz + 10, `url(#${gs.id})`);
      if (art.time === 'night' || art.stars) {
        const r = rng('stars' + scene.id);
        for (let i = 0; i < 120; i++) body += circ(r() * W, r() * hz * 0.7, r() * 1.8, '#fff', `opacity="${0.3 + r() * 0.6}"`);
        body += circ(W * 0.82, 130, 46, '#efe8d0', 'opacity=".85"');
      }
      if (art.sun) {
        const g = rad('#ffd08a', 0.6);
        defs.push(g.def);
        body += circ(art.sun[0], art.sun[1], 380, `url(#${g.id})`) + circ(art.sun[0], art.sun[1], 60, '#ffe2b0');
      }
      // far skyline
      const r = rng('sky' + scene.id);
      let x = -20;
      while (x < W) {
        const bw = 60 + r() * 140, bh = 80 + r() * (art.skyline || 260);
        body += rect(x, hz - bh, bw, bh + 10, shade(sky[0], -0.25), 'opacity=".9"');
        if (r() > 0.75) body += poly([[x, hz - bh], [x + bw, hz - bh], [x + bw / 2, hz - bh - 50]], shade(sky[0], -0.3));
        for (let i = 0; i < 5; i++) if (r() > 0.55) body += rect(x + 8 + r() * (bw - 20), hz - bh + 12 + r() * (bh - 30), 7, 10, '#f2c77a', `opacity="${0.4 + t.amb}"`);
        x += bw - 4;
      }
      const ground = art.ground || '#3a342c';
      const gg = lin([shade(ground, 0.1), shade(ground, -0.45)]);
      defs.push(gg.def);
      body += rect(0, hz, W, H - hz, `url(#${gg.id})`);
      if (art.cobbles !== false) {
        const rr = rng('cob' + scene.id);
        for (let j = 0; j < 9; j++) {
          const y = hz + (H - hz) * Math.pow((j + 1) / 10, 1.5);
          for (let i = 0; i < 26; i++) body += ell(rr() * W, y, 24 + j * 4, 5 + j, shade(ground, -0.15 + rr() * 0.25), 'opacity=".45"');
        }
      }
    }

    // decorative layers
    (art.layers || []).forEach((l) => {
      body += `<g transform="translate(${l.x || 0} ${l.y || 0})${l.flip ? ` translate(${l.w} 0) scale(-1 1)` : ''}" opacity="${l.o != null ? l.o : 1}">${drawProp(l.k, l.w || 100, l.h || 100, l)}</g>`;
    });

    // lights
    (art.light || []).forEach((L) => {
      const g = rad(L.c || '#ffcf88', L.a != null ? L.a : 0.35);
      defs.push(g.def);
      body += circ(L.x, L.y, L.r || 400, `url(#${g.id})`, 'style="mix-blend-mode:screen"');
    });
    // ambient darkness
    if (t.amb) body += rect(0, 0, W, H, '#05070d', `opacity="${t.amb * (art.dark != null ? art.dark : 1)}"`);
    // vignette
    const v = `vig${gradId++}`;
    defs.push(`<radialGradient id="${v}" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/></radialGradient>`);
    body += rect(0, 0, W, H, `url(#${v})`);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs.join('')}</defs>${body}</svg>`;
  }

  function hotspotProp(h) {
    if (!h.art) return '';
    const a = typeof h.art === 'string' ? { k: h.art } : h.art;
    const [x, y, w, hh] = h.rect;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="prop" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px" viewBox="0 0 ${w} ${hh}" overflow="visible">${drawProp(a.k, w, hh, a)}</svg>`;
  }

  /* ---------------- characters (full body) ---------------- */
  function hairBack(cfg, s) {
    const c = cfg.hair || '#2a1d14';
    switch (cfg.hairStyle) {
      case 'long': return path(`M${-38 * s} ${-8 * s} Q${-46 * s} ${60 * s} ${-30 * s} ${92 * s} L${30 * s} ${92 * s} Q${44 * s} ${60 * s} ${36 * s} ${-8 * s} Z`, c);
      case 'bob': return path(`M${-36 * s} ${-6 * s} Q${-40 * s} ${36 * s} ${-26 * s} ${44 * s} L${26 * s} ${44 * s} Q${40 * s} ${36 * s} ${36 * s} ${-6 * s} Z`, c);
      case 'bun': return circ(-24 * s, -30 * s, 16 * s, c);
      default: return '';
    }
  }
  function hairFront(cfg, s) {
    const c = cfg.hair || '#2a1d14';
    switch (cfg.hairStyle) {
      case 'bald': return path(`M${-30 * s} ${-18 * s} Q0 ${-30 * s} ${30 * s} ${-18 * s} L${32 * s} ${-6 * s} L${-32 * s} ${-6 * s} Z`, c, 'opacity=".6"');
      case 'hat': return ell(0, -26 * s, 46 * s, 9 * s, cfg.hatColor || '#222') + path(`M${-28 * s} ${-26 * s} Q${-26 * s} ${-58 * s} 0 ${-58 * s} Q${26 * s} ${-58 * s} ${28 * s} ${-26 * s} Z`, cfg.hatColor || '#222') + rect(-28 * s, -34 * s, 56 * s, 7 * s, '#6a1a1a');
      case 'long':
      case 'bob': return path(`M${-34 * s} ${-2 * s} Q${-36 * s} ${-44 * s} 0 ${-44 * s} Q${38 * s} ${-44 * s} ${34 * s} ${4 * s} Q${14 * s} ${-26 * s} ${-8 * s} ${-24 * s} Q${-22 * s} ${-14 * s} ${-34 * s} ${-2 * s} Z`, c);
      case 'grey':
      default: return path(`M${-32 * s} ${-4 * s} Q${-34 * s} ${-44 * s} 0 ${-44 * s} Q${34 * s} ${-44 * s} ${32 * s} ${-6 * s} Q${20 * s} ${-26 * s} 0 ${-26 * s} Q${-20 * s} ${-26 * s} ${-32 * s} ${-4 * s} Z`, cfg.hairStyle === 'grey' ? '#9a958c' : c);
    }
  }

  function character(id, cfg) {
    cfg = cfg || {};
    const skin = cfg.skin || '#d6a77f';
    const top = cfg.top || '#2f3b4a';
    const bottom = cfg.bottom || '#2a2a33';
    const shoes = cfg.shoes || '#1a1410';
    const long = cfg.topStyle === 'coat' || cfg.topStyle === 'trench' || cfg.topStyle === 'dress';
    const dress = cfg.topStyle === 'dress';
    const s = 1;
    // body coordinates: viewBox 0 0 200 420, feet at y=410, x=100
    const leg = (cls, dx) =>
      `<g class="leg ${cls}" style="transform-origin:${100 + dx}px 235px">${rect(88 + dx, 232, 24, 160, dress ? skin : bottom)}${rect(84 + dx, 388, 38, 18, shoes, 'rx="6"')}</g>`;
    const arm = (cls, dx, shadeAmt) =>
      `<g class="arm ${cls}" style="transform-origin:${100 + dx}px 128px">${rect(90 + dx, 122, 20, 112, shade(top, shadeAmt), 'rx="9"')}${circ(100 + dx, 238, 10, skin)}</g>`;
    const torso =
      `<g class="torso">` +
      path(`M64 128 Q100 112 136 128 L${long ? 146 : 138} ${long ? 330 : 246} L${long ? 54 : 62} ${long ? 330 : 246} Z`, top) +
      (cfg.topStyle === 'jacket' || cfg.topStyle === 'trench' || cfg.topStyle === 'coat' ? path(`M100 124 L92 200 L100 ${long ? 330 : 246} L108 200 Z`, shade(top, -0.25)) + path('M86 124 L100 160 L114 124 Z', cfg.shirt || '#d8d2c4') : '') +
      (cfg.topStyle === 'vest' ? path('M80 126 L100 170 L120 126 L134 244 L66 244 Z', cfg.vest || '#5a3a22') : '') +
      (cfg.scarf ? path('M76 120 Q100 136 124 120 L124 134 Q100 150 76 134 Z', cfg.scarf) + rect(110, 130, 12, 50, cfg.scarf) : '') +
      (cfg.belt ? rect(64, 240, 74, 8, cfg.belt) : '') +
      `</g>`;
    const head =
      `<g class="head" style="transform-origin:100px 110px"><g transform="translate(100 74)">` +
      hairBack(cfg, s) +
      rect(-9, 22, 18, 22, shade(skin, -0.1)) +
      ell(0, 0, 30, 36, skin) +
      ell(18, 2, 4, 6, shade(skin, -0.15)) +
      circ(10, -2, 3, '#1a1410') +
      path('M 6 14 Q 12 17 18 13', 'none', `stroke="${shade(skin, -0.45)}" stroke-width="2"`) +
      (cfg.beard ? path(`M-22 10 Q-20 40 4 42 Q26 40 28 8 Q22 22 8 22 Q-8 24 -22 10 Z`, cfg.beardColor || cfg.hair || '#2a1d14', 'opacity=".85"') : '') +
      (cfg.moustache ? path('M2 12 Q12 6 22 12 Q12 10 2 12 Z', cfg.hair || '#3a2a1a') : '') +
      (cfg.glasses ? circ(10, -2, 8, 'none', 'stroke="#222" stroke-width="2"') + line(18, -2, 28, -4, '#222', 2) : '') +
      hairFront(cfg, s) +
      `</g></g>`;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 420" class="actor-svg">` +
      ell(100, 408, 56, 10, '#000', 'opacity=".35" class="shadow"') +
      `<g class="body">` +
      leg('leg-b', -10) +
      arm('arm-b', -22, -0.25) +
      (dress ? path('M58 230 L142 230 L152 330 L48 330 Z', top) : '') +
      torso +
      leg('leg-f', 8) +
      head +
      arm('arm-f', 26, 0.05) +
      `</g></svg>`
    );
  }

  /* ---------------- portraits with expressions ---------------- */
  const EXPR = {
    neutral: { brow: [0, 0], eye: 1, mouth: 'M-14 38 Q0 41 14 38' },
    smile: { brow: [-2, -2], eye: 0.75, mouth: 'M-17 34 Q0 50 17 34' },
    laugh: { brow: [-4, -4], eye: 0.2, mouth: 'M-18 32 Q0 58 18 32 Z', fillMouth: true },
    surprised: { brow: [-9, -9], eye: 1.35, mouth: 'M-7 40 a7 9 0 1 0 14 0 a7 9 0 1 0 -14 0', fillMouth: true },
    worried: { brow: [-5, 4], eye: 1, mouth: 'M-14 42 Q-6 37 0 40 Q6 43 14 39', tilt: 'in' },
    sad: { brow: [-6, 5], eye: 0.8, mouth: 'M-14 44 Q0 34 14 44', tilt: 'in' },
    angry: { brow: [5, -3], eye: 0.85, mouth: 'M-15 42 Q0 36 15 42', tilt: 'out' },
    think: { brow: [-7, 2], eye: 0.9, mouth: 'M-12 40 Q2 40 14 36', look: 6 },
    skeptical: { brow: [-8, 3], eye: 0.85, mouth: 'M-14 40 Q4 42 16 35', asym: true },
    tender: { brow: [-3, -1], eye: 0.6, mouth: 'M-12 36 Q0 45 12 36', blush: true },
    determined: { brow: [3, 0], eye: 0.9, mouth: 'M-14 39 L14 39', tilt: 'out' },
    scared: { brow: [-8, 6], eye: 1.3, mouth: 'M-12 42 Q0 36 12 42 Q0 46 -12 42 Z', fillMouth: true, tilt: 'in' }
  };
  O.EXPRESSIONS = Object.keys(EXPR);

  function portrait(id, cfg, expr) {
    cfg = cfg || {};
    const e = EXPR[expr] || EXPR.neutral;
    const skin = cfg.skin || '#d6a77f';
    const top = cfg.top || '#2f3b4a';
    const hair = cfg.hair || '#2a1d14';
    const bgc = cfg.portraitBg || '#3a2c20';
    const eyeH = 5 * e.eye;
    const look = e.look || 0;
    const browY = -18;
    const bL = e.brow[0], bR = e.asym ? -e.brow[1] : e.brow[0];
    const tiltIn = e.tilt === 'in' ? 1 : e.tilt === 'out' ? -1 : 0;
    const brows =
      path(`M-30 ${browY + bL + tiltIn * 4} Q-20 ${browY + bL - 4} -8 ${browY + bL - tiltIn * 4}`, 'none', `stroke="${shade(hair, -0.2)}" stroke-width="5" stroke-linecap="round"`) +
      path(`M8 ${browY + bR - tiltIn * 4} Q20 ${browY + bR - 4} 30 ${browY + bR + tiltIn * 4}`, 'none', `stroke="${shade(hair, -0.2)}" stroke-width="5" stroke-linecap="round"`);
    const eye = (cx) =>
      e.eye < 0.3
        ? path(`M${cx - 8} -2 Q${cx} -9 ${cx + 8} -2`, 'none', 'stroke="#1a1410" stroke-width="3"')
        : ell(cx, -3, 8, Math.max(2, eyeH + 2), '#f4efe6') + circ(cx + look, -3, Math.min(5, eyeH + 1), cfg.eyes || '#3a2a1a') + circ(cx + look + 1.5, -5, 1.4, '#fff');
    const g = lin([shade(bgc, 0.25), shade(bgc, -0.5)]);
    gradId++;
    let hb = '', hf = '';
    switch (cfg.hairStyle) {
      case 'long':
        hb = path('M-52 -30 Q-66 70 -60 140 L60 140 Q66 70 52 -30 Z', hair);
        hf = path('M-48 -6 Q-54 -72 0 -74 Q56 -72 50 -2 Q38 -40 4 -44 Q-30 -40 -48 -6 Z', hair);
        break;
      case 'bob':
        hb = path('M-52 -30 Q-58 40 -46 64 L46 64 Q58 40 52 -30 Z', hair);
        hf = path('M-50 4 Q-56 -72 0 -74 Q56 -72 50 4 Q44 -36 0 -40 Q-40 -38 -50 4 Z', hair);
        break;
      case 'bun':
        hb = circ(0, -78, 22, hair);
        hf = path('M-48 -10 Q-50 -70 0 -70 Q50 -70 48 -10 Q40 -46 0 -48 Q-40 -46 -48 -10 Z', hair);
        break;
      case 'bald':
        hf = path('M-46 -24 Q0 -70 46 -24 Q30 -46 0 -48 Q-30 -46 -46 -24 Z', hair, 'opacity=".5"');
        break;
      case 'hat':
        hf = ell(0, -48, 76, 14, cfg.hatColor || '#222') + path('M-44 -48 Q-42 -100 0 -100 Q42 -100 44 -48 Z', cfg.hatColor || '#222') + rect(-44, -60, 88, 10, '#6a1a1a');
        break;
      case 'grey':
        hf = path('M-48 -8 Q-50 -70 0 -70 Q50 -70 48 -8 Q40 -44 0 -46 Q-40 -44 -48 -8 Z', '#a8a39a');
        break;
      default:
        hf = path('M-48 -8 Q-50 -72 0 -72 Q50 -72 48 -8 Q42 -42 8 -46 Q-28 -48 -48 -8 Z', hair);
    }
    const mouthFill = e.fillMouth ? '#5a1f1f' : 'none';
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" class="portrait-svg"><defs>${g.def}</defs>` +
      rect(0, 0, 300, 360, `url(#${g.id})`) +
      `<g transform="translate(150 170)">` +
      hb +
      path('M-110 190 Q-100 100 -40 86 L40 86 Q100 100 110 190 Z', top) +
      (cfg.scarf ? path('M-46 80 Q0 110 46 80 L50 100 Q0 130 -50 100 Z', cfg.scarf) : '') +
      (cfg.topStyle === 'jacket' || cfg.topStyle === 'coat' || cfg.topStyle === 'trench' ? path('M-30 86 L0 140 L30 86 Z', cfg.shirt || '#d8d2c4') + path('M-40 86 L-6 150 L-20 190 L-70 190 Z', shade(top, -0.2)) + path('M40 86 L6 150 L20 190 L70 190 Z', shade(top, -0.2)) : '') +
      rect(-16, 50, 32, 40, shade(skin, -0.12)) +
      ell(0, 0, 50, 64, skin) +
      ell(-50, 4, 8, 14, shade(skin, -0.08)) + ell(50, 4, 8, 14, shade(skin, -0.08)) +
      (e.blush || cfg.blush ? ell(-30, 18, 10, 6, '#d9776a', 'opacity=".35"') + ell(30, 18, 10, 6, '#d9776a', 'opacity=".35"') : '') +
      eye(-19) + eye(19) +
      brows +
      path('M0 0 Q-4 16 -6 20 Q0 24 6 20', 'none', `stroke="${shade(skin, -0.3)}" stroke-width="2.5"`) +
      (cfg.beard ? path('M-48 6 Q-46 70 0 72 Q46 70 48 6 Q40 30 22 30 Q10 26 0 28 Q-10 26 -22 30 Q-40 30 -48 6 Z', cfg.beardColor || hair, 'opacity=".9"') : '') +
      (cfg.moustache ? path('M-20 30 Q0 22 20 30 Q0 28 -20 30 Z', hair) : '') +
      path(e.mouth, mouthFill, `stroke="${shade(skin, -0.5)}" stroke-width="3.5" stroke-linecap="round"`) +
      (cfg.lipstick ? path(e.mouth, 'none', `stroke="${cfg.lipstick}" stroke-width="4" opacity=".55"`) : '') +
      (cfg.glasses ? circ(-19, -3, 15, 'none', 'stroke="#1a1a1a" stroke-width="3"') + circ(19, -3, 15, 'none', 'stroke="#1a1a1a" stroke-width="3"') + line(-4, -3, 4, -3, '#1a1a1a', 3) : '') +
      hf +
      (cfg.earring ? circ(-50, 20, 4, '#c9a85a') + circ(50, 20, 4, '#c9a85a') : '') +
      `</g></svg>`
    );
  }

  /* ---------------- item icons ---------------- */
  const ICONS = {
    usb: () => rect(30, 14, 36, 56, '#2b2f38', 'rx="6"') + rect(38, 70, 20, 14, '#c0c4c9') + rect(42, 74, 4, 4, '#333') + rect(50, 74, 4, 4, '#333') + rect(36, 24, 24, 8, '#c9a85a'),
    photo: (c) => rect(14, 18, 68, 58, '#efe6cf', 'transform="rotate(-6 48 48)"') + rect(20, 24, 56, 40, c || '#8a7454', 'transform="rotate(-6 48 48)"') + circ(36, 42, 5, '#3a2a1a') + circ(48, 40, 5, '#3a2a1a') + circ(60, 41, 5, '#3a2a1a'),
    card: () => rect(12, 22, 72, 50, '#efe1bf') + line(18, 36, 76, 36, '#a8231f', 2) + line(18, 46, 70, 46, '#8a7a5a', 2) + line(18, 56, 64, 56, '#8a7a5a', 2) + text(18, 32, 'O-17', 11, '#3a2a1a'),
    medal_l: () => path('M48 16 A32 32 0 0 0 48 80 L44 64 L50 52 L42 40 L50 30 Z', '#c9a85a') + circ(36, 48, 8, 'none', 'stroke="#8a6a2a" stroke-width="3"'),
    medal_r: () => path('M48 16 A32 32 0 0 1 48 80 L44 64 L50 52 L42 40 L50 30 Z', '#b8963c') + circ(60, 48, 8, 'none', 'stroke="#8a6a2a" stroke-width="3"'),
    medal: () => circ(48, 48, 32, '#c9a85a') + circ(48, 48, 26, 'none', 'stroke="#8a6a2a" stroke-width="3"') + lyre(48, 50, 14, '#6a4a1a') + poly([[48, 10], [44, 18], [52, 18]], '#6a4a1a'),
    key: () => circ(30, 48, 14, 'none', 'stroke="#c9a85a" stroke-width="7"') + rect(42, 44, 42, 8, '#c9a85a') + rect(70, 52, 6, 12, '#c9a85a') + rect(80, 52, 6, 9, '#c9a85a'),
    map: () => poly([[10, 22], [36, 14], [60, 22], [86, 14], [86, 74], [60, 82], [36, 74], [10, 82]], '#d8c79b') + line(36, 14, 36, 74, '#a89a6a', 2) + line(60, 22, 60, 82, '#a89a6a', 2) + path('M18 60 Q40 40 56 52 T80 30', 'none', 'stroke="#a8231f" stroke-width="2" stroke-dasharray="4 3"') + text(66, 34, '★', 14, '#a8231f'),
    list: () => rect(22, 10, 52, 76, '#efe6cf') + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => line(30, 22 + i * 8, i === 5 ? 50 : 66, 22 + i * 8, i === 5 ? '#111' : '#7a6a4a', i === 5 ? 5 : 2)).join('') + text(30, 19, 'XVII', 8, '#a8231f'),
    seal: () => circ(48, 48, 34, '#8a2a20') + circ(48, 48, 26, 'none', 'stroke="#c9a85a" stroke-width="3"') + lyre(48, 50, 14, '#c9a85a'),
    seal_piece: () => path('M48 48 L48 14 A34 34 0 0 1 82 48 Z', '#8a2a20') + path('M48 48 L48 22 A26 26 0 0 1 74 48', 'none', 'stroke="#c9a85a" stroke-width="3"'),
    tape: () => rect(10, 24, 76, 50, '#2a2622', 'rx="6"') + rect(18, 30, 60, 22, '#d8ccb0') + circ(34, 41, 8, '#2a2622') + circ(62, 41, 8, '#2a2622') + text(22, 66, 'ORFEO', 10, '#c9a85a'),
    fragment: () => poly([[14, 20], [70, 14], [80, 40], [64, 78], [20, 70]], '#e8dcc0') + line(24, 34, 62, 30, '#7a6a4a', 2) + line(24, 44, 66, 42, '#7a6a4a', 2) + line(24, 54, 56, 54, '#7a6a4a', 2),
    letter: () => rect(12, 24, 72, 48, '#e8dcc0') + path('M12 24 L48 52 L84 24', 'none', 'stroke="#8a7a5a" stroke-width="3"') + circ(48, 56, 7, '#8a2a20'),
    lens: () => circ(40, 40, 22, '#bcd3e0', 'opacity=".7"') + circ(40, 40, 22, 'none', 'stroke="#5a3a22" stroke-width="6"') + line(56, 56, 80, 80, '#5a3a22', 9),
    torch: () => rect(20, 40, 50, 18, '#3a3a3a', 'rx="4"') + poly([[70, 34], [84, 28], [84, 70], [70, 64]], '#5a5a5a') + circ(86, 49, 6, '#ffe9a0'),
    phone: () => rect(30, 10, 36, 76, '#1a1a1e', 'rx="7"') + rect(34, 18, 28, 56, '#5a7a9a'),
    ticket: () => rect(10, 30, 76, 36, '#d8c08a') + line(30, 30, 30, 66, '#8a6a3a', 2, 'stroke-dasharray="3 3"') + text(36, 52, 'PARIS', 12, '#3a2a1a'),
    book: () => rect(18, 14, 60, 70, '#5a2a22') + rect(24, 14, 6, 70, '#3a1a12') + rect(36, 30, 34, 6, '#c9a85a'),
    recorder: () => rect(14, 28, 68, 44, '#3a3a40', 'rx="5"') + circ(34, 50, 10, '#1a1a1a') + circ(62, 50, 10, '#1a1a1a') + rect(30, 22, 36, 8, '#5a5a60'),
    crowbar: () => path('M18 80 L70 22 Q78 14 84 22', 'none', 'stroke="#7a2a20" stroke-width="8" stroke-linecap="round"'),
    envelope: () => rect(12, 26, 72, 46, '#cdbf9d') + path('M12 26 L48 50 L84 26', 'none', 'stroke="#8a7a5a" stroke-width="3"'),
    negative: () => rect(10, 30, 76, 36, '#2a2218') + [0, 1, 2].map((i) => rect(16 + i * 24, 36, 18, 24, '#6a5a40')).join(''),
    pen: () => line(20, 76, 76, 20, '#1a1a1a', 8) + line(20, 76, 26, 70, '#c9a85a', 8),
    coin: () => circ(48, 48, 26, '#b8963c') + circ(48, 48, 20, 'none', 'stroke="#8a6a2a" stroke-width="2"') + text(40, 54, '17', 16, '#6a4a1a'),
    glove: () => path('M30 80 L30 40 L36 20 L42 40 L44 16 L50 40 L54 18 L58 42 L62 26 L66 46 L66 80 Z', '#3a2a22'),
    film: () => circ(48, 48, 32, '#2a2a2a') + [0, 1, 2, 3, 4].map((i) => circ(48 + Math.cos(i * 1.256) * 18, 48 + Math.sin(i * 1.256) * 18, 6, '#5a5a5a')).join('') + circ(48, 48, 5, '#777'),
    cloth: () => path('M14 30 Q48 10 82 30 L74 80 Q48 66 22 80 Z', '#6a2a2a'),
    rope: () => path('M20 70 Q30 20 50 50 T80 30', 'none', 'stroke="#b8a070" stroke-width="7"'),
    gear: () => circ(48, 48, 22, '#8a7a5a') + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => rect(44, 18, 8, 12, '#8a7a5a', `transform="rotate(${i * 45} 48 48)"`)).join('') + circ(48, 48, 8, '#2a2014'),
    candle: () => rect(38, 34, 20, 48, '#e8dcc0') + ell(48, 26, 6, 10, '#ffb84a'),
    symbol: () => circ(48, 48, 32, 'none', 'stroke="#c9a85a" stroke-width="4"') + lyre(48, 50, 18, '#c9a85a'),
    generic: () => rect(20, 20, 56, 56, '#6a5a40', 'rx="8"') + text(40, 58, '?', 24, '#efe6cf')
  };

  function itemIcon(item) {
    const ic = (item && item.icon) || {};
    const fn = ICONS[ic.k] || ICONS.generic;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" class="item-svg">${fn(ic.c)}</svg>`;
  }

  /* ---------------- archival photographs (puzzle/cutscene) ---------------- */
  function photo(kind, opts) {
    opts = opts || {};
    const W = 800, H = 560;
    const sepia = kind === 'photo1944' ? ['#c9b58c', '#6a5638', '#3a2c1c'] : kind === 'photo1967' ? ['#b6c0c2', '#5d6668', '#2a3032'] : ['#d6cbb0', '#7a6a50', '#3a2c1c'];
    let s = rect(0, 0, W, H, sepia[0]);
    if (kind === 'photo1944') {
      // Florentine facade, 4 men and the woman, one face erased
      s += rect(60, 40, 680, 380, sepia[1]) + rect(60, 40, 680, 30, sepia[2]);
      for (let i = 0; i < 6; i++) s += rect(100 + i * 108, 100, 56, 110, sepia[2]);
      s += path('M340 420 L340 300 A60 60 0 0 1 460 300 L460 420 Z', sepia[2]);
      [180, 280, 520, 620].forEach((x, i) => {
        s += ell(x, 330, 22, 26, sepia[2]) + rect(x - 34, 356, 68, 150, sepia[2]);
        if (i === 2) s += ell(x, 330, 26, 30, '#e8dcc0') + path(`M${x - 24} 316 L${x + 22} 346 M${x - 20} 344 L${x + 24} 318`, 'none', 'stroke="#7a6a50" stroke-width="5"');
      });
    } else if (kind === 'photo1967') {
      s += rect(40, 60, 720, 360, sepia[1]);
      for (let i = 0; i < 5; i++) s += rect(80 + i * 140, 90, 90, 140, sepia[2]) + rect(80 + i * 140, 160, 90, 6, sepia[0]);
      [150, 250, 560].forEach((x) => (s += ell(x, 330, 22, 26, sepia[2]) + rect(x - 34, 356, 68, 150, sepia[2])));
      s += rect(620, 380, 140, 70, sepia[2], 'rx="10"');
    } else {
      s += rect(40, 40, 720, 400, sepia[1]);
    }
    if (opts.woman !== false) {
      // the woman: always in the same spot relative to the registration marks
      const wx = 400, wy = 300;
      s += ell(wx, wy, 20, 24, '#1a1410') + ell(wx, wy - 20, 40, 8, '#1a1410') + path(`M${wx - 30} ${wy + 26} L${wx + 30} ${wy + 26} L${wx + 46} ${wy + 200} L${wx - 46} ${wy + 200} Z`, '#1a1410');
      s += circ(wx, wy + 52, 7, '#d8c08a');
    }
    if (opts.marks !== false) {
      // registration crosses
      [[40, 30], [760, 30], [40, 530], [760, 530]].forEach(([x, y]) => (s += circ(x, y, 12, 'none', 'stroke="#a8231f" stroke-width="2"') + line(x - 18, y, x + 18, y, '#a8231f', 2) + line(x, y - 18, x, y + 18, '#a8231f', 2)));
    }
    if (opts.half) {
      // half Orfeo symbol pricked into the print
      const clip = opts.half === 'left' ? `<clipPath id="hl"><rect x="0" y="0" width="400" height="560"/></clipPath>` : `<clipPath id="hr"><rect x="400" y="0" width="400" height="560"/></clipPath>`;
      s += `<defs>${clip}</defs><g clip-path="url(#${opts.half === 'left' ? 'hl' : 'hr'})">${circ(400, 140, 54, 'none', 'stroke="#f8f0d8" stroke-width="4" stroke-dasharray="2 6"')}${lyre(400, 142, 36, '#f8f0d8', 0.9)}</g>`;
    }
    s += text(24, H - 14, kind === 'photo1944' ? 'FIRENZE · 1944' : kind === 'photo1967' ? 'PARIS · 1967' : '', 22, sepia[2], 'font-style="italic"');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="photo-svg">${s}</svg>`;
  }

  O.Art = { background, hotspotProp, drawProp, character, portrait, itemIcon, photo, lyre, shade, rng, PROPS, ICONS };
})();
