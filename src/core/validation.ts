/** Lanza RangeError si el valor no es un número mayor que 0 (incluye NaN). */
export function assertPositive(value: number, label: string): void {
  if (!(value > 0)) {
    throw new RangeError(`${label} debe ser mayor que 0 (recibido: ${value})`)
  }
}
