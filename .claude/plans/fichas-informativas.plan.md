# Plan: Fichas informativas

**Source PRD**: `.claude/prds/sistema-solar-3d.prd.md`
**Selected Milestone**: 2. Fichas informativas
**Complexity**: Medium

## Summary
Cuando el estudiante elige un cuerpo (con el menú, un clic o un toque), la cámara lo enfoca como hasta ahora y además se abre su ficha. La ficha dice qué es el cuerpo, muestra sus datos clave comparados con la Tierra y un dato curioso, y guarda más datos para quien quiera profundizar. Las cifras que ya están en `bodies.ts` se reutilizan. Las demás vienen de la NASA, con su fuente y la fecha de consulta. La ficha es HTML accesible, no 3D, y funciona igual en escritorio y en celular.

## Decisiones
| Decisión | Elección | Motivo |
|---|---|---|
| Un solo contenido para todos los niveles | Información por capas. El resumen sencillo y los datos clave se ven siempre. "Más datos" es un `<details>` desplegable con cifras técnicas | Es una respuesta tentativa a la pregunta abierta del PRD, sin selector de nivel: en primaria se lee el resumen y en universidad se abre "Más datos". Se valida en la prueba piloto (hito 4) |
| Origen de las cifras | Lo que ya está en `bodies.ts` se calcula: diámetro, distancia, año, rotación e inclinación. Lo nuevo va en `src/core/facts.ts` | Cada dato tiene una sola fuente, así que dos números no pueden contradecirse |
| Fuentes | NASA Planetary Fact Sheet para las cifras y NASA Science para resúmenes, datos curiosos y lunas | Son fuentes oficiales, como pide el riesgo del PRD. Cada ficha enlaza sus fuentes |
| Formato de números | `Intl.NumberFormat('es-419')` (1,234.5) en una constante `LOCALE` | Coincide con el estilo del proyecto (punto decimal) y funciona igual en Node y Chromium |
| Construcción del HTML | `createElement` y `textContent`, nunca `innerHTML` | Evita inyecciones aunque el contenido sea propio |
| Dependencias nuevas | Ninguna | Basta el DOM |

**Supuestos de este hito** (vienen de preguntas abiertas del PRD; hay que confirmarlos):
- Un solo contenido, en español. El resumen se escribe para estudiantes de 10 a 14 años; las cifras técnicas van en "Más datos".
- El número de lunas cambia con los descubrimientos. Se muestra con fecha ("lunas conocidas a octubre de 2026").
- La revisión científica la hacen tú o un docente antes del piloto. El plan deja cada cifra con su fuente para facilitarla.
- Cerrar la ficha no mueve la cámara. "Ver todo" cierra la ficha y vuelve a la vista general.

## Contenido de cada ficha
| Sección | Contenido | Origen |
|---|---|---|
| Encabezado | Nombre y tipo: Estrella, Planeta rocoso, Gigante gaseoso o Gigante helado | `facts.ts` |
| Resumen | 2 o 3 frases sencillas, máximo 300 caracteres | NASA Science |
| Datos clave | Diámetro (y "≈ 11 Tierras"), distancia media al Sol (millones de km), duración del año (días o años terrestres), tiempo en girar sobre su eje, temperatura media y lunas conocidas | `bodies.ts` + Fact Sheet |
| Dato curioso | 1 o 2 | NASA Science |
| Más datos | Masa y gravedad (Tierra = 1), densidad, inclinación del eje, día solar, gases principales de la atmósfera y si gira al revés | Fact Sheet |
| Fuentes | Enlaces y fecha de consulta | — |

