# Sistema Solar 3D

Web interactiva en 3D del sistema solar, a escala didáctica y con información de cada cuerpo celeste, para estudiantes de cualquier nivel.

**Estado:** hito 1 de 5 terminado (sistema solar explorable).

## Qué se puede hacer

- Ver el Sol y los 8 planetas girando en sus órbitas y sobre su propio eje.
- Girar la vista, acercarla y alejarla con el mouse, el dedo o el touchpad.
- Tocar un planeta (o elegirlo en el menú) para que la cámara viaje hacia él y lo siga en su órbita.
- Volver a la vista completa con **Ver todo**.
- El menú se puede usar solo con el teclado.

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
npm run test:coverage  # pruebas unitarias con cobertura (mínimo 80 % en src/core/)
npx playwright install chromium   # solo la primera vez, antes de las pruebas E2E
npm run test:e2e       # pruebas en el navegador (Playwright, escritorio y celular)
```

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/core/` | Lógica pura con pruebas: datos de los cuerpos, escala didáctica, órbitas y cálculos de cámara |
| `src/scene/` | Escena 3D con Three.js: mallas, órbitas, cámara y animación |
| `src/ui/` | Menú de cuerpos y estados de la página |
| `e2e/` | Pruebas de extremo a extremo con Playwright |
| `public/textures/` | Texturas de 2K de los planetas y del fondo de estrellas |

## Fuentes y créditos

- Datos físicos: [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/).
- Texturas: [Solar System Scope](https://www.solarsystemscope.com/textures/), licencia CC BY 4.0. Detalle en [`public/textures/CREDITOS.md`](public/textures/CREDITOS.md).

## Documentación del proyecto

- Requisitos: [PRD](.claude/prds/sistema-solar-3d.prd.md)
- Plan del hito 1: [plan](.claude/plans/sistema-solar-explorable.plan.md)
