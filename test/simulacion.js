'use strict';
// Partidas completas con sockets reales: reparto, privacidad, noche, día, cazador, enamorados, alguacil, brujería y reinicio.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lobo-test-'));
process.env.ADMIN_PASSWORD = 'clave-de-prueba';
const { io: cliente } = require('socket.io-client');
const { server, partidas } = require('../server');

let url;
const abiertos = [];
function conectar() {
  const s = cliente(url, { transports: ['websocket'], forceNew: true });
  abiertos.push(s);
  s.ultimo = null;
  s.on('narrador:estado', (e) => { s.ultimo = e; });
  s.on('jugador:estado', (e) => { s.ultimo = e; });
  return new Promise((ok) => s.on('connect', () => ok(s)));
}
const emit = (s, ev, d) => new Promise((ok) => s.emit(ev, d, ok));
const pausa = (ms = 60) => new Promise((r) => setTimeout(r, ms));
async function bien(s, ev, d) { const r = await emit(s, ev, d); assert.strictEqual(r.ok, true, ev + ' → ' + JSON.stringify(r)); await pausa(); return r; }
async function mal(s, ev, d, codigo) { const r = await emit(s, ev, d); assert.strictEqual(r.ok, false, ev + ' debía fallar'); assert.strictEqual(r.error, codigo, ev + ' → ' + JSON.stringify(r)); }
let n = 0;
const ok = (m) => { n += 1; console.log('  ✓ ' + m); };

