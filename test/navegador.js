'use strict';
// Partida real en Chromium: narrador + 4 móviles. Comprueba la interfaz, los botones ⓘ, la tarjeta de rol,
// el cambio de idioma sin perder el estado, la reconexión y que no haya errores de consola (CSP incluida).
const assert = require('assert');
const os = require('os');
const pathMod = require('path');
process.env.DATA_DIR = require('fs').mkdtempSync(pathMod.join(os.tmpdir(), 'lobo-nav-'));
process.env.ADMIN_PASSWORD = 'clave-de-prueba';
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/npm-tools/node_modules/playwright'); }
const { server } = require('../server');
const fs = require('fs');
const vm = require('vm');
const ctx = { navigator: {} }; ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname, '../public/i18n.js'), 'utf8'), ctx);
const D = ctx.I18N.dict;

const NOMBRES = ['Ana', 'Beto', 'Carla', 'Dani'];
let n = 0;
const ok = (m) => { n += 1; console.log('  ✓ ' + m); };
const errores = [];

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = 'http://localhost:' + server.address().port;
  const browser = await playwright.chromium.launch();

  async function pagina(movil) {
    const c = await browser.newContext(movil ? { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true } : { viewport: { width: 1100, height: 900 } });
    const p = await c.newPage();
    p.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
    return p;
  }
  const sinDesborde = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

  // --- Administrador: crea un código desde el panel ---
  const ctxAdmin = await browser.newContext({ httpCredentials: { username: 'admin', password: 'clave-de-prueba' }, viewport: { width: 1200, height: 800 } });
  const adm = await ctxAdmin.newPage();
  adm.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
  adm.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
  await adm.goto(base + '/admin?lang=es');
  await adm.waitForSelector('.vacio');
  await adm.fill('#in-etiqueta', 'Laura Prueba');
  await adm.click('#btn-crear');
  await adm.waitForSelector('#codigo-nuevo-texto');
  const codigo = (await adm.textContent('#codigo-nuevo-texto')).trim();
  assert.match(codigo, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  await adm.waitForSelector('tr[data-id]');
  assert.ok((await adm.textContent('tbody')).includes('Laura Prueba'));
  await adm.click('.selector-idioma button[data-lang=ca]');
  assert.ok((await adm.textContent('tbody')).includes('actiu'));
  await adm.click('.selector-idioma button[data-lang=es]');
  ok('el administrador crea un código de invitación desde /admin');

  // --- Narrador: sin código no entra ---
  const nar = await pagina(false);
  await nar.goto(base + '/narrador?lang=es');
  assert.strictEqual(await nar.locator('#crear').count(), 0, 'sin código no hay botón de crear');
  await nar.fill('#codigo', 'ZZZZZ-ZZZZZ');
  await nar.click('#entrar');
  await nar.waitForSelector('.error');
  assert.match(await nar.textContent('.error'), /Código no válido/);
  await nar.click('.selector-idioma button[data-lang=ca]');
  assert.match(await nar.textContent('.error'), /Codi no vàlid/);
  await nar.click('.selector-idioma button[data-lang=es]');
  await nar.fill('#codigo', codigo.toLowerCase());
  await nar.click('#entrar');
  await nar.waitForSelector('#crear');
  assert.ok((await nar.textContent('.saludo')).includes('Laura Prueba'));
  await nar.reload();           // el código queda guardado en el navegador
  await nar.waitForSelector('#crear');
  ok('el narrador necesita un código de invitación (y lo recuerda)');
  await nar.click('#crear');
  await nar.waitForSelector('#pin');
  const pin = (await nar.textContent('#pin')).trim();
  assert.match(pin, /^\d{6}$/);
  ok('el narrador crea la partida (PIN ' + pin + ')');

  // Botones ⓘ en la configuración de roles
  for (const r of ['vidente', 'lobo', 'aldeano', 'bruja']) {
    const info = nar.locator(`.rol-item[data-rol=${r}] .info`);
    assert.strictEqual(await info.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await nar.locator(`.descripcion[data-desc=${r}]`).count(), 0);
    await info.click();
    assert.strictEqual(await nar.locator(`.rol-item[data-rol=${r}] .info`).getAttribute('aria-expanded'), 'true');
    assert.strictEqual((await nar.textContent(`.descripcion[data-desc=${r}]`)).trim(), D.es[`rol.${r}.d`]);
  }
  await nar.locator('.rol-item[data-rol=bruja] .info').click();
  assert.strictEqual(await nar.locator('.descripcion[data-desc=bruja]').count(), 0, 'el segundo clic cierra la descripción');
  // Cambio de idioma: el texto abierto se traduce y sigue abierto
  await nar.click('.selector-idioma button[data-lang=ca]');
  assert.strictEqual((await nar.textContent('.descripcion[data-desc=vidente]')).trim(), D.ca['rol.vidente.d']);
  assert.strictEqual(await nar.locator('.rol-item[data-rol=vidente] .info').getAttribute('aria-expanded'), 'true');
  await nar.click('.selector-idioma button[data-lang=es]');
  ok('botón ⓘ junto a cada rol: abre, cierra y se traduce');

  // Jugadores
  const jug = {};
  for (const nom of NOMBRES) {
    const p = await pagina(true);
    await p.goto(base + '/?lang=es&pin=' + pin);
    await p.fill('#nombre', nom);
    await p.click('button[type=submit]');
    await p.waitForSelector('text=Estás dentro, ' + nom);
    assert.ok(await sinDesborde(p), 'sin desbordamiento horizontal en móvil');
    jug[nom] = p;
  }
  await nar.waitForFunction(() => document.querySelectorAll('.lista-jugadores li').length === 4);
  ok('4 jugadores entran con el PIN desde el móvil');

  // Configuración
  assert.ok(await nar.isChecked('#rol-vidente'));
  await nar.check('#rol-cupido');
  await nar.waitForFunction(() => document.querySelector('#resumen').textContent.includes('Roles especiales: 2'));
  await nar.uncheck('#rol-cupido');
  await nar.waitForFunction(() => document.querySelector('#resumen').textContent.includes('Roles especiales: 1'));
  await nar.click('#lobos-mas');
  await nar.waitForFunction(() => document.querySelector('#lobos-n').textContent === '2');
  await nar.click('#empezar'); // 2 lobos de 4 jugadores: el servidor lo rechaza
  await nar.waitForSelector('#aviso:not([hidden])');
  assert.match(await nar.textContent('#aviso'), /demasiados lobos/i);
  await nar.click('#lobos-menos');
  await nar.waitForFunction(() => document.querySelector('#lobos-n').textContent === '1');
  ok('configuración de roles y rechazo de un reparto imposible');

  await nar.click('#empezar');
  await nar.waitForSelector('[data-paso=vidente]');

  // --- Cada jugador ve su rol con lo que hace ---
  const roles = {};
  for (const nom of NOMBRES) {
    const p = jug[nom];
    await p.waitForSelector('.carta.oculta');
    await p.click('.carta-boton');
    const rol = await p.getAttribute('.carta h2[data-rol]', 'data-rol');
    roles[nom] = rol;
    assert.strictEqual((await p.textContent('.carta .descripcion')).trim(), D.es[`rol.${rol}.d`], 'descripción del rol en la tarjeta');
    assert.strictEqual((await p.textContent('.carta h2')).trim(), D.es[`rol.${rol}.n`]);
  }
  const cuenta = (r) => NOMBRES.filter((x) => roles[x] === r);
  assert.strictEqual(cuenta('lobo').length, 1); assert.strictEqual(cuenta('vidente').length, 1); assert.strictEqual(cuenta('aldeano').length, 2);
  const [lobo] = cuenta('lobo'), [vidente] = cuenta('vidente'), [ald1, ald2] = cuenta('aldeano');
  // Idioma del jugador: la tarjeta se traduce sin ocultarse
  await jug[lobo].click('.selector-idioma button[data-lang=ca]');
  assert.strictEqual((await jug[lobo].textContent('.carta .descripcion')).trim(), D.ca['rol.lobo.d']);
  assert.strictEqual((await jug[lobo].textContent('.carta h2')).trim(), D.ca['rol.lobo.n']);
  await jug[lobo].click('.selector-idioma button[data-lang=es]');
  await jug[lobo].click('.carta-boton');
  assert.strictEqual(await jug[lobo].locator('.carta.oculta').count(), 1, 'tocar la carta la oculta');
  await jug[lobo].click('.carta-boton');
  assert.ok(await jug[vidente].isVisible('.banda.noche'));
  ok('cada jugador ve su rol con su descripción (en su idioma) y puede ocultarlo');

  // --- Noche: vidente y lobo desde el panel del narrador ---
  const elegir = (nom) => nar.locator('.rejilla .opcion', { hasText: nom }).first().click();
  await elegir(lobo);
  await nar.click('.selector-idioma button[data-lang=ca]');
  assert.strictEqual(await nar.locator('.rejilla .opcion.marcado').count(), 1, 'la selección sobrevive al cambio de idioma');
  await nar.click('.selector-idioma button[data-lang=es]');
  assert.strictEqual(await nar.locator('.rejilla .opcion.marcado').count(), 1);
  assert.strictEqual(await nar.isDisabled('#siguiente'), true, 'no se avanza sin confirmar');
  await nar.click('#confirmar');
  await nar.waitForSelector('.vision');
  assert.ok((await nar.textContent('.vision')).includes(D.es['rol.lobo.n']));
  await nar.click('#siguiente');
  await nar.waitForSelector('[data-paso=lobo]');
  // El botón ⓘ también está en el paso de noche
  await nar.locator('[data-paso=lobo] .info').click();
  assert.strictEqual((await nar.textContent('[data-paso=lobo] .descripcion')).trim(), D.es['rol.lobo.d']);
  await elegir(ald1);
  await nar.click('#confirmar');
  await nar.waitForSelector('.hecho');
  await nar.click('#siguiente');
  await nar.waitForSelector('.muertes li');
  assert.ok((await nar.textContent('.muertes li')).includes(ald1));
  assert.ok((await nar.textContent('.muertes li')).includes('devorado por los lobos'));
  await jug[ald1].waitForSelector('.banda.eliminado');
  await jug[vidente].waitForSelector('.lista-jugadores li.muerto');
  assert.ok(await jug[vidente].isVisible('.banda.dia'));
  ok('noche y amanecer: el narrador conduce los pasos; el eliminado lo ve en su pantalla');

  // --- Votación: el pueblo elimina al lobo ---
  await nar.locator('#seccion-voto .rejilla .opcion', { hasText: lobo }).first().click();
  await nar.click('#votar');
  await nar.waitForSelector('.banda.final.pueblo');
  assert.ok((await nar.textContent('.banda.final')).includes('Gana el pueblo'));
  await jug[ald2].waitForSelector('.banda.final.pueblo');
  const lista = await jug[ald2].textContent('.lista-jugadores'); assert.ok(lista.includes('era Lobo'), 'al final se revelan los roles: ' + lista);
  ok('votación y final de partida (roles revelados)');

  // --- Reconexión: recargar el móvil no saca al jugador ---
  await jug[ald2].reload();
  await jug[ald2].waitForSelector('.banda.final.pueblo');
  await nar.reload();
  await nar.waitForSelector('#otra');
  await nar.click('#otra');
  await nar.waitForSelector('#empezar');
  await jug[ald2].waitForSelector('text=Estás dentro, ' + ald2);
  assert.ok(await sinDesborde(nar));
  ok('recarga de jugador y narrador sin perder la sesión; nueva partida con los mismos jugadores');

  // --- Revocar el código desde /admin cierra la partida abierta ---
  await adm.reload();
  await adm.waitForSelector('tr[data-id]');
  adm.once('dialog', (d) => d.accept());
  await adm.click('[data-accion=revocar]');
  await adm.waitForSelector('.etiqueta-estado.revocado');
  await jug[ald2].waitForSelector('text=La partida se ha cerrado'); // los jugadores son avisados
  await nar.waitForSelector('#crear'); // el narrador vuelve al inicio
  await nar.reload();
  await nar.waitForSelector('#crear');
  await nar.click('#crear');
  await nar.waitForSelector('.error');  // el código revocado ya no sirve: pide uno nuevo
  assert.match(await nar.textContent('.error'), /ya no es válido/);
  ok('revocar un código cierra sus partidas (avisa a los jugadores) y bloquea nuevas');

  // Los 401 de un código erróneo o revocado son la respuesta esperada del servidor (el navegador los registra en consola)
  const graves = errores.filter((e) => !/status of 401/.test(e));
  assert.strictEqual(errores.length - graves.length, 2, 'solo los dos 401 esperados');
  assert.deepStrictEqual(graves, [], 'errores de consola: ' + graves.join(' | '));
  ok('sin errores de consola ni de CSP');
  console.log('\nNavegador: ' + n + ' bloques correctos');
  await browser.close(); server.close(); process.exit(0);
})().catch((e) => { console.error('FALLO:', e); process.exit(1); });
