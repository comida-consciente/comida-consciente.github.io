# Comida Consciente

Registro de lo que comes y de cómo te sientes antes y después. **Para darte cuenta, no para
controlar**: no cuenta calorías, no pone notas y no juzga.

**Pruébala:** https://comida-consciente.github.io/ — funciona en el navegador del móvil. En
iPhone, añádela a la pantalla de inicio (Compartir → «Añadir a pantalla de inicio») para que
Safari no borre los datos.

**Privacidad:** todo se guarda en tu navegador, en tu móvil. No hay servidor, ni cuentas, ni
analítica: la página no se conecta a ningún sitio, y su política de seguridad (CSP) se lo
impide al propio navegador. Tus datos solo salen si tú guardas una copia o exportas.

**Licencia:** © 2026 Iñigo Caraballo. Todos los derechos reservados (ver [`LICENSE`](LICENSE)):
el código se puede leer, pero no reutilizar. Las fuentes de `fonts/` van con su propia
licencia (SIL Open Font License). Sin garantía de ningún tipo.

---

## Para desarrollar

**La documentación vive en el vault** (privado), no aquí: `../Vault_Proyectos/Comida_Consciente/`.
Empezar por `Comida_Consciente.md`. Este repo es solo la implementación.

| En el vault | Qué es |
|---|---|
| `Diseño/CC-Especificacion-App-Registro.md` | **La app**: pantallas, datos, exportación, diseño y plan |
| `Tareas/CC-Instrucciones.md` | Principios no negociables, qué **no** construir y, al final, el **banco de ideas** |
| `Diseño/CC-Esquema-de-Datos.md` | **El contrato de datos.** Manda sobre el código |
| `Diseño/CC-Decisiones.md` | Las decisiones (D1–D17), con su motivo |
| `Diseño/CC-Analisis.md` | Las preguntas pre-registradas (Q1–Q6, con Q3b) y qué tarjeta de Patrones responde a cada una |
| `Versiones/` | Una nota por versión, de la `v0.1` a la `v0.9` |
| `QA/` | Bugs, compatibilidad y la revisión de seguridad (`CC-Revision-Publicacion`) |
| `fixtures/` | Contrato de aceptación del parser y del validador |

## La app (`index.html`)

Un solo fichero en la raíz, servido tal cual por GitHub Pages (`.nojekyll`). Es la **v0.9**: el
diseño «Sereno» (D15), el PIN opcional (D14), Patrones y etiquetas (D16) y la revisión de
seguridad antes de publicar (D17). Guarda en el `localStorage` del navegador: cada móvil tiene
sus propios datos (D12). La copia de seguridad es `version: 3`.

- **La clave de guardado (`comida-app-proto-v1`) y la marca de la copia (`"app": "comida-app"`) no
  se cambian** aunque la app se llame Comida Consciente: cambiarlas vaciaría los móviles e
  invalidaría las copias guardadas.
- **CSP con hash.** El `<meta http-equiv="Content-Security-Policy">` solo deja ejecutar el script
  cuyo hash SHA-256 lleva dentro. **Cada cambio del `<script>` cambia el hash**: hay que
  recalcularlo con `python3 tests/csp.py --escribir`. El test `tests/test_csp.py` falla si no
  coincide, así que no se puede publicar roto sin darse cuenta.
- Las fuentes están en `fonts/` (sin Google Fonts). No se carga nada de fuera.
- Para probarla en local: `python3 -m http.server` en la raíz del repo y abrir
  `http://127.0.0.1:8000/`. El PIN necesita `localhost` o https (Web Crypto), no `file://`.

## Las herramientas de Python

Son de la **v0.1**, de cuando el registro se hacía en notas de Obsidian: leen el **formato del
diario** (una nota por día con frontmatter YAML, como `fixtures/diario/`). **La app todavía no
exporta en ese formato**: su «Completo» es markdown para leer, sin YAML. Exportar en formato
diario está en el banco de ideas (D17.14).

## Uso

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

# 1. ¿Está bien escrito el vault?
.venv/bin/python validar.py <ruta-del-diario>
.venv/bin/python validar.py <ruta> --solo-errores   # sin avisos
.venv/bin/python validar.py <ruta> --json           # para otras herramientas
.venv/bin/python validar.py <ruta> --schema         # cruza con el JSON Schema

