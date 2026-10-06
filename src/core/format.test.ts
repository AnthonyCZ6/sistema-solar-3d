import { describe, expect, it } from 'vitest'
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

describe('formatNumber', () => {
  it('separa los miles con coma y los decimales con punto', () => {
    expect(formatNumber(1_234_567.89, 2)).toBe('1,234,567.89')
  })

  it('sin decimales por defecto', () => {
    expect(formatNumber(12_756.2)).toBe('12,756')
  })
})

describe('formatKm', () => {
  it('muestra kilómetros enteros con separador de miles', () => {
    expect(formatKm(142_984)).toBe('142,984 km')
  })

  it('rechaza valores no positivos', () => {
    expect(() => formatKm(0)).toThrow(RangeError)
  })
})

describe('formatMillionKm', () => {
  it('muestra las distancias grandes en millones de km con un decimal', () => {
    expect(formatMillionKm(778_500_000)).toBe('778.5 millones de km')
  })

  it('quita el decimal cuando es cero', () => {
    expect(formatMillionKm(150_000_000)).toBe('150 millones de km')
  })
})

describe('formatRotation', () => {
  it('hasta 48 horas se muestra en horas', () => {
    expect(formatRotation(23.9)).toBe('23.9 horas')
    expect(formatRotation(48)).toBe('48 horas')
  })

  it('más de 48 horas se muestra en días terrestres', () => {
    expect(formatRotation(72)).toBe('3 días')
    expect(formatRotation(1_407.6)).toBe('58.7 días')
  })

  it('rechaza duraciones no positivas', () => {
    expect(() => formatRotation(-1)).toThrow(RangeError)
  })
})

describe('formatOrbitalPeriod', () => {
  it('hasta 2 años terrestres se muestra en días', () => {
    expect(formatOrbitalPeriod(88)).toBe('88 días')
    expect(formatOrbitalPeriod(365.2)).toBe('365.2 días')
    expect(formatOrbitalPeriod(687)).toBe('687 días')
  })

  it('más de 2 años terrestres se muestra en años terrestres', () => {
    expect(formatOrbitalPeriod(4_331)).toBe('11.9 años terrestres')
    expect(formatOrbitalPeriod(59_800)).toBe('163.7 años terrestres')
  })

  it('rechaza periodos no positivos', () => {
    expect(() => formatOrbitalPeriod(0)).toThrow(RangeError)
  })
})

describe('formatTemperature', () => {
  it('las temperaturas bajo cero llevan signo', () => {
    expect(formatTemperature(-65)).toBe('-65 °C')
  })

  it('usa separador de miles', () => {
    expect(formatTemperature(5_500)).toBe('5,500 °C')
  })

  it('a partir de un millón se muestra en millones', () => {
    expect(formatTemperature(15_700_000)).toBe('15.7 millones de °C')
  })

  it('rechaza valores que no son números', () => {
    expect(() => formatTemperature(Number.NaN)).toThrow(RangeError)
  })
})

describe('formatEarthRatio', () => {
  it('desde 10 redondea a enteros', () => {
    expect(formatEarthRatio(11.21)).toBe('11')
    expect(formatEarthRatio(332_900)).toBe('332,900')
  })

  it('entre 1 y 10 deja hasta un decimal', () => {
    expect(formatEarthRatio(9.45)).toBe('9.5')
    expect(formatEarthRatio(4.01)).toBe('4')
  })

  it('por debajo de 1 deja dos cifras significativas', () => {
    expect(formatEarthRatio(0.383)).toBe('0.38')
    expect(formatEarthRatio(0.0553)).toBe('0.055')
  })

  it('rechaza proporciones no positivas', () => {
    expect(() => formatEarthRatio(0)).toThrow(RangeError)
  })
})

describe('formatDegrees', () => {
  it('deja hasta un decimal', () => {
    expect(formatDegrees(23.4)).toBe('23.4°')
    expect(formatDegrees(177.4)).toBe('177.4°')
  })

  it('los ángulos menores a 1° conservan dos cifras significativas', () => {
    expect(formatDegrees(0.034)).toBe('0.034°')
  })

  it('acepta 0° y rechaza ángulos negativos', () => {
    expect(formatDegrees(0)).toBe('0°')
    expect(() => formatDegrees(-1)).toThrow(RangeError)
  })
})

describe('formatDensity', () => {
  it('muestra kilogramos por metro cúbico', () => {
    expect(formatDensity(5_514)).toBe('5,514 kg/m³')
  })
})

describe('formatMillionYears', () => {
  it('muestra millones de años con separador de miles', () => {
    expect(formatMillionYears(4_600)).toBe('4,600 millones de años')
  })
})

describe('fechas', () => {
  it('formatLongDate muestra día, mes y año en español', () => {
    expect(formatLongDate('2026-10-06')).toBe('6 de octubre de 2026')
  })

  it('formatMonthYear muestra mes y año en español', () => {
    expect(formatMonthYear('2026-10-06')).toBe('octubre de 2026')
  })

  it('no se corre un día por la zona horaria', () => {
    expect(formatLongDate('2026-01-01')).toBe('1 de enero de 2026')
  })

  it('rechaza fechas que no tienen el formato AAAA-MM-DD', () => {
    expect(() => formatLongDate('6/10/2026')).toThrow(RangeError)
    expect(() => formatMonthYear('2026-13-40')).toThrow(RangeError)
  })
})
