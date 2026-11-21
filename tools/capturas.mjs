// Recorrido de Hombres lobo con un Chrome real (CDP): admin, narrador, jugador, una partida hasta el final; comprueba el flujo y hace capturas
// a 390 y 1200 px, claro y oscuro, con DATOS INVENTADOS. El servidor arranca aqui con una base temporal; no se toca ningun servicio real.
// Uso: node tools/capturas.mjs [carpeta]   (npm run capturas)     SIN_CAPTURAS=1 -> solo las comprobaciones (npm run e2e)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { openChrome, free, sleep } from './lib-chrome.mjs';

const require = createRequire(import.meta.url);
const { io } = require('socket.io-client');
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'docs', 'capturas'));
const SIN = !!process.env.SIN_CAPTURAS;
const CLAVE = 'capturas-clave-de-prueba', IP = '203.0.113.9';
const port = await free(), nodeBase = 'http://127.0.0.1:' + port, base = 'http://localhost:' + port, tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lobo-cap-'));
const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), DATA_DIR: path.join(tmp, 'data'), ADMIN_PASSWORD: CLAVE }, stdio: 'ignore' });
for (let i = 0; i < 100; i++) { try { await fetch(nodeBase + '/healthz'); break; } catch { await sleep(100); } }
const BASIC = 'Basic ' + Buffer.from('admin:' + CLAVE).toString('base64');
const post = (u, b, h = {}) => fetch(nodeBase + u, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': IP, ...h }, body: JSON.stringify(b) });
const ok = (m) => console.log('  OK ' + m);
if (!SIN) fs.mkdirSync(OUT, { recursive: true });

const B = await openChrome({ prefix: 'lobo' }); const { ev, waitFor, setVal, goto, media, send, log } = B;
const SIZES = [[390, 844], [1200, 900]], THEMES = ['claro', 'oscuro'];
let nshots = 0;
const noise = (l) => !/favicon|adguard|FETCHERR|status of 401/i.test(l);
async function shot(name) {
  if (SIN) return;
  for (const [w, hh] of SIZES) for (const th of THEMES) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: hh, deviceScaleFactor: 1, mobile: w < 600 }); await media(th); await sleep(700);
    const full = Math.min(3200, Math.max(hh, await ev('document.documentElement.scrollHeight')));
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: full, deviceScaleFactor: 1, mobile: w < 600 }); await sleep(250);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name + '-' + w + '-' + th + '.png'), Buffer.from(r.result.data, 'base64')); nshots++;
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await media('claro');
}
const clickSel = (sel) => ev(`(function(){var b=document.querySelector(${JSON.stringify(sel)});if(!b||b.disabled)return false;b.click();return true})()`);
const esc = async () => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); };
const hscroll = () => ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth');
const idioma = () => ev('localStorage.setItem("quest-lang","ca")');

