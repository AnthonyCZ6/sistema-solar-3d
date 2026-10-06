# Plan: Calidad adaptativa

**Source PRD**: `.claude/prds/sistema-solar-3d.prd.md`
**Selected Milestone**: 3. Calidad adaptativa
**Complexity**: Large

## Summary
La web elige sola un nivel de calidad (baja, media o alta) según el equipo y la conexión. Si mientras se usa va lenta, baja de nivel sin que nadie haga nada. Siempre carga primero texturas ligeras. Las de alta resolución (hasta 8K) se descargan solo para el cuerpo enfocado y para el fondo, y solo en equipos que pueden con ellas. Así se ve nítido en una pantalla 4K sin castigar a un equipo escolar ni a una red lenta. Como red de seguridad, un selector permite fijar la calidad a mano, y el modo `?diagnostico` muestra FPS y nivel para medir en el piloto.

## Decisiones
| Decisión | Elección | Motivo |
|---|---|---|
| Qué se adapta | Píxeles por píxel CSS, antialias, resolución de texturas y del fondo | Son los costos reales: relleno de píxeles, memoria de GPU y descarga. Las 9 esferas de 64 segmentos son baratas incluso en gama baja |
| Alta resolución | Solo bajo demanda: textura 4K u 8K del **cuerpo enfocado** (una a la vez; la anterior se libera) | Una textura 8K ocupa unos 170 MB de GPU con mipmaps. Nueve juntas no caben en muchos equipos. De lejos, 2K basta |
| Nivel inicial | Heurística pura (`chooseInitialTier`) con renderer de GPU, `maxTextureSize`, `deviceMemory`, `hardwareConcurrency`, puntero táctil y pantalla | Funciona sin pruebas de rendimiento al arrancar. Una señal que falta (Safari y Firefox no exponen `deviceMemory`) no penaliza |
| Ajuste en marcha | Solo hacia abajo: si la mediana del tiempo por cuadro supera 40 ms (menos de 25 FPS) durante 3 s, baja un nivel. Nunca sube sola | Sin oscilaciones. El umbral está por debajo de 30 FPS para no castigar equipos limitados a 30 Hz, como iOS en ahorro de energía |
| Conexión | Con `saveData` o red `2g`/`3g` no se descargan texturas de detalle y las de base son 1K | Es la mitigación del riesgo del PRD "recursos pesados en redes escolares" |
| Ajuste manual | Selector "Calidad: Automática, Baja, Media, Alta", guardado en `localStorage` con try/catch | Es la mitigación del riesgo "la gama se detecta mal". La opción manual apaga el ajuste automático |
| Texturas | Las mismas de Solar System Scope (CC BY 4.0) en carpetas `1k/`, `2k/`, `4k/` y `8k/`. Las de 1K y 4K se generan reduciendo las originales | Hay versiones 8K para todos los cuerpos salvo Urano y Neptuno (solo 2K); de la atmósfera de Venus hay hasta 4K. Verificado el 2026-10-06 |
| Herramienta de imágenes | `sharp` como devDependency, en un script `npm run textures` | Genera las variantes de forma repetible. Los archivos generados se versionan, así que el build no depende de `sharp` |
| Decodificación | `ImageBitmapLoader` para las texturas de detalle | Decodifica la imagen fuera del hilo principal: un JPG de 8K no congela la animación |
| Descartado: texturas KTX2/Basis | — | Reducirían la memoria de GPU, pero exigen otro formato, un transcodificador WASM y más herramientas. Con una sola textura de detalle a la vez no hace falta |

**Niveles** (propuesta inicial; las pruebas fijan que cada nivel es igual o mejor que el anterior en todo, no los números exactos):

| Ajuste | baja | media | alta |
|---|---|---|---|
| Píxeles por píxel CSS (máximo) | 1 | 1.5 | 2 |
| Antialias (solo al arrancar) | no | sí | sí |
| Texturas de los cuerpos | 1K | 2K | 2K |
| Textura del cuerpo enfocado | — | 4K | 8K si la GPU acepta 8192 px; si no, 4K |
| Fondo de estrellas | 2K | 4K | 8K (se carga después de la vista inicial) |

