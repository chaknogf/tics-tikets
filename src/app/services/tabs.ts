/** Navegación por teclado de pestañas con activación manual. */
export function indiceTabSiguiente(
  actual: number,
  total: number,
  tecla: string,
): number | null {
  if (total <= 0) {
    return null;
  }
  switch (tecla) {
    case 'ArrowRight':
      return Math.min(actual + 1, total - 1);
    case 'ArrowLeft':
      return Math.max(actual - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return null;
  }
}