try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false }); await media('claro');
  console.log('Administracion');
  const crea = async (etiqueta, caduca) => (await (await post('/api/admin/codigos', { etiqueta, caduca }, { Authorization: BASIC })).json());
  const c1 = await crea('Marta Puig (IES Exemple)'), c2 = await crea('Joan Serra (Escola Prova)', '2027-06-30'), c3 = await crea('Laia Roca (Institut Mostra)');
  await fetch(nodeBase + '/api/admin/codigos/' + c3.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: BASIC, 'X-Forwarded-For': IP }, body: JSON.stringify({ revocado: true }) });
  await goto(base + '/'); await idioma();
  await goto(base + '/admin');
  assert.ok(await waitFor('!!document.querySelector("#dc-entrada input[type=password]")')); ok('/admin sin credenciales: pantalla de entrada comun'); await shot('admin-entrada');
  await setVal('#dc-entrada input[type=password]', 'contrasena-equivocada'); await ev('document.querySelector("#dc-entrada form").requestSubmit()');
  assert.ok(await waitFor('/Quedan|Queden|Queda/.test(document.body.innerText)')); ok('contrasena incorrecta: intentos restantes'); await shot('admin-entrada-error');
  await setVal('#dc-entrada input[type=password]', CLAVE); await ev('document.querySelector("#dc-entrada form").requestSubmit()');
  assert.ok(await waitFor('!!document.querySelector("#in-etiqueta") && document.querySelectorAll("tr[data-id]").length===3')); ok('panel de codigos (3 filas)');
  await ev('window.__tr=document.querySelector("tr[data-id]")');
  await setVal('#in-etiqueta', 'Pau Vidal (Col·legi Demo)'); await clickSel('#btn-crear');
  assert.ok(await waitFor('!!document.querySelector("#codigo-nuevo-texto") && document.querySelectorAll("tr[data-id]").length===4')); ok('crear codigo');
  assert.ok(await ev('document.body.contains(window.__tr)')); ok('la tabla se actualiza sin reconstruir las filas');
  await shot('admin');
  await clickSel('tr[data-id="' + c3.id + '"] [data-accion=borrar]'); assert.ok(await waitFor('!!document.querySelector("dialog[open]")')); ok('borrar pide confirmacion con dialogo propio'); await shot('admin-dialogo'); await esc();
  assert.ok(await waitFor('!document.querySelector("dialog[open]")'));

  console.log('Narrador y jugadores');
  await goto(base + '/narrador'); await ev('localStorage.clear(); sessionStorage.clear(); localStorage.setItem("quest-lang","ca")'); await goto(base + '/narrador');
  assert.ok(await waitFor('!!document.getElementById("codigo")')); await shot('narrador-acceso');
  await setVal('#codigo', 'AAAAA-BBBBB'); await clickSel('#entrar');
  assert.ok(await waitFor('/Et queden|Et queda/.test(document.querySelector(".mensaje").innerText)')); ok('codigo erroneo: intentos restantes'); await shot('narrador-acceso-error');
  await setVal('#codigo', c1.codigo); await clickSel('#entrar');
  assert.ok(await waitFor('!!document.getElementById("crear")')); await shot('narrador-inicio');
  await clickSel('#crear'); assert.ok(await waitFor('/^\\d{6}$/.test((document.getElementById("pin")||{}).textContent||"")')); ok('partida creada con PIN y QR');
  const pin = await ev('document.getElementById("pin").textContent');
  const NOM = ['Aina', 'Biel', 'Carla', 'Dani', 'Eva', 'Ferran'], bots = [];
  for (const n of NOM) await new Promise((res) => { const s = io(nodeBase, { transports: ['websocket'] }); s.on('connect', () => s.emit('jugador:unirse', { pin, nombre: n }, () => res())); bots.push(s); });
  assert.ok(await waitFor('document.querySelectorAll(".lista-jugadores li").length===6')); await shot('narrador-lobby');
  await ev('window.__app=document.getElementById("app");window.__li=document.querySelector(".lista-jugadores li")');
  const antes = await ev('document.getElementById("rol-cupido").checked'); await clickSel('#rol-cupido');
  assert.ok(await waitFor('document.getElementById("rol-cupido").checked===' + (!antes))); assert.ok(await ev('window.__li===document.querySelector(".lista-jugadores li") && window.__app===document.getElementById("app")'), 'sin reconstruir'); ok('configurar un rol actualiza la pantalla sin reconstruir el DOM');
  if (!(await ev('document.getElementById("rol-cupido").checked'))) { /* queda como estaba */ } else await clickSel('#rol-cupido');
  // jugador humano: entrada por PIN
  await goto(base + '/'); await idioma(); await goto(base + '/');
  assert.ok(await waitFor('!!document.getElementById("pin")')); await shot('jugador-entrada');
  await setVal('#pin', '000000'); await setVal('#nombre', 'Marina'); await clickSel('form button[type=submit]');
  assert.ok(await waitFor('!!document.querySelector(".error")')); ok('PIN incorrecto: error claro'); await shot('jugador-entrada-error');
  await goto(base + '/?pin=' + pin);
  assert.strictEqual(await ev('document.activeElement && document.activeElement.id'), 'nombre'); ok('con el PIN del QR, el cursor queda en el nombre');
  await setVal('#nombre', 'Marina'); await clickSel('form button[type=submit]');
  assert.ok(await waitFor('!!document.querySelector(".lista-jugadores")')); await shot('jugador-lobby');
  // el narrador (misma pestana: su sesion vive en sessionStorage) empieza la partida
  await goto(base + '/narrador'); assert.ok(await waitFor('!!document.getElementById("empezar") && !document.getElementById("empezar").disabled'));
  await clickSel('#empezar'); assert.ok(await waitFor('!!document.querySelector("[data-paso]")')); ok('la partida empieza: noche 1');
  const lobosIds = async () => JSON.parse(await ev('JSON.stringify([...document.querySelectorAll("tr[data-id]")].filter(function(r){return /Llop/.test(r.cells[1].textContent)}).map(function(r){return r.getAttribute("data-id")}))'));
  const jugar = async (fotos) => {
    // recorre la noche: elige siempre a alguien que no es lobo y avanza
    for (let guard = 0; guard < 12; guard++) {
      if (!(await ev('!!document.querySelector("[data-paso]")'))) return;
      const wolves = await lobosIds(), paso = await ev('document.querySelector("[data-paso]").getAttribute("data-paso")');
      if (fotos && !fotos.done) { fotos.done = true; await shot('narrador-noche'); }
      const ids = JSON.parse(await ev('JSON.stringify([...document.querySelectorAll(".rejilla .opcion:not(.nadie):not([disabled])")].map(function(b){return b.getAttribute("data-id")}))'));
      const buenos = ids.filter((i) => !wolves.includes(i)), cuantos = paso === 'cupido' ? 2 : paso === 'bruja' ? 0 : 1;
      for (const i of buenos.slice(0, cuantos)) await ev(`document.querySelector('.rejilla .opcion[data-id="${i}"]').click()`);
      await sleep(200);
      if (await ev('!!document.getElementById("confirmar") && !document.getElementById("confirmar").disabled')) { await clickSel('#confirmar'); await sleep(350); }
      await waitFor('!document.getElementById("siguiente").disabled', 4000); await clickSel('#siguiente'); await sleep(350);
    }
  };
  const fotos = {};
  await jugar(fotos);
  // vista del jugador de noche / carta de rol
  assert.ok(await waitFor('!!document.querySelector("#noche, #seccion-voto, .pendiente")', 8000)); ok('amanece: el narrador ve el dia');
  await shot('narrador-dia');
  await ev('window.__app=document.getElementById("app")');
  await goto(base + '/'); assert.ok(await waitFor('!!document.querySelector(".carta-boton")')); await shot('jugador-carta-oculta');
  await clickSel('.carta-boton'); assert.ok(await waitFor('!!document.querySelector(".carta h2[data-rol]")')); ok('el jugador toca la carta y ve su rol'); await shot('jugador-carta');
  await goto(base + '/narrador'); await waitFor('!!document.querySelector("#seccion-voto, #noche, .pendiente")');
  // dias y noches hasta que el pueblo gane: se vota a un lobo cada dia
  let final = false;
  for (let ronda = 0; ronda < 8 && !final; ronda++) {
    for (let g = 0; g < 4; g++) { // cazador / alguacil pendientes
      if (await ev('!!document.querySelector(".pendiente")')) { await clickSel('#resolver'); await sleep(400); } else break;
    }
    if (await ev('!!document.getElementById("seccion-voto")')) {
      const w = await lobosIds(), vivos = JSON.parse(await ev('JSON.stringify([...document.querySelectorAll("tr[data-id]:not(.muerto)")].map(function(r){return r.getAttribute("data-id")}))'));
      const objetivo = w.find((i) => vivos.includes(i)) || vivos[0];
      await ev(`document.querySelector('#seccion-voto .rejilla .opcion[data-id="${objetivo}"]').click()`); await sleep(200);
      if (ronda === 0) await shot('narrador-votacion');
      await clickSel('#votar'); await sleep(500);
    }
    if (await ev('!!document.querySelector(".banda.final")')) { final = true; break; }
    for (let g = 0; g < 4; g++) { if (await ev('!!document.querySelector(".pendiente")')) { await clickSel('#resolver'); await sleep(400); } else break; }
    if (await ev('!!document.querySelector(".banda.final")')) { final = true; break; }
    if (await ev('!!document.getElementById("noche")')) { await clickSel('#noche'); await sleep(500); await jugar(null); }
  }
  assert.ok(await waitFor('!!document.querySelector(".banda.final")', 8000)); ok('la partida termina con ganador'); await shot('narrador-final');
  await goto(base + '/'); assert.ok(await waitFor('!!document.querySelector(".banda.final")')); await shot('jugador-final');
  await goto(base + '/narrador'); await waitFor('!!document.getElementById("otra")');
  await clickSel('.barra-partida #cerrar'); assert.ok(await waitFor('!!document.querySelector("dialog[open]")')); ok('cerrar la partida: dialogo propio'); await shot('narrador-dialogo'); await esc();
  await goto(base + '/reglas'); await idioma(); await goto(base + '/reglas'); assert.ok(await waitFor('document.querySelectorAll(".rol-regla").length===9')); assert.ok(await hscroll()); await shot('reglas');
  bots.forEach((s) => s.close());

  const malos = log.filter(noise); assert.deepStrictEqual(malos, [], 'consola limpia (sin violaciones de CSP ni dialogos nativos): ' + malos.join(' | '));
  ok('consola sin errores ni violaciones de CSP, sin alert/confirm nativos');
  console.log(SIN ? '\nE2E OK' : '\nCapturas: ' + nshots + ' en ' + OUT);
} catch (e) { console.error('FALLO', e); console.error('LOG', log.filter(noise)); try { console.error(await ev('document.body.innerText.slice(0,600)')); } catch { /* sin pagina */ } process.exitCode = 1; }
finally { await B.close(); srv.kill(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* Windows */ } process.exit(process.exitCode || 0); }
