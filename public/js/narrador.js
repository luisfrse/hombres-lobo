// Panel del narrador: configura los roles, lleva la noche paso a paso, anuncia el día y gestiona la votación.
(function () {
  'use strict';
  var el = Lobo.el, T = I18N.T, t = I18N.t;
  var app = document.getElementById('app');
  var avisoEl = document.getElementById('aviso');
  var socket = Lobo.conectarSocket();

  var CLAVE = 'lobo-narrador';
  var sesion = leer();      // { pin, token } (solo en esta pestaña)
  var estado = null;
  var ui = { clave: '', sel: [], cura: false, veneno: null, voto: null, alguacil: null, cazador: null };
  var errorAviso = null, tAviso = null;

  var CLAVE_ACCESO = 'lobo-acceso';
  var acceso = leerAcceso();   // { codigo, token, etiqueta }: código de invitación guardado en este navegador
  var contactUrl = 'https://luisfs.com';
  var errorAcceso = null, codigoEscrito = '', comprobando = false;
  function leerAcceso() { try { return JSON.parse(localStorage.getItem(CLAVE_ACCESO)); } catch (e) { return null; } }
  function guardarAcceso(a) { acceso = a; try { if (a) localStorage.setItem(CLAVE_ACCESO, JSON.stringify(a)); else localStorage.removeItem(CLAVE_ACCESO); } catch (e) { /* sin almacenamiento */ } }

  // Canjea un código de invitación por una sesión de narrador
  function entrarConCodigo(codigo) {
    return fetch('/api/acceso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: codigo }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok) throw { error: x.d.error || 'generico' };
        guardarAcceso({ codigo: codigo, token: x.d.token, etiqueta: x.d.etiqueta });
        if (x.d.contactUrl) contactUrl = x.d.contactUrl;
      });
  }
  fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) { if (c.contactUrl) contactUrl = c.contactUrl; pintar(); }).catch(function () { /* sin config */ });

  function crearPartida(reintento) {
    socket.emit('narrador:crear', { token: acceso && acceso.token }, function (r) {
      if (r && r.ok) { guardar({ pin: r.pin, token: r.token }); return; }
      if (r && r.error === 'sesion_caducada' && acceso && acceso.codigo && !reintento) {
        // La sesión caducó: se renueva en silencio con el código guardado
        entrarConCodigo(acceso.codigo).then(function () { crearPartida(true); }).catch(function () {
          guardarAcceso(null); errorAcceso = { error: 'codigo_guardado_invalido' }; pintar();
        });
        return;
      }
      if (r && r.error === 'sesion_caducada') { guardarAcceso(null); errorAcceso = { error: 'codigo_guardado_invalido' }; pintar(); return; }
      avisar(r || { error: 'generico' });
    });
  }

  function leer() { try { return JSON.parse(sessionStorage.getItem(CLAVE)); } catch (e) { return null; } }
  function guardar(s) { sesion = s; try { if (s) sessionStorage.setItem(CLAVE, JSON.stringify(s)); else sessionStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ } }

  function avisar(e) {
    errorAviso = e;
    pintarAviso();
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { errorAviso = null; pintarAviso(); }, 6000);
  }
  function pintarAviso() {
    avisoEl.hidden = !errorAviso;
    avisoEl.textContent = errorAviso ? Lobo.textoError(errorAviso) : '';
  }

  function llamar(ev, datos, alOk) {
    socket.emit(ev, datos || {}, function (r) {
      if (r && r.ok) { if (alOk) alOk(r); return; }
      if (r && (r.error === 'no_narrador')) { guardar(null); estado = null; pintar(); }
      avisar(r || { error: 'generico' });
    });
  }

  socket.on('connect', function () {
    if (!sesion) return pintar();
    socket.emit('narrador:reanudar', sesion, function (r) {
      if (!(r && r.ok)) { guardar(null); estado = null; pintar(); }
    });
  });
  socket.on('connect_error', function () { avisar({ error: 'conexion' }); });
  socket.on('narrador:estado', function (e) { estado = e; pintar(); });
  socket.on('narrador:cerrada', function () { guardar(null); estado = null; pintar(); });

  // ------------------------------------------------------------------ piezas
  function jugadorPorId(id) { return estado.jugadores.filter(function (j) { return j.id === id; })[0]; }
  function nombreDe(id) { var j = jugadorPorId(id); return j ? j.nombre : '?'; }
  function vivos() { return estado.jugadores.filter(function (j) { return j.vivo; }); }
  function rn(r) { return t('rol.' + r + '.n'); }

  // Rejilla de botones para elegir jugadores. max = cuántos se pueden marcar; con nadie se añade la opción «Nadie».
  function rejilla(lista, max, conNadie, prohibido) {
    var botones = lista.map(function (j) {
      var on = ui.sel.indexOf(j.id) >= 0;
      return el('button', {
        type: 'button', class: 'opcion' + (on ? ' marcado' : ''), 'data-id': j.id, 'aria-pressed': on ? 'true' : 'false',
        disabled: prohibido === j.id,
        onclick: function () { alternar(j.id, max); },
      }, (j.alguacil ? '🎖️ ' : '') + j.nombre, el('small', null, ' ' + (Lobo.ICONOS[j.rol] || '')));
    });
    if (conNadie) {
      var on0 = ui.sel.length === 0;
      botones.push(el('button', { type: 'button', class: 'opcion nadie' + (on0 ? ' marcado' : ''), 'data-id': '', 'aria-pressed': on0 ? 'true' : 'false', onclick: function () { ui.sel = []; pintar(); } }, T('n.nadie')));
    }
    return el('div', { class: 'rejilla' }, botones);
  }
  function alternar(id, max) {
    var i = ui.sel.indexOf(id);
    if (max === 1) ui.sel = i >= 0 ? [] : [id];
    else if (i >= 0) ui.sel.splice(i, 1);
    else { if (ui.sel.length >= max) ui.sel.shift(); ui.sel.push(id); }
    pintar();
  }

  function etiquetaRol(r, clave) {
    return el('span', { class: 'etiqueta-rol' }, (Lobo.ICONOS[r] || '') + ' ', Lobo.nombreRol(r));
  }

  function tablaJugadores() {
    return el('table', { class: 'tabla' },
      el('thead', null, el('tr', null, el('th', null, T('n.th_jugador')), el('th', null, T('n.th_rol')), el('th', null, T('n.th_estado')))),
      el('tbody', null, estado.jugadores.map(function (j) {
        return el('tr', { class: j.vivo ? '' : 'muerto', 'data-id': j.id },
          el('td', null, j.nombre),
          el('td', null, j.rol ? etiquetaRol(j.rol) : '—'),
          el('td', null,
            j.vivo ? T('n.vivo') : T('n.muerto'),
            j.alguacil ? el('span', { class: 'marca', title: T('n.alguacil_marca') }, ' 🎖️') : null,
            j.amor ? el('span', { class: 'marca', title: T('n.amor_marca') }, ' 💘') : null,
            j.conectado ? null : el('small', { class: 'desc' }, ' · ', T('n.desconectado'))
          ));
      })));
  }

  function cabPartida() {
    return el('section', { class: 'barra-partida' },
      el('span', { class: 'pin-chico' }, 'PIN ', el('strong', null, estado.pin)),
      estado.fase === 'noche' ? el('span', { class: 'fase noche' }, '🌙 ', T('n.noche_n', { n: estado.noche })) : null,
      estado.fase === 'dia' ? el('span', { class: 'fase dia' }, '☀️ ', T('n.dia_n', { n: estado.noche })) : null,
      el('span', { class: 'fase' }, T('n.vivos', { n: vivos().length })),
      el('button', { type: 'button', class: 'btn-texto', id: 'cerrar', onclick: function () { if (confirm(t('n.confirm_cerrar'))) llamar('narrador:cerrar', {}, function () { guardar(null); estado = null; pintar(); }); } }, T('n.cerrar'))
    );
  }

  // ------------------------------------------------------------------ pantallas
  function pantallaAcceso() {
    var campo = el('input', { id: 'codigo', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: '16', value: codigoEscrito, 'aria-label': T('acc.codigo') });
    campo.addEventListener('input', function () { codigoEscrito = campo.value; });
    var form = el('form', { class: 'tarjeta acceso', novalidate: true },
      el('h2', null, T('acc.titulo')),
      el('p', null, T('acc.intro')),
      el('label', { class: 'campo' }, el('span', null, T('acc.codigo')), campo),
      el('button', { class: 'btn grande', type: 'submit', id: 'entrar', disabled: comprobando }, T('acc.entrar')),
      errorAcceso ? el('p', { class: 'error', role: 'alert' }, Lobo.textoError(errorAcceso)) : null,
      el('p', { class: 'enlace pista' }, T('acc.sin_codigo'), ' ', el('a', { href: contactUrl, target: '_blank', rel: 'noopener' }, T('acc.solicitar')))
    );
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      comprobando = true; errorAcceso = null; pintar();
      entrarConCodigo(codigoEscrito).then(function () { comprobando = false; codigoEscrito = ''; pintar(); })
        .catch(function (e) { comprobando = false; errorAcceso = e && e.error ? e : { error: 'conexion' }; pintar(); });
    });
    return form;
  }

  function pantallaInicio() {
    if (!acceso || !acceso.token) return pantallaAcceso();
    return [
      el('p', { class: 'saludo' }, el('span', null, T('acc.hola', { n: acceso.etiqueta })),
        el('button', { type: 'button', class: 'btn-texto', id: 'cambiar-codigo', onclick: function () { guardarAcceso(null); errorAcceso = null; pintar(); } }, T('acc.salir'))),
      el('section', { class: 'tarjeta centro' },
        el('p', null, T('n.intro')),
        el('button', { type: 'button', class: 'btn grande', id: 'crear', onclick: function () { crearPartida(false); } }, T('n.crear')),
        el('p', { class: 'enlace' }, el('a', { href: '/' }, T('j.entrar'))))
    ];
  }

  function fichaRol(r, extra) {
    var fila = el('div', { class: 'rol-fila' },
      extra || null,
      el('span', { class: 'rol-nombre' }, (Lobo.ICONOS[r] || '') + ' ', Lobo.nombreRol(r)),
      Lobo.botonInfo(r, 'cfg', pintar)
    );
    return el('div', { class: 'rol-item', 'data-rol': r }, fila, Lobo.descripcionAbierta(r, 'cfg'));
  }

  function pantallaLobby() {
    var n = estado.jugadores.length, c = estado.config;
    var especiales = Lobo.ESPECIALES.filter(function (r) { return c.roles[r]; }).length;
    var aldeanos = Math.max(0, n - c.lobos - especiales);
    var host = location.host;

    var invitacion = el('section', { class: 'tarjeta centro invitacion' },
      el('p', null, T('n.entra', { host: host })),
      el('div', { class: 'pin-grande', id: 'pin' }, estado.pin),
      el('p', { class: 'pista' }, T('n.o_qr')),
      el('img', { class: 'qr', src: '/api/qr?pin=' + estado.pin, alt: T('n.qr_alt'), width: '200', height: '200' })
    );

    var jugadores = el('section', { class: 'tarjeta' },
      el('h3', null, T('n.jugadores', { n: n })),
      n === 0 ? el('p', { class: 'pista' }, T('n.sin_jugadores')) : el('ul', { class: 'lista-jugadores' }, estado.jugadores.map(function (j) {
        return el('li', { class: j.conectado ? 'vivo' : 'muerto', 'data-id': j.id },
          el('span', { class: 'nombre' }, j.nombre),
          el('button', { type: 'button', class: 'btn-texto expulsar', 'aria-label': T('n.expulsar'), title: T('n.expulsar'), onclick: function () {
            if (confirm(t('n.confirm_expulsar', { j: j.nombre }))) llamar('narrador:expulsar', { id: j.id });
          } }, '✕'));
      }))
    );

    var lobos = el('div', { class: 'rol-item', 'data-rol': 'lobo' },
      el('div', { class: 'rol-fila' },
        el('span', { class: 'rol-nombre' }, '🐺 ', T('n.lobos')),
        el('span', { class: 'paso-num' },
          el('button', { type: 'button', class: 'mini', id: 'lobos-menos', 'aria-label': T('n.menos'), disabled: c.lobos <= 1, onclick: function () { llamar('narrador:config', { lobos: c.lobos - 1 }); } }, '−'),
          el('output', { id: 'lobos-n' }, String(c.lobos)),
          el('button', { type: 'button', class: 'mini', id: 'lobos-mas', 'aria-label': T('n.mas'), disabled: c.lobos >= 10, onclick: function () { llamar('narrador:config', { lobos: c.lobos + 1 }); } }, '+')
        ),
        Lobo.botonInfo('lobo', 'cfg', pintar)
      ),
      Lobo.descripcionAbierta('lobo', 'cfg')
    );

    var especialesUI = Lobo.ESPECIALES.map(function (r) {
      var cb = el('input', { type: 'checkbox', id: 'rol-' + r, 'aria-label': T('n.activar', { r: rn(r) }) });
      cb.checked = !!c.roles[r];
      cb.addEventListener('change', function () { var o = {}; o[r] = cb.checked; llamar('narrador:config', { roles: o }); });
      return fichaRol(r, cb);
    });
    var revelar = el('input', { type: 'checkbox', id: 'revelar' });
    revelar.checked = !!c.revelar;
    revelar.addEventListener('change', function () { llamar('narrador:config', { revelar: revelar.checked }); });

    var config = el('section', { class: 'tarjeta' },
      el('h3', null, T('n.config')),
      lobos,
      fichaRol('aldeano'),
      especialesUI,
      el('label', { class: 'check' }, revelar, ' ', T('n.revelar')),
      el('p', { class: 'resumen', id: 'resumen' }, T('n.resumen', { j: n, l: c.lobos, e: especiales, a: aldeanos }))
    );

    var falta = n < estado.min;
    var empezar = el('section', { class: 'centro' },
      el('button', { type: 'button', class: 'btn grande', id: 'empezar', disabled: falta, onclick: function () { llamar('narrador:iniciar'); } }, T('n.empezar')),
      falta ? el('p', { class: 'pista' }, T('n.minimo', { n: estado.min })) : null
    );
    return [invitacion, jugadores, config, empezar];
  }

  function reiniciarSeleccion(clave) {
    if (ui.clave === clave) return;
    ui = { clave: clave, sel: [], cura: false, veneno: null, voto: null, alguacil: null, cazador: null };
  }

  function pantallaNoche() {
    var a = estado.actual;
    reiniciarSeleccion('n' + estado.noche + ':' + estado.paso + ':' + (a ? a.hecho : ''));
    var id = a.id;
    if (a.hecho && !ui.recuperado) {
      ui.recuperado = true;
      if (id === 'bruja') { ui.cura = !!a.acc.cura; ui.sel = a.acc.veneno ? [a.acc.veneno] : []; }
      else ui.sel = (a.acc || []).slice();
    }
    var rolPaso = id; // el paso 'lobo' corresponde al rol lobo
    var tarjeta = el('section', { class: 'tarjeta paso', 'data-paso': id },
      el('small', { class: 'pista' }, T('n.paso_n', { i: estado.paso + 1, n: estado.pasos.length })),
      el('h2', null, (Lobo.ICONOS[rolPaso] || '') + ' ', T('n.paso.' + id), ' ', Lobo.botonInfo(rolPaso, 'noche', pintar)),
      Lobo.descripcionAbierta(rolPaso, 'noche')
    );
    var controles = [];
    if (!a.vivo) {
      controles.push(el('p', { class: 'aviso-interno' }, T('n.muerto_aviso')));
    } else if (id === 'cupido') {
      controles.push(el('p', null, T('n.elige_dos')), rejilla(vivos(), 2, false));
      controles.push(el('button', { type: 'button', class: 'btn', id: 'confirmar', disabled: ui.sel.length !== 2, onclick: function () { llamar('narrador:accion', { objetivos: ui.sel }); } }, T('n.confirmar')));
    } else if (id === 'bruja') {
      var v = a.victima;
      controles.push(el('p', { class: 'victima' }, v ? T('n.bruja_victima', { j: nombreDe(v) }) : T('n.bruja_nadie')));
      if (a.protegida) controles.push(el('p', { class: 'pista' }, T('n.bruja_protegida')));
      var puedeCurar = a.cura && v && !a.protegida;
      controles.push(el('button', { type: 'button', class: 'opcion' + (ui.cura ? ' marcado' : ''), id: 'cura', 'aria-pressed': ui.cura ? 'true' : 'false', disabled: !puedeCurar, onclick: function () { ui.cura = !ui.cura; pintar(); } }, a.cura ? T('n.bruja_cura') : T('n.bruja_cura_usada')));
      if (a.veneno) {
        controles.push(el('p', null, T('n.bruja_veneno')), rejilla(vivos(), 1, true));
      } else {
        controles.push(el('p', { class: 'pista' }, T('n.bruja_veneno_usada')));
      }
      controles.push(el('button', { type: 'button', class: 'btn', id: 'confirmar', onclick: function () {
        llamar('narrador:accion', { cura: ui.cura, veneno: ui.sel[0] || null });
      } }, T('n.confirmar')));
    } else {
      controles.push(el('p', null, T('n.elige_uno')), rejilla(vivos(), 1, true, id === 'salvador' ? a.prohibido : null));
      controles.push(el('button', { type: 'button', class: 'btn', id: 'confirmar', onclick: function () { llamar('narrador:accion', { objetivos: ui.sel }); } }, T('n.confirmar')));
    }
    if (a.hecho && a.vivo) {
      controles.push(el('p', { class: 'hecho' }, '✔ ', a.acc && a.acc.length !== undefined ? a.acc.map(nombreDe).join(', ') || t('n.nadie') : ''));
    }
    if (a.vision) {
      controles.push(el('div', { class: 'vision' }, el('p', null, T('n.vision', { j: nombreDe(a.vision.j) })), el('h3', null, (Lobo.ICONOS[a.vision.rol] || '') + ' ', Lobo.nombreRol(a.vision.rol)), el('p', { class: 'pista' }, T('n.vision_aviso'))));
    }
    controles.push(el('button', { type: 'button', class: 'btn siguiente', id: 'siguiente', disabled: a.vivo && !a.hecho, onclick: function () { llamar('narrador:siguiente'); } }, T('n.siguiente')));
    tarjeta.appendChild(el('div', { class: 'controles' }, controles));
    return [tarjeta, el('section', { class: 'tarjeta' }, tablaJugadores())];
  }

  function listaMuertes() {
    if (!estado.anuncio.length) return el('p', { class: 'pista' }, T('n.nadie_murio'));
    return el('ul', { class: 'muertes' }, estado.anuncio.map(function (m) {
      return el('li', { 'data-id': m.j }, '💀 ', T('n.murio', { j: nombreDe(m.j), c: t('causa.' + m.causa) }));
    }));
  }

  function pantallaDia() {
    var p = estado.pendientes[0];
    reiniciarSeleccion('d' + estado.noche + ':' + estado.pendientes.length + ':' + estado.votoHecho);
    var piezas = [el('section', { class: 'tarjeta' }, el('h2', null, '☀️ ', T('n.amanece')), listaMuertes())];

    if (p) {
      var cuerpo = [el('h3', null, p.tipo === 'cazador' ? '🏹 ' : '🎖️ ', p.tipo === 'cazador' ? T('n.pend_cazador', { j: nombreDe(p.jugador) }) : T('n.pend_alguacil', { j: nombreDe(p.jugador) })),
        rejilla(vivos(), 1, true),
        el('button', { type: 'button', class: 'btn', id: 'resolver', onclick: function () { llamar('narrador:pendiente', { objetivo: ui.sel[0] || null }); } }, T('n.confirmar'))];
      piezas.push(el('section', { class: 'tarjeta pendiente' }, cuerpo));
    } else {
      var alg = estado.jugadores.filter(function (j) { return j.alguacil; })[0];
      if (!estado.votoHecho) {
        piezas.push(el('section', { class: 'tarjeta', id: 'seccion-alguacil' },
          el('h3', null, '🎖️ ', T('n.alguacil_titulo')),
          el('p', null, alg ? T('n.alguacil_actual', { j: alg.nombre }) : T('n.alguacil_ninguno')),
          el('details', null,
            el('summary', null, T('n.nombrar')),
            rejilla(vivos(), 1, false),
            el('button', { type: 'button', class: 'btn secundario', id: 'nombrar', disabled: ui.sel.length !== 1, onclick: function () { llamar('narrador:alguacil', { objetivo: ui.sel[0] }); } }, T('n.nombrar'))
          )
        ));
        piezas.push(el('section', { class: 'tarjeta', id: 'seccion-voto' },
          el('h3', null, '🗳️ ', T('n.votacion')),
          el('p', { class: 'pista' }, T('n.votacion_ayuda')),
          rejilla(vivos(), 1, true),
          el('button', { type: 'button', class: 'btn peligro', id: 'votar', onclick: function () { llamar('narrador:votar', { objetivo: ui.sel[0] || null }); } }, ui.sel.length ? T('n.eliminar') : T('n.confirmar'))
        ));
      } else {
        piezas.push(el('section', { class: 'centro' }, el('button', { type: 'button', class: 'btn grande', id: 'noche', onclick: function () { llamar('narrador:noche'); } }, '🌙 ', T('n.empezar_noche'))));
      }
    }
    piezas.push(el('section', { class: 'tarjeta' }, tablaJugadores()));
    return piezas;
  }

  function pantallaFinal() {
    return [
      el('section', { class: 'banda final ' + estado.ganador }, el('h2', null, T('g.' + estado.ganador)), listaMuertes()),
      el('section', { class: 'tarjeta' }, tablaJugadores()),
      el('section', { class: 'centro' },
        el('button', { type: 'button', class: 'btn grande', id: 'otra', onclick: function () { llamar('narrador:nueva'); } }, T('n.otra')),
        el('p', { class: 'pista' }, T('n.solo_nuevos_roles')))
    ];
  }

  function pintar() {
    var piezas;
    if (!estado) piezas = [].concat(pantallaInicio());
    else {
      piezas = [cabPartida()];
      if (estado.fase === 'lobby') piezas = piezas.concat(pantallaLobby());
      else if (estado.fase === 'noche' && estado.actual) piezas = piezas.concat(pantallaNoche());
      else if (estado.fase === 'dia') piezas = piezas.concat(pantallaDia());
      else if (estado.fase === 'final') piezas = piezas.concat(pantallaFinal());
    }
    document.body.classList.toggle('es-noche', !!(estado && estado.fase === 'noche'));
    var y = window.scrollY;
    var enCodigo = document.activeElement && document.activeElement.id === 'codigo';
    var pos = enCodigo ? document.activeElement.selectionStart : 0;
    app.replaceChildren.apply(app, piezas);
    window.scrollTo(0, y);
    if (enCodigo) { var f = document.getElementById('codigo'); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) { /* sin selección */ } } }
    pintarAviso();
  }

  I18N.onChange(pintar);
  pintar();
})();
