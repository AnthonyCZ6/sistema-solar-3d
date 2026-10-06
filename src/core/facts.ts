/**
 * Contenido de las fichas informativas: lo que no está ya en `bodies.ts`.
 *
 * Fuentes (consultadas en FACTS_CHECKED_ON):
 * - Cifras: NASA Planetary Fact Sheet, tabla "Ratio to Earth" y fichas detalladas
 *   de cada planeta (https://nssdc.gsfc.nasa.gov/planetary/factsheet/), y NASA Sun Fact Sheet.
 * - Lunas conocidas: páginas de lunas de NASA Science (actualizadas en septiembre de 2026;
 *   la Fact Sheet de marzo de 2025 está desactualizada en este dato).
 * - Resúmenes y datos curiosos: páginas "Facts" de NASA Science de cada cuerpo.
 *   Cada afirmación que depende de una cifra tiene una prueba en `facts.test.ts`.
 */
import type { BodyId } from './bodies'

export type BodyCategory = 'estrella' | 'rocoso' | 'gaseoso' | 'helado'

export interface FactSource {
  readonly label: string
  readonly url: string
}

interface CommonFacts {
  /** 2 o 3 frases sencillas, para estudiantes de 10 a 14 años. */
  readonly summary: string
  readonly curiosities: readonly string[]
  /** Masa comparada con la de la Tierra (Tierra = 1). */
  readonly massEarths: number
  /** Gravedad en la superficie comparada con la de la Tierra (Tierra = 1). */
  readonly gravityEarths: number
  readonly densityKgM3: number
  /** Gases principales: la atmósfera de un planeta o la superficie del Sol. */
  readonly composition: string
  readonly sources: readonly FactSource[]
}

export interface StarFacts extends CommonFacts {
  readonly category: 'estrella'
  readonly surfaceTemperatureC: number
  readonly coreTemperatureC: number
  readonly ageMillionYears: number
}

export interface PlanetFacts extends CommonFacts {
  readonly category: Exclude<BodyCategory, 'estrella'>
  /** En los gigantes, donde la presión es igual a la del nivel del mar en la Tierra (1 bar). */
  readonly meanTemperatureC: number
  readonly knownMoons: number
  /** De un amanecer al siguiente, en horas. No es lo mismo que el periodo de rotación. */
  readonly solarDayHours: number
}

export type BodyFacts = StarFacts | PlanetFacts

/** Fecha en que se consultaron las fuentes (AAAA-MM-DD). */
export const FACTS_CHECKED_ON = '2026-10-06'

const PLANET_FACT_SHEET: FactSource = {
  label: 'NASA Planetary Fact Sheet',
  url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
}

function nasaScience(name: string, path: string): FactSource {
  return { label: `NASA Science: ${name}`, url: `https://science.nasa.gov/${path}/facts/` }
}

function nasaMoons(name: string, path: string): FactSource {
  return { label: `NASA Science: lunas de ${name}`, url: `https://science.nasa.gov/${path}/moons/` }
}

