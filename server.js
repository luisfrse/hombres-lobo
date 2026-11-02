'use strict';

// Hombres lobo / Homes llop
// - Un narrador (persona real) crea la partida y la lleva desde su panel; los jugadores entran con un PIN desde el móvil.
// - Para crear partidas el narrador necesita un código de invitación (lo crea y revoca el administrador en /admin).
// - Las partidas viven en memoria y se olvidan al cerrarlas o tras 6 h sin actividad. La única base de datos
//   (SQLite) contiene los códigos de invitación y su contador de uso.
// - El servidor reparte los roles y gestiona la noche y el día. El debate y la votación se hacen en voz alta.
// - Cada jugador solo recibe su propio rol (y lo que ese rol puede saber). El narrador lo ve todo.

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const Database = require('better-sqlite3');

// ---------------------------------------------------------------------------
// Configuración y límites
// ---------------------------------------------------------------------------
function entero(nombre, defecto) {
  const n = parseInt(process.env[nombre], 10);
  return Number.isFinite(n) && n > 0 ? n : defecto;
}
const PORT = process.env.PORT || 3000;
const DIR_DATOS = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const CONTACT_URL = process.env.CONTACT_URL || 'https://luisfs.com';
const HORAS = 60 * 60 * 1000;
const LIMITES = {
  partidas: entero('MAX_PARTIDAS', 30),
  partidasPorCodigo: entero('MAX_PARTIDAS_POR_CODIGO', 3),
  jugadores: entero('MAX_JUGADORES', 30),
  minJugadores: 4,
  nombre: 20,
  inactividadMs: entero('INACTIVIDAD_HORAS', 6) * 60 * 60 * 1000,
};
const ESPECIALES = ['vidente', 'bruja', 'cazador', 'cupido', 'nina', 'salvador'];
const ROLES = ['aldeano', 'lobo', ...ESPECIALES];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function ipDeCabecera(xff, respaldo) {
  const partes = String(xff || '').split(',').map((x) => x.trim()).filter(Boolean);
  return partes.length ? partes[partes.length - 1] : respaldo || 'desconocida';
}

function limitador(maximo, ventanaMs) {
  const mapa = new Map();
  return {
    bloqueado(ip) {
      const e = mapa.get(ip);
      if (!e) return false;
      if (Date.now() - e.desde > ventanaMs) { mapa.delete(ip); return false; }
      return e.n >= maximo;
    },
    fallo(ip) {
      if (mapa.size > 20000) mapa.clear();
      const e = mapa.get(ip);
      if (!e || Date.now() - e.desde > ventanaMs) mapa.set(ip, { n: 1, desde: Date.now() });
      else e.n += 1;
    },
    exito(ip) { mapa.delete(ip); },
    purgar() {
      const ahora = Date.now();
      for (const [ip, e] of mapa) if (ahora - e.desde > ventanaMs) mapa.delete(ip);
    },
  };
}
const limUnirse = limitador(40, 10 * 60 * 1000); // 40 PIN/sesiones erróneos cada 10 min por IP
const limAcceso = limitador(5, 15 * 60 * 1000); // 5 códigos de invitación erróneos cada 15 min por IP
const limAdmin = limitador(5, 15 * 60 * 1000); // 5 contraseñas de /admin erróneas cada 15 min por IP

function limpiarNombre(texto) {
  return Array.from(
    String(texto == null ? '' : texto)
      .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  ).slice(0, LIMITES.nombre).join('').trim();
}

function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function err(error, vars) { return { ok: false, error, vars }; }

// ---------------------------------------------------------------------------
// Códigos de invitación (única persistencia, en SQLite)
// ---------------------------------------------------------------------------
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(9).toString('base64url');
  console.warn('[Lobo] ADMIN_PASSWORD no está definida. Contraseña temporal para esta ejecución: ' + ADMIN_PASSWORD);
  console.warn('[Lobo] Define la variable de entorno ADMIN_PASSWORD para fijarla.');
}

fs.mkdirSync(DIR_DATOS, { recursive: true });
const RUTA_DB = path.join(DIR_DATOS, 'lobo-codigos.db');
const db = new Database(RUTA_DB);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS codigos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etiqueta TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    creado TEXT NOT NULL,
    caduca TEXT,
    revocado INTEGER NOT NULL DEFAULT 0,
    ultimo_uso TEXT,
    partidas INTEGER NOT NULL DEFAULT 0
  );
