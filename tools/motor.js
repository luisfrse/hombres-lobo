/* Quest · i18n (català / castellano). Diccionarios planos ca y es: al añadir una clave, ponla en los dos (npm test lo comprueba).
   API: I18N.t(clave, vars) · I18N.set(idioma) · I18N.lang · I18N.langs. Es el mismo archivo en las dos apps de Quest. */
(function (global) {
  'use strict';

  var DICT = /*__DICT__*/;
  var LANGS = ['ca', 'es'];
  var CLAVE = 'quest-lang';
  var enNavegador = typeof document !== 'undefined';

  function guardado() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function detectar() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { /* sin URL */ }
    if (LANGS.indexOf(q) >= 0) return q;
    var g = guardado();
    if (LANGS.indexOf(g) >= 0) return g;
    var n = '';
    try { n = (navigator.language || '').toLowerCase(); } catch (e) { /* sin navigator */ }
    return n.indexOf('es') === 0 ? 'es' : 'ca';
  }

  var lang = enNavegador ? detectar() : 'ca';
  var registro = []; // textos y atributos pintados con T(): se vuelven a traducir al cambiar de idioma
  var oyentes = [];

  function tl(l, key, vars) {
    var d = DICT[l] || DICT.ca;
    var plural = vars && vars.n === 1;
    var s;
    if (plural) s = d[key + '#1'] !== undefined ? d[key + '#1'] : DICT.ca[key + '#1'];
    if (s === undefined) s = d[key] !== undefined ? d[key] : DICT.ca[key];
    if (s === undefined) return key;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''; });
  }
  function t(key, vars) { return tl(lang, key, vars); }
  function has(key) { return DICT[lang][key] !== undefined || DICT.ca[key] !== undefined; }

  function D(key, vars) { this.key = key; this.vars = vars; }
  function T(key, vars) { return new D(key, vars); }
  function esD(x) { return x instanceof D; }

  function podar() {
    registro = registro.filter(function (r) { return (r.nodo || r.el).isConnected; });
  }
  function nodo(d) {
    var n = document.createTextNode(t(d.key, d.vars));
    registro.push({ tipo: 'texto', nodo: n, key: d.key, vars: d.vars });
    if (registro.length > 4000) podar();
    return n;
  }
  function bind(el, attr, d) {
    el.setAttribute(attr, t(d.key, d.vars));
    registro.push({ tipo: 'attr', el: el, attr: attr, key: d.key, vars: d.vars });
  }
  function bindFn(el, attr, fn) {
    el.setAttribute(attr, fn());
    registro.push({ tipo: 'fn', el: el, attr: attr, fn: fn });
  }
  function setT(el, key, vars) { el.replaceChildren(nodo(T(key, vars))); }
  function titulo(key, vars) {
    document.title = t(key, vars);
    registro = registro.filter(function (r) { return r.tipo !== 'titulo'; });
    registro.push({ tipo: 'titulo', el: document.documentElement, key: key, vars: vars });
  }

  // Texto con <b>, <strong>, <code>, <em> y <br> (para párrafos de las páginas estáticas)
  function rich(el, texto) {
    el.replaceChildren();
    var partes = String(texto).split(/(<\/?(?:b|strong|code|em)>|<br\s*\/?>)/);
    var pila = [el];
    partes.forEach(function (p) {
      var m = /^<(\/?)(b|strong|code|em)>$/.exec(p);
      if (m) {
        if (m[1]) { if (pila.length > 1) pila.pop(); } else {
          var e = document.createElement(m[2]);
          pila[pila.length - 1].appendChild(e);
          pila.push(e);
        }
      } else if (/^<br/.test(p)) pila[pila.length - 1].appendChild(document.createElement('br'));
      else if (p) pila[pila.length - 1].appendChild(document.createTextNode(p));
    });
  }

  function aplicar(raiz) {
    if (!enNavegador) return;
    raiz = raiz || document;
    var q = function (s) { return raiz.querySelectorAll ? raiz.querySelectorAll(s) : []; };
    Array.prototype.forEach.call(q('[data-i18n]'), function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    Array.prototype.forEach.call(q('[data-i18n-html]'), function (e) { rich(e, t(e.getAttribute('data-i18n-html'))); });
    Array.prototype.forEach.call(q('[data-i18n-ph]'), function (e) { e.setAttribute('placeholder', t(e.getAttribute('data-i18n-ph'))); });
    Array.prototype.forEach.call(q('[data-i18n-aria]'), function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
    Array.prototype.forEach.call(q('[data-i18n-title]'), function (e) { e.setAttribute('title', t(e.getAttribute('data-i18n-title'))); });
    Array.prototype.forEach.call(q('[data-i18n-alt]'), function (e) { e.setAttribute('alt', t(e.getAttribute('data-i18n-alt'))); });
    var dt = document.querySelector('title[data-i18n-doc]');
    if (dt) document.title = t(dt.getAttribute('data-i18n-doc'));
  }

  function refrescar() {
    podar();
    registro.forEach(function (r) {
      if (r.tipo === 'texto') r.nodo.data = t(r.key, r.vars);
      else if (r.tipo === 'attr') r.el.setAttribute(r.attr, t(r.key, r.vars));
      else if (r.tipo === 'fn') r.el.setAttribute(r.attr, r.fn());
      else if (r.tipo === 'titulo') document.title = t(r.key, r.vars);
    });
  }

  function marcarSelectores() {
    if (!enNavegador) return;
    Array.prototype.forEach.call(document.querySelectorAll('.selector-idioma button'), function (b) {
      var activo = b.getAttribute('data-lang') === lang;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.selector-idioma'), function (g) { g.setAttribute('aria-label', t('idioma')); });
  }

  function set(l) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l;
    try { localStorage.setItem(CLAVE, l); } catch (e) { /* sin almacenamiento */ }
    if (enNavegador) document.documentElement.lang = l;
    aplicar(document);
    refrescar();
    marcarSelectores();
    oyentes.slice().forEach(function (f) { try { f(l); } catch (e) { console.error(e); } });
  }

  function selector() {
    var g = document.createElement('div');
    g.className = 'selector-idioma';
    g.setAttribute('role', 'group');
    LANGS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-lang', l);
      b.textContent = l.toUpperCase();
      b.addEventListener('click', function () { set(l); });
      g.appendChild(b);
    });
    return g;
  }

  function montar() {
    document.documentElement.lang = lang;
    var huecos = document.querySelectorAll('[data-lang-slot]');
    if (huecos.length) {
      Array.prototype.forEach.call(huecos, function (h) { h.replaceChildren(selector()); });
    } else {
      var c = document.createElement('div');
      c.className = 'selector-flotante';
      c.appendChild(selector());
      document.body.appendChild(c);
    }
    aplicar(document);
    marcarSelectores();
  }
  if (enNavegador) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
  }

  // Formatos según idioma
  function loc() { return lang === 'es' ? 'es-ES' : 'ca-ES'; }
  function locDe(l) { return l === 'es' ? 'es-ES' : 'ca-ES'; }
  var ZONA = 'Europe/Madrid';
  function setZona(z) { ZONA = z; }
  function fecha(d, l) {
    return new Date(d).toLocaleDateString(locDe(l || lang), { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: ZONA });
  }
  function fechaHora(d, l) {
    var x = new Date(d);
    return fecha(x, l) + ' ' + x.toLocaleTimeString(locDe(l || lang), { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA });
  }
  function num(n, opciones, l) { return new Intl.NumberFormat(locDe(l || lang), opciones).format(n); }
  function seg(ms, l) { return num(ms / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }, l) + ' s'; }
  function segNum(ms, l) { return num(ms / 1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, l); }
  function ordenar(a, b) { return String(a).localeCompare(String(b), loc(), { numeric: true, sensitivity: 'base' }); }

  // Error con código: el mensaje se traduce al crearlo; el código permite volver a traducirlo
  function Err(code, vars) {
    var e = new Error(t('e.' + code, vars));
    e.code = code;
    e.vars = vars;
    return e;
  }
  // Texto de un error del servidor ({ error: 'codigo', vars }) o de un Error con código
  function errTxt(codigo, vars, porDefecto) {
    if (codigo && has('e.' + codigo)) return t('e.' + codigo, vars);
    return t(porDefecto || 'e.generico');
  }

  var API = {
    t: t, tl: tl, T: T, D: D, esD: esD, has: has, set: set, nodo: nodo, bind: bind, bindFn: bindFn, setT: setT, titulo: titulo,
    rich: rich, apply: aplicar, selector: selector, fecha: fecha, fechaHora: fechaHora, num: num, seg: seg, segNum: segNum,
    ordenar: ordenar, loc: loc, setZona: setZona, Err: Err, errTxt: errTxt,
    onChange: function (f) { oyentes.push(f); },
    langs: LANGS.slice(), dict: DICT,
  };
  Object.defineProperty(API, 'lang', { get: function () { return lang; } });
  global.I18N = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
