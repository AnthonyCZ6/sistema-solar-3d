/**
 * Formato de cifras para las fichas, en español latinoamericano
 * (coma para los miles y punto para los decimales, como en el resto del proyecto).
 */
import { assertPositive } from './validation'

export const LOCALE = 'es-419'

const HOURS_PER_DAY = 24
const DAYS_PER_EARTH_YEAR = 365.25
/** Hasta este número de horas, una rotación se lee mejor en horas que en días. */
const MAX_ROTATION_HOURS_SHOWN = 48
/** Hasta este número de años terrestres, un año se lee mejor en días. */
const MAX_ORBIT_YEARS_SHOWN_AS_DAYS = 2
const MILLION = 1_000_000
/** Desde este valor, una proporción con la Tierra se redondea a entero. */
const WHOLE_RATIO_FROM = 10
const SIGNIFICANT_DIGITS_BELOW_ONE = 2
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maxFractionDigits }).format(value)
}

/** Números menores a 1 con dos cifras significativas (0.055); el resto, con hasta `maxFractionDigits`. */
function formatReadable(value: number, maxFractionDigits: number): string {
  if (value > 0 && value < 1) {
    return new Intl.NumberFormat(LOCALE, {
      maximumSignificantDigits: SIGNIFICANT_DIGITS_BELOW_ONE,
    }).format(value)
  }
  return formatNumber(value, maxFractionDigits)
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} debe ser un número (recibido: ${value})`)
  }
}

export function formatKm(km: number): string {
  assertPositive(km, 'La distancia')
  return `${formatNumber(km)} km`
}

export function formatMillionKm(km: number): string {
  assertPositive(km, 'La distancia')
  return `${formatNumber(km / MILLION, 1)} millones de km`
}

/** Tiempo en girar sobre su eje: en horas si es corto, en días si es largo. */
export function formatRotation(hours: number): string {
  assertPositive(hours, 'La duración')
  if (hours <= MAX_ROTATION_HOURS_SHOWN) return `${formatNumber(hours, 1)} horas`
  return `${formatNumber(hours / HOURS_PER_DAY, 1)} días`
}

/** Duración del año: en días si es corto, en años terrestres si es largo. */
export function formatOrbitalPeriod(days: number): string {
  assertPositive(days, 'El periodo orbital')
  const years = days / DAYS_PER_EARTH_YEAR
  if (years <= MAX_ORBIT_YEARS_SHOWN_AS_DAYS) return `${formatNumber(days, 1)} días`
  return `${formatNumber(years, 1)} años terrestres`
}

export function formatTemperature(celsius: number): string {
  assertFinite(celsius, 'La temperatura')
  if (Math.abs(celsius) >= MILLION) return `${formatNumber(celsius / MILLION, 1)} millones de °C`
  return `${formatNumber(celsius)} °C`
}

/** Cuántas veces la Tierra, redondeado para leerlo de un vistazo (11, 9.5, 0.38). */
export function formatEarthRatio(ratio: number): string {
  assertPositive(ratio, 'La proporción con la Tierra')
  return formatReadable(ratio, ratio >= WHOLE_RATIO_FROM ? 0 : 1)
}

export function formatDegrees(degrees: number): string {
  if (!(degrees >= 0)) {
    throw new RangeError(`El ángulo no puede ser negativo (recibido: ${degrees})`)
  }
  return `${formatReadable(degrees, 1)}°`
}

export function formatDensity(kgPerCubicMeter: number): string {
  assertPositive(kgPerCubicMeter, 'La densidad')
  return `${formatNumber(kgPerCubicMeter)} kg/m³`
}

export function formatMillionYears(millionYears: number): string {
  assertPositive(millionYears, 'La edad')
  return `${formatNumber(millionYears)} millones de años`
}

/** Convierte "AAAA-MM-DD" en una fecha UTC; así no se corre un día por la zona horaria. */
function parseIsoDate(isoDate: string): Date {
  const match = ISO_DATE.exec(isoDate)
  const date = new Date(`${isoDate}T00:00:00Z`)
  // Date acepta 2026-02-30 y lo pasa a marzo: se compara el día para rechazarlo.
  if (!match || Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(match[3])) {
    throw new RangeError(`La fecha debe tener el formato AAAA-MM-DD (recibido: ${isoDate})`)
  }
  return date
}

export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeZone: 'UTC' }).format(
    parseIsoDate(isoDate),
  )
}

export function formatMonthYear(isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    parseIsoDate(isoDate),
  )
}