# 2. Generar la capa derivada (parquet + SQLite, para pandas o Power BI)
.venv/bin/python parsear.py <ruta-del-diario>
.venv/bin/python parsear.py <ruta> --resumen        # no escribe nada

# 3. Verlo
.venv/bin/python ver.py <ruta-del-diario>           # genera y abre el visor
```

`validar.py` sale con código 1 si hay **errores**. Los avisos nunca hacen fallar
nada: avisar de un campo ausente no es rechazar la entrada (principio 3 de
`Tareas/CC-Instrucciones.md`). Salida en formato de compilador, `fichero:línea:`,
que VS Code hace clicable:

```
2026-09-19.md:7: ERROR [hora_sexagesimal] `hora: 8:15` sin comillas: YAML la
  convierte en el numero 495 — escribir `hora: "8:15"` entre comillas
2026-09-19.md:11: ERROR [fuera_de_vocabulario] `energia: cansado` no esta en el
  vocabulario `energia` — quiza `sueno` o `baja`
```

## El visor

`ver.py` genera `derivado/visor.html`: **un único fichero local y autocontenido**,
sin CDN, sin fuentes remotas y sin una sola petición de red. Son datos de estado
emocional y pensamientos: la superficie de exposición es cero por defecto (D9).
Hay un test que lo comprueba en cada ejecución.

Enseña **calendario y día**, y ni un gráfico de patrones. No es una limitación
técnica: `Diseño/CC-Analisis.md` pide 4–6 semanas de registro antes de mirar nada.
Y los días se colorean sólo por *si hay registro*, nunca por cómo fue el día —
un semáforo de "buen día / mal día" está expresamente prohibido en las
instrucciones del proyecto.

## Qué hay dentro

```
esquema/
  dia.schema.json    el contrato: campos, tipos y vocabularios cerrados
  sinonimos.json     ayuda para corregir ('oficina' → 'trabajo'). No es contrato
  __init__.py        carga ambos; única fuente de los enums en código
validador/
  nota.py            trocea la nota y conserva el número de línea
  reglas.py          las reglas; una pasada, todos los hallazgos
  sugerencias.py     ortografía → sinónimo → errata → rendirse con elegancia
  contraste.py       segunda pasada contra el JSON Schema (--schema)
  hallazgos.py       ERROR / AVISO
parser/
  lector.py          .md → diccionario, deshaciendo las trampas de YAML
  tidy.py            una fila por ingesta + tabla de días, con los derivados
  exportar.py        parquet, SQLite y la tabla larga de emociones
visor/
  datos.py           de la capa derivada a lo que consume la página
  plantilla.py       la página: HTML, CSS y JS en un fichero
  generar.py         escribe el visor
validar.py  parsear.py  ver.py     las tres CLIs
tests/                             contrato de aceptación (los fixtures, el CSP de la app)
```

Ningún enum está escrito a mano en el código: `esquema/__init__.py` los lee de
`dia.schema.json`, y hasta el mapa campo→vocabulario se deriva de sus `$ref`.
Para añadir un valor al vocabulario se toca `Diseño/CC-Esquema-de-Datos.md` (el
vault) y luego `dia.schema.json`, **en ese orden**.

## Tests

```bash
.venv/bin/python -m pytest tests -q
```

Los fixtures **no se copian aquí**: son el contrato de aceptación y viven junto a
la documentación que los explica, en el vault. Los tests los buscan al lado
(`../Vault_Proyectos/Comida_Consciente/fixtures`) y se saltan solos si no están. Para
apuntar a otro sitio:

```bash
COMIDA_FIXTURES=/ruta/a/fixtures .venv/bin/python -m pytest tests -q
```

## Las dos trampas de YAML 1.1

Las dos corrompen en silencio, sin dar error, y las dos están cubiertas:

- `hora: 8:15` sin comillas se lee como el **entero 495** (sexagesimal). El
  validador lo caza y pide comillas.
- `hambre_antes: no` sin comillas se lee como el **booleano `False`** (la lista
  de PyYAML incluye `yes`/`no`/`on`/`off`), y `no` es un valor del vocabulario
  `hambre`. Se deshace en `esquema.destrampar()`, en un único sitio.
  Lo cubre el validador para las notas del diario. (La app todavía no exporta en este formato:
  ver «Las herramientas de Python», arriba.)

## Privacidad

Aquí no entra ni un dato real: `diario/`, `derivado/`, las copias y las exportaciones de la
app están en `.gitignore`. Los registros viven en el móvil de cada persona (D1, D12).
