# Sistema Solar 3D

Web interactiva en 3D del sistema solar, a escala didáctica y con información de cada cuerpo celeste, para estudiantes de cualquier nivel.

**Ver la web:** https://anthonycz6.github.io/sistema-solar-3d/

**Estado:** hito 1 terminado (sistema solar explorable). Hito 2 (fichas informativas) implementado; falta la revisión científica de las fichas.

## Qué se puede hacer

- Ver el Sol y los 8 planetas girando en sus órbitas y sobre su propio eje.
- Girar la vista, acercarla y alejarla con el mouse, el dedo o el touchpad.
- Tocar un planeta (o elegirlo en el menú) para que la cámara viaje hacia él y lo siga en su órbita.
- Cada planeta lleva un aro de su color de tamaño fijo en pantalla, para verlo y tocarlo aunque de lejos mida 1 o 2 píxeles.
- Al elegir un cuerpo se abre su **ficha**: qué es, un resumen sencillo, datos clave comparados con la Tierra, datos curiosos y un desplegable **Más datos** con cifras técnicas. La cámara se corre para que la ficha no tape el cuerpo.
- Cerrar la ficha con el botón **×** o con **Escape**; vuelve a abrirse al pulsar el cuerpo otra vez.
- Volver a la vista completa con **Ver todo**.
- El menú y la ficha se pueden usar solo con el teclado.

> **Escala didáctica:** los tamaños y las distancias están comprimidos para que todo quepa en pantalla. Se respeta qué es más grande y qué está más lejos, no la proporción real.

## Requisitos

- Node.js 22.12 o superior.
- Un navegador con WebGL 2 (Chrome, Edge, Firefox o Safari recientes). Si no lo tiene, la página muestra un mensaje en lugar de quedar en blanco.

## Comandos

```bash
npm install            # instalar dependencias
npm run dev            # servidor de desarrollo en http://localhost:5173
npm run build          # build de producción en dist/
npm run preview        # servir el build de producción

npm run typecheck      # revisar tipos de TypeScript
npm test               # pruebas unitarias (Vitest)
npm run test:coverage  # pruebas unitarias con cobertura (mínimo 80 % en core, ui y la cámara)
npx playwright install chromium   # solo la primera vez, antes de las pruebas E2E
npm run test:e2e       # pruebas en el navegador (Playwright, escritorio y celular)
```

### Integración continua

Cada push a `main` o a una rama `feat/**` corre la verificación completa en una VM de GitHub Actions (Ubuntu): tipos, pruebas unitarias con cobertura, build y pruebas E2E. Si algo falla, las capturas y trazas de Playwright quedan como artefacto `resultados-playwright` durante 7 días. En `main`, si todo pasa, la web se publica en GitHub Pages. Ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/core/` | Lógica pura con pruebas: datos de los cuerpos, contenido de las fichas, formato de cifras, escala didáctica, órbitas, cámara y marcadores |
| `src/scene/` | Escena 3D con Three.js: mallas, órbitas, marcadores, cámara y animación |
| `src/ui/` | Menú de cuerpos, ficha informativa y estados de la página (con pruebas en DOM simulado) |
| `e2e/` | Pruebas de extremo a extremo con Playwright |
| `public/textures/` | Texturas de 2K de los planetas y del fondo de estrellas |

## Fuentes y créditos

- Datos físicos: [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) y [NASA Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html).
- Fichas (resúmenes, datos curiosos y lunas conocidas): páginas de [NASA Science](https://science.nasa.gov/solar-system/) de cada cuerpo, consultadas el 6 de octubre de 2026. Cada ficha enlaza sus fuentes; el detalle está en [`src/core/facts.ts`](src/core/facts.ts).
- Texturas: [Solar System Scope](https://www.solarsystemscope.com/textures/), licencia CC BY 4.0. Detalle en [`public/textures/CREDITOS.md`](public/textures/CREDITOS.md).

## Documentación del proyecto

- Requisitos: [PRD](.claude/prds/sistema-solar-3d.prd.md)
- Plan del hito 1: [plan](.claude/plans/sistema-solar-explorable.plan.md)
- Plan del hito 2: [plan](.claude/plans/fichas-informativas.plan.md)
- Plan del hito 3: [plan](.claude/plans/calidad-adaptativa.plan.md)
