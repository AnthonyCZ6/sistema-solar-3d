import { describe, expect, it } from 'vitest'
import { BODIES, SUN, getBody, type BodyId } from './bodies'
import { buildFactSheet, type FactSheet } from './factSheet'
import { FACTS } from './facts'

function sheetFor(id: BodyId): FactSheet {
  return buildFactSheet(getBody(id), FACTS[id])
}

function valueOf(rows: FactSheet['keyFacts'], label: string): string | undefined {
  return rows.find((row) => row.label === label)?.value
}

const PLANET_KEY_LABELS = [
  'Diámetro',
  'Distancia media al Sol',
  'Un año dura',
  'Gira sobre su eje en',
  'Temperatura media',
  'Lunas conocidas',
]

describe('buildFactSheet', () => {
  it('el título es el nombre y el tipo se escribe en palabras', () => {
    expect(sheetFor('jupiter').title).toBe('Júpiter')
    expect(sheetFor('jupiter').categoryLabel).toBe('Gigante gaseoso')
    expect(sheetFor('marte').categoryLabel).toBe('Planeta rocoso')
    expect(sheetFor('urano').categoryLabel).toBe('Gigante helado')
    expect(sheetFor('sol').categoryLabel).toBe('Estrella')
  })

  it('los planetas muestran los mismos datos clave, en el mismo orden', () => {
    for (const body of BODIES.filter((candidate) => candidate.kind === 'planeta')) {
      expect(sheetFor(body.id).keyFacts.map((row) => row.label), body.name).toEqual(
        PLANET_KEY_LABELS,
      )
    }
  })

  it('el diámetro sale del radio de bodies.ts y se compara con la Tierra', () => {
    expect(valueOf(sheetFor('jupiter').keyFacts, 'Diámetro')).toBe('142,984 km (≈ 11 Tierras)')
    expect(valueOf(sheetFor('marte').keyFacts, 'Diámetro')).toBe('6,792 km (≈ 0.53 Tierras)')
  })

  it('la Tierra no se compara consigo misma', () => {
    const earth = sheetFor('tierra')
    expect(valueOf(earth.keyFacts, 'Diámetro')).toBe('12,756 km')
    expect(valueOf(earth.moreFacts, 'Masa')).toBe('Es la referencia (Tierra = 1)')
    expect(valueOf(earth.moreFacts, 'Gravedad')).toBe('Es la referencia (Tierra = 1)')
  })

  it('formatea distancia, año, rotación, temperatura y lunas de un planeta', () => {
    const jupiter = sheetFor('jupiter').keyFacts
    expect(valueOf(jupiter, 'Distancia media al Sol')).toBe('778.5 millones de km')
    expect(valueOf(jupiter, 'Un año dura')).toBe('11.9 años terrestres')
    expect(valueOf(jupiter, 'Gira sobre su eje en')).toBe('9.9 horas')
    expect(valueOf(jupiter, 'Temperatura media')).toBe('-110 °C')
    expect(valueOf(jupiter, 'Lunas conocidas')).toBe('115 (a octubre de 2026)')
  })

  it('un planeta sin lunas dice "Ninguna"', () => {
    expect(valueOf(sheetFor('venus').keyFacts, 'Lunas conocidas')).toBe('Ninguna')
  })

  it('separa la rotación del día solar, que va en "Más datos"', () => {
    const mercury = sheetFor('mercurio')
    expect(valueOf(mercury.keyFacts, 'Gira sobre su eje en')).toBe('58.7 días')
    expect(valueOf(mercury.moreFacts, 'Un día solar (de amanecer a amanecer)')).toBe('175.9 días')
    for (const body of BODIES) {
      const labels = [...sheetFor(body.id).keyFacts, ...sheetFor(body.id).moreFacts].map(
        (row) => row.label,
      )
      expect(labels, body.name).not.toContain('Un día dura')
    }
  })

  it('compara masa y gravedad con la Tierra en "Más datos"', () => {
    const jupiter = sheetFor('jupiter').moreFacts
    expect(valueOf(jupiter, 'Masa')).toBe('≈ 318 Tierras')
    expect(valueOf(jupiter, 'Gravedad')).toBe('2.4 veces la de la Tierra')
    expect(valueOf(jupiter, 'Densidad')).toBe('1,326 kg/m³')
    expect(valueOf(jupiter, 'Inclinación del eje')).toBe('3.1°')
    expect(valueOf(jupiter, 'Atmósfera')).toBe('Hidrógeno (90 %) y helio (10 %)')
  })

  it('Venus y Urano giran al revés que la mayoría; la Tierra no', () => {
    const retrograde = 'Al revés que la mayoría de los planetas (retrógrado)'
    expect(valueOf(sheetFor('venus').moreFacts, 'Sentido de giro')).toBe(retrograde)
    expect(valueOf(sheetFor('urano').moreFacts, 'Sentido de giro')).toBe(retrograde)
    expect(valueOf(sheetFor('tierra').moreFacts, 'Sentido de giro')).toBe(
      'Como la mayoría de los planetas',
    )
  })

  it('el Sol no tiene año ni lunas, y muestra sus propios datos', () => {
    const sun = sheetFor('sol')
    const labels = sun.keyFacts.map((row) => row.label)
    expect(labels).not.toContain('Un año dura')
    expect(labels).not.toContain('Lunas conocidas')
    expect(valueOf(sun.keyFacts, 'Diámetro')).toBe('1,391,400 km (≈ 109 Tierras)')
    expect(valueOf(sun.keyFacts, 'Temperatura de la superficie')).toBe('5,500 °C')
    expect(valueOf(sun.keyFacts, 'Edad')).toBe('4,600 millones de años')
    expect(valueOf(sun.keyFacts, 'Planetas que lo orbitan')).toBe('8')
    expect(valueOf(sun.keyFacts, 'Gira sobre su eje en')).toBe('25.4 días')
    expect(valueOf(sun.moreFacts, 'Temperatura en el centro')).toBe('15.7 millones de °C')
    expect(valueOf(sun.moreFacts, 'Composición')).toBe(FACTS.sol.composition)
  })

  it('copia el resumen, los datos curiosos y las fuentes', () => {
    const saturn = sheetFor('saturno')
    expect(saturn.summary).toBe(FACTS.saturno.summary)
    expect(saturn.curiosities).toEqual(FACTS.saturno.curiosities)
    expect(saturn.sources).toEqual(FACTS.saturno.sources)
  })

  it('indica la fecha de consulta de los datos', () => {
    expect(sheetFor('tierra').checkedOn).toBe('Datos consultados el 6 de octubre de 2026')
  })

  it('todos los cuerpos generan una ficha sin valores vacíos', () => {
    for (const body of BODIES) {
      const sheet = sheetFor(body.id)
      for (const row of [...sheet.keyFacts, ...sheet.moreFacts]) {
        expect(row.value.trim(), `${body.name}: ${row.label}`).not.toBe('')
      }
    }
  })

  it('rechaza datos que no corresponden al cuerpo', () => {
    expect(() => buildFactSheet(SUN, FACTS.tierra)).toThrow(Error)
    expect(() => buildFactSheet(getBody('tierra'), FACTS.sol)).toThrow(Error)
  })
})
