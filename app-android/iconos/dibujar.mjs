// Dibuja los originales del icono y la pantalla de arranque (el plato y el cubierto de icon.svg)
// y los guarda en ../assets/, de donde `npx capacitor-assets generate --android` saca los tamaños.
// Uso: node iconos/dibujar.mjs  (necesita Chrome; ruta en CHROME o la de Windows por defecto)
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const salida = join(aqui, '..', 'assets');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const VERDE = '#2E5E4E', CREMA = '#F6F4EE';
mkdirSync(salida, { recursive: true });

// El dibujo de icon.svg (viewBox 64) sin el cuadrado verde de fondo.
const glifo = `<g fill="none" stroke="${CREMA}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="35" cy="32" r="14"/><circle cx="35" cy="32" r="7"/><path d="M14 18v28"/></g>`;

// escala: qué parte de la imagen ocupa el dibujo (centrado en su caja de 64×64; el glifo ocupa x 11–49).
function dibujar(nombre, lado, escala, fondo) {
  const h = lado * escala, x = (lado - h) / 2;
  const dibujo = escala ? `<svg x="${x}" y="${x}" width="${h}" height="${h}" viewBox="0 0 64 64"><g transform="translate(0.5 0)">${glifo}</g></svg>` : '';
  const html = `<!doctype html><style>html,body{margin:0;background:${fondo || 'transparent'};overflow:hidden}</style>
<svg width="${lado}" height="${lado}">${dibujo}</svg>`;
  const f = join(tmpdir(), `cc-${nombre}.html`);
  writeFileSync(f, html);
  execFileSync(chrome, ['--headless', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
    `--window-size=${lado},${lado}`, `--screenshot=${join(salida, nombre)}`, `file:///${f.split(String.fromCharCode(92)).join('/')}`], { stdio: 'ignore' });
  rmSync(f);
  console.log(`assets/${nombre}`);
}

dibujar('icon-only.png', 1024, 0.78, VERDE);         // icono clásico (móviles antiguos) y el de Play
dibujar('icon-foreground.png', 1024, 0.62, null);    // capa delantera del icono adaptable: cabe en la zona segura
dibujar('icon-background.png', 1024, 0, VERDE);      // capa trasera: sólo el fondo
dibujar('splash.png', 2732, 0.2, VERDE);   // pantalla de arranque
dibujar('splash-dark.png', 2732, 0.2, VERDE);
