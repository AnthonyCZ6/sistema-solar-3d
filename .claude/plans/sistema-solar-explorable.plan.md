# Plan: Sistema solar explorable

**Source PRD**: `.claude/prds/sistema-solar-3d.prd.md`
**Selected Milestone**: 1. Sistema solar explorable
**Complexity**: Medium

## Summary
Una web que abre directamente una escena 3D con el Sol y los 8 planetas girando en órbita, a escala didáctica. El estudiante puede girar, acercar y enfocar cualquier cuerpo con el mouse, el dedo o un menú. Este hito crea la base técnica (proyecto, datos, escala, movimiento y escena). Las fichas informativas (hito 2) y la calidad adaptativa por gama del dispositivo (hito 3) quedan fuera.

## Decisiones técnicas
| Decisión | Elección | Motivo |
|---|---|---|
| Motor 3D | Three.js (0.186) | Es el estándar de 3D en la web. Incluye controles de cámara con soporte táctil (`OrbitControls`) |
| Herramientas | Vite 8 + TypeScript | Servidor de desarrollo rápido y build estático, fácil de publicar en cualquier hosting |
| Pruebas unitarias | Vitest 5 + cobertura v8 | Se integra con Vite. Exige 80 % de cobertura en la lógica pura (`src/core/`) |
| Pruebas E2E | Playwright 1.63 (Chromium) | Verifica la carga real en el navegador, el menú y el aviso sin WebGL |
| Texturas | Solar System Scope, versiones 2K | Licencia CC BY 4.0 (hay que verificarla al descargar). Existen versiones 8K para el hito 3 |
| Datos | NASA Planetary Fact Sheet | Fuente oficial para radios, distancias y periodos |
| Reutilización | Se construye desde cero sobre Three.js | En GitHub solo hay 1 proyecto parecido con licencia (MIT, 104★, hecho por "vibecoding"); los demás no tienen licencia. Ninguno cubre la escala didáctica ni la calidad adaptativa |

**Supuestos de este hito** (vienen de preguntas abiertas del PRD):
- La interfaz está en **español**.
- Las órbitas son **circulares y en un mismo plano**, una simplificación didáctica. Se muestran la inclinación del eje y la rotación de cada planeta.
- **No hay lunas**: van en el hito 5.
- Funciona en escritorio y móvil (táctil). La optimización por gama queda para el hito 3.

## Patterns to Mirror
No hay código previo en el repo y no hay patrones que copiar. Este hito **establece** las convenciones:

| Category | Source | Pattern |
|---|---|---|
| Naming | (nuevo) | Archivos TS en camelCase (`orbit.ts`, `bodyMenu.ts`). Constantes con nombre, sin números mágicos |
| Errors | (nuevo) | Ninguna falla deja la pantalla en blanco: sin WebGL se muestra un mensaje en español; si una textura falla, se usa el color sólido del cuerpo y `console.warn`. No se usa `console.log` |
| Tests | (nuevo) | Cada `*.test.ts` va junto a su módulo en `src/core/`. Estructura Arrange-Act-Assert. Los E2E van en `e2e/*.spec.ts` |
| Data | (nuevo) | Los datos de los cuerpos son constantes tipadas e inmutables (`readonly`/`as const`) en `src/core/bodies.ts` |

## Files to Change
| File | Action | Why |
|---|---|---|
| `package.json` | CREATE | Dependencias y scripts (`dev`, `build`, `typecheck`, `test`, `test:coverage`, `test:e2e`) |
| `tsconfig.json` | CREATE | TypeScript estricto |
| `vite.config.ts` | CREATE | Build y configuración de Vitest con umbral de cobertura del 80 % en `src/core/` |
| `playwright.config.ts` | CREATE | E2E en Chromium con WebGL por software, levantando `vite preview` |
| `index.html` | CREATE | Punto de entrada: canvas, menú y avisos |
| `src/main.ts` | CREATE | Arranque: detecta WebGL y monta la escena o el aviso |
| `src/styles.css` | CREATE | Diseño a pantalla completa y adaptable a celular |
| `src/core/bodies.ts` | CREATE | Datos reales del Sol y los 8 planetas: radio, distancia, periodos, inclinación del eje, color de respaldo y textura |
| `src/core/scale.ts` | CREATE | Funciones de escala didáctica para tamaño, distancia y tiempo |
| `src/core/orbit.ts` | CREATE | Posición orbital y ángulo de rotación en el tiempo t |
| `src/core/focus.ts` | CREATE | Distancia de cámara al enfocar un cuerpo y límites de zoom |
| `src/core/webgl.ts` | CREATE | Detección de soporte WebGL |
| `src/core/*.test.ts` | CREATE | Pruebas unitarias de los 5 módulos anteriores |
| `src/scene/createScene.ts` | CREATE | Renderer, cámara, luz del Sol, fondo de estrellas y bucle de animación |
| `src/scene/bodyMeshes.ts` | CREATE | Esferas texturizadas, anillos de Saturno y color de respaldo |
| `src/scene/orbitLines.ts` | CREATE | Líneas de las órbitas |
| `src/scene/cameraFocus.ts` | CREATE | Transición suave de cámara, seguimiento del cuerpo y botón "Ver todo" |
| `src/ui/bodyMenu.ts` | CREATE | Menú accesible con los 9 cuerpos (botones, teclado) |
| `src/ui/notices.ts` | CREATE | Aviso "escala didáctica, no real" y mensaje "tu navegador no soporta 3D" |
| `public/textures/*` | CREATE | Texturas 2K del Sol, los 8 planetas, el anillo de Saturno y las estrellas |
| `public/textures/CREDITOS.md` | CREATE | Atribución exigida por la licencia CC BY 4.0 |
| `e2e/explorar.spec.ts` | CREATE | Flujos críticos en el navegador |
| `.gitignore` | UPDATE | Agregar `coverage/`, `test-results/` y `playwright-report/` |
| `README.md` | UPDATE | Cómo instalar, correr y probar el proyecto |
| `.claude/prds/sistema-solar-3d.prd.md` | UPDATE | Fila del hito 1 en `in-progress` con enlace a este plan |

