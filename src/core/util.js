/* Orfeo engine — utilities, event bus, condition language */
(function () {
  'use strict';
  const O = (window.Orfeo = window.Orfeo || {});

  O.VERSION = '1.0.0';
  O.W = 1920;
  O.H = 1080;

  O.$ = (s, r) => (r || document).querySelector(s);
  O.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /** Tiny DOM builder: el('div.cls#id', {attrs}, children) */
  O.el = function (spec, attrs, children) {
    const m = spec.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i) || [];
    const node = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, v) => {
      if (t === '.') node.classList.add(v);
      else node.id = v;
    });
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'class') String(v).split(/\s+/).filter(Boolean).forEach((c) => node.classList.add(c));
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null || c === false) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  };

  O.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  O.lerp = (a, b, t) => a + (b - a) * t;
  O.sleep = (ms) => new Promise((r) => setTimeout(r, O.testMode ? 0 : ms));
  O.uid = () => Math.random().toString(36).slice(2, 9);
  O.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  O.deepClone = (o) => JSON.parse(JSON.stringify(o));
  O.isTouch = () => matchMedia('(hover: none)').matches || 'ontouchstart' in window;

  /** Event bus */
  const listeners = {};
  O.on = (ev, fn) => ((listeners[ev] = listeners[ev] || []).push(fn), fn);
  O.off = (ev, fn) => {
    if (listeners[ev]) listeners[ev] = listeners[ev].filter((f) => f !== fn);
  };
  O.emit = (ev, payload) => {
    (listeners[ev] || []).slice().forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.warn('[Orfeo] listener error', ev, e);
      }
    });
  };

  /** Text that may be a string or per-character object {beps, kiki, default} */
  O.textFor = function (t, who) {
    if (t == null) return null;
    if (typeof t === 'string' || Array.isArray(t)) return t;
    return t[who] != null ? t[who] : t.default != null ? t.default : t.beps || t.kiki || null;
  };

  /* ------------------------------------------------------------------ */
  /* Condition language                                                  */
  /*   flag.x  item.usb  stat.fiducia>=3  !puzzle.p1  chapter>=5          */
  /*   active=='kiki'  count.symbols==7  (a || b) && c                    */
  /* ------------------------------------------------------------------ */
  const TOKEN = /\s*(\|\||&&|>=|<=|==|!=|[()!<>]|'[^']*'|"[^"]*"|-?\d+(?:\.\d+)?|[A-Za-z_][\w.\-]*)/y;
  const cache = new Map();

  function tokenize(src) {
    const out = [];
    TOKEN.lastIndex = 0;
    let m;
    while (TOKEN.lastIndex < src.length) {
      const start = TOKEN.lastIndex;
      m = TOKEN.exec(src);
      if (!m) {
        if (/^\s*$/.test(src.slice(start))) break;
        throw new Error('Condizione non valida: "' + src + '" @' + start);
      }
      out.push(m[1]);
    }
    return out;
  }

  function parse(src) {
    const t = tokenize(src);
    let i = 0;
    const peek = () => t[i];
    const next = () => t[i++];
    function or() {
      let n = and();
      while (peek() === '||') {
        next();
        const r = and();
        const l = n;
        n = (r2) => l(r2) || r(r2);
      }
      return n;
    }
    function and() {
      let n = unary();
      while (peek() === '&&') {
        next();
        const r = unary();
        const l = n;
        n = (r2) => l(r2) && r(r2);
      }
      return n;
    }
    function unary() {
      if (peek() === '!') {
        next();
        const u = unary();
        return (r) => !u(r);
      }
      return cmp();
    }
    function cmp() {
      const l = primary();
      const op = peek();
      if (['>=', '<=', '==', '!=', '>', '<'].includes(op)) {
        next();
        const r = primary();
        return (res) => {
          const a = l(res);
          const b = r(res);
          switch (op) {
            case '>=': return Number(a) >= Number(b);
            case '<=': return Number(a) <= Number(b);
            case '>': return Number(a) > Number(b);
            case '<': return Number(a) < Number(b);
            // eslint-disable-next-line eqeqeq
            case '==': return a == b || (a == null && !b);
            // eslint-disable-next-line eqeqeq
            case '!=': return !(a == b || (a == null && !b));
          }
        };
      }
      return l;
    }
    function primary() {
      const tok = next();
      if (tok === undefined) throw new Error('Condizione incompleta: ' + src);
      if (tok === '(') {
        const n = or();
        if (next() !== ')') throw new Error('Parentesi mancante: ' + src);
        return n;
      }
      if (/^['"]/.test(tok)) {
        const s = tok.slice(1, -1);
        return () => s;
      }
      if (/^-?\d/.test(tok)) {
        const n = Number(tok);
        return () => n;
      }
      if (tok === 'true') return () => true;
      if (tok === 'false') return () => false;
      return (res) => res(tok);
    }
    const fn = or();
    if (i < t.length) throw new Error('Token inatteso "' + t[i] + '" in: ' + src);
    return fn;
  }

  O.compileCond = function (src) {
    if (cache.has(src)) return cache.get(src);
    const fn = parse(src);
    cache.set(src, fn);
    return fn;
  };

  /** Evaluate condition with the global resolver (GameState). Empty → true. */
  O.cond = function (src, resolver) {
    if (src == null || src === '' || src === true) return true;
    if (src === false) return false;
    try {
      return !!O.compileCond(String(src))(resolver || O.State.resolve);
    } catch (e) {
      console.warn('[Orfeo] condizione errata', src, e.message);
      return false;
    }
  };
})();
