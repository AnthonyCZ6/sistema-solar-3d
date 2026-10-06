import { describe, expect, it } from 'vitest'
import { BODIES, PLANETS, type BodyId } from './bodies'
import { FACTS, FACTS_CHECKED_ON, type BodyCategory, type PlanetFacts } from './facts'
import { formatLongDate } from './format'

const EXPECTED_CATEGORIES: Readonly<Record<BodyId, BodyCategory>> = {
  sol: 'estrella',
  mercurio: 'rocoso',
  venus: 'rocoso',
  tierra: 'rocoso',
  marte: 'rocoso',
  jupiter: 'gaseoso',
  saturno: 'gaseoso',
  urano: 'helado',
  neptuno: 'helado',
}
const MIN_SUMMARY_LENGTH = 80
const MAX_SUMMARY_LENGTH = 300
const WATER_DENSITY_KG_M3 = 1000
const OFFICIAL_DOMAINS = ['nasa.gov', 'esa.int']

const allFacts = BODIES.map((body) => ({ body, facts: FACTS[body.id] }))

function planetFacts(): { id: BodyId; facts: PlanetFacts }[] {
  return PLANETS.map((planet) => {
    const facts = FACTS[planet.id]
    if (facts.category === 'estrella') throw new Error(`${planet.name} no puede ser una estrella`)
    return { id: planet.id, facts }
  })
}

function isOfficialHost(hostname: string): boolean {
  return OFFICIAL_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
}

describe('FACTS', () => {
  it('hay una ficha por cada cuerpo, sin sobrantes', () => {
    expect(Object.keys(FACTS).sort()).toEqual(BODIES.map((body) => body.id).sort())
  })

  it('el tipo de cada cuerpo es el esperado y solo el Sol es una estrella', () => {
    for (const { body, facts } of allFacts) {
      expect(facts.category, body.name).toBe(EXPECTED_CATEGORIES[body.id])
      expect(facts.category === 'estrella', body.name).toBe(body.kind === 'estrella')
    }
  })

  it(`cada resumen tiene entre ${MIN_SUMMARY_LENGTH} y ${MAX_SUMMARY_LENGTH} caracteres`, () => {
    for (const { body, facts } of allFacts) {
      expect(facts.summary.length, body.name).toBeGreaterThanOrEqual(MIN_SUMMARY_LENGTH)
      expect(facts.summary.length, body.name).toBeLessThanOrEqual(MAX_SUMMARY_LENGTH)
    }
  })

  it('cada ficha tiene 1 o 2 datos curiosos, sin textos vacíos', () => {
    for (const { body, facts } of allFacts) {
      expect(facts.curiosities.length, body.name).toBeGreaterThanOrEqual(1)
      expect(facts.curiosities.length, body.name).toBeLessThanOrEqual(2)
      for (const text of facts.curiosities) expect(text.trim(), body.name).not.toBe('')
    }
  })

  it('las fuentes son páginas https de la NASA o la ESA, con nombre', () => {
    for (const { body, facts } of allFacts) {
      expect(facts.sources.length, body.name).toBeGreaterThanOrEqual(1)
      for (const source of facts.sources) {
        const url = new URL(source.url)
        expect(url.protocol, source.url).toBe('https:')
        expect(isOfficialHost(url.hostname), source.url).toBe(true)
        expect(source.label.trim(), source.url).not.toBe('')
      }
    }
  })

  it('las cifras físicas son positivas y las temperaturas son números', () => {
    for (const { body, facts } of allFacts) {
      for (const value of [facts.massEarths, facts.gravityEarths, facts.densityKgM3]) {
        expect(value, body.name).toBeGreaterThan(0)
      }
      if (facts.category === 'estrella') {
        expect(facts.coreTemperatureC).toBeGreaterThan(facts.surfaceTemperatureC)
        expect(facts.ageMillionYears).toBeGreaterThan(0)
      } else {
        expect(Number.isFinite(facts.meanTemperatureC), body.name).toBe(true)
        expect(facts.solarDayHours, body.name).toBeGreaterThan(0)
      }
    }
  })

  it('la Tierra es la referencia: su masa y su gravedad valen 1', () => {
    expect(FACTS.tierra.massEarths).toBe(1)
    expect(FACTS.tierra.gravityEarths).toBe(1)
  })

  it('las lunas conocidas son enteros no negativos y la Tierra tiene 1', () => {
    for (const { id, facts } of planetFacts()) {
      expect(Number.isInteger(facts.knownMoons), id).toBe(true)
      expect(facts.knownMoons, id).toBeGreaterThanOrEqual(0)
    }
    expect(planetFacts().find(({ id }) => id === 'tierra')?.facts.knownMoons).toBe(1)
  })

  it('el Sol tiene más masa que todos los planetas juntos', () => {
    const planetsMass = planetFacts().reduce((total, { facts }) => total + facts.massEarths, 0)
    expect(FACTS.sol.massEarths).toBeGreaterThan(planetsMass)
  })

  describe('lo que dicen los textos concuerda con las cifras', () => {
    it('Saturno es el planeta con más lunas conocidas', () => {
      const [most] = [...planetFacts()].sort((a, b) => b.facts.knownMoons - a.facts.knownMoons)
      expect(most?.id).toBe('saturno')
    })

    it('Saturno es menos denso que el agua', () => {
      expect(FACTS.saturno.densityKgM3).toBeLessThan(WATER_DENSITY_KG_M3)
    })

    it('la Tierra es el planeta más denso', () => {
      const [densest] = [...planetFacts()].sort((a, b) => b.facts.densityKgM3 - a.facts.densityKgM3)
      expect(densest?.id).toBe('tierra')
    })

    it('Venus es el planeta más caliente, aunque Mercurio está más cerca del Sol', () => {
      const [hottest] = [...planetFacts()].sort(
        (a, b) => b.facts.meanTemperatureC - a.facts.meanTemperatureC,
      )
      expect(hottest?.id).toBe('venus')
    })

    it('Júpiter tiene más del doble de masa que todos los demás planetas juntos', () => {
      const others = planetFacts().filter(({ id }) => id !== 'jupiter')
      const othersMass = others.reduce((total, { facts }) => total + facts.massEarths, 0)
      expect(FACTS.jupiter.massEarths).toBeGreaterThan(2 * othersMass)
    })

    it('en Mercurio un día solar dura más que su año', () => {
      const mercury = planetFacts().find(({ id }) => id === 'mercurio')
      const yearHours = (PLANETS[0]?.orbit?.periodDays ?? 0) * 24
      expect(mercury?.facts.solarDayHours).toBeGreaterThan(yearHours)
    })
  })

  it('la fecha de consulta es una fecha AAAA-MM-DD válida', () => {
    expect(() => formatLongDate(FACTS_CHECKED_ON)).not.toThrow()
  })

  it('los datos no se pueden modificar', () => {
    expect(Object.isFrozen(FACTS)).toBe(true)
    for (const { body, facts } of allFacts) {
      expect(Object.isFrozen(facts), body.name).toBe(true)
      expect(Object.isFrozen(facts.curiosities), body.name).toBe(true)
      expect(Object.isFrozen(facts.sources), body.name).toBe(true)
      for (const source of facts.sources) expect(Object.isFrozen(source), body.name).toBe(true)
    }
  })
})