## Tasks
### Task 1: Andamiaje del proyecto
- **Action**: crear el proyecto Vite + TypeScript, instalar `three`, `vitest`, `@vitest/coverage-v8` y `@playwright/test`, definir los scripts y actualizar `.gitignore`.
- **Mirror**: convenciones de la tabla anterior.
- **Validate**: `npm run typecheck && npm run build` termina sin errores.

### Task 2: Datos de los cuerpos (TDD)
- **Action**: primero las pruebas (RED). Hay 9 cuerpos en orden desde el Sol, todos los valores numéricos son positivos, cada uno tiene nombre en español, color de respaldo y ruta de textura, y los datos no se pueden modificar. Después `bodies.ts` con los valores de la NASA Planetary Fact Sheet (GREEN).
- **Mirror**: datos inmutables y tipados.
- **Validate**: `npx vitest run src/core/bodies.test.ts`

### Task 3: Escala didáctica (TDD)
- **Action**: las pruebas fijan **invariantes**, no números:
  - el orden de tamaños se respeta (Júpiter > Saturno > … > Mercurio);
  - el Sol es el cuerpo más grande;
  - ningún planeta queda por debajo de un tamaño mínimo visible;
  - el orden de distancias se respeta;
  - dos órbitas vecinas no se tocan, considerando los radios de los planetas;
  - la órbita de Mercurio queda fuera del Sol.

  Después se implementa una compresión (por ejemplo, una potencia menor a 1) con constantes con nombre.
- **Mirror**: funciones puras sin Three.js.
- **Validate**: `npx vitest run src/core/scale.test.ts`

### Task 4: Movimiento orbital y rotación (TDD)
- **Action**: las pruebas comprueban que:
  - en t=0 cada planeta está en su ángulo inicial;
  - tras un periodo completo vuelve al mismo punto;
  - Mercurio avanza más rápido que Neptuno;
  - la Tierra completa una órbita en la constante `SECONDS_PER_EARTH_YEAR`;
  - el ángulo de rotación propia respeta el periodo de cada planeta, incluida la rotación retrógrada de Venus.

  Después se implementa `orbit.ts`.
- **Mirror**: funciones puras.
- **Validate**: `npx vitest run src/core/orbit.test.ts`

### Task 5: Detección de WebGL y lógica de enfoque (TDD)
- **Action**: probar `webgl.ts` simulando un canvas que sí y otro que no entrega contexto. Probar `focus.ts`: la distancia de cámara es proporcional al radio mostrado y está siempre dentro de los límites de zoom. Después implementar ambos.
- **Mirror**: funciones puras con el entorno inyectado.
- **Validate**: `npm run test:coverage` con ≥ 80 % en `src/core/`.

### Task 6: Texturas y créditos
- **Action**: descargar las texturas 2K de Solar System Scope (Sol, 8 planetas, anillo de Saturno con transparencia, estrellas), **verificar la licencia en su página** y escribir `CREDITOS.md`.
- **Mirror**: n/a
- **Validate**: están las 11 texturas y pesan ≤ 10 MB en total (`du -ch public/textures`).

### Task 7: Escena 3D
- **Action**: montar el renderer con `pixelRatio` limitado a 2, la cámara, la luz puntual en el Sol (que emite luz propia), el fondo de estrellas, las esferas con textura e inclinación del eje, los anillos de Saturno y las líneas de órbita. El bucle de animación usa `orbit.ts` y `scale.ts`. Si una textura falla, se usa el color de respaldo y `console.warn`.
- **Mirror**: la escena solo consume `src/core/`; no hay lógica de cálculo dentro de `scene/`.
- **Validate**: `npm run dev`, revisión visual y consola sin errores.

