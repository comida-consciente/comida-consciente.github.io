// Copia la web (la carpeta de arriba) a www/, que es lo que Capacitor mete en la app.
// La web es el original: aquí no se edita nada, sólo se copia lo que la app carga.
import { cpSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const web = join(aqui, '..');
const destino = join(aqui, 'www');

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino);
for (const f of ['index.html', 'icon.svg', 'apple-touch-icon.png']) cpSync(join(web, f), join(destino, f));
cpSync(join(web, 'fonts'), join(destino, 'fonts'), { recursive: true });

const html = readFileSync(join(destino, 'index.html'), 'utf8');
const version = (html.match(/VERSION\s*=\s*['"]([^'"]+)['"]/) || [])[1] || '?';
console.log(`Copiada la web ${version} a www/`);
