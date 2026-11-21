// Utilidades compartidas por la pantalla del jugador, la del narrador, la de reglas y la de administracion.
(function (global) {
  'use strict';

  // Iconos de los roles y de la partida: nombres del conjunto comun (DCIcons) o propios de esta app (iconos-lobo.js).
  var ICONOS = { aldeano: 'user', lobo: 'lobo', vidente: 'orb', bruja: 'flask', cazador: 'target', cupido: 'heart', nina: 'eye', salvador: 'shield' };
  var ESPECIALES = ['vidente', 'bruja', 'cazador', 'cupido', 'nina', 'salvador'];

  // Icono SVG (sin emojis).
  function icono(nombre, clase) {
    var w = document.createElement('span');
    w.className = 'dc-icon' + (clase ? ' ' + clase : '');
    w.setAttribute('aria-hidden', 'true');
    if (global.DCIcons) w.appendChild(global.DCIcons.svg(nombre));
    return w;
  }
  function icRol(r, clase) { return icono(ICONOS[r] || 'info', clase); }

  // Manejadores de eventos reemplazables: el nodo nuevo de cada repintado cede su manejador al nodo que ya esta en pantalla (ver parchear).
  function on(e, tipo, fn) {
    if (!e.__h) e.__h = {};
    if (!e.__h[tipo]) e.addEventListener(tipo, function (ev) { var f = e.__h && e.__h[tipo]; if (f) return f.call(e, ev); });
    e.__h[tipo] = fn;
    return e;
  }

  // Crea un elemento. Los textos y atributos pueden ser cadenas o I18N.T(...) (se retraducen al cambiar de idioma).
  function el(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k.indexOf('on') === 0 && typeof v === 'function') on(e, k.slice(2), v);
        else if (I18N.esD(v)) I18N.bind(e, k, v);
        else if (k === 'class') e.className = v;
        else if (v === true) e.setAttribute(k, '');
        else e.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) anadir(e, arguments[i]);
    return e;
  }
  function anadir(e, h) {
    if (h === null || h === undefined || h === false) return;
    if (Array.isArray(h)) h.forEach(function (x) { anadir(e, x); });
    else if (I18N.esD(h)) e.appendChild(I18N.nodo(h));
    else if (h instanceof Node) e.appendChild(h);
    else e.appendChild(document.createTextNode(String(h)));
  }

  // ---- repintado sin reconstruir: se compara el arbol nuevo con el que hay en pantalla y solo se tocan las diferencias ----
  // Asi no se pierden el foco, el cursor, el scroll, los <details> abiertos ni lo escrito en un campo cuando llega un estado por socket.
  function clave(n) { return n.nodeType === 1 ? (n.getAttribute('data-k') || n.id || n.getAttribute('data-id') || '') : ''; }
  function mismoNodo(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType !== 1) return true;
    return a.tagName === b.tagName && clave(a) === clave(b);
  }
  function parchear(viejo, nuevo) {
    if (viejo.nodeType === 3) { if (viejo.data !== nuevo.data) viejo.data = nuevo.data; return; }
    var i, n;
    for (i = viejo.attributes.length - 1; i >= 0; i--) { n = viejo.attributes[i].name; if (!nuevo.hasAttribute(n) && n !== 'open') viejo.removeAttribute(n); }
    for (i = 0; i < nuevo.attributes.length; i++) { n = nuevo.attributes[i].name; if (n !== 'open' && viejo.getAttribute(n) !== nuevo.attributes[i].value) viejo.setAttribute(n, nuevo.attributes[i].value); }
    viejo.__h = nuevo.__h;
    var tag = viejo.tagName;
    if (tag === 'INPUT') {
      if (viejo.type === 'checkbox') viejo.checked = nuevo.checked;
      else if (document.activeElement !== viejo && viejo.value !== nuevo.value) viejo.value = nuevo.value;
      viejo.disabled = nuevo.disabled;
    } else if (tag === 'BUTTON') viejo.disabled = nuevo.disabled;
    else if (tag === 'DETAILS') { if (viejo.open !== nuevo.open) viejo.open = nuevo.open; }
    if (tag === 'IMG') return;
    morphHijos(viejo, Array.prototype.slice.call(nuevo.childNodes));
  }
  function morphHijos(padre, nuevos) {
    for (var i = 0; i < nuevos.length; i++) {
      var n = nuevos[i], v = padre.childNodes[i];
      if (!v) padre.appendChild(n);
      else if (mismoNodo(v, n)) parchear(v, n);
      else {
        var k = clave(n), hallado = null;
        if (k) for (var j = i + 1; j < padre.childNodes.length; j++) { if (mismoNodo(padre.childNodes[j], n)) { hallado = padre.childNodes[j]; break; } }
        if (hallado) { padre.insertBefore(hallado, v); parchear(hallado, n); } else padre.insertBefore(n, v);
      }
    }
    while (padre.childNodes.length > nuevos.length) padre.removeChild(padre.lastChild);
  }
  // Pinta una lista de piezas dentro de un contenedor.
  function pintarEn(cont, piezas) {
    var plano = [].concat.apply([], piezas.map(function (p) { return Array.isArray(p) ? p : [p]; })).filter(function (p) { return p !== null && p !== undefined && p !== false; });
    morphHijos(cont, plano.map(function (p) { return p instanceof Node ? p : document.createTextNode(String(p)); }));
  }

  // ---- dialogos propios (nada de alert/confirm) ----
  var seq = 0;
  function confirmar(o) {
    return new Promise(function (resolve) {
      var id = 'dlg-' + (++seq), dlg = document.createElement('dialog'), hecho = false;
      dlg.className = 'dc-dialog'; dlg.setAttribute('aria-labelledby', id);
      function cerrar(v) { if (hecho) return; hecho = true; try { dlg.close(); } catch (e) { /* ya cerrado */ } dlg.remove(); resolve(v); }
      dlg.appendChild(el('h2', { class: 'dc-card__title', id: id }, o.titulo));
      dlg.appendChild(el('p', null, o.texto));
      dlg.appendChild(el('div', { class: 'dc-dialog__actions' },
        el('button', { type: 'button', class: 'dc-btn dc-btn--secondary', 'data-dlg': 'no', onclick: function () { cerrar(false); } }, I18N.T('cancelar')),
        el('button', { type: 'button', class: 'dc-btn ' + (o.peligro ? 'dc-btn--danger' : 'dc-btn--primary'), 'data-dlg': 'si', onclick: function () { cerrar(true); } }, o.ok || I18N.T('c.aceptar'))));
      dlg.addEventListener('close', function () { cerrar(false); });
      dlg.addEventListener('cancel', function () { cerrar(false); });
      document.body.appendChild(dlg); dlg.showModal();
      var b = dlg.querySelector('[data-dlg=si]'); if (b) b.focus();
    });
  }

  // Anillo de progreso (SVG creado una vez; despues solo cambia el trazo y el texto). valor 0..1.
  var NS = 'http://www.w3.org/2000/svg', CIRC = 2 * Math.PI * 42;
  function anillo(clase) {
    var caja = el('div', { class: 'anillo' + (clase ? ' ' + clase : ''), role: 'img' });
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true');
    var pista = document.createElementNS(NS, 'circle'), val = document.createElementNS(NS, 'circle');
    [pista, val].forEach(function (c) { c.setAttribute('cx', '50'); c.setAttribute('cy', '50'); c.setAttribute('r', '42'); });
    pista.setAttribute('class', 'anillo__pista'); val.setAttribute('class', 'anillo__val'); val.setAttribute('stroke-dasharray', String(CIRC));
    svg.appendChild(pista); svg.appendChild(val);
    var g = el('span', null), p = el('small', null);
    caja.appendChild(svg); caja.appendChild(el('span', { class: 'anillo__txt' }, g, p));
    caja.poner = function (valor, grande, pequeno, etiqueta) {
      val.setAttribute('stroke-dashoffset', String(CIRC * (1 - Math.max(0, Math.min(1, valor)))));
      g.textContent = grande; p.textContent = pequeno || ''; caja.setAttribute('aria-label', etiqueta || (grande + ' ' + (pequeno || '')));
    };
    return caja;
  }

  // De noche la pantalla pasa sola al tema oscuro comun (se lee mejor con la luz baja) y al amanecer vuelve a la eleccion de la persona.
  function nocheTema(noche) {
    var h = document.documentElement;
    if (noche) { if (h.getAttribute('data-theme') !== 'dark') { h.__antes = h.getAttribute('data-theme') || ''; h.setAttribute('data-theme', 'dark'); h.__forzado = 1; } }
    else if (h.__forzado) { h.__forzado = 0; if (h.__antes) h.setAttribute('data-theme', h.__antes); else h.removeAttribute('data-theme'); }
    document.body.classList.toggle('es-noche', !!noche);
  }

  function nombreRol(r) { return I18N.T('rol.' + r + '.n'); }

  // Boton de informacion: muestra u oculta la descripcion de un rol. El estado abierto se conserva entre repintados.
  var abiertos = {};
  function botonInfo(rid, clave, alRepintar) {
    var k = clave + ':' + rid;
    return el('button', { type: 'button', class: 'info', 'aria-expanded': abiertos[k] ? 'true' : 'false', 'data-info': rid, title: I18N.T('n.info'), 'aria-label': I18N.T('n.info'),
      onclick: function (ev) { ev.stopPropagation(); abiertos[k] = !abiertos[k]; alRepintar(); } }, icono('info'));
  }
  function descripcionAbierta(rid, clave) {
    if (!abiertos[clave + ':' + rid]) return null;
    return el('p', { class: 'descripcion', 'data-desc': rid }, I18N.T('rol.' + rid + '.d'));
  }

  function conectarSocket() {
    return io({ transports: ['websocket', 'polling'] });
  }

  function textoError(e) {
    if (!e) return '';
    return I18N.errTxt(e.error || e.code, e.vars);
  }

  // Tema claro/oscuro en la cabecera (el idioma lo monta i18n.js en [data-lang-slot]).
  function tema() {
    var caja = document.getElementById('tema-slot'); if (!caja) return;
    function ahora() { var a = document.documentElement.getAttribute('data-theme'); return a || (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
    function pintar() {
      var oscuro = ahora() === 'dark', t = I18N.T(oscuro ? 'tema.claro' : 'tema.oscuro');
      caja.replaceChildren(el('button', { type: 'button', class: 'dc-btn dc-btn--on-dark dc-btn--icon', 'aria-label': t, title: t, onclick: function () {
        var n = ahora() === 'dark' ? 'light' : 'dark'; document.documentElement.__forzado = 0; document.documentElement.setAttribute('data-theme', n);
        try { localStorage.setItem('lobo.tema', n); } catch (e) { /* sin almacenamiento */ } pintar();
      } }, icono(oscuro ? 'sun' : 'moon')));
    }
    pintar(); I18N.onChange(pintar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tema); else tema();

  global.Lobo = { el: el, on: on, icono: icono, icRol: icRol, ICONOS: ICONOS, ESPECIALES: ESPECIALES, nombreRol: nombreRol, botonInfo: botonInfo, descripcionAbierta: descripcionAbierta,
    conectarSocket: conectarSocket, textoError: textoError, pintarEn: pintarEn, confirmar: confirmar, anillo: anillo, nocheTema: nocheTema };
})(window);
