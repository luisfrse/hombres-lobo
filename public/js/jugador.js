// Pantalla del jugador: entra con el PIN, ve su rol (con lo que hace) y el estado de la partida.
(function () {
  'use strict';
  var el = Lobo.el, T = I18N.T;
  var app = document.getElementById('app');
  var aviso = document.getElementById('aviso');
  var socket = Lobo.conectarSocket();

  var CLAVE = 'lobo-sesion';
  var sesion = leer();       // { pin, token }
  var estado = null;         // último estado recibido
  var error = null;          // { error, vars }
  var visible = false;       // rol mostrado en pantalla
  var rolVisto = null;
  var entrando = false;
  var pinEscrito = '';
  var nombreEscrito = '';

  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { return null; } }
  function guardar(s) { sesion = s; try { if (s) localStorage.setItem(CLAVE, JSON.stringify(s)); else localStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ } }

  function salirALogin(e) {
    guardar(null); estado = null; visible = false; rolVisto = null; error = e || null; pintar();
  }

  function unirse(datos) {
    entrando = true; pintar();
    socket.emit('jugador:unirse', datos, function (r) {
      entrando = false;
      if (r && r.ok) {
        error = null;
        guardar({ pin: datos.pin, token: r.token, nombre: r.nombre });
      } else {
        if (datos.token) guardar(null);
        error = r || { error: 'generico' };
        pintar();
      }
    });
  }

  socket.on('connect', function () { if (sesion && sesion.token) unirse({ pin: sesion.pin, token: sesion.token }); else pintar(); });
  socket.on('connect_error', function () { error = { error: 'conexion' }; pintar(); });
  socket.on('jugador:estado', function (e) {
    estado = e; error = null;
    var r = e.yo && e.yo.rol ? e.yo.rol : null;
    if (r !== rolVisto) { rolVisto = r; visible = false; }
    pintar();
  });
  socket.on('jugador:expulsado', function () { salirALogin({ error: 'expulsado' }); });
  socket.on('jugador:cerrada', function () { salirALogin({ error: 'partida_cerrada' }); });
  socket.on('jugador:desplazado', function () { salirALogin(null); });

  // ------------------------------------------------------------------ pantallas
  function pantallaEntrada() {
    var params = new URLSearchParams(location.search);
    if (!pinEscrito) pinEscrito = (params.get('pin') || (sesion && sesion.pin) || '').replace(/\D/g, '').slice(0, 6);
    var pin = el('input', { id: 'pin', class: 'dc-input dc-input--code', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '6', autocomplete: 'off', value: pinEscrito, 'aria-label': T('j.pin'), 'aria-invalid': error ? 'true' : null });
    var nombre = el('input', { id: 'nombre', class: 'dc-input', type: 'text', maxlength: '20', autocomplete: 'nickname', value: nombreEscrito, placeholder: T('j.nombre_ph') });
    Lobo.on(pin, 'input', function () { pinEscrito = this.value.replace(/\D/g, '').slice(0, 6); this.value = pinEscrito; });
    Lobo.on(nombre, 'input', function () { nombreEscrito = this.value; });
    var form = el('form', { class: 'tarjeta entrada', novalidate: true },
      el('div', { class: 'entrada-cab' }, el('span', { class: 'dc-brand__tile dc-brand--lg' }, Lobo.icono('moon')), el('h2', null, T('j.pin'))),
      el('label', { class: 'campo' }, el('span', null, T('j.pin')), pin, el('small', { class: 'pista' }, T('j.pin_ayuda'))),
      el('label', { class: 'campo' }, el('span', null, T('j.nombre')), nombre),
      el('div', { class: 'mensaje', 'aria-live': 'assertive' }, error ? el('p', { class: 'error', role: 'alert' }, Lobo.icono('x-circle'), el('span', null, Lobo.textoError(error))) : null),
      el('button', { class: 'btn grande', type: 'submit', disabled: entrando }, T('j.entrar'))
    );
    Lobo.on(form, 'submit', function (ev) {
      ev.preventDefault();
      unirse({ pin: pinEscrito, nombre: nombreEscrito });
    });
    return [form, el('p', { class: 'enlace' }, el('a', { href: '/narrador' }, T('j.soy_narrador')))];
  }

  function tarjetaRol(e) {
    var yo = e.yo;
    var cuerpo;
    if (!visible) {
      cuerpo = el('div', { class: 'carta oculta' }, el('div', { class: 'icono' }, Lobo.icono('card', 'dc-icon--xl')), el('p', null, T('j.toca_ver')));
    } else {
      cuerpo = el('div', { class: 'carta rol-' + yo.rol },
        el('div', { class: 'icono' }, Lobo.icRol(yo.rol, 'dc-icon--xl')),
        el('small', null, T('j.tu_rol')),
        el('h2', { 'data-rol': yo.rol }, Lobo.nombreRol(yo.rol)),
        el('p', { class: 'descripcion', 'data-desc': yo.rol }, T('rol.' + yo.rol + '.d')),
        yo.companeros && yo.companeros.length ? el('p', { class: 'nota lobo' }, T('j.companeros', { l: yo.companeros.join(', ') })) : null,
        yo.amor ? el('p', { class: 'nota amor' }, Lobo.icono('heart'), ' ', T('j.enamorado', { j: yo.amor })) : null,
        yo.alguacil ? el('p', { class: 'nota alguacil' }, Lobo.icono('medal'), ' ', T('j.alguacil')) : null,
        el('small', { class: 'pista' }, T('j.toca_ocultar'))
      );
    }
    var b = el('button', { type: 'button', class: 'carta-boton', 'aria-pressed': visible ? 'true' : 'false', onclick: function () { visible = !visible; pintar(); } }, cuerpo);
    return b;
  }

  function listaJugadores(e) {
    return el('section', { class: 'tarjeta' },
      el('h3', null, T('j.vivos', { n: e.vivos })),
      el('ul', { class: 'lista-jugadores' }, e.jugadores.map(function (j) {
        return el('li', { class: j.vivo ? 'vivo' : 'muerto', 'data-id': j.id },
          j.alguacil ? [Lobo.icono('medal'), ' '] : null,
          el('span', { class: 'nombre' }, j.nombre),
          j.rol ? el('em', null, ' · ', T('j.era', { r: I18N.t('rol.' + j.rol + '.n') })) : null
        );
      }))
    );
  }

  function pantallaPartida(e) {
    var piezas = [];
    if (e.fase === 'lobby') {
      piezas.push(el('section', { class: 'tarjeta centro' },
        el('h2', null, T('j.dentro', { n: e.yo.nombre })),
        el('p', null, T('j.espera')),
        el('p', { class: 'contador' }, T('j.en_sala', { n: e.jugadores.length })),
        el('ul', { class: 'lista-jugadores' }, e.jugadores.map(function (j) { return el('li', { class: 'vivo' }, j.nombre); }))
      ));
    } else {
      if (e.fase === 'noche') {
        piezas.push(el('section', { class: 'banda noche' }, el('h2', null, Lobo.icono('moon'), ' ', T('j.noche_n', { n: e.noche })), el('p', null, e.yo.vivo ? T('j.noche') : T('j.noche_muerto'))));
      } else if (e.fase === 'dia') {
        piezas.push(el('section', { class: 'banda dia' }, el('h2', null, Lobo.icono('sun'), ' ', T('j.dia_n', { n: e.noche })), el('p', null, T('j.dia'))));
      } else if (e.fase === 'final') {
        piezas.push(el('section', { class: 'banda final ' + e.ganador }, el('small', null, T('j.fin')), el('h2', null, T('g.' + e.ganador)), el('p', null, T('j.tu_eras', { r: I18N.t('rol.' + e.yo.rol + '.n') }))));
      }
      if (!e.yo.vivo && e.fase !== 'final') {
        piezas.push(el('section', { class: 'banda eliminado' }, el('h3', null, Lobo.icono('skull'), ' ', T('j.eliminado')), el('p', null, T('j.eliminado_det'))));
      }
      piezas.push(tarjetaRol(e));
      piezas.push(listaJugadores(e));
      if (e.fase === 'final') piezas.push(el('p', { class: 'centro pista' }, T('j.espera_nueva')));
    }
    piezas.push(el('p', { class: 'enlace' }, el('button', { type: 'button', class: 'btn-texto', id: 'salir', onclick: salir }, T('j.salir'))));
    return piezas;
  }

  function salir() {
    socket.emit('jugador:salir', {}, function () { salirALogin(null); });
  }

  function pintar() {
    var cont = estado && sesion ? pantallaPartida(estado) : pantallaEntrada();
    Lobo.nocheTema(!!(estado && sesion && estado.fase === 'noche'));
    // Se compara con lo que hay en pantalla y solo se cambia lo que difiere: no se pierde el foco, el cursor ni lo escrito
    Lobo.pintarEn(app, [].concat(cont));
    if (!enfocado && !(estado && sesion) && document.getElementById('pin')) {
      enfocado = true; var f = document.getElementById(pinEscrito.length === 6 ? 'nombre' : 'pin'); if (f) f.focus();
    }
  }
  var enfocado = false;

  I18N.onChange(pintar);
  pintar();
})();