El Sol no tiene año ni lunas. En su lugar muestra la temperatura de la superficie, su edad, que lo orbitan 8 planetas y que contiene el 99.8 % de la masa del sistema solar.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Naming | `src/ui/bodyMenu.ts:3`, `:43` | Fábrica `createX(contenedor, …, handlers)` que devuelve una interfaz pequeña (`BodyMenu`). Los handlers son una interfaz `XHandlers` |
| Data | `src/core/bodies.ts:56`, `:168`, `:177` | Datos tipados en `RAW_…` y congelados con `Object.freeze` a nivel profundo. Comentario con la fuente al inicio del archivo |
| Errors | `src/core/bodies.ts:187`, `src/core/validation.ts:4` | Errores en español con el valor recibido. `RangeError` para valores fuera de rango |
| Logging | `src/scene/bodyMeshes.ts:58` | Solo `console.warn('[área] …')` o `console.error` con prefijo. Nada de `console.log` |
| Page state | `src/ui/notices.ts:8` | El estado se guarda en atributos de `body` y el CSS decide qué se muestra |
| Constants | `src/scene/createScene.ts:26-37` | Constantes con nombre y un comentario que explica el porqué |
| Unit tests | `src/core/scale.test.ts:12`, `src/ui/bodyMenu.test.ts:1-6` | Nombres de prueba en español que describen el comportamiento, con invariantes en vez de números sueltos. Las pruebas de UI usan `// @vitest-environment happy-dom` y un `setup()` |
| E2E | `e2e/explorar.spec.ts:7-15` | Helpers `bodyMenu(page)` y `waitUntilLoaded(page)`. Comprobaciones sobre el DOM, no sobre píxeles |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/core/format.ts` + `.test.ts` | CREATE | Formato de números, distancias, duraciones, temperaturas y comparación con la Tierra |
| `src/core/facts.ts` + `.test.ts` | CREATE | Contenido de las 9 fichas (`Record<BodyId, BodyFacts>`: TypeScript obliga a que estén todas) |
| `src/core/factSheet.ts` + `.test.ts` | CREATE | Une `bodies.ts` y `facts.ts` en el modelo de la ficha (secciones con etiqueta y valor ya formateados) |
| `src/core/focus.ts` + `.test.ts` | UPDATE | `viewOffsetForInset()`: cuánto desplazar el encuadre para que la ficha no tape el cuerpo enfocado |
| `src/ui/infoPanel.ts` + `.test.ts` | CREATE | Panel de la ficha: mostrar, reemplazar, cerrar (botón y Escape) y enlaces seguros |
| `src/scene/createScene.ts` | UPDATE | `view.setViewInset()` con `camera.setViewOffset`, que se reaplica al cambiar el tamaño de la ventana |
| `src/main.ts` | UPDATE | Al cambiar el enfoque se abre o se cierra la ficha y se ajusta el encuadre |
| `index.html` | UPDATE | `<aside id="ficha" aria-labelledby="ficha-titulo">` después del menú, para que siga en el orden de tabulación |
| `src/styles.css` | UPDATE | En escritorio, columna derecha. En celular, hoja inferior con desplazamiento sobre el menú. No tapa el menú, "Ver todo" ni el aviso de escala |
| `e2e/fichas.spec.ts` | CREATE | Flujos de la ficha en escritorio y celular |
| `README.md` | UPDATE | Estado (hito 2 de 5), qué incluye la ficha y fuentes |
| `.claude/prds/sistema-solar-3d.prd.md` | UPDATE | Fila del hito 2 en `in-progress` con enlace a este plan (hecho al crear el plan) |

## Tasks
### Task 1: Formato de cifras (TDD)
- **Action**: primero las pruebas (RED):
  - los miles se separan con coma y los decimales con punto;
  - las distancias grandes se muestran en millones de km ("778.5 millones de km");
  - una rotación de más de 48 horas se muestra en días ("58.6 días"); el resto en horas;
  - un año de más de 2 años terrestres se muestra en años ("11.9 años terrestres"); el resto en días;
  - las temperaturas bajo cero llevan signo ("-65 °C");
  - la comparación con la Tierra redondea de forma legible ("≈ 11 Tierras", "≈ 0.4 Tierras");
  - un valor no positivo donde no corresponde lanza `RangeError`.

  Después se implementa `format.ts` (GREEN) con constantes con nombre para los umbrales.
- **Mirror**: funciones puras como `src/core/scale.ts`, validación con `assertPositive`.
- **Validate**: `npx vitest run src/core/format.test.ts`

### Task 2: Contenido de las fichas (TDD)
- **Action**: las pruebas fijan invariantes, no textos:
  - hay ficha para los 9 cuerpos de `BODIES`, sin sobrantes;
  - el tipo concuerda con `kind` (solo el Sol es estrella; Mercurio a Marte rocosos, Júpiter y Saturno gaseosos, Urano y Neptuno helados);
  - cada resumen tiene entre 80 y 300 caracteres y cada ficha tiene 1 o 2 datos curiosos;
  - las fuentes son URL `https://` de `nasa.gov` o `esa.int`;
  - la Tierra vale 1 en masa y gravedad relativas, y las lunas son enteros ≥ 0;
  - los datos no se pueden modificar.

  Después se escriben las 9 fichas con datos de la NASA, con la fuente en un comentario y la constante `FACTS_CHECKED_ON` con la fecha de consulta.
