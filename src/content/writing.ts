/** Responsive brush width with restrained pressure variation. */
export function brushWidth(pressure: number, surfaceSize: number): number {
  const safePressure = pressure > 0 ? pressure : 0.5;
  return (18 * surfaceSize * (0.75 + Math.min(1, safePressure) * 0.5)) / 320;
}
