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

/**
 * Mueve el foco en navegadores sin `focusgroup`. Devuelve true si manejó la tecla
 * para que el llamador pueda aplicar preventDefault().
 */
export function moverFocoPestana(tablist: HTMLElement, tecla: string): boolean {
  if ('focusGroup' in HTMLElement.prototype) {
    return false;
  }
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('button'));
  const actual = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (actual < 0) {
    return false;
  }
  const destino = indiceTabSiguiente(actual, tabs.length, tecla);
  if (destino === null || destino === actual) {
    return false;
  }
  tabs[destino].focus();
  return true;
}
