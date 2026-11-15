// Carga el <script> de index.html en Node, sin navegador, para probar su lógica.
// La página (document, ventanas, botones) se sustituye por un objeto que acepta cualquier cosa y no
// hace nada; localStorage es de verdad (en memoria) y el cifrado es la Web Crypto de Node, la misma API
// que la del navegador. Las funciones de la app se sacan por `app` añadiendo una línea al final del
// script (solo aquí: index.html no cambia).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const HTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const SCRIPT = HTML.match(/<script>([\s\S]*?)<\/script>/)[1];

// Lo que la app puede usar desde las pruebas. Las variables con `let` van con get/set.
const EXPUESTO = `globalThis.app={
  sanearIngesta,sanearDia,normData,mergeImport,csvCell,txt,TXT_MAX,IMPORT_MAX,
  derivarClave,cifrar,descifrar,refrescar,save,load,bannerHtml,hayRoto,cifrarConPin,
  contarFallo,bloquear,FALLOS_MAX,STORE,
  get data(){return data},set data(v){data=v},
  get ultimoRaw(){return ultimoRaw},get perfil(){return perfil},
  get pat(){return pat},get idx(){return idx},get exp(){return exp},get etqUi(){return etqUi},
  set etqUi(v){etqUi=v},set exp(v){exp=v},
};`;

// Un objeto que vale para todo: cualquier propiedad, llamada o `new` devuelve otro igual.
function nada() {
  const f = function () {};
  return new Proxy(f, {
    get(_, k) {
      if (k === Symbol.toPrimitive) return () => '';
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      return nada();
    },
    set: () => true,
    apply: () => nada(),
    construct: () => nada(),
  });
}

class Almacen {
  constructor(inicial = {}) { this.m = new Map(Object.entries(inicial)); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

/** Arranca una copia nueva de la app con lo que haya en `almacen` (claves → texto). */
export function cargarApp(almacen = {}) {
  const localStorage = new Almacen(almacen);
  const recargas = { n: 0 };
  const ctx = {
    localStorage, crypto: webcrypto, console,
    TextEncoder, TextDecoder, Response, Blob, CompressionStream, DecompressionStream,
    btoa, atob, URL, Intl,
    setTimeout: (f, ms) => { const t = setTimeout(f, ms); t.unref?.(); return t; },
    clearTimeout, setInterval: () => 0, clearInterval: () => {},
    document: nada(), navigator: nada(), matchMedia: nada(), getComputedStyle: nada(),
    requestAnimationFrame: () => 0, addEventListener: () => {}, removeEventListener: () => {},
    location: { reload: () => { recargas.n++; }, href: 'https://comida-consciente.github.io/', protocol: 'https:' },
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const fin = SCRIPT.lastIndexOf('})();');
  vm.runInContext(SCRIPT.slice(0, fin) + EXPUESTO + SCRIPT.slice(fin), ctx, { filename: 'index.html' });
  return { app: ctx.app, localStorage, recargas };
}
