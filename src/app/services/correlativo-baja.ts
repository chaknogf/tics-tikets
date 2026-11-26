/** Correlativo de actas: TI-BAJA-YYYY-NNNNN (el backend es la fuente definitiva). */
export function formatearCorrelativo(anio: number, secuencia: number): string {
  return `TI-BAJA-${anio}-${String(Math.max(1, Math.trunc(secuencia))).padStart(5, '0')}`;
}

/** Extrae el año de un YYYY-MM-DD sin pasar por Date, evitando desplazamiento de zona horaria. */
export function anioDeFecha(valor: string | null | undefined): number | null {
  if (!valor) {
    return null;
  }
  const coincide = /^(\d{4})-\d{2}-\d{2}/.exec(valor);
  return coincide ? Number(coincide[1]) : null;
}