(async () => {
  await new Promise((r) => server.listen(0, r));
  url = 'http://localhost:' + server.address().port;

  // --- Códigos de invitación (administración) ---
  const AUTH = 'Basic ' + Buffer.from('admin:clave-de-prueba').toString('base64');
  const api = (ruta, metodo = 'GET', cuerpo, auth = AUTH) => fetch(url + ruta, {
    method: metodo, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  assert.strictEqual((await api('/admin', 'GET', null, null)).status, 401, '/admin exige contraseña');
  assert.strictEqual((await api('/api/admin/codigos', 'GET', null, null)).status, 401);
  assert.strictEqual((await api('/api/admin/codigos', 'POST', { etiqueta: '' })).status, 400);
  assert.strictEqual((await api('/admin')).status, 200);
  const crearCodigo = async (etiqueta) => (await api('/api/admin/codigos', 'POST', { etiqueta })).json();
  const acceder = async (codigo) => { const r = await api('/api/acceso', 'POST', { codigo }, null); return { status: r.status, d: await r.json() }; };
  const ana = await crearCodigo('Ana Prueba');
  assert.match(ana.codigo, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  const a1 = await acceder(ana.codigo.toLowerCase().replace('-', ' '));
  assert.strictEqual(a1.status, 200); assert.strictEqual(a1.d.etiqueta, 'Ana Prueba');
  const sesionAna = a1.d.token;
  const pegado = await acceder('Hola, aquí tienes tu código para llevar partidas de Hombres lobo: ' + ana.codigo + '\nEntra en https://lobo.luisfs.com/narrador e introdúcelo.');
  assert.strictEqual(pegado.status, 200, 'se acepta el mensaje de invitación pegado entero');
  const dosDispositivos = await acceder(ana.codigo);
  assert.strictEqual(dosDispositivos.status, 200, 'el mismo código sirve en varios dispositivos');
  assert.notStrictEqual(dosDispositivos.d.token, a1.d.token);
  ok('códigos de invitación: /admin protegido y acceso con código');

  const nar = await conectar();
  await mal(nar, 'narrador:crear', {}, 'sesion_caducada');
  await mal(nar, 'narrador:crear', { token: 'inventado' }, 'sesion_caducada');
  const { pin, token } = await emit(nar, 'narrador:crear', { token: sesionAna });
  assert.match(pin, /^\d{6}$/);
  await pausa();
  const E = () => nar.ultimo;
  const R = (r) => E().jugadores.filter((j) => j.rol === r);

  // --- Entrada y errores ---
  const intruso = await conectar();
  await mal(intruso, 'jugador:unirse', { pin: '000000', nombre: 'X' }, 'pin_invalido');
  await mal(intruso, 'jugador:unirse', { pin, nombre: '   ' }, 'falta_nombre');
  await mal(intruso, 'narrador:iniciar', {}, 'no_narrador');
  const nombres = ['Ana', 'Beto', 'Carla', 'Dani', 'Eva', 'Fran', 'Gala', 'Hugo'];
  const jug = {};
  for (const nom of nombres) {
    const s = await conectar();
    const r = await emit(s, 'jugador:unirse', { pin, nombre: nom });
    assert.ok(r.ok && r.token, 'unirse ' + nom);
    s.token = r.token; jug[nom] = s;
  }
  await mal(intruso, 'jugador:unirse', { pin, nombre: 'ana' }, 'nombre_en_uso');
  await pausa();
  assert.strictEqual(E().jugadores.length, 8);
  assert.ok(E().jugadores.every((j) => j.rol === null));
  ok('entrada de jugadores, nombres repetidos y PIN erróneo');

  // --- Validaciones de reparto ---
  const sinEsp = { vidente: false, bruja: false, cazador: false, cupido: false, nina: false, salvador: false };
  await bien(nar, 'narrador:config', { lobos: 4, roles: sinEsp });
  await mal(nar, 'narrador:iniciar', {}, 'demasiados_lobos');
  await bien(nar, 'narrador:config', { lobos: 3, roles: { vidente: true, bruja: true, cazador: true, cupido: true, nina: true, salvador: true } });
  await mal(nar, 'narrador:iniciar', {}, 'demasiados_roles');
  await bien(nar, 'narrador:config', { lobos: 2, roles: { ...sinEsp, vidente: true, bruja: true, cazador: true, cupido: true, salvador: true } });
  ok('validación de lobos y roles');

  await bien(nar, 'narrador:iniciar', {});
  assert.strictEqual(E().fase, 'noche');
  assert.deepStrictEqual(E().pasos, ['cupido', 'salvador', 'vidente', 'lobo', 'bruja']);
  const tarde = await conectar();
  await mal(tarde, 'jugador:unirse', { pin, nombre: 'Tarde' }, 'partida_empezada');

  // --- Privacidad ---
  const porId = {}; for (const nom of nombres) porId[E().jugadores.find((j) => j.nombre === nom).id] = jug[nom];
  const lobos = R('lobo'); assert.strictEqual(lobos.length, 2);
  for (const j of E().jugadores) {
    const e = porId[j.id].ultimo;
    assert.strictEqual(e.yo.rol, j.rol, 'cada uno ve su rol');
    assert.ok(e.jugadores.every((x) => x.rol === null), 'nadie ve el rol de otros vivos');
    assert.ok(!('actual' in e) && !('pasos' in e), 'el jugador no recibe el estado del narrador');
    if (j.rol === 'lobo') assert.strictEqual(e.yo.companeros.length, 1); else assert.strictEqual(e.yo.companeros, undefined);
  }
  const volcado = JSON.stringify(Object.values(porId).map((s) => s.ultimo)).replace(/"yo":\{[^}]*\}/g, '');
  for (const r of ['"lobo"', '"vidente"', '"bruja"']) assert.ok(!volcado.includes(r), 'filtración del rol ' + r);
  ok('privacidad: cada jugador solo ve su rol y sus compañeros lobos');

  const ald = R('aldeano')[0], caz = R('cazador')[0], sal = R('salvador')[0], vid = R('vidente')[0], bru = R('bruja')[0], cup = R('cupido')[0];
  const nomDe = (id) => E().jugadores.find((j) => j.id === id).nombre;

  // --- Noche 1 ---
  await mal(nar, 'narrador:siguiente', {}, 'accion_invalida');
  await mal(nar, 'narrador:accion', { objetivos: [ald.id] }, 'objetivo_invalido');
  await mal(nar, 'narrador:accion', { objetivos: [ald.id, ald.id] }, 'objetivo_invalido');
  await mal(nar, 'narrador:accion', { objetivos: ['zzz', 'yyy'] }, 'objetivo_invalido');
  await bien(nar, 'narrador:accion', { objetivos: [ald.id, caz.id] });
  await bien(nar, 'narrador:siguiente', {});
  assert.strictEqual(E().actual.id, 'salvador');
  await bien(nar, 'narrador:accion', { objetivos: [vid.id] });
  await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [lobos[0].id] });
  assert.deepStrictEqual(E().actual.vision, { j: lobos[0].id, rol: 'lobo' });
  await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [ald.id] });
  await bien(nar, 'narrador:siguiente', {});
  assert.strictEqual(E().actual.id, 'bruja');
  assert.strictEqual(E().actual.victima, ald.id);
  assert.strictEqual(E().actual.protegida, false);
  assert.strictEqual(porId[ald.id].ultimo.yo.amor, caz.nombre, 'el enamorado conoce a su pareja');
  assert.strictEqual(porId[caz.id].ultimo.yo.amor, ald.nombre);
  assert.strictEqual(porId[vid.id].ultimo.yo.amor, undefined);
  await bien(nar, 'narrador:accion', { cura: false, veneno: null });
  await bien(nar, 'narrador:siguiente', {});
  assert.strictEqual(E().fase, 'dia');
  assert.deepStrictEqual(E().anuncio.map((a) => [a.j, a.causa]), [[ald.id, 'lobos'], [caz.id, 'amor']]);
  assert.deepStrictEqual(E().pendientes, [{ tipo: 'cazador', jugador: caz.id }]);
  await mal(nar, 'narrador:votar', { objetivo: null }, 'accion_invalida');
  await mal(nar, 'narrador:pendiente', { objetivo: caz.id }, 'objetivo_invalido'); // el cazador ya está muerto
  await bien(nar, 'narrador:pendiente', { objetivo: lobos[0].id });
  assert.deepStrictEqual(E().pendientes, []);
  assert.strictEqual(E().fase, 'dia');
  const visto = porId[vid.id].ultimo;
  assert.strictEqual(visto.jugadores.find((x) => x.id === ald.id).rol, 'aldeano', 'rol del eliminado visible');
  assert.strictEqual(visto.jugadores.find((x) => x.id === sal.id).rol, null);
  assert.strictEqual(porId[caz.id].ultimo.yo.vivo, false);
  await bien(nar, 'narrador:alguacil', { objetivo: vid.id });
  assert.strictEqual(porId[sal.id].ultimo.jugadores.find((x) => x.id === vid.id).alguacil, true);
  await mal(nar, 'narrador:noche', {}, 'accion_invalida'); // falta la votación
  await bien(nar, 'narrador:votar', { objetivo: null });
  await bien(nar, 'narrador:noche', {});
  ok('noche 1: enamorados, cazador, vidente, alguacil');

  // --- Noche 2: el Salvador no repite; la protección anula el ataque ---
  assert.deepStrictEqual(E().pasos, ['salvador', 'vidente', 'lobo', 'bruja']);
  await mal(nar, 'narrador:accion', { objetivos: [vid.id] }, 'salvador_repite');
  await bien(nar, 'narrador:accion', { objetivos: [bru.id] });
  await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [] });
  await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [bru.id] });
  await bien(nar, 'narrador:siguiente', {});
  assert.strictEqual(E().actual.protegida, true);
  await mal(nar, 'narrador:accion', { cura: true }, 'objetivo_invalido');
  await bien(nar, 'narrador:accion', { cura: false });
  await bien(nar, 'narrador:siguiente', {});
  assert.deepStrictEqual(E().anuncio, []);
  assert.strictEqual(E().fase, 'dia');
  await bien(nar, 'narrador:votar', { objetivo: null });
  await bien(nar, 'narrador:noche', {});
  ok('noche 2: protección del Salvador');

  // --- Noche 3: la Bruja cura ---
  await bien(nar, 'narrador:accion', { objetivos: [sal.id] }); await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [] }); await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [vid.id] }); await bien(nar, 'narrador:siguiente', {});
  assert.strictEqual(E().actual.victima, vid.id);
  await bien(nar, 'narrador:accion', { cura: true });
  assert.strictEqual(E().actual.cura, true);
  await bien(nar, 'narrador:siguiente', {});
  assert.deepStrictEqual(E().anuncio, []);
  await bien(nar, 'narrador:votar', { objetivo: null });
  await bien(nar, 'narrador:noche', {});
  ok('noche 3: poción de curación');

  // --- Noche 4: poción usada; veneno al último lobo; muere el alguacil y gana el pueblo ---
  await bien(nar, 'narrador:accion', { objetivos: [cup.id] }); await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [] }); await bien(nar, 'narrador:siguiente', {});
  await bien(nar, 'narrador:accion', { objetivos: [vid.id] }); await bien(nar, 'narrador:siguiente', {});
  assert.strictEqual(E().actual.cura, false);
  await mal(nar, 'narrador:accion', { cura: true }, 'pocion_usada');
  await bien(nar, 'narrador:accion', { cura: false, veneno: lobos[1].id });
  await bien(nar, 'narrador:siguiente', {});
  assert.strictEqual(E().fase, 'final');
  assert.strictEqual(E().ganador, 'pueblo');
  assert.deepStrictEqual(E().anuncio.map((a) => a.causa), ['lobos', 'veneno']);
  assert.deepStrictEqual(E().pendientes, []);
  const fin = porId[sal.id].ultimo;
  assert.ok(fin.jugadores.every((x) => x.rol), 'al final se revelan todos los roles');
  ok('noche 4: veneno, alguacil muerto, victoria del pueblo');

  // --- Reconexión ---
  const antes = porId[sal.id].ultimo.yo.rol;
  const nombreSal = sal.nombre;
  porId[sal.id].disconnect(); await pausa(80);
  assert.strictEqual(E().jugadores.find((j) => j.id === sal.id).conectado, false);
  const re = await conectar();
  const rr = await emit(re, 'jugador:unirse', { pin, token: jug[nombreSal].token }); await pausa();
  assert.ok(rr.ok); assert.strictEqual(re.ultimo.yo.rol, antes);
  assert.strictEqual(E().jugadores.find((j) => j.id === sal.id).conectado, true);
  const nar2 = await conectar();
  await mal(nar2, 'narrador:reanudar', { pin, token: 'x'.repeat(48) }, 'no_narrador');
  await bien(nar2, 'narrador:reanudar', { pin, token });
  assert.ok(nar2.ultimo && nar2.ultimo.pin === pin);
  await mal(nar, 'narrador:nueva', {}, 'no_narrador'); // el socket viejo ya no es el narrador
  nar.ultimo = null; nar2.ultimo && (nar.ultimo = nar2.ultimo);
  ok('reconexión de jugador y de narrador');

  // --- Otra partida: 3 lobos sin roles especiales; ganan los lobos por votación ---
  await bien(nar2, 'narrador:nueva', {});
  assert.strictEqual(nar2.ultimo.fase, 'lobby');
  assert.ok(nar2.ultimo.jugadores.length === 8 && nar2.ultimo.jugadores.every((j) => j.rol === null && j.vivo));
  await bien(nar2, 'narrador:config', { lobos: 3, roles: sinEsp });
  await bien(nar2, 'narrador:iniciar', {});
  const e2 = () => nar2.ultimo;
  assert.deepStrictEqual(e2().pasos, ['lobo']);
  const lb = e2().jugadores.filter((j) => j.rol === 'lobo'), al = e2().jugadores.filter((j) => j.rol === 'aldeano');
  assert.strictEqual(lb.length, 3); assert.strictEqual(al.length, 5);
  await bien(nar2, 'narrador:accion', { objetivos: [al[0].id] });
  await bien(nar2, 'narrador:siguiente', {});
  assert.strictEqual(e2().fase, 'dia'); assert.strictEqual(e2().ganador, null);
  await bien(nar2, 'narrador:votar', { objetivo: al[1].id });
  assert.strictEqual(e2().fase, 'final'); assert.strictEqual(e2().ganador, 'lobos');
  ok('segunda partida: victoria de los lobos por votación');

  // --- Cierre ---
  let cerrada = 0; re.on('jugador:cerrada', () => { cerrada += 1; });
  await bien(nar2, 'narrador:cerrar', {});
  await pausa(80);
  assert.strictEqual(cerrada, 1); assert.strictEqual(partidas.size, 0);
  ok('cierre de la partida');

  // --- Límite por código, revocación y caducidad ---
  const m = await conectar();
  const abiertas = [];
  for (let i = 0; i < 3; i++) { const r = await emit(m, 'narrador:crear', { token: sesionAna }); assert.ok(r.ok, 'crear ' + i); abiertas.push(r.pin); }
  await mal(m, 'narrador:crear', { token: sesionAna }, 'max_partidas_codigo');
  const filaAna = (await (await api('/api/admin/codigos')).json()).find((f) => f.id === ana.id);
  assert.strictEqual(filaAna.partidas, 4, 'el contador de partidas del código');
  assert.strictEqual(filaAna.enVivo.activas, 3);
  ok('máximo de partidas abiertas por código');

  const cerradas = [];
  const dueno = await conectar();
  dueno.on('narrador:cerrada', () => cerradas.push('narrador'));
  await emit(dueno, 'narrador:reanudar', { pin: abiertas[0], token: partidas.get(abiertas[0]).tokenNarrador });
  const jr = await conectar(); jr.on('jugador:cerrada', () => cerradas.push('jugador'));
  await emit(jr, 'jugador:unirse', { pin: abiertas[0], nombre: 'Zoe' });
  const rev = await (await api('/api/admin/codigos/' + ana.id, 'PATCH', { revocado: true })).json();
  assert.strictEqual(rev.estado, 'revocado');
  await pausa(150);
  assert.deepStrictEqual(cerradas.sort(), ['jugador', 'narrador'], 'revocar cierra las partidas abiertas');
  for (const p of abiertas) assert.ok(!partidas.has(p));
  assert.strictEqual((await acceder(ana.codigo)).status, 401);
  await mal(m, 'narrador:crear', { token: sesionAna }, 'sesion_caducada');
  await api('/api/admin/codigos/' + ana.id, 'PATCH', { revocado: false });
  assert.strictEqual((await acceder(ana.codigo)).status, 200);
  await api('/api/admin/codigos/' + ana.id, 'PATCH', { caduca: '2000-01-01' });
  assert.strictEqual((await acceder(ana.codigo)).status, 401, 'código caducado');
  await api('/api/admin/codigos/' + ana.id, 'PATCH', { caduca: null });
  const borrado = await (await api('/api/admin/codigos/' + ana.id, 'DELETE')).json();
  assert.strictEqual(borrado.borrados, 1);
  assert.strictEqual((await acceder(ana.codigo)).status, 401);
  ok('revocar, caducar, reactivar y borrar códigos');

  // --- Límites de intentos por IP ---
  let erroneos = 0, estado = 0;
  for (let i = 0; i < 6 && estado !== 429; i++) { estado = (await acceder('MALMALMAL' + i)).status; if (estado === 401) erroneos += 1; }
  assert.strictEqual(estado, 429, 'a partir del 5.º código erróneo: 429');
  assert.ok(erroneos <= 5);
  assert.strictEqual((await acceder('XXXXX')).status, 429);
  for (let i = 0; i < 5; i++) assert.strictEqual((await api('/api/admin/estado', 'GET', null, 'Basic ' + Buffer.from('a:mala').toString('base64'))).status, 401);
  assert.strictEqual((await api('/api/admin/estado')).status, 429, 'tras 5 contraseñas erróneas, ni la buena pasa');
  ok('límites de intentos por IP (códigos y contraseña de administrador)');

  console.log('\nSimulación: ' + n + ' bloques correctos');
  abiertos.forEach((s) => s.close());
  server.close(); process.exit(0);
})().catch((e) => { console.error('FALLO:', e); process.exit(1); });