- **Mirror**: `RAW_BODIES` + `freezeBody` de `bodies.ts`.
- **Validate**: `npx vitest run src/core/facts.test.ts`

### Task 3: Modelo de la ficha (TDD)
- **Action**: `buildFactSheet(body, facts)` devuelve título, tipo, resumen, `keyFacts` y `moreFacts` (pares etiqueta-valor), datos curiosos y fuentes. Las pruebas comprueban que:
  - el diámetro de Júpiter sale de `radiusKm` y dice "≈ 11 Tierras";
  - la Tierra no se compara consigo misma;
  - el Sol no tiene filas de año ni de lunas y sí de temperatura de superficie;
  - Venus y Urano indican que giran al revés (inclinación > 90°);
  - la etiqueta es "Gira sobre su eje en" y no "Un día dura". El día solar va aparte, en "Más datos".
- **Mirror**: la lógica vive en `core/`; la UI solo pinta.
- **Validate**: `npx vitest run src/core/factSheet.test.ts`

### Task 4: Panel de la ficha (TDD con happy-dom)
- **Action**: `createInfoPanel(aside, { onClose })` devuelve `{ show(sheet), hide(), isOpen() }`. Las pruebas comprueban que:
  - `show` pinta el título en un `h2` con id `ficha-titulo`, el tipo, los datos clave en una lista de definiciones (`<dl>`) y "Más datos" en un `<details>` cerrado;
  - mostrar otro cuerpo reemplaza el contenido; no lo acumula;
  - el botón "Cerrar ficha" (con `aria-label`) y la tecla Escape llaman a `onClose`, y Escape no hace nada con la ficha cerrada;
  - los enlaces de fuentes usan `target="_blank"` y `rel="noopener noreferrer"`;
  - un texto con `<script>` se muestra como texto y no crea elementos.
- **Mirror**: `src/ui/bodyMenu.ts` y su prueba.
- **Validate**: `npx vitest run src/ui/infoPanel.test.ts`

### Task 5: Encuadre sin tapar el cuerpo (TDD + escena)
- **Action**: probar `viewOffsetForInset(inset)`: sin inset no hay desplazamiento; con un panel de `r` px a la derecha el centro se mueve `r/2`; con una hoja de `b` px abajo se mueve `b/2`; un inset negativo lanza `RangeError`. Después, en `createScene.ts`, `view.setViewInset(inset)` aplica `camera.setViewOffset` y lo reaplica en `fitToViewport`.
- **Mirror**: `overviewDistance` y `minZoomDistance` de `src/core/focus.ts`.
- **Validate**: `npx vitest run src/core/focus.test.ts` y revisión visual: el planeta enfocado queda en el centro de la zona libre.

### Task 6: Integración y diseño
- **Action**: en `main.ts`, `onFocusChange(id)` actualiza el menú. Con un id abre `infoPanel.show(buildFactSheet(...))`; con null cierra la ficha. Al abrir, cerrar o cambiar el tamaño de la ventana, se mide el panel y se llama a `view.setViewInset`. El botón de cerrar solo cierra la ficha; volver a pulsar el mismo cuerpo la reabre. Se agrega el `<aside>` en `index.html` y el CSS:
  - en escritorio, columna derecha de unos 340 px, con desplazamiento interno;
  - en celular, hoja inferior de alto máximo `45dvh`, encima de la fila del menú;
  - en celular horizontal (740×360), panel a la derecha con alto completo.
