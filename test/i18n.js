'use strict';
// Diccionarios: mismas claves en catalán y castellano, mismos {marcadores}, y todas las claves usadas existen.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const ctx = { navigator: {} };
ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(path.join(raiz, 'public/i18n.js'), 'utf8'), ctx);
const I = ctx.I18N;
const { ca, es } = I.dict;
let fallos = 0;
const falla = (m) => { fallos += 1; console.error('  ✗ ' + m); };

const marcadores = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
for (const k of new Set([...Object.keys(ca), ...Object.keys(es)])) {
  if (ca[k] === undefined) falla('falta en ca: ' + k);
  else if (es[k] === undefined) falla('falta en es: ' + k);
  else {
    if (!ca[k].trim() || !es[k].trim()) falla('vacía: ' + k);
    if (marcadores(ca[k]) !== marcadores(es[k])) falla('marcadores distintos: ' + k);
  }
}
for (const k of Object.keys(ca)) if (k.includes('#') && ca[k.split('#')[0]] === undefined) falla('plural sin singular: ' + k);

const fuentes = ['public/js/comun.js', 'public/js/reglas.js', 'public/reglas.html', 'public/js/jugador.js', 'public/js/narrador.js', 'public/js/admin.js', 'public/index.html', 'public/narrador.html', 'views/admin.html']
  .map((f) => fs.readFileSync(path.join(raiz, f), 'utf8')).join('\n');
const usadas = new Set();
for (const m of fuentes.matchAll(/\b(?:T|t)\('([\w.]+)'\s*[,)]/g)) usadas.add(m[1]);
for (const m of fuentes.matchAll(/data-i18n(?:-[a-z]+)?="([\w.]+)"/g)) usadas.add(m[1]);
for (const k of usadas) if (ca[k] === undefined) falla('clave usada que no existe: ' + k);

const ROLES = ['aldeano', 'lobo', 'vidente', 'bruja', 'cazador', 'cupido', 'nina', 'salvador'];
for (const r of ROLES) for (const s of ['n', 'd']) if (!ca['rol.' + r + '.' + s]) falla('falta rol.' + r + '.' + s);
for (const p of ['cupido', 'salvador', 'vidente', 'lobo', 'bruja']) if (!ca['n.paso.' + p]) falla('falta n.paso.' + p);
for (const p of ['cupido', 'salvador', 'vidente', 'lobo', 'bruja']) for (const s of ['abre', 'cierra']) if (!ca['guion.' + p + '.' + s]) falla('falta guion.' + p + '.' + s);
for (const g of ['pueblo', 'lobos', 'amantes']) if (!ca['g.' + g]) falla('falta g.' + g);
for (const c of ['lobos', 'veneno', 'amor', 'cazador', 'votacion']) if (!ca['causa.' + c]) falla('falta causa.' + c);

const servidor = fs.readFileSync(path.join(raiz, 'server.js'), 'utf8');
for (const m of servidor.matchAll(/err\('(\w+)'/g)) if (ca['e.' + m[1]] === undefined) falla('error sin traducir: e.' + m[1]);

for (const r of ROLES) if (ca['rol.' + r + '.d'] === es['rol.' + r + '.d']) falla('descripción sin traducir: ' + r);
const iguales = Object.keys(ca).filter((k) => ca[k] === es[k] && ca[k].length > 15 && !['ac.caduca_opc', 'reg.fin.t'].includes(k));
if (iguales.length) falla('textos largos idénticos en ca y es: ' + iguales.join(', '));

if (fallos) { console.error('\n' + fallos + ' problemas'); process.exit(1); }
console.log('i18n correcto: ' + Object.keys(ca).length + ' claves, ' + usadas.size + ' usadas en el código');
