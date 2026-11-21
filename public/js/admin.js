(() => {
  const $ = (id) => document.getElementById(id);
  const T = I18N.T;

  function el(tag, props, ...hijos) {
    const e = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === 'class') e.className = v;
        else if (k.startsWith('on')) Lobo.on(e, k.slice(2), v);
        else if (I18N.esD(v)) I18N.bind(e, k, v);
        else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
      }
    }
    for (const h of hijos.flat()) {
      if (h === null || h === undefined || h === false) continue;
      e.append(I18N.esD(h) ? I18N.nodo(h) : h.nodeType ? h : document.createTextNode(h));
    }
    return e;
  }

  // Fechas con formato del idioma elegido; se reformatean al cambiar de idioma sin recargar la tabla
  const celdaFecha = (iso) => (iso ? el('td', { 'data-fecha': iso }, I18N.fecha(iso)) : el('td', null, '—'));
  const celdaFechaHora = (iso) => (iso ? el('td', { 'data-fechahora': iso }, I18N.fechaHora(iso)) : el('td', null, T('ac.nunca')));
  I18N.onChange(() => {
    for (const e of document.querySelectorAll('[data-fecha]')) e.textContent = I18N.fecha(e.dataset.fecha);
    for (const e of document.querySelectorAll('[data-fechahora]')) e.textContent = I18N.fechaHora(e.dataset.fechahora);
  });

  function mostrarError(d) {
    const e = $('error');
    e.replaceChildren(d ? I18N.nodo(d) : '');
    e.hidden = !d;
  }
  const errDe = (e) => (e && e.d) || T('e.generico');

  async function api(url, opciones) {
    const r = await fetch(url, opciones);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = new Error(d.error || 'http' + r.status);
      err.d = d.error && I18N.has('e.' + d.error) ? T('e.' + d.error, d.vars) : T('e.generico');
      throw err;
    }
    return d;
  }

  async function copiar(texto, boton) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      const t = el('textarea', { class: 'copia-oculta' }, texto);
      document.body.append(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    const antes = Array.from(boton.childNodes);
    boton.replaceChildren(I18N.nodo(T('ac.copiado')));
    setTimeout(() => { boton.replaceChildren(...antes); }, 1500);
  }

  function invitacion(fila) {
    return I18N.t('ac.mensaje', { c: fila.codigo, u: location.origin });
  }

  function tarjetaNuevo(fila) {
    const b1 = el('button', { class: 'btn secundario', type: 'button' }, T('ac.copiar_codigo'));
    Lobo.on(b1, 'click', () => copiar(fila.codigo, b1));
    const b2 = el('button', { class: 'btn', type: 'button' }, T('ac.copiar_msg'));
    Lobo.on(b2, 'click', () => copiar(invitacion(fila), b2));
    $('nuevo').replaceChildren(el('div', { class: 'codigo-nuevo', id: 'codigo-nuevo' },
      el('div', null, el('div', null, T('ac.codigo_para', { n: fila.etiqueta })), el('div', { class: 'codigo-mono', id: 'codigo-nuevo-texto' }, fila.codigo)),
      b1, b2));
  }

  async function cargar() {
    const [codigos, estado] = await Promise.all([api('/api/admin/codigos'), api('/api/admin/estado')]);
    I18N.setT($('estado-servidor'), 'ac.estado_srv', { a: estado.partidasActivas, j: estado.jugadoresEnPartidas });

    if (!codigos.length) {
      Lobo.pintarEn($('tabla'), [el('div', { class: 'vacio' }, Lobo.icono('key'), T('ac.vacio'))]);
      return;
    }
    const cuerpo = el('tbody');
    for (const f of codigos) {
      const bCopiar = el('button', { class: 'link', type: 'button' }, T('ac.copiar'));
      Lobo.on(bCopiar, 'click', () => copiar(f.codigo, bCopiar));
      const bInv = el('button', { class: 'link', type: 'button' }, T('ac.invitacion'));
      Lobo.on(bInv, 'click', () => copiar(invitacion(f), bInv));
      const bRevocar = el('button', { class: 'link' + (f.estado === 'revocado' ? '' : ' rojo'), type: 'button', 'data-accion': 'revocar' },
        f.estado === 'revocado' ? T('ac.reactivar') : T('ac.revocar'));
      Lobo.on(bRevocar, 'click', async () => {
        const revocar = f.estado !== 'revocado';
        if (revocar && !(await Lobo.confirmar({ titulo: T('ac.confirm_revocar_t'), texto: I18N.T('ac.confirm_revocar', { n: f.etiqueta }), ok: T('ac.revocar'), peligro: true }))) return;
        try { await api('/api/admin/codigos/' + f.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revocado: revocar }) }); await cargar(); } catch (e) { mostrarError(errDe(e)); }
      });
      const bBorrar = el('button', { class: 'link rojo', type: 'button', 'data-accion': 'borrar' }, T('ac.borrar'));
      Lobo.on(bBorrar, 'click', async () => {
        if (!(await Lobo.confirmar({ titulo: T('ac.confirm_borrar_t'), texto: I18N.T('ac.confirm_borrar', { n: f.etiqueta }), ok: T('ac.borrar'), peligro: true }))) return;
        try { await api('/api/admin/codigos/' + f.id, { method: 'DELETE' }); await cargar(); } catch (e) { mostrarError(errDe(e)); }
      });
      cuerpo.append(el('tr', { 'data-id': String(f.id) },
        el('td', null, f.etiqueta),
        el('td', null, el('span', { class: 'codigo-mono' }, f.codigo)),
        celdaFecha(f.creado),
        celdaFecha(f.caduca ? f.caduca + 'T12:00:00' : null),
        celdaFechaHora(f.ultimoUso),
        el('td', { class: 'num' }, String(f.partidas)),
        el('td', { class: 'num' }, f.enVivo.activas ? T('ac.en_vivo', { a: f.enVivo.activas, j: f.enVivo.jugadores }) : '—'),
        el('td', null, el('span', { class: 'etiqueta-estado ' + f.estado }, I18N.has('ac.est_' + f.estado) ? T('ac.est_' + f.estado) : f.estado)),
        el('td', null, el('div', { class: 'acciones-fila' }, bCopiar, bInv, bRevocar, bBorrar))));
    }
    Lobo.pintarEn($('tabla'), [el('table', null,
      el('thead', null, el('tr', null,
        el('th', null, T('ac.th_persona')), el('th', null, T('ac.th_codigo')), el('th', null, T('ac.th_creado')), el('th', null, T('ac.th_caduca')),
        el('th', null, T('ac.th_ultimo')), el('th', { class: 'num' }, T('ac.th_partidas')), el('th', { class: 'num' }, T('ac.th_vivo')),
        el('th', null, T('ac.th_estado')), el('th', null, ''))),
      cuerpo)]);
  }

  $('btn-crear').addEventListener('click', async () => {
    mostrarError(null);
    try {
      const fila = await api('/api/admin/codigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiqueta: $('in-etiqueta').value, caduca: $('in-caduca').value || null }),
      });
      $('in-etiqueta').value = '';
      $('in-caduca').value = '';
      tarjetaNuevo(fila);
      await cargar();
    } catch (e) {
      mostrarError(errDe(e));
    }
  });

  $('in-etiqueta').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') $('btn-crear').click(); });

  $('salir-slot').append(el('button', { class: 'dc-btn dc-btn--on-dark', type: 'button', onclick: async () => { try { await fetch('/api/admin-entrada/logout', { method: 'POST' }); } catch (e) { /* da igual */ } location.href = '/admin'; } }, Lobo.icono('log-out'), T('ac.salir')));
  cargar().catch((e) => mostrarError(errDe(e)));
  setInterval(() => cargar().catch(() => {}), 15000);
})();