**Supuestos de este hito** (vienen de preguntas abiertas del PRD; hay que confirmarlos):
- Se soporta cualquier equipo con WebGL 2, incluidos celulares. Sin WebGL sigue el mensaje actual.
- Umbrales de fluidez: al menos 25 FPS de mediana en gama baja y 55 o más en gama alta. El PRD los dejó en TBD.
- El antialias no se puede cambiar sin recrear el contexto WebGL. Si se cambia la calidad a mano, el antialias se aplica en la siguiente visita; lo demás cambia al momento.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Naming | `src/scene/cameraFocus.ts:17` | Interfaz mínima de lo que se usa de Three.js (`CameraControls`) para probar sin navegador. Se repite para el renderer y el cargador de texturas |
| Data | `src/core/bodies.ts:56`, `:168` | Datos tipados e inmutables. La tabla de niveles es `as const` y está congelada |
| Errors | `src/scene/bodyMeshes.ts:42-58` | Si una textura falla, se queda la anterior o el color de respaldo, con `console.warn('[texturas] …')`. Ningún fallo deja la pantalla en blanco |
| Feature detection | `src/core/webgl.ts` | El entorno se inyecta y nunca lanza: una API que falta se trata como "desconocido" |
| Page state | `src/ui/notices.ts:8` | El nivel visible queda en `body[data-calidad]`, útil para el CSS y las E2E |
| Constants | `src/scene/createScene.ts:26-37` | `MAX_PIXEL_RATIO` y similares pasan a la tabla de niveles, con un comentario que explica el porqué |
| Unit tests | `src/scene/cameraFocus.test.ts`, `src/ui/bodyMenu.test.ts:1-6` | Dobles de prueba simples en lugar de WebGL; happy-dom para la UI |
| E2E | `e2e/explorar.spec.ts:112`, `:124` | `page.route` para observar o bloquear texturas y `addInitScript` para simular el navegador |

## Files to Change
| File | Action | Why |
|---|---|---|
| `scripts/textures.mjs` | CREATE | Genera las variantes 1K y 4K a partir de las originales, con calidad JPG fija |
| `package.json` | UPDATE | Script `textures` y devDependency `sharp` |
| `public/textures/{1k,2k,4k,8k}/*` | CREATE / MOVE | Las 2K actuales pasan a `2k/` con `git mv`; se agregan las 8K descargadas y las 1K y 4K generadas |
| `public/textures/CREDITOS.md` | UPDATE | Nuevas resoluciones y la nota "redimensionadas" que exige CC BY 4.0 al modificar |
| `src/core/bodies.ts` + test | UPDATE | `textureFile` pasa a `texture: { name, maxResolution }` (también el anillo) |
| `src/core/textures.ts` + test | CREATE | `TextureResolution` y la mejor resolución disponible para un cuerpo y nivel |
| `src/core/quality.ts` + test | CREATE | Tabla de niveles, `DeviceSignals`, `chooseInitialTier()` y el límite por conexión |
| `src/core/frameMonitor.ts` + test | CREATE | Monitor de fluidez con calentamiento, mediana, pausa tras cambiar texturas y bajada de un nivel |
| `src/scene/deviceSignals.ts` | CREATE | Lee `navigator`, `matchMedia` y las capacidades de WebGL a `DeviceSignals`, sin lanzar errores |
| `src/scene/qualityController.ts` + test | CREATE | Aplica el nivel: pixel ratio, texturas base, textura de detalle al enfocar (liberando la anterior) y fondo |
| `src/scene/bodyMeshes.ts` | UPDATE | Permite cambiar la textura de un cuerpo y liberar la anterior (`dispose`) |
| `src/scene/createScene.ts` | UPDATE | Antialias y pixel ratio según el nivel, monitor en el bucle, aviso de enfoque al controlador, `view.setQuality()` |
| `src/ui/qualityMenu.ts` + test | CREATE | Selector accesible de calidad, persistente, que tolera un `localStorage` bloqueado |
| `src/ui/diagnostics.ts` + test | CREATE | Panel `?diagnostico`: nivel, FPS (mediana), GPU, pixel ratio y resolución de texturas |
| `src/main.ts`, `index.html`, `src/styles.css` | UPDATE | Montar el selector y el diagnóstico |
| `vite.config.ts` | UPDATE | Agregar `src/scene/qualityController.ts` a la cobertura obligatoria |
| `e2e/calidad.spec.ts` | CREATE | Flujos de calidad en el navegador |
| `e2e/explorar.spec.ts` | UPDATE | Ruta nueva de la textura de Marte en la prueba de textura que falla |
| `README.md` | UPDATE | Niveles, selector, `?diagnostico` y `npm run textures` |
| `.claude/prds/sistema-solar-3d.prd.md` | UPDATE | Fila del hito 3 en `in-progress` con enlace a este plan (hecho al crear el plan) |

