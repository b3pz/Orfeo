/* MovementController — walkable polygons, visibility-graph pathfinding,
 * click-to-walk with perspective scaling, run (double click) and partner follow. */
(function () {
  'use strict';
  const O = window.Orfeo;

  /* ---------- geometry ---------- */
  function inside(p, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1] + 1e-9) + a[0]) c = !c;
    }
    return c;
  }
  function closestOnSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = O.clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return [a[0] + dx * t, a[1] + dy * t];
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function centroid(poly) {
    let x = 0, y = 0;
    poly.forEach((p) => ((x += p[0]), (y += p[1])));
    return [x / poly.length, y / poly.length];
  }
  function clampInto(p, poly) {
    if (!poly || inside(p, poly)) return p.slice();
    let best = null, bd = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const q = closestOnSeg(p, poly[i], poly[(i + 1) % poly.length]);
      const d = dist(p, q);
      if (d < bd) ((bd = d), (best = q));
    }
    // nudge slightly toward the centroid so the point is strictly inside
    const c = centroid(poly);
    for (let k = 1; k <= 12; k++) {
      const t = k * 0.01;
      const n = [best[0] + (c[0] - best[0]) * t, best[1] + (c[1] - best[1]) * t];
      if (inside(n, poly)) return n;
    }
    return best;
  }
  function segsCross(p1, p2, p3, p4) {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
    return ((d1 > 1e-6 && d2 < -1e-6) || (d1 < -1e-6 && d2 > 1e-6)) && ((d3 > 1e-6 && d4 < -1e-6) || (d3 < -1e-6 && d4 > 1e-6));
  }
  function visible(a, b, poly) {
    for (let i = 0; i < poly.length; i++) if (segsCross(a, b, poly[i], poly[(i + 1) % poly.length])) return false;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return inside(m, poly) || dist(clampInto(m, poly), m) < 2;
  }
  function nodes(poly) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], prev = poly[(i + poly.length - 1) % poly.length], next = poly[(i + 1) % poly.length];
      const v1 = [p[0] - prev[0], p[1] - prev[1]], v2 = [next[0] - p[0], next[1] - p[1]];
      const n = [v1[0] / (Math.hypot(...v1) || 1) - v2[0] / (Math.hypot(...v2) || 1), v1[1] / (Math.hypot(...v1) || 1) - v2[1] / (Math.hypot(...v2) || 1)];
      const len = Math.hypot(...n) || 1;
      for (const sgn of [1, -1]) {
        const q = [p[0] + (sgn * n[0] * 6) / len, p[1] + (sgn * n[1] * 6) / len];
        if (inside(q, poly)) {
          out.push(q);
          break;
        }
      }
    }
    return out;
  }
  function findPath(from, to, poly) {
    if (!poly) return [to];
    const start = clampInto(from, poly), goal = clampInto(to, poly);
    if (visible(start, goal, poly)) return [goal];
    const ns = [start, goal].concat(nodes(poly));
    const N = ns.length;
    const d = new Array(N).fill(Infinity), prev = new Array(N).fill(-1), done = new Array(N).fill(false);
    d[0] = 0;
    for (let it = 0; it < N; it++) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
      if (u < 0 || d[u] === Infinity) break;
      done[u] = true;
      if (u === 1) break;
      for (let v = 0; v < N; v++) {
        if (done[v] || v === u) continue;
        if (!visible(ns[u], ns[v], poly)) continue;
        const nd = d[u] + dist(ns[u], ns[v]);
        if (nd < d[v]) ((d[v] = nd), (prev[v] = u));
      }
    }
    if (prev[1] < 0) return [goal];
    const path = [];
    for (let v = 1; v !== 0 && v >= 0; v = prev[v]) path.unshift(ns[v]);
    return path;
  }

  const Movement = {
    inside,
    clampInto,
    findPath,
    walking: {},

    polygon(scene, who) {
      if (!scene) return null;
      if (scene.walkIf) {
        const alt = scene.walkIf.find((w) => (!w.who || w.who === who) && O.cond(w.if));
        if (alt) return alt.walk;
      }
      if (scene.walkFor && scene.walkFor[who]) return scene.walkFor[who];
      return scene.walk || null;
    },

    scaleAt(scene, y) {
      const s = (scene && scene.scale) || [560, 0.55, 1060, 1.0];
      const t = O.clamp((y - s[0]) / (s[2] - s[0] || 1), 0, 1);
      return O.lerp(s[1], s[3], t);
    },

    /** Walk character `who` to point. Resolves true on arrival, false if interrupted. */
    walkTo(who, target, opts) {
      opts = opts || {};
      const ch = O.State.d.chars[who];
      const scene = O.Scene.current;
      if (!ch || !scene || ch.scene !== scene.id) return Promise.resolve(true);
      const poly = this.polygon(scene, who);
      const path = findPath([ch.x, ch.y], target, poly);
      this.stop(who);
      if (O.testMode || opts.instant) {
        const end = path[path.length - 1];
        ch.x = end[0];
        ch.y = end[1];
        if (opts.face) ch.dir = opts.face === 'l' ? -1 : 1;
        O.Characters.update(who);
        return Promise.resolve(true);
      }
      return new Promise((resolve) => {
        const job = { path: path.slice(), resolve, cancelled: false, run: !!opts.run };
        this.walking[who] = job;
        O.Characters.anim(who, job.run ? 'run' : 'walk');
        let last = performance.now();
        const step = (now) => {
          if (job.cancelled) return;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const tgt = job.path[0];
          if (!tgt) {
            delete this.walking[who];
            O.Characters.anim(who, 'idle');
            if (opts.face) ch.dir = opts.face === 'l' ? -1 : 1;
            O.Characters.update(who);
            resolve(true);
            return;
          }
          const sc = this.scaleAt(scene, ch.y);
          const speed = (job.run ? 620 : 330) * sc;
          const dx = tgt[0] - ch.x, dy = tgt[1] - ch.y;
          const d = Math.hypot(dx, dy);
          if (Math.abs(dx) > 2) ch.dir = dx < 0 ? -1 : 1;
          if (d <= speed * dt) {
            ch.x = tgt[0];
            ch.y = tgt[1];
            job.path.shift();
          } else {
            // vertical movement is slower (perspective)
            const k = (speed * dt) / d;
            ch.x += dx * k;
            ch.y += dy * k * 0.8;
          }
          O.Characters.update(who);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },

    stop(who) {
      const j = this.walking[who];
      if (j) {
        j.cancelled = true;
        delete this.walking[who];
        O.Characters.anim(who, 'idle');
        j.resolve(false);
      }
    },
    stopAll() {
      Object.keys(this.walking).forEach((w) => this.stop(w));
    },

    /** Active character walks; partner follows if together and allowed. */
    async moveActive(target, opts) {
      const st = O.State.d;
      const who = st.active;
      const scene = O.Scene.current;
      const p = O.State.partnerId();
      const pc = st.chars[p];
      if (st.together && pc.present && pc.scene === scene.id && scene.follow !== false && !(opts && opts.noFollow)) {
        const side = st.chars[who].x < target[0] ? -1 : 1;
        const ft = [target[0] + side * 150, target[1] - 25];
        setTimeout(() => this.walkTo(p, ft, { run: opts && opts.run }), O.testMode ? 0 : 220);
      }
      return this.walkTo(who, target, opts);
    }
  };

  O.Movement = Movement;
})();
