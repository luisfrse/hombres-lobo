// Utilidades compartidas por la pantalla del jugador y la del narrador.
(function (global) {
  'use strict';

  var ICONOS = { aldeano: '🧑‍🌾', lobo: '🐺', vidente: '🔮', bruja: '🧪', cazador: '🏹', cupido: '💘', nina: '👧', salvador: '🛡️' };
  var ESPECIALES = ['vidente', 'bruja', 'cazador', 'cupido', 'nina', 'salvador'];

  // Crea un elemento. Los textos y atributos pueden ser cadenas o I18N.T(...) (se retraducen al cambiar de idioma).
  function el(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k.indexOf('on') === 0 && typeof v === 'function') e.addEventListener(k.slice(2), v);
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

  function nombreRol(r) { return I18N.T('rol.' + r + '.n'); }

  // Botón ⓘ: muestra u oculta la descripción de un rol. El estado abierto se conserva entre repintados.
  var abiertos = {};
  function botonInfo(rid, clave, alRepintar) {
    var k = clave + ':' + rid;
    var b = el('button', { type: 'button', class: 'info', 'aria-expanded': abiertos[k] ? 'true' : 'false', 'data-info': rid, title: I18N.T('n.info'), 'aria-label': I18N.T('n.info') }, 'ⓘ');
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      abiertos[k] = !abiertos[k];
      alRepintar();
    });
    return b;
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

  global.Lobo = { el: el, ICONOS: ICONOS, ESPECIALES: ESPECIALES, nombreRol: nombreRol, botonInfo: botonInfo, descripcionAbierta: descripcionAbierta, conectarSocket: conectarSocket, textoError: textoError };
})(window);
