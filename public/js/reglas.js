// Página de reglas: la lista de roles sale del diccionario (mismas descripciones que ve el jugador en su tarjeta).
(function () {
  'use strict';
  var el = Lobo.el, T = I18N.T;
  var orden = ['aldeano', 'lobo', 'vidente', 'bruja', 'cazador', 'cupido', 'nina', 'salvador'];
  var cont = document.getElementById('roles');
  orden.forEach(function (r) {
    cont.appendChild(el('article', { class: 'rol-regla', 'data-rol': r },
      el('div', { class: 'icono' }, Lobo.ICONOS[r]),
      el('div', null,
        el('h3', null, Lobo.nombreRol(r), ' ', el('small', { class: r === 'lobo' ? 'equipo lobos' : 'equipo pueblo' }, T(r === 'lobo' ? 'equipo.lobos' : 'equipo.pueblo'))),
        el('p', { class: 'descripcion' }, T('rol.' + r + '.d')))));
  });
  cont.appendChild(el('article', { class: 'rol-regla', 'data-rol': 'alguacil' },
    el('div', { class: 'icono' }, '🎖️'),
    el('div', null, el('h3', null, T('alguacil.n')), el('p', { class: 'descripcion' }, T('alguacil.d')))));
})();