`);

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
function generarCodigo() {
  let c = '';
  for (let i = 0; i < 10; i++) c += ALFABETO[crypto.randomInt(ALFABETO.length)];
  return c;
}
function normalizarCodigo(texto) {
  const t = String(texto == null ? '' : texto).toUpperCase().slice(0, 500);
  // Si se pega el mensaje de invitación entero, se toma el código (formato XXXXX-XXXXX) de dentro
  const m = t.match(/\b[A-Z2-9]{5}-[A-Z2-9]{5}\b/);
  return (m ? m[0] : t).replace(/[^A-Z0-9]/g, '').slice(0, 32);
}
function formatearCodigo(c) { return c.length === 10 ? c.slice(0, 5) + '-' + c.slice(5) : c; }
function hoyISO() { return new Date().toISOString().slice(0, 10); }
function estadoCodigo(fila) {
  if (fila.revocado) return 'revocado';
  if (fila.caduca && fila.caduca < hoyISO()) return 'caducado';
  return 'activo';
}
function limpiarTexto(s, max) {
  const t = typeof s === 'string' || typeof s === 'number' ? String(s) : '';
  return t.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function iguales(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Sesiones de narrador (en memoria): se obtienen con un código de invitación válido
const sesiones = new Map(); // token -> { codigoId, etiqueta, exp }
function crearSesion(fila) {
  const token = crypto.randomBytes(24).toString('hex');
  sesiones.set(token, { codigoId: fila.id, etiqueta: fila.etiqueta, exp: Date.now() + 12 * HORAS });
  return token;
}
function sesionPorToken(token) {
  const s = sesiones.get(String(token || ''));
  if (!s) return null;
  if (s.exp < Date.now()) { sesiones.delete(token); return null; }
  const fila = db.prepare('SELECT * FROM codigos WHERE id = ?').get(s.codigoId);
  if (!fila || estadoCodigo(fila) !== 'activo') { sesiones.delete(token); return null; }
  return { codigoId: s.codigoId, etiqueta: s.etiqueta };
}
function invalidarSesionesDe(codigoId) {
  for (const [t, s] of sesiones) if (s.codigoId === codigoId) sesiones.delete(t);
}

// ---------------------------------------------------------------------------
// Partidas
// ---------------------------------------------------------------------------
const partidas = new Map(); // pin -> partida

function configInicial() {
  const roles = {};
  for (const r of ESPECIALES) roles[r] = r === 'vidente';
  return { lobos: 1, roles, revelar: true };
}

function nuevoPin() {
  for (let i = 0; i < 50; i++) {
    const pin = String(crypto.randomInt(100000, 1000000));
    if (!partidas.has(pin)) return pin;
  }
  return null;
}

function nuevaPartida(codigoId) {
  const pin = nuevoPin();
  if (!pin) return null;
  const p = {
    pin,
    codigoId,
    creada: Date.now(),
    actividad: Date.now(),
    tokenNarrador: crypto.randomBytes(24).toString('hex'),
    narradorSocket: null,
    config: configInicial(),
    jugadores: new Map(), // id público -> jugador
    contador: 0,
  };
  reiniciarRonda(p);
  partidas.set(pin, p);
  return p;
}

function reiniciarRonda(p) {
  p.fase = 'lobby'; // lobby | noche | dia | final
  p.noche = 0;
  p.pasos = [];
  p.paso = 0;
  p.acciones = {};
  p.memoria = { cura: false, veneno: false, ultimoSalvado: null };
  p.pendientes = [];
  p.anuncio = [];
  p.votoHecho = false;
  p.ganador = null;
  for (const j of p.jugadores.values()) {
    j.rol = null; j.vivo = true; j.amor = null; j.alguacil = false;
  }
}

function vivos(p) { return Array.from(p.jugadores.values()).filter((j) => j.vivo); }
function conRol(p, rol) { return Array.from(p.jugadores.values()).filter((j) => j.rol === rol); }

// --- Reparto ---
function validarReparto(p) {
  const n = p.jugadores.size;
  if (n < LIMITES.minJugadores) return err('pocos_jugadores', { n: LIMITES.minJugadores });
  const lobos = p.config.lobos;
  if (!(lobos >= 1)) return err('sin_lobos');
  const especiales = ESPECIALES.filter((r) => p.config.roles[r]);
  const total = lobos + especiales.length;
  if (total > n) return err('demasiados_roles', { r: total, n });
  if (lobos >= n - lobos) return err('demasiados_lobos');
  return { ok: true, especiales };
}

function repartir(p, especiales) {
  const jugadores = barajar(Array.from(p.jugadores.values()));
  const mazo = [];
  for (let i = 0; i < p.config.lobos; i++) mazo.push('lobo');
  mazo.push(...especiales);
  while (mazo.length < jugadores.length) mazo.push('aldeano');
  const mezclado = barajar(mazo);
  jugadores.forEach((j, i) => { j.rol = mezclado[i]; });
}

// --- Noche ---
function pasosDeNoche(p) {
  const pasos = [];
  const hay = (r) => conRol(p, r).length > 0;
  if (p.noche === 1 && hay('cupido')) pasos.push('cupido');
  if (hay('salvador')) pasos.push('salvador');
  if (hay('vidente')) pasos.push('vidente');
  pasos.push('lobo');
  if (hay('bruja')) pasos.push('bruja');
  return pasos;
}

function empezarNoche(p) {
  p.fase = 'noche';
  p.noche += 1;
  p.paso = 0;
  p.acciones = {};
  p.anuncio = [];
  p.votoHecho = false;
  p.pasos = pasosDeNoche(p);
}

function titularesVivos(p, paso) {
  const rol = paso === 'lobo' ? 'lobo' : paso;
  return conRol(p, rol).some((j) => j.vivo);
}

// Representación de p.acciones: cupido [a,b] · salvador/lobo/vidente [] u [id] · bruja { cura, veneno }
function victimaDeLobos(p) {
  const id = p.acciones.lobo && p.acciones.lobo[0];
  const j = id ? p.jugadores.get(id) : null;
  return j && j.vivo ? j : null;
}
function protegidoId(p) { return (p.acciones.salvador && p.acciones.salvador[0]) || null; }

// --- Muertes y fin ---
function matar(p, id, causa) {
  const j = p.jugadores.get(id);
  if (!j || !j.vivo) return;
  j.vivo = false;
  p.anuncio.push({ j: j.id, causa });
  if (j.rol === 'cazador') p.pendientes.push({ tipo: 'cazador', jugador: j.id });
  if (j.alguacil) { j.alguacil = false; p.pendientes.push({ tipo: 'alguacil', jugador: j.id }); }
  if (j.amor) {
    const otro = p.jugadores.get(j.amor);
    if (otro && otro.vivo) matar(p, otro.id, 'amor');
  }
}

function comprobarGanador(p) {
  const v = vivos(p);
  const lobos = v.filter((j) => j.rol === 'lobo');
  const resto = v.length - lobos.length;
  if (v.length === 2 && v[0].amor === v[1].id && v[1].amor === v[0].id && lobos.length === 1) return 'amantes';
  if (lobos.length === 0) return 'pueblo';
  if (lobos.length >= resto) return 'lobos';
  return null;
}

// Tras una muerte: si no quedan decisiones pendientes, comprueba si acaba la partida
function evaluar(p) {
  if (p.pendientes.length && p.pendientes.every((x) => x.tipo === 'alguacil')) {
    // El sucesor del alguacil no cambia el resultado: si ya hay ganador no hace falta resolverlo
    const g = comprobarGanador(p);
    if (g) p.pendientes = [];
  }
  if (p.pendientes.length) return;
  const g = comprobarGanador(p);
  if (g) { p.ganador = g; p.fase = 'final'; }
}

function amanecer(p) {
  const victima = victimaDeLobos(p);
  const protegido = protegidoId(p);
  const bruja = p.acciones.bruja || {};
  const brujaViva = conRol(p, 'bruja').some((j) => j.vivo);
  const curada = brujaViva && bruja.cura && victima && victima.id !== protegido;
  if (victima && victima.id !== protegido && !curada) matar(p, victima.id, 'lobos');
  if (brujaViva && bruja.cura) p.memoria.cura = true;
  if (brujaViva && bruja.veneno) {
    matar(p, bruja.veneno, 'veneno');
    p.memoria.veneno = true;
  }
  p.memoria.ultimoSalvado = protegido;
  p.fase = 'dia';
  p.paso = 0;
  evaluar(p);
}

// ---------------------------------------------------------------------------
// Estado que se envía a cada cliente
// ---------------------------------------------------------------------------
function estadoNarrador(p) {
  const lista = Array.from(p.jugadores.values()).map((j) => ({
    id: j.id, nombre: j.nombre, rol: j.rol, vivo: j.vivo, conectado: j.conectado, alguacil: j.alguacil, amor: j.amor,
  }));
  let actual = null;
  if (p.fase === 'noche' && p.paso < p.pasos.length) {
    const id = p.pasos[p.paso];
    const accion = p.acciones[id];
    const victima = victimaDeLobos(p);
    actual = {
      id,
      vivo: titularesVivos(p, id),
      hecho: accion !== undefined,
      acc: accion === undefined ? null : accion,
      vision: null,
      victima: null,
      protegida: false,
      cura: !p.memoria.cura,
      veneno: !p.memoria.veneno,
      prohibido: p.memoria.ultimoSalvado,
    };
    if (id === 'vidente' && accion && accion.length) {
      const o = p.jugadores.get(accion[0]);
      if (o) actual.vision = { j: o.id, rol: o.rol };
    }
    if (id === 'bruja') {
      actual.victima = victima ? victima.id : null;
      actual.protegida = !!(victima && protegidoId(p) === victima.id);
    }
  }
  return {
    pin: p.pin,
    fase: p.fase,
    noche: p.noche,
    config: p.config,
    min: LIMITES.minJugadores,
    max: LIMITES.jugadores,
    jugadores: lista,
    pasos: p.pasos,
    paso: p.paso,
    actual,
    pendientes: p.pendientes,
    anuncio: p.anuncio,
    votoHecho: p.votoHecho,
    ganador: p.ganador,
  };
}

function estadoJugador(p, j) {
  const base = {
    pin: p.pin,
    fase: p.fase,
    noche: p.noche,
    ganador: p.ganador,
    vivos: vivos(p).length,
    yo: { id: j.id, nombre: j.nombre, vivo: j.vivo },
    jugadores: Array.from(p.jugadores.values()).map((o) => {
      const rolVisible = p.fase === 'final' || (!o.vivo && p.config.revelar && p.fase !== 'lobby');
      return { id: o.id, nombre: o.nombre, vivo: o.vivo, alguacil: o.alguacil, rol: rolVisible ? o.rol : null };
    }),
  };
  if (p.fase !== 'lobby' && j.rol) {
    base.yo.rol = j.rol;
    base.yo.alguacil = j.alguacil;
    if (j.rol === 'lobo') {
      base.yo.companeros = Array.from(p.jugadores.values()).filter((o) => o.rol === 'lobo' && o.id !== j.id).map((o) => o.nombre);
    }
    if (j.amor) {
      const o = p.jugadores.get(j.amor);
      base.yo.amor = o ? o.nombre : null;
    }
  }
  return base;
}

function emitir(io, p) {
  p.actividad = Date.now();
  if (p.narradorSocket) io.to(p.narradorSocket).emit('narrador:estado', estadoNarrador(p));
  for (const j of p.jugadores.values()) {
    if (j.socket) io.to(j.socket).emit('jugador:estado', estadoJugador(p, j));
  }
}

// ---------------------------------------------------------------------------
// Express y Socket.IO
// ---------------------------------------------------------------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e4,
  allowRequest: (req, cb) => {
    // Solo se aceptan sockets abiertos desde el propio sitio
    const origin = req.headers.origin;
    if (!origin) return cb(null, true);
    let host;
    try { host = new URL(origin).host.toLowerCase(); } catch (e) { return cb(null, false); }
    const reenviado = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim().toLowerCase();
    const propio = String(req.headers.host || '').toLowerCase();
    cb(null, host === reenviado || host === propio);
  },
});

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
    "connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
  );
  next();
});


// ---------------------------------------------------------------------------
// Acceso de narradores y administración de códigos
// ---------------------------------------------------------------------------
function requiereClaveAdmin(req, res, next) {
  const ip = ipDeCabecera(req.headers['x-forwarded-for'], req.socket.remoteAddress);
  if (limAdmin.bloqueado(ip)) {
    if (req.path.startsWith('/api/')) return res.status(429).json({ error: 'demasiados_intentos' });
    return res.status(429).type('text/plain; charset=utf-8').send('Demasiados intentos fallidos. Espera unos minutos. / Massa intents fallits. Espera uns minuts.');
  }
  const cabecera = req.headers.authorization || '';
  if (cabecera.startsWith('Basic ')) {
    const dec = Buffer.from(cabecera.slice(6), 'base64').toString('utf8');
    const i = dec.indexOf(':');
    if (iguales(i >= 0 ? dec.slice(i + 1) : dec, ADMIN_PASSWORD)) { limAdmin.exito(ip); return next(); }
    limAdmin.fallo(ip); // solo cuenta si llegó una contraseña errónea; la primera visita sin credenciales no
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Hombres lobo (administrador)", charset="UTF-8"');
  res.status(401).send('Se requiere contraseña / Es requereix contrasenya');
}

app.get('/api/config', (req, res) => res.json({ contactUrl: CONTACT_URL }));

app.post('/api/acceso', express.json({ limit: '2kb' }), (req, res) => {
  const ip = ipDeCabecera(req.headers['x-forwarded-for'], req.socket.remoteAddress);
  if (limAcceso.bloqueado(ip)) return res.status(429).json({ error: 'demasiados_intentos' });
  const codigo = normalizarCodigo(req.body && req.body.codigo);
  const fila = codigo ? db.prepare('SELECT * FROM codigos WHERE codigo = ?').get(codigo) : null;
  if (!fila || estadoCodigo(fila) !== 'activo') {
    limAcceso.fallo(ip);
    return res.status(401).json({ error: 'codigo_invalido' });
  }
  limAcceso.exito(ip);
  res.json({ token: crearSesion(fila), etiqueta: fila.etiqueta, contactUrl: CONTACT_URL });
});

function cerrarPartidasDe(codigoId) {
  invalidarSesionesDe(codigoId);
  for (const p of Array.from(partidas.values())) if (p.codigoId === codigoId) cerrarPartida(p);
}

function enVivoDe(codigoId) {
  let activas = 0, jugadores = 0;
  for (const p of partidas.values()) {
    if (p.codigoId === codigoId && p.fase !== 'final') { activas += 1; jugadores += p.jugadores.size; }
  }
  return { activas, jugadores };
}

function filaPublica(f) {
  return {
    id: f.id, etiqueta: f.etiqueta, codigo: formatearCodigo(f.codigo), creado: f.creado, caduca: f.caduca,
    ultimoUso: f.ultimo_uso, partidas: f.partidas, estado: estadoCodigo(f), enVivo: enVivoDe(f.id),
  };
}

app.get('/api/admin/codigos', requiereClaveAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM codigos ORDER BY id DESC').all().map(filaPublica));
});

app.post('/api/admin/codigos', requiereClaveAdmin, express.json({ limit: '2kb' }), (req, res) => {
  const etiqueta = limpiarTexto(req.body && req.body.etiqueta, 60);
  if (!etiqueta) return res.status(400).json({ error: 'falta_etiqueta' });
  let caduca = req.body && req.body.caduca ? String(req.body.caduca) : null;
  if (caduca && !/^\d{4}-\d{2}-\d{2}$/.test(caduca)) return res.status(400).json({ error: 'fecha_invalida' });
  if (!caduca) caduca = null;
  for (let i = 0; i < 10; i++) {
    try {
      const r = db.prepare('INSERT INTO codigos (etiqueta, codigo, creado, caduca) VALUES (?,?,?,?)')
        .run(etiqueta, generarCodigo(), new Date().toISOString(), caduca);
      return res.json(filaPublica(db.prepare('SELECT * FROM codigos WHERE id = ?').get(r.lastInsertRowid)));
    } catch (e) {
      if (!/UNIQUE/.test(String(e.message))) throw e;
    }
  }
  res.status(500).json({ error: 'no_codigo_unico' });
});

app.patch('/api/admin/codigos/:id', requiereClaveAdmin, express.json({ limit: '2kb' }), (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const fila = db.prepare('SELECT * FROM codigos WHERE id = ?').get(id);
  if (!fila) return res.status(404).json({ error: 'no_existe_codigo' });
  if (req.body && typeof req.body.revocado === 'boolean') {
    db.prepare('UPDATE codigos SET revocado = ? WHERE id = ?').run(req.body.revocado ? 1 : 0, id);
    if (req.body.revocado) cerrarPartidasDe(id);
  }
  if (req.body && 'caduca' in req.body) {
    const c = req.body.caduca ? String(req.body.caduca) : null;
    if (c && !/^\d{4}-\d{2}-\d{2}$/.test(c)) return res.status(400).json({ error: 'fecha_invalida' });
    db.prepare('UPDATE codigos SET caduca = ? WHERE id = ?').run(c, id);
  }
  res.json(filaPublica(db.prepare('SELECT * FROM codigos WHERE id = ?').get(id)));
});

app.delete('/api/admin/codigos/:id', requiereClaveAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  cerrarPartidasDe(id);
  const r = db.prepare('DELETE FROM codigos WHERE id = ?').run(id);
  res.json({ borrados: r.changes });
});

app.get('/api/admin/estado', requiereClaveAdmin, (req, res) => {
  let jugadores = 0, activas = 0;
  for (const p of partidas.values()) if (p.fase !== 'final') { activas += 1; jugadores += p.jugadores.size; }
  res.json({ partidasActivas: activas, jugadoresEnPartidas: jugadores, limites: LIMITES });
});

app.get('/admin', requiereClaveAdmin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

const PUBLICO = path.join(__dirname, 'public');
app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));
app.get('/narrador', (req, res) => res.sendFile(path.join(PUBLICO, 'narrador.html')));
app.use(express.static(PUBLICO, { index: 'index.html', extensions: ['html'] }));
app.use((e, req, res, next) => {
  if (res.headersSent) return next(e);
  res.status(400).json({ error: 'peticion_invalida' });
});

// Código QR hacia la página del jugador con el PIN ya escrito (solo para partidas que existen)
app.get('/api/qr', async (req, res) => {
  const ip = ipDeCabecera(req.headers['x-forwarded-for'], req.socket.remoteAddress);
  if (limUnirse.bloqueado(ip)) return res.status(429).send('Demasiados intentos');
  const pin = String(req.query.pin || '');
  if (!/^\d{6}$/.test(pin)) return res.status(400).send('PIN no válido');
  if (!partidas.has(pin)) { limUnirse.fallo(ip); return res.status(404).send('Partida no encontrada'); }
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const url = `${proto}://${req.get('host')}/?pin=${pin}`;
  try {
    const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b0d1a', light: '#ffffff' } });
    res.type('image/svg+xml').set('Cache-Control', 'no-store').send(svg);
  } catch (e) {
    res.status(500).send('No se pudo generar el QR');
  }
});

