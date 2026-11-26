/**
 * Comparte peticiones idénticas que están en vuelo.
 *
 * No guarda respuestas: en cuanto la petición termina, la clave se libera y
 * la siguiente llamada vuelve al backend. Así se evitan duplicados sin
 * servir datos obsoletos después de una mutación.
 */
export class Deduplicador {
  private readonly enVuelo = new Map<string, Promise<unknown>>();

  obtener<T>(clave: string, ejecutar: () => Promise<T>): Promise<T> {
    const pendiente = this.enVuelo.get(clave);
    if (pendiente) {
      return pendiente as Promise<T>;
    }

    const promesa = Promise.resolve().then(ejecutar);
    this.enVuelo.set(clave, promesa);

    const liberar = () => {
      if (this.enVuelo.get(clave) === promesa) {
        this.enVuelo.delete(clave);
      }
    };
    promesa.then(liberar, liberar);

    return promesa;
  }

  /** Se usa al crear/editar/borrar datos para no reutilizar lecturas en vuelo. */
  invalidarTodo(): void {
    this.enVuelo.clear();
  }
}