const RAW_FACTS: Readonly<Record<BodyId, BodyFacts>> = {
  sol: {
    category: 'estrella',
    summary:
      'El Sol es una estrella: una enorme esfera de gas muy caliente que da luz y calor. Su gravedad mantiene a los planetas en sus órbitas, y sin su energía no habría vida en la Tierra.',
    curiosities: ['Contiene el 99.8 % de toda la masa del sistema solar.'],
    massEarths: 332_900,
    gravityEarths: 28,
    densityKgM3: 1_408,
    composition: 'Hidrógeno (91 %) y helio (9 %) en su superficie',
    // Temperatura efectiva de 5772 K y central de 1.571 × 10⁷ K, pasadas a °C.
    surfaceTemperatureC: 5_500,
    coreTemperatureC: 15_700_000,
    ageMillionYears: 4_600,
    sources: [
      nasaScience('el Sol', 'sun'),
      {
        label: 'NASA Sun Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html',
      },
    ],
  },
  mercurio: {
    category: 'rocoso',
    summary:
      'Mercurio es el planeta más pequeño y el más cercano al Sol. Como casi no tiene atmósfera que guarde el calor, de día llega a 430 °C y de noche baja a -180 °C.',
    curiosities: [
      'Un día en Mercurio, de un amanecer al siguiente, dura 176 días terrestres: más que su año, que dura 88.',
    ],
    massEarths: 0.0553,
    gravityEarths: 0.378,
    densityKgM3: 5_429,
    composition: 'Casi no tiene: una capa muy tenue de sodio, magnesio, oxígeno e hidrógeno',
    meanTemperatureC: 167,
    knownMoons: 0,
    solarDayHours: 4_222.6,
    sources: [nasaScience('Mercurio', 'mercury'), PLANET_FACT_SHEET],
  },
  venus: {
    category: 'rocoso',
    summary:
      'Venus es casi del tamaño de la Tierra, pero es el planeta más caliente del sistema solar: su atmósfera espesa de dióxido de carbono atrapa el calor. En su superficie hay unos 464 °C.',
    curiosities: [
      'Gira al revés que la Tierra: allí el Sol sale por el oeste y se pone por el este.',
      'Es el tercer objeto más brillante del cielo, después del Sol y la Luna.',
    ],
    massEarths: 0.815,
    gravityEarths: 0.907,
    densityKgM3: 5_243,
    composition: 'Muy espesa: dióxido de carbono (96.5 %) y nitrógeno (3.5 %)',
    meanTemperatureC: 464,
    knownMoons: 0,
    solarDayHours: 2_802,
    sources: [nasaScience('Venus', 'venus'), PLANET_FACT_SHEET],
  },
  tierra: {
    category: 'rocoso',
    summary:
      'La Tierra es nuestro hogar y el único lugar conocido donde hay seres vivos. Es el planeta rocoso más grande, y su atmósfera de nitrógeno y oxígeno nos permite respirar.',
    curiosities: ['Es el planeta más denso del sistema solar.'],
    massEarths: 1,
    gravityEarths: 1,
    densityKgM3: 5_514,
    composition: 'Nitrógeno (78 %) y oxígeno (21 %)',
    meanTemperatureC: 15,
    knownMoons: 1,
    solarDayHours: 24,
    sources: [nasaScience('la Tierra', 'earth'), PLANET_FACT_SHEET],
  },
  marte: {
    category: 'rocoso',
    summary:
      'Marte es el planeta rojo: los minerales de hierro de su suelo se oxidan, como la herrumbre, y lo tiñen de rojo. Es frío, seco y mide más o menos la mitad que la Tierra.',
    curiosities: [
      'Tiene el volcán más grande del sistema solar, el monte Olimpo, mucho más alto que el Everest.',
      'Sus dos lunas, Fobos y Deimos, son pequeñas y quizá sean asteroides que Marte atrapó.',
    ],
    massEarths: 0.107,
    gravityEarths: 0.377,
    densityKgM3: 3_934,
    composition: 'Muy delgada: dióxido de carbono (95 %), nitrógeno (2.6 %) y argón (1.9 %)',
    meanTemperatureC: -65,
    knownMoons: 2,
    solarDayHours: 24.7,
    sources: [nasaScience('Marte', 'mars'), PLANET_FACT_SHEET],
  },
  jupiter: {
    category: 'gaseoso',
    summary:
      'Júpiter es el planeta más grande. Es un gigante de gas sin superficie sólida, con franjas de nubes y la Gran Mancha Roja, una tormenta más grande que la Tierra que dura desde hace cientos de años.',
    curiosities: [
      'Tiene más del doble de masa que todos los demás planetas juntos.',
      'Tiene el día más corto del sistema solar: gira sobre sí mismo en menos de 10 horas.',
    ],
    massEarths: 317.8,
    gravityEarths: 2.36,
    densityKgM3: 1_326,
    composition: 'Hidrógeno (90 %) y helio (10 %)',
    meanTemperatureC: -110,
    knownMoons: 115,
    solarDayHours: 9.9,
    sources: [nasaScience('Júpiter', 'jupiter'), nasaMoons('Júpiter', 'jupiter'), PLANET_FACT_SHEET],
  },
  saturno: {
    category: 'gaseoso',
    summary:
      'Saturno es famoso por sus anillos, hechos de miles de millones de trozos de hielo y roca. Es un gigante de gas menos denso que el agua y el planeta con más lunas conocidas.',
    curiosities: [
      'Sus anillos se extienden hasta 282,000 km desde el planeta, pero en los anillos principales miden solo unos 10 metros de grosor.',
    ],
    massEarths: 95.2,
    gravityEarths: 0.916,
    densityKgM3: 687,
    composition: 'Hidrógeno (96 %) y helio (3 %)',
    meanTemperatureC: -140,
    knownMoons: 293,
    solarDayHours: 10.7,
    sources: [nasaScience('Saturno', 'saturn'), nasaMoons('Saturno', 'saturn'), PLANET_FACT_SHEET],
  },
  urano: {
    category: 'helado',
    summary:
      'Urano es un gigante helado que gira de lado: su eje está tan inclinado que recorre su órbita como una pelota que rueda. El metano de su atmósfera le da su color azul verdoso.',
    curiosities: [
      'Lo descubrió William Herschel en 1781; al principio creyó que era un cometa o una estrella.',
    ],
    massEarths: 14.5,
    gravityEarths: 0.889,
    densityKgM3: 1_270,
    composition: 'Hidrógeno (83 %), helio (15 %) y metano (2 %)',
    meanTemperatureC: -195,
    knownMoons: 29,
    solarDayHours: 17.2,
    sources: [nasaScience('Urano', 'uranus'), nasaMoons('Urano', 'uranus'), PLANET_FACT_SHEET],
  },
  neptuno: {
    category: 'helado',
    summary:
      'Neptuno es el planeta más lejano: está más de 30 veces más lejos del Sol que la Tierra. Es un gigante helado, oscuro y frío, azotado por vientos supersónicos.',
    curiosities: [
      'Sus vientos pueden ser nueve veces más fuertes que los de la Tierra.',
      'Se descubrió en 1846, y en 2011 completó su primera vuelta al Sol desde entonces.',
    ],
    massEarths: 17.1,
    gravityEarths: 1.12,
    densityKgM3: 1_638,
    composition: 'Hidrógeno (80 %), helio (19 %) y metano (1.5 %)',
    meanTemperatureC: -200,
    knownMoons: 16,
    solarDayHours: 16.1,
    sources: [nasaScience('Neptuno', 'neptune'), nasaMoons('Neptuno', 'neptune'), PLANET_FACT_SHEET],
  },
}

function freezeFacts(facts: BodyFacts): BodyFacts {
  return Object.freeze({
    ...facts,
    curiosities: Object.freeze([...facts.curiosities]),
    sources: Object.freeze(facts.sources.map((source) => Object.freeze({ ...source }))),
  })
}

/** Ficha de cada cuerpo. El tipo `Record` obliga a que estén los 9. */
export const FACTS: Readonly<Record<BodyId, BodyFacts>> = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_FACTS).map(([id, facts]) => [id, freezeFacts(facts)]),
  ) as Record<BodyId, BodyFacts>,
)