## Tasks
### Task 1: Texturas por resolución
- **Action**: descargar de Solar System Scope las versiones 8K del Sol, Mercurio, la Tierra, Marte, Júpiter, Saturno, el anillo y las estrellas, más la 4K de la atmósfera de Venus. Antes de descargar, revisar de nuevo la licencia. Mover las 2K actuales a `public/textures/2k/` con nombres cortos (`mars.jpg`). Escribir `scripts/textures.mjs`, que genera `1k/` desde 2K y `4k/` desde 8K, con calidad JPG constante. Actualizar `CREDITOS.md`.
- **Mirror**: n/a
- **Validate**: `npm run textures` es repetible (dos ejecuciones dan los mismos archivos). Tamaños medidos con `du -ch public/textures/*`: 1K ≤ 1.5 MB en total; la carga inicial en media y alta sigue siendo ≤ 5 MB, como hoy. Si `8k/` supera unos 60 MB, se decide contigo si usar Git LFS antes del commit.

### Task 2: Resolución disponible por cuerpo (TDD)
- **Action**: probar `bestResolution(body, wanted)`: Júpiter con 8K pedida da 8K; Urano y Neptuno con 8K dan 2K; Venus con 8K da 4K; ningún cuerpo baja de 1K; la URL usa `import.meta.env.BASE_URL`. Después adaptar `bodies.ts` y su prueba (cada cuerpo declara `maxResolution`).
- **Mirror**: `src/core/bodies.ts`, funciones puras.
- **Validate**: `npx vitest run src/core/textures.test.ts src/core/bodies.test.ts`

### Task 3: Niveles y detección inicial (TDD)
- **Action**: pruebas de `chooseInitialTier(signals)` con una matriz de casos:
  - renderer por software (SwiftShader, llvmpipe, Microsoft Basic Render) o `maxTextureSize` < 4096 da baja;
  - `deviceMemory` ≤ 2 o 2 núcleos o menos da baja;
  - celular (puntero táctil sin puntero fino), ≤ 4 GB o ≤ 4 núcleos da media;
  - el resto da alta;
  - una señal desconocida no baja el nivel;
  - con `saveData` o red `2g`/`3g`, las texturas quedan en el límite de baja aunque la GPU sea alta;
  - una opción manual guardada manda sobre todo.

  Además, cada nivel es igual o mejor que el anterior en todos los ajustes y la tabla no se puede modificar.
- **Mirror**: invariantes como en `src/core/scale.test.ts`.
- **Validate**: `npx vitest run src/core/quality.test.ts`

### Task 4: Monitor de fluidez (TDD)
- **Action**: `createFrameMonitor(options)` recibe la duración de cada cuadro y responde `'bajar'` o `null`. Las pruebas, con cuadros sintéticos, comprueban que:
  - durante el calentamiento (5 s tras la carga) no decide nada;
  - 3 s seguidos con mediana > 40 ms dan `'bajar'` una sola vez y reinician el calentamiento;
  - un pico aislado (la subida de una textura) no cuenta;
  - `pause()` tras un cambio de texturas descarta la ventana actual;
  - en baja ya no pide bajar más;
  - un cuadro con la pestaña oculta o un delta enorme se ignora.
- **Mirror**: funciones puras y estado encapsulado como en `createCameraRig`.
- **Validate**: `npx vitest run src/core/frameMonitor.test.ts`

