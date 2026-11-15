// Guarda la web en el móvil para que abra sin conexión (la app de Android no lo usa: ya la lleva dentro).
// Con red, siempre la versión publicada, que se guarda para la próxima vez. Sin red, o si la red tarda
// más de 4 s, la guardada. Solo guarda los archivos de la app, nunca los datos: esos siguen en el
// localStorage del navegador. tests/test_sw.py comprueba que VERSION es la de index.html.
const VERSION = 'v0.17';
const CACHE = 'comida-consciente-' + VERSION;
const ARCHIVOS = ['./', 'index.html', 'privacidad.html', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png',
  'fonts/fraunces.woff2', 'fonts/atkinson-400.woff2', 'fonts/atkinson-700.woff2', 'fonts/atkinson-400-italic.woff2'];
const ESPERA_MS = 4000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

// Al estrenar versión se borran las copias de las anteriores.
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('comida-consciente-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(primeroLaRed(r));
});

async function primeroLaRed(r) {
  const cache = await caches.open(CACHE);
  const red = fetch(r).then(res => { if (res.ok) cache.put(r, res.clone()); return res; });
  red.catch(() => {});
  try {
    const res = await Promise.race([red, new Promise(ok => setTimeout(ok, ESPERA_MS))]);
    if (res) return res;
  } catch { /* sin red: la guardada */ }
  const guardada = await cache.match(r, { ignoreSearch: true })
    || (r.mode === 'navigate' ? await cache.match('index.html') : undefined);
  return guardada || red;
}
