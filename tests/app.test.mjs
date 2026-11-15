// Pruebas de la lógica de la app (index.html): `node --test tests/app.test.mjs`.
// Cubren lo que, si se rompe, pierde o expone datos: leer copias, fusionarlas, cifrar, exportar y
// el PIN. Se pasan solas antes de fabricar la APK (app-android/construir.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarApp } from './entorno-app.mjs';

const ingesta = (id, extra = {}) => ({ id, fecha: '2026-11-10', tipo: 'comida', hora: '14:00', alimentos: 'lentejas', ...extra });
const copia = (ingestas, dias = {}) => ({ app: 'comida-app', version: 3, exportado: '2026-11-11T10:00:00.000Z', ingestas, dias });
const vacios = () => ({ ingestas: {}, dias: {}, etiquetasDistintas: [] });

test('CSV: las celdas que empiezan como una fórmula no se ejecutan en Excel', () => {
  const { app } = cargarApp();
  for (const v of ['=1+1', '+34', '-2', '@SUMA(A1)', '\tx', '\rx']) assert.ok(app.csvCell(v).replace(/^"/, '').startsWith("'"), v);
  assert.equal(app.csvCell('a;b'), '"a;b"');
  assert.equal(app.csvCell('dijo "hola"'), '"dijo ""hola"""');
  assert.equal(app.csvCell('pan'), 'pan');
});

test('Copias manipuladas: ids peligrosos, tipos raros y textos enormes', () => {
  const { app } = cargarApp();
  assert.equal(app.sanearIngesta(ingesta('__proto__')), null);
  assert.equal(app.sanearIngesta(ingesta('constructor')), null);
  assert.equal(app.sanearIngesta(ingesta('a1', { fecha: '2026-02-30' })), null);
  assert.equal(app.sanearIngesta(ingesta('a1', { tipo: 'veneno' })), null);
  assert.equal(app.sanearIngesta('texto'), null);
  const x = app.sanearIngesta(ingesta('a1', { alimentos: 'x'.repeat(50000), emoAntes: ['Felicidad', 'inventada', 3], hora: '25:00' }));
  assert.equal(x.alimentos.length, app.TXT_MAX);
  assert.deepEqual([...x.emoAntes], ['Felicidad']);
  assert.equal(x.hora, '');
});

test('Copias manipuladas: no contaminan los objetos de la app', () => {
  const { app } = cargarApp();
  const d = JSON.parse('{"ingestas":{"__proto__":{"id":"__proto__","polucion":1},"a1":' + JSON.stringify(ingesta('a1')) + '},"dias":{"__proto__":{"agua":1}}}');
  app.normData(d);
  assert.equal(({}).polucion, undefined);
  assert.deepEqual(Object.keys(d.ingestas), ['a1']);
});

test('Agua escrita como texto: con su máximo', () => {
  const { app } = cargarApp();
  assert.equal(app.sanearDia({ agua: '2,5 litros' }).agua, 2.5);
  const o = app.sanearDia({ agua: '99999 litros' });
  assert.equal(o.agua, undefined);
  assert.equal(o.aguaTexto, '99999 litros');
  assert.equal(app.sanearDia({ agua: 99 }).agua, undefined);
  assert.equal(app.sanearDia({ agua: 3 }).agua, 3);
});

test('Recuperar la misma copia dos veces no añade nada la segunda', () => {
  const { app } = cargarApp();
  app.data = vacios();
  const o = copia([ingesta('a1'), ingesta('a2', { tipo: 'cena', alimentos: '' })], { '2026-11-10': { reflexiones: 'bien' } });
  const m1 = app.mergeImport(o);
  assert.equal(m1.nuevas, 2);
  assert.equal(m1.dias, 1);
  app.data = m1.next;
  const m2 = app.mergeImport(o);
  assert.deepEqual([m2.nuevas, m2.completadas, m2.dias, m2.malas], [0, 0, 0, 0]);
});

test('Recuperar una copia rellena huecos pero no pisa lo que ya hay', () => {
  const { app } = cargarApp();
  app.data = vacios();
  app.data = app.mergeImport(copia([ingesta('a1', { alimentos: '' })])).next;
  const m = app.mergeImport(copia([ingesta('a1', { alimentos: 'arroz', hora: '09:00' })]));
  assert.equal(m.completadas, 1);
  assert.equal(m.next.ingestas.a1.alimentos, 'arroz');
  assert.equal(m.next.ingestas.a1.hora, '14:00');
});

test('Cifrado: ida y vuelta, y con otro PIN no se abre', async () => {
  const { app } = cargarApp();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kdf = { salt: Buffer.from(salt).toString('base64'), iter: 1000 };
  const k = await app.derivarClave('123456', salt, 1000);
  const texto = JSON.stringify({ ingestas: { a1: ingesta('a1', { pensAntes: 'á é ñ 😊' }) } });
  const raw = await app.cifrar(texto, k, kdf);
  assert.ok(!raw.includes('lentejas'));
  assert.equal(await app.descifrar(JSON.parse(raw), k), texto);
  const otra = await app.derivarClave('654321', salt, 1000);
  await assert.rejects(app.descifrar(JSON.parse(raw), otra));
});

test('Activar el PIN cifra los datos y borra lo que no se pudo leer', async () => {
  const { app, localStorage } = cargarApp({ 'comida-app-proto-v1': '{roto', });
  assert.ok(app.hayRoto());
  app.data = { ...vacios(), ingestas: { a1: ingesta('a1') } };
  await app.cifrarConPin('123456');
  assert.ok(!localStorage.getItem(app.STORE).includes('lentejas'));
  assert.equal(localStorage.getItem(app.STORE + '-roto'), null);
});

test('Lo que no se puede leer se aparta y se avisa', () => {
  const { app, localStorage } = cargarApp({ 'comida-app-proto-v1': '{esto no es json' });
  assert.equal(localStorage.getItem(app.STORE + '-roto'), '{esto no es json');
  assert.match(app.bannerHtml(), /no se han podido leer/);
  assert.match(app.bannerHtml(), /rotoBaj/);
});

test('Borrado desde otra pestaña: lo que estaba aquí no se vuelve a escribir', async () => {
  const guardado = JSON.stringify({ ingestas: { a1: ingesta('a1') }, dias: {} });
  const { app, localStorage } = cargarApp({ 'comida-app-proto-v1': guardado });
  assert.ok(app.data.ingestas.a1);
  localStorage.removeItem(app.STORE);
  assert.equal(await app.refrescar(), true);
  assert.deepEqual(Object.keys(app.data.ingestas), []);
  await app.save();
  assert.ok(!localStorage.getItem(app.STORE).includes('lentejas'));
});

test('PIN: al quinto fallo, espera de 30 s', () => {
  const { app } = cargarApp();
  for (let i = 1; i < app.FALLOS_MAX; i++) assert.equal(app.contarFallo(), false);
  assert.equal(app.contarFallo(), true);
  assert.ok(app.perfil.esperaHasta > Date.now());
  assert.equal(app.perfil.fallos, 0);
});

test('Al bloquear no se quedan en memoria filtros ni índices', () => {
  const { app } = cargarApp();
  app.perfil.pin = { cifra: true, len: 6 };
  app.pat.filtros.texto = 'ansiedad';
  app.pat.origen = 'algo';
  app.etqUi = { ren: 'x' };
  app.bloquear();
  assert.equal(app.data, null);
  assert.equal(app.idx, null);
  assert.equal(app.pat.origen, '');
  assert.notEqual(app.pat.filtros.texto, 'ansiedad');
  assert.deepEqual({ ...app.etqUi }, {});
});
