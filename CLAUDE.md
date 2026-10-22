# Comida Consciente — contexto para Claude Code

**La documentación canónica vive en el vault**, no aquí:
`../Vault_Proyectos/Comida_Consciente/`. Empezar por `Comida_Consciente.md`, y para la app
de registro, por `Diseño/CC-Especificacion-App-Registro.md`.

Este fichero no duplica nada: sólo recuerda las reglas que no se pueden
descubrir leyendo el código, y dice dónde está lo demás. Si algo de aquí choca
con `Tareas/CC-Instrucciones.md` del vault, **manda el vault**.

## Las cinco reglas que no se deducen del código

1. **La fuente de verdad es la app, en el dispositivo** (D1 revisada). El
   markdown es un formato de exportación, y tiene que seguir el esquema para
   que `validar.py` y `parsear.py` funcionen sobre él. Sin cuentas: cada móvil
   es una persona (D12).
2. **Registrar tiene que costar menos de 20 segundos.** El proyecto no fracasa
   por bugs, fracasa por abandono del registro. Cualquier campo obligatorio
   nuevo es una amenaza directa.
3. **Una entrada con sólo `tipo` + `hora` + `alimentos` es válida.** El validador
   avisa de lo ausente, nunca rechaza.
4. **Captura y clasificación van separadas.** Los alimentos se registran en texto
   libre; el etiquetado es posterior y en batch.
5. **La especificación manda sobre el aspecto.** Desde la v0.6 (D15, rediseño
   «Sereno») la referencia visual es `Diseño/CC-Especificacion-App-Registro.md`
   del vault (§3 y §7), no el prototipo v0.4, del que solo quedan los campos,
   los formatos de exportación y la copia. Si la especificación y la app
   discrepan, preguntar.
   Lo que siga abierto en el banco de ideas de `CC-Instrucciones` no se decide
   sin el usuario.

## Qué NO construir

Calorías, macros, peso, IMC, objetivos, puntuaciones del día, semáforos de
"buen día / mal día", clasificar alimentos en saludable/no saludable, rachas,
gamificación, notificaciones que presionen a registrar, nube, telemetría.

La plantilla en papel no tiene nada de esto y **esa ausencia es deliberada**: es
un registro de conciencia, no de control. Si se pide algo de esta lista, señalar
`Tareas/CC-Instrucciones.md` del vault y pedir confirmación explícita.

## Antes de tocar el esquema

Se actualiza primero `Diseño/CC-Esquema-de-Datos.md` en el vault, después
`esquema/dia.schema.json`. En ese orden. Los enums no se escriben a mano en
ningún otro sitio: se leen del schema. Tampoco en el JS de la app (`index.html`).

## Fixtures

Contrato de aceptación, en el vault (`fixtures/`). Si un cambio rompe un fixture,
el cambio está mal. `fixtures/CC-Fixtures.md` explica qué prueba cada uno.

## Lo que no se puede cambiar sin pensarlo (D17)

- **La clave `comida-app-proto-v1` y la marca `"app": "comida-app"` de la copia se quedan**,
  aunque la app se llame Comida Consciente. Cambiarlas vaciaría los móviles y dejaría
  inservibles las copias guardadas.
- **CSP con hash.** Cualquier cambio dentro del `<script>` de `index.html` cambia su hash:
  después de editarlo, `python3 tests/csp.py --escribir`, y `pytest` lo comprueba. Nunca
  `'unsafe-inline'` en `script-src`, ni `connect-src` distinto de `'none'`: «nada sale del móvil»
  tiene que poder comprobarse.
- Lo que llega de una copia pasa por `sanearIngesta`/`sanearDia`, y todo lo que entra en el HTML,
  por `esc()`, también en clases y atributos.
- **Cifrado con el PIN (D18).** Nunca se guarda el PIN ni un hash suyo cuando cifra; la sal va en el
  sobre. `save()` y `refrescar()` devuelven promesas: esperarlas antes de avisar de nada. Con PIN,
  `data` es `null` mientras la app está bloqueada. La copia de seguridad va sin cifrar (decidido).

## Notas de trabajo

- Idioma del código, los datos y la conversación: **castellano**. Los valores de
  enum van en minúsculas y sin acentos.
- Un bug que añade fricción al registrar es crítico aunque sea una tontería
  técnica. Ficha en `QA/CC-Bugs-Activos.md` del vault.
- El usuario trabaja en VS Code sobre macOS. Homebrew Python es *externally
  managed*: usar `.venv`.