### Task 5: Señales del dispositivo
- **Action**: `readDeviceSignals(renderer)` lee:
  - `navigator.hardwareConcurrency`, `navigator.deviceMemory` y `navigator.connection` (`saveData`, `effectiveType`), si existen;
  - `matchMedia('(pointer: coarse)')` y `(any-pointer: fine)`;
  - `renderer.capabilities.maxTextureSize`;
  - el nombre de la GPU con `WEBGL_debug_renderer_info` si está disponible (Firefox da un nombre genérico, que cuenta como desconocido).

  Todo va con detección de soporte y sin lanzar errores.
- **Mirror**: `src/core/webgl.ts`.
- **Validate**: lo cubre la E2E (SwiftShader se detecta como software).

### Task 6: Controlador de calidad (TDD con dobles)
- **Action**: `createQualityController(deps)` depende de interfaces mínimas (renderer con `setPixelRatio`, cargador de texturas y cuerpos con `setTexture`). Las pruebas comprueban que:
  - al aplicar un nivel cambia el pixel ratio (limitado por `devicePixelRatio`) y se cargan las texturas base de ese nivel;
  - al enfocar un cuerpo en media o alta se pide su textura de detalle, y al enfocar otro se libera la anterior (`dispose`);
  - en baja o con conexión limitada no se piden texturas de detalle;
  - al volver a la vista general se libera el detalle;
  - si una textura de detalle falla, se queda la base y se avisa con `console.warn`;
  - si llega tarde una respuesta de un cuerpo que ya no está enfocado, se descarta;
  - tras cada cambio de texturas se pausa el monitor;
  - al bajar de nivel por fluidez se aplica el nuevo nivel y `body[data-calidad]` cambia.
- **Mirror**: `src/scene/cameraFocus.ts` (interfaz `CameraControls`) y su prueba.
- **Validate**: `npx vitest run src/scene/qualityController.test.ts`

### Task 7: Integración en la escena
- **Action**: en `createScene.ts`, el renderer se crea con el antialias del nivel inicial; `MAX_PIXEL_RATIO` sale de la tabla de niveles; el bucle pasa cada delta al monitor; `focusOn` y `showOverview` avisan al controlador; el fondo de mayor resolución se pide después de `onTexturesLoaded`. Se usa `ImageBitmapLoader` para el detalle. `bodyMeshes.ts` expone el cambio de textura y libera la anterior. `createScene.ts` debe quedar por debajo de 400 líneas, con la lógica en el controlador.
- **Mirror**: la escena solo consume `core/` y el controlador.
- **Validate**: `npm run dev`, cambiar de nivel con el selector y revisar en el panel de memoria de Chrome DevTools que solo haya una textura de detalle viva.

### Task 8: Selector manual y modo diagnóstico (TDD con happy-dom)
- **Action**: `createQualityMenu(container, handlers)`: un `<select>` con etiqueta visible "Calidad" y las opciones Automática (con el nivel elegido entre paréntesis), Baja, Media y Alta. Guarda la elección en `localStorage`; si `localStorage` lanza un error, funciona igual sin guardar. `createDiagnostics(container)` solo aparece con `?diagnostico` y muestra el nivel, los FPS, la GPU, el pixel ratio y la resolución de texturas, actualizados cada segundo. Probar ambos.
- **Mirror**: `src/ui/bodyMenu.ts`, textos en español y elementos accesibles.
- **Validate**: `npx vitest run src/ui/qualityMenu.test.ts src/ui/diagnostics.test.ts`

### Task 9: Pruebas E2E
- **Action**: `e2e/calidad.spec.ts` verifica que:
  - con SwiftShader la página arranca en `data-calidad="baja"`, solo pide texturas de `1k/` y `2k/` (fondo), nunca de `4k/` ni `8k/`, y descarga ≤ 2 MB de texturas;
  - eligiendo "Alta" en el selector, `data-calidad` cambia y se mantiene tras recargar;
  - en alta, al enfocar Júpiter se pide su textura de detalle (`4k/` u `8k/`) y al enfocar Urano no se pide nada de detalle (no existe);
  - con `localStorage` bloqueado la página carga sin errores;
  - `?diagnostico` muestra el panel con el nivel y los FPS, y sin el parámetro no aparece;
  - el selector se usa con el teclado.

  Además, `explorar.spec.ts` se adapta a la ruta nueva de Marte.
