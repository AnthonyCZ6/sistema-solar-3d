/**
 * Une los datos físicos (`bodies.ts`) y el contenido de la ficha (`facts.ts`)
 * en filas de texto listas para mostrar. La UI solo pinta lo que sale de aquí.
 */
import { PLANETS, getBody, type CelestialBody, type BodyId } from './bodies'
import {
  FACTS_CHECKED_ON,
  type BodyCategory,
  type BodyFacts,
  type FactSource,
  type PlanetFacts,
  type StarFacts,
} from './facts'
import {
  formatDegrees,
  formatDensity,
  formatEarthRatio,
  formatKm,
  formatLongDate,
  formatMillionKm,
  formatMillionYears,
  formatMonthYear,
  formatNumber,
  formatOrbitalPeriod,
  formatRotation,
  formatTemperature,
} from './format'

export interface FactRow {
  readonly label: string
  readonly value: string
}

export interface FactSheet {
  readonly bodyId: BodyId
  readonly title: string
  readonly categoryLabel: string
  readonly summary: string
  /** Siempre a la vista. */
  readonly keyFacts: readonly FactRow[]
  /** Dentro del desplegable "Más datos". */
  readonly moreFacts: readonly FactRow[]
  readonly curiosities: readonly string[]
  readonly sources: readonly FactSource[]
  readonly checkedOn: string
}

const KM_PER_AU = 149_597_870.7
/** `bodies.ts` expresa la rotación al revés con una inclinación del eje mayor a 90°. */
const RETROGRADE_TILT_DEG = 90
const EARTH_REFERENCE = 'Es la referencia (Tierra = 1)'

const CATEGORY_LABELS: Readonly<Record<BodyCategory, string>> = {
  estrella: 'Estrella',
  rocoso: 'Planeta rocoso',
  gaseoso: 'Gigante gaseoso',
  helado: 'Gigante helado',
}

function row(label: string, value: string): FactRow {
  return Object.freeze({ label, value })
}

function earthsLabel(ratio: number): string {
  const formatted = formatEarthRatio(ratio)
  return `${formatted} ${formatted === '1' ? 'Tierra' : 'Tierras'}`
}

function isEarth(body: CelestialBody): boolean {
  return body.id === 'tierra'
}

function diameter(body: CelestialBody): string {
  const km = formatKm(body.radiusKm * 2)
  if (isEarth(body)) return km
  return `${km} (≈ ${earthsLabel(body.radiusKm / getBody('tierra').radiusKm)})`
}

function mass(body: CelestialBody, facts: BodyFacts): string {
  return isEarth(body) ? EARTH_REFERENCE : `≈ ${earthsLabel(facts.massEarths)}`
}

function gravity(body: CelestialBody, facts: BodyFacts): string {
  return isEarth(body) ? EARTH_REFERENCE : `${formatEarthRatio(facts.gravityEarths)} veces la de la Tierra`
}

function knownMoons(count: number, checkedOn: string): string {
  if (count === 0) return 'Ninguna'
  return `${formatNumber(count)} (a ${formatMonthYear(checkedOn)})`
}

function starRows(body: CelestialBody, facts: StarFacts): Pick<FactSheet, 'keyFacts' | 'moreFacts'> {
  return {
    keyFacts: [
      row('Diámetro', diameter(body)),
      row('Temperatura de la superficie', formatTemperature(facts.surfaceTemperatureC)),
      row('Edad', formatMillionYears(facts.ageMillionYears)),
      row('Planetas que lo orbitan', formatNumber(PLANETS.length)),
      row('Gira sobre su eje en', formatRotation(body.rotationPeriodHours)),
    ],
    moreFacts: [
      row('Masa', mass(body, facts)),
      row('Gravedad', gravity(body, facts)),
      row('Densidad', formatDensity(facts.densityKgM3)),
      row('Temperatura en el centro', formatTemperature(facts.coreTemperatureC)),
      row('Inclinación del eje', formatDegrees(body.axialTiltDeg)),
      row('Composición', facts.composition),
    ],
  }
}

function planetRows(
  body: CelestialBody,
  facts: PlanetFacts,
  checkedOn: string,
): Pick<FactSheet, 'keyFacts' | 'moreFacts'> {
  if (!body.orbit) throw new Error(`Faltan los datos de la órbita de ${body.name}`)
  const retrograde = body.axialTiltDeg > RETROGRADE_TILT_DEG
  return {
    keyFacts: [
      row('Diámetro', diameter(body)),
      row('Distancia media al Sol', formatMillionKm(body.orbit.distanceAu * KM_PER_AU)),
      row('Un año dura', formatOrbitalPeriod(body.orbit.periodDays)),
      row('Gira sobre su eje en', formatRotation(body.rotationPeriodHours)),
      row('Temperatura media', formatTemperature(facts.meanTemperatureC)),
      row('Lunas conocidas', knownMoons(facts.knownMoons, checkedOn)),
    ],
    moreFacts: [
      row('Masa', mass(body, facts)),
      row('Gravedad', gravity(body, facts)),
      row('Densidad', formatDensity(facts.densityKgM3)),
      row('Inclinación del eje', formatDegrees(body.axialTiltDeg)),
      row(
        'Sentido de giro',
        retrograde
          ? 'Al revés que la mayoría de los planetas (retrógrado)'
          : 'Como la mayoría de los planetas',
      ),
      row('Un día solar (de amanecer a amanecer)', formatRotation(facts.solarDayHours)),
      row('Atmósfera', facts.composition),
    ],
  }
}

/** Arma la ficha de un cuerpo. Lanza un error si los datos son de otro tipo de cuerpo. */
export function buildFactSheet(
  body: CelestialBody,
  facts: BodyFacts,
  checkedOn: string = FACTS_CHECKED_ON,
): FactSheet {
  if ((body.kind === 'estrella') !== (facts.category === 'estrella')) {
    throw new Error(`Los datos de tipo "${facts.category}" no corresponden a ${body.name}`)
  }
  const rows =
    facts.category === 'estrella' ? starRows(body, facts) : planetRows(body, facts, checkedOn)
  return Object.freeze({
    bodyId: body.id,
    title: body.name,
    categoryLabel: CATEGORY_LABELS[facts.category],
    summary: facts.summary,
    keyFacts: Object.freeze(rows.keyFacts),
    moreFacts: Object.freeze(rows.moreFacts),
    curiosities: facts.curiosities,
    sources: facts.sources,
    checkedOn: `Datos consultados el ${formatLongDate(checkedOn)}`,
  })
}