- **Mirror**: variables CSS existentes (`--panel`, `--borde`, `--margen`) y el bloque `@media (max-width: 640px), (max-height: 520px)`.
- **Validate**: `npm run dev`, revisión con teclado y en 360×640, 740×360 y 1280×800.

### Task 7: Pruebas E2E
- **Action**: `e2e/fichas.spec.ts` verifica en escritorio y celular que:
  - al elegir Júpiter se abre su ficha con el título "Júpiter", "Gigante gaseoso", la fila "Diámetro" y un enlace a nasa.gov;
  - "Cerrar ficha" la oculta, el estado sigue en "Enfocando: Júpiter" y al pulsar Júpiter otra vez se reabre;
  - Escape la cierra;
  - "Ver todo" la cierra y vuelve a la vista general;
  - al tocar el Sol en la escena se abre la ficha del Sol;
  - los 9 cuerpos abren su ficha sin errores en consola;
  - la ficha no se superpone al menú, a "Ver todo" ni al aviso de escala (se comparan las cajas), y no hay desplazamiento horizontal, también en 740×360.

  Guarda una captura de cada ficha como evidencia para la revisión científica.
- **Mirror**: helpers de `e2e/explorar.spec.ts`.
- **Validate**: `npm run test:e2e`

### Task 8: Documentación y revisión
- **Action**: actualizar el README, revisar con el agente `code-reviewer`, corregir los hallazgos CRITICAL y HIGH, y hacer commit `feat: fichas informativas (hito 2)`.
- **Validate**: todos los comandos de la sección Validation en verde.

## Validation
```bash
npm run typecheck        # tsc --noEmit
npm run test:coverage    # Vitest, ≥ 80 % en src/core/, src/ui/ y la cámara
npm run build            # build de producción
npm run test:e2e         # Playwright, escritorio y celular
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Una cifra está mal o es de una fuente no oficial | Media | Solo se usan la NASA Fact Sheet y NASA Science, con la fuente junto a cada valor. Tú o un docente revisan las capturas antes del piloto |
| Confundir el periodo de rotación con el día solar (Mercurio gira en 58.6 días, pero de un amanecer al siguiente pasan 176) | Alta | Etiqueta "Gira sobre su eje en" y el día solar como dato aparte. Una prueba fija la etiqueta |
| El número de lunas queda desactualizado | Alta | Se muestra con fecha de consulta (`FACTS_CHECKED_ON`) |
| En celular la ficha tapa el planeta o el menú | Media | `setViewOffset` desplaza el encuadre. La E2E comprueba que no haya superposición en 3 tamaños |
| El resumen queda muy difícil para primaria o muy simple para universidad | Media | Información por capas. Se mide en el piloto con al menos dos grupos de edad |
| `Intl` formatea distinto en algún navegador | Baja | Locale fijo `es-419`; las pruebas unitarias y la E2E comprueban el texto formateado |

## Acceptance
- [ ] Al elegir cualquiera de los 9 cuerpos (menú, clic o toque) se abre su ficha
- [ ] La ficha se cierra con el botón, con Escape y con "Ver todo", y se reabre al pulsar el cuerpo otra vez
- [ ] La ficha no tapa el cuerpo enfocado, el menú, "Ver todo" ni el aviso de escala, en escritorio y celular
- [ ] Cada ficha muestra sus fuentes y la fecha de consulta
- [ ] All tasks complete
- [ ] Validation passes (typecheck, cobertura ≥ 80 %, build, E2E)
- [ ] Patterns mirrored, not reinvented
- [ ] Sin hallazgos CRITICAL o HIGH en la revisión de código
- [ ] Revisión científica de las 9 fichas (la hacen tú o un docente; no se puede automatizar)