- **Mirror**: `page.route` y `addInitScript` de `e2e/explorar.spec.ts`.
- **Validate**: `npm run test:e2e`

### Task 10: Prueba en equipos reales
- **Action**: medir con `?diagnostico` en:
  1. Chrome DevTools con CPU ×6 más lenta (debe bajar sola a baja y quedar ≥ 25 FPS);
  2. un celular de gama baja o media;
  3. una computadora escolar o de gama baja;
  4. una pantalla 4K (en alta, Júpiter enfocado se ve nítido).

  Anotar los resultados en este plan, en una sección "Resultado".
- **Mirror**: n/a
- **Validate**: tabla de resultados con equipo, nivel elegido, FPS y observaciones. Los equipos reales dependen de que tengas acceso a ellos.

### Task 11: Documentación y revisión
- **Action**: actualizar README y CREDITOS, revisar con los agentes `code-reviewer` y `typescript-reviewer`, corregir los hallazgos CRITICAL y HIGH, y hacer commit `feat: calidad adaptativa (hito 3)`.
- **Validate**: todos los comandos de la sección Validation en verde.

## Validation
```bash
npm run typecheck        # tsc --noEmit
npm run test:coverage    # Vitest, ≥ 80 % en core, ui, cámara y controlador de calidad
npm run build            # build de producción
npm run test:e2e         # Playwright, escritorio y celular
du -ch public/textures/1k public/textures/2k   # presupuesto de la carga inicial
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| La heurística elige mal porque faltan señales (Safari, Firefox) | Alta | Una señal desconocida no penaliza; el monitor de fluidez corrige hacia abajo y el selector manual queda de respaldo |
| Bajar de nivel por un falso positivo (pestaña en segundo plano, ahorro de energía a 30 Hz, subida de una textura) | Media | Calentamiento, mediana sobre 3 s, umbral de 40 ms, pausa tras cambiar texturas y descarte de cuadros con la pestaña oculta |
| Una textura 8K congela la animación o agota la memoria de GPU | Media | Solo una textura de detalle a la vez, se libera la anterior, se decodifica con `ImageBitmapLoader` y se exige `maxTextureSize` ≥ 8192 |
| El repositorio crece mucho con las texturas 8K | Media | Se mide en la tarea 1. Si pasa de unos 60 MB, se decide contigo entre Git LFS o quedarse en 4K como máximo |
| Las E2E solo pueden probar la gama baja (SwiftShader) | Alta | Los otros niveles se fuerzan con el selector manual. La lógica de detección se cubre con pruebas unitarias de matriz |
| Las variantes redimensionadas incumplen la licencia | Baja | CC BY 4.0 permite modificar si se indica. `CREDITOS.md` dice "redimensionadas" |
| Sin equipos reales de gama baja para validar | Media | CPU ×6 en DevTools como aproximación. La medición real queda para el piloto (hito 4) con `?diagnostico` |

## Acceptance
- [ ] Sin configurar nada, la web elige un nivel según el equipo y la conexión
- [ ] Si va lenta, baja sola de nivel y no vuelve a subir en esa visita
- [ ] Con CPU ×6 queda fluida (≥ 25 FPS de mediana)
- [ ] En alta y en una pantalla 4K, el cuerpo enfocado se ve con su textura de mayor resolución
- [ ] Nunca hay más de una textura de detalle cargada
- [ ] El selector manual funciona con teclado y se recuerda entre visitas
- [ ] `?diagnostico` muestra nivel y FPS
- [ ] All tasks complete
- [ ] Validation passes (typecheck, cobertura ≥ 80 %, build, E2E, presupuesto de texturas)
- [ ] Patterns mirrored, not reinvented
- [ ] Sin hallazgos CRITICAL o HIGH en la revisión de código