// Limpieza de partidas abandonadas
setInterval(() => {
  const ahora = Date.now();
  for (const [pin, p] of partidas) {
    if (ahora - p.actividad > LIMITES.inactividadMs) cerrarPartida(p);
  }
  limUnirse.purgar();
  limAcceso.purgar();
  limAdmin.purgar();
}, 10 * 60 * 1000).unref();

function cerrarPartida(p) {
  for (const j of p.jugadores.values()) if (j.socket) io.to(j.socket).emit('jugador:cerrada');
  if (p.narradorSocket) io.to(p.narradorSocket).emit('narrador:cerrada');
  partidas.delete(p.pin);
}

io.on('connection', (socket) => {
  const ip = ipDeCabecera(socket.handshake.headers['x-forwarded-for'], socket.handshake.address);
  let rol = null; // 'narrador' | 'jugador'
  let partida = null;
  let jugador = null;

  // Ritmo máximo de eventos por conexión
  let cubo = 60;
  const rellenar = setInterval(() => { cubo = Math.min(60, cubo + 20); }, 1000);
  rellenar.unref();
  socket.use((paquete, next) => {
    if (cubo > 0) { cubo -= 1; return next(); }
    const cb = paquete[paquete.length - 1];
    if (typeof cb === 'function') cb({ ok: false, error: 'demasiados_intentos' });
  });

  const responder = (cb, datos) => { if (typeof cb === 'function') cb(datos); };
  const esNarrador = () => rol === 'narrador' && partida && partidas.get(partida.pin) === partida && partida.narradorSocket === socket.id;

  // Ejecuta un evento del narrador con las comprobaciones comunes
  function accionNarrador(cb, fn) {
    try {
      if (!esNarrador()) return responder(cb, err('no_narrador'));
      const r = fn(partida);
      if (r && r.ok === false) return responder(cb, r);
      emitir(io, partida);
      responder(cb, { ok: true });
    } catch (e) {
      console.error('[Lobo] error en acción de narrador', e);
      responder(cb, err('generico'));
    }
  }
  const idValido = (p, id, soloVivo) => {
    const j = typeof id === 'string' ? p.jugadores.get(id) : null;
    return j && (!soloVivo || j.vivo) ? j : null;
  };

  // ----- Narrador -----
  socket.on('narrador:crear', (datos, cb) => {
    try {
      const sesion = sesionPorToken(datos && datos.token);
      if (!sesion) return responder(cb, { ok: false, sesion: false, error: 'sesion_caducada' });
      let propias = 0;
      for (const x of partidas.values()) if (x.codigoId === sesion.codigoId && x.fase !== 'final') propias += 1;
      if (propias >= LIMITES.partidasPorCodigo) return responder(cb, err('max_partidas_codigo', { n: propias }));
      if (partidas.size >= LIMITES.partidas) return responder(cb, err('servidor_lleno'));
      const p = nuevaPartida(sesion.codigoId);
      if (!p) return responder(cb, err('servidor_lleno'));
      db.prepare('UPDATE codigos SET partidas = partidas + 1, ultimo_uso = ? WHERE id = ?').run(new Date().toISOString(), sesion.codigoId);
      partida = p; rol = 'narrador';
      p.narradorSocket = socket.id;
      responder(cb, { ok: true, pin: p.pin, token: p.tokenNarrador });
      emitir(io, p);
    } catch (e) {
      console.error('[Lobo] error al crear', e);
      responder(cb, err('generico'));
    }
  });

  socket.on('narrador:reanudar', (datos, cb) => {
    try {
      if (limUnirse.bloqueado(ip)) return responder(cb, err('demasiados_intentos'));
      const p = partidas.get(String((datos && datos.pin) || ''));
      const token = String((datos && datos.token) || '');
      const a = Buffer.from(token);
      const b = Buffer.from(p ? p.tokenNarrador : '');
      if (!p || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        limUnirse.fallo(ip);
        return responder(cb, err('no_narrador'));
      }
      partida = p; rol = 'narrador';
      p.narradorSocket = socket.id;
      responder(cb, { ok: true, pin: p.pin });
      emitir(io, p);
    } catch (e) {
      responder(cb, err('generico'));
    }
  });

  socket.on('narrador:config', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'lobby') return err('accion_invalida');
    const d = datos && typeof datos === 'object' ? datos : {};
    const lobos = parseInt(d.lobos, 10);
    if (Number.isFinite(lobos)) p.config.lobos = Math.max(1, Math.min(10, lobos));
    if (d.roles && typeof d.roles === 'object') {
      for (const r of ESPECIALES) if (typeof d.roles[r] === 'boolean') p.config.roles[r] = d.roles[r];
    }
    if (typeof d.revelar === 'boolean') p.config.revelar = d.revelar;
  }));

  socket.on('narrador:expulsar', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'lobby') return err('accion_invalida');
    const j = idValido(p, datos && datos.id, false);
    if (!j) return err('objetivo_invalido');
    p.jugadores.delete(j.id);
    if (j.socket) io.to(j.socket).emit('jugador:expulsado');
  }));

  socket.on('narrador:iniciar', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'lobby') return err('accion_invalida');
    const v = validarReparto(p);
    if (v.ok === false) return v;
    repartir(p, v.especiales);
    empezarNoche(p);
  }));

  socket.on('narrador:accion', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'noche' || p.paso >= p.pasos.length) return err('accion_invalida');
    const id = p.pasos[p.paso];
    const d = datos && typeof datos === 'object' ? datos : {};
    const objetivos = Array.isArray(d.objetivos) ? d.objetivos.filter((x) => typeof x === 'string').slice(0, 2) : [];
    const vivo = titularesVivos(p, id);

    if (!vivo && id !== 'lobo') { p.acciones[id] = id === 'bruja' ? {} : []; return; } // titular eliminado: pantomima sin efecto

    if (id === 'cupido') {
      if (objetivos.length !== 2 || objetivos[0] === objetivos[1]) return err('objetivo_invalido');
      const a = idValido(p, objetivos[0], true);
      const b = idValido(p, objetivos[1], true);
      if (!a || !b) return err('objetivo_invalido');
      for (const j of p.jugadores.values()) j.amor = null;
      a.amor = b.id; b.amor = a.id;
      p.acciones.cupido = [a.id, b.id];
    } else if (id === 'salvador' || id === 'lobo' || id === 'vidente') {
      if (objetivos.length === 0) {
        p.acciones[id] = [];
      } else {
        const o = idValido(p, objetivos[0], true);
        if (!o) return err('objetivo_invalido');
        if (id === 'salvador' && p.memoria.ultimoSalvado === o.id) return err('salvador_repite');
        p.acciones[id] = [o.id];
      }
    } else if (id === 'bruja') {
      const victima = victimaDeLobos(p);
      const prot = protegidoId(p);
      const cura = !!d.cura;
      const veneno = typeof d.veneno === 'string' && d.veneno ? d.veneno : null;
      if (cura) {
        if (p.memoria.cura) return err('pocion_usada');
        if (!victima || victima.id === prot) return err('objetivo_invalido');
      }
      if (veneno) {
        if (p.memoria.veneno) return err('pocion_usada');
        if (!idValido(p, veneno, true)) return err('objetivo_invalido');
      }
      p.acciones.bruja = { cura, veneno };
    }
  }));

  socket.on('narrador:siguiente', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'noche' || p.paso >= p.pasos.length) return err('accion_invalida');
    const id = p.pasos[p.paso];
    if (p.acciones[id] === undefined && titularesVivos(p, id)) return err('accion_invalida');
    p.paso += 1;
    if (p.paso >= p.pasos.length) amanecer(p);
  }));

  socket.on('narrador:pendiente', (datos, cb) => accionNarrador(cb, (p) => {
    const primera = p.pendientes[0];
    if (!primera || (p.fase !== 'dia' && p.fase !== 'noche')) return err('accion_invalida');
    const objetivo = datos && datos.objetivo ? idValido(p, datos.objetivo, true) : null;
    if (datos && datos.objetivo && !objetivo) return err('objetivo_invalido');
    p.pendientes.shift();
    if (primera.tipo === 'cazador') {
      if (objetivo) matar(p, objetivo.id, 'cazador');
    } else if (primera.tipo === 'alguacil') {
      if (objetivo) objetivo.alguacil = true;
    }
    evaluar(p);
  }));

  socket.on('narrador:alguacil', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'dia') return err('accion_invalida');
    const j = idValido(p, datos && datos.objetivo, true);
    if (!j) return err('objetivo_invalido');
    for (const x of p.jugadores.values()) x.alguacil = false;
    j.alguacil = true;
  }));

  socket.on('narrador:votar', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'dia' || p.votoHecho) return err('accion_invalida');
    if (p.pendientes.length) return err('accion_invalida');
    const objetivo = datos && datos.objetivo ? idValido(p, datos.objetivo, true) : null;
    if (datos && datos.objetivo && !objetivo) return err('objetivo_invalido');
    p.votoHecho = true;
    if (objetivo) matar(p, objetivo.id, 'votacion');
    evaluar(p);
  }));

  socket.on('narrador:noche', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'dia' || !p.votoHecho || p.pendientes.length) return err('accion_invalida');
    empezarNoche(p);
  }));

  socket.on('narrador:nueva', (datos, cb) => accionNarrador(cb, (p) => {
    if (p.fase !== 'final') return err('accion_invalida');
    reiniciarRonda(p);
  }));

  socket.on('narrador:cerrar', (datos, cb) => {
    if (!esNarrador()) return responder(cb, err('no_narrador'));
    const p = partida;
    responder(cb, { ok: true });
    cerrarPartida(p);
  });

  // ----- Jugador -----
  socket.on('jugador:unirse', (datos, cb) => {
    try {
      if (limUnirse.bloqueado(ip)) return responder(cb, err('demasiados_intentos'));
      const d = datos && typeof datos === 'object' ? datos : {};
      const p = partidas.get(String(d.pin || ''));
      if (!p) { limUnirse.fallo(ip); return responder(cb, err('pin_invalido')); }

      // Reconexión de un jugador que ya estaba dentro
      if (typeof d.token === 'string' && d.token) {
        const existente = Array.from(p.jugadores.values()).find((j) => j.token === d.token);
        if (existente) {
          if (existente.socket && existente.socket !== socket.id) io.to(existente.socket).emit('jugador:desplazado');
          existente.socket = socket.id; existente.conectado = true;
          partida = p; jugador = existente; rol = 'jugador';
          responder(cb, { ok: true, token: existente.token, nombre: existente.nombre });
          return emitir(io, p);
        }
      }

      if (p.fase !== 'lobby') return responder(cb, err('partida_empezada'));
      const nombre = limpiarNombre(d.nombre);
      if (!nombre) return responder(cb, err('falta_nombre'));
      const minusculas = nombre.toLowerCase();
      if (Array.from(p.jugadores.values()).some((j) => j.nombre.toLowerCase() === minusculas)) return responder(cb, err('nombre_en_uso'));
      if (p.jugadores.size >= LIMITES.jugadores) return responder(cb, err('partida_llena'));

      p.contador += 1;
      const j = {
        id: 'j' + p.contador, token: crypto.randomBytes(16).toString('hex'), nombre,
        socket: socket.id, conectado: true, rol: null, vivo: true, amor: null, alguacil: false,
      };
      p.jugadores.set(j.id, j);
      partida = p; jugador = j; rol = 'jugador';
      limUnirse.exito(ip);
      responder(cb, { ok: true, token: j.token, nombre: j.nombre });
      emitir(io, p);
    } catch (e) {
      console.error('[Lobo] error al unirse', e);
      responder(cb, err('generico'));
    }
  });

  socket.on('jugador:salir', (datos, cb) => {
    if (rol !== 'jugador' || !partida || !jugador) return responder(cb, { ok: true });
    const p = partida;
    if (p.fase === 'lobby') {
      p.jugadores.delete(jugador.id);
      emitir(io, p);
    } else {
      jugador.conectado = false; jugador.socket = null;
      emitir(io, p);
    }
    partida = null; jugador = null; rol = null;
    responder(cb, { ok: true });
  });

  socket.on('disconnect', () => {
    clearInterval(rellenar);
    if (!partida) return;
    if (rol === 'jugador' && jugador && jugador.socket === socket.id) {
      jugador.conectado = false;
      jugador.socket = null;
      if (partidas.get(partida.pin) === partida) emitir(io, partida);
    } else if (rol === 'narrador' && partida.narradorSocket === socket.id) {
      partida.narradorSocket = null;
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => console.log('[Lobo] Escuchando en el puerto ' + PORT));
}

module.exports = { server, io, partidas, db, LIMITES, ESPECIALES, ROLES, comprobarGanador };