### Task 8: Navegación y enfoque
- **Action**: `OrbitControls` con límites de zoom de `focus.ts` y soporte táctil. Al hacer clic o tocar un planeta (raycast), la cámara viaja suavemente hacia él y lo sigue en su órbita. El botón "Ver todo" vuelve a la vista general.
- **Mirror**: la distancia viene de `focus.ts`.
- **Validate**: revisión manual con mouse y con la emulación táctil del navegador.

### Task 9: Interfaz
- **Action**: menú con los 9 cuerpos (botones `<button>`, foco visible, navegable con teclado) que enfoca igual que el clic. Indicador "Enfocando: {nombre}". Aviso persistente "Escala didáctica: tamaños y distancias no son reales". Mensaje claro si no hay WebGL. Diseño usable a 360 px de ancho.
- **Mirror**: textos en español y elementos HTML accesibles.
- **Validate**: navegación solo con teclado y vista a 360 px en las herramientas del navegador.

### Task 10: Pruebas E2E
- **Action**: `e2e/explorar.spec.ts` verifica que:
  - la página carga sin errores en consola;
  - el canvas es visible;
  - el menú tiene 9 botones;
  - al pulsar "Júpiter" el indicador dice "Enfocando: Júpiter";
  - "Ver todo" restaura la vista;
  - si se simula un navegador sin WebGL, aparece el mensaje y la página no queda en blanco.

  Además guarda una captura de pantalla como evidencia.
- **Mirror**: las comprobaciones son sobre el DOM, no sobre píxeles, para que las pruebas sean estables.
- **Validate**: `npm run test:e2e`

### Task 11: Documentación y revisión
- **Action**: README con instrucciones, revisión con el agente `code-reviewer`, corrección de hallazgos CRITICAL y HIGH, y commit `feat: sistema solar 3D explorable (hito 1)`.
- **Validate**: todos los comandos de la sección Validation en verde.

## Validation
```bash
npm run typecheck        # tsc --noEmit
npm run test:coverage    # Vitest, ≥ 80 % en src/core/
npm run build            # build de producción
npm run test:e2e         # Playwright sobre vite preview
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| WebGL inestable en Chromium headless (E2E poco fiables) | Media | WebGL por software (SwiftShader) y comprobaciones sobre el DOM, no sobre píxeles |
| La licencia de las texturas no es la esperada | Baja | Verificarla antes de descargar. Alternativa: texturas de dominio público de la NASA |
| TypeScript 7 (versión nativa, reciente) es incompatible con alguna herramienta | Baja | Fijar TypeScript 6.x si algo falla en `typecheck` |
| Va lento en equipos escolares antes del hito 3 | Media | Texturas 2K y `pixelRatio` limitado a 2. La adaptación completa es del hito 3 |
| Es difícil hacer clic en planetas pequeños y en movimiento | Alta | Menú de cuerpos y tamaño mínimo visible garantizado por las pruebas de escala |
| La escala didáctica induce ideas erróneas | Media | Aviso persistente en pantalla |
| Los supuestos (español, órbitas circulares, sin lunas) no coinciden con lo que quieres | Media | Confirmarlos antes de empezar |

## Acceptance
- [x] Al abrir la web se ven el Sol y los 8 planetas orbitando en 3D
- [x] Se puede girar, acercar y enfocar con mouse, toque y menú
- [x] "Ver todo" vuelve a la vista general
- [x] Sin WebGL aparece un mensaje claro (no una pantalla en blanco)
- [x] El aviso de escala didáctica está visible
- [x] All tasks complete
- [x] Validation passes (typecheck, cobertura ≥ 80 % en `src/core/`, build, E2E)
- [x] Patterns mirrored, not reinvented
- [x] Sin hallazgos CRITICAL o HIGH en la revisión de código

## Resultado (2026-10-05)
- Pruebas unitarias: 55 en verde; cobertura de `src/core/`: 97 % instrucciones, 90 % ramas, 95.7 % funciones, 100 % líneas.
- E2E: 16 en verde (8 escenarios × escritorio y celular), incluido clic en la escena, celular horizontal, textura que falla y navegador sin WebGL.
- Revisión de código: sin CRITICAL ni HIGH. Se corrigieron los 5 MEDIUM (menú en celular horizontal, "Ver todo" fuera de vista, reajuste al rotar la pantalla, pérdida del contexto WebGL, errores en el bucle de animación) y varios LOW.
- Pendiente para hitos siguientes: pruebas unitarias de `scene/cameraFocus.ts` y `ui/bodyMenu.ts` (hoy cubiertas solo por E2E); en la vista general los planetas interiores se ven muy pequeños.
