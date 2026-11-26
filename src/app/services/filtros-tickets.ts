import { Ticket } from '../interface/interfaces';

export interface RangoTickets {
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  mes?: string | null;
}

/** Extrae YYYY-MM-DD de un valor ISO con o sin hora (el backend puede devolver DateTime). */
export function fechaSolicitudComoISO(valor: unknown): string | null {
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  if (typeof valor !== 'string') {
    return null;
  }
  const coincidencia = /^(\d{4}-\d{2}-\d{2})/.exec(valor);
  return coincidencia ? coincidencia[1] : null;
}

/**
 * Filtra por fecha_solicitud con la misma regla que aplicar_filtros_tickets:
 * rango inclusivo y, si llega mes, ambos criterios se combinan (AND).
 */
export function ticketEnRango(ticket: Ticket, rango: RangoTickets): boolean {
  const fecha = fechaSolicitudComoISO(ticket.fecha_solicitud);
  const mes = rango.mes?.trim() || '';
  const desde = rango.fecha_desde?.slice(0, 10) || '';
  const hasta = rango.fecha_hasta?.slice(0, 10) || '';

  if (!mes && !desde && !hasta) {
    return true;
  }
  if (!fecha) {
    return false;
  }
  if (mes && !fecha.startsWith(`${mes}-`)) {
    return false;
  }
  if (desde && fecha < desde) {
    return false;
  }
  if (hasta && fecha > hasta) {
    return false;
  }
  return true;
}

/** Paginación sobre el conjunto ya filtrado (el backend antiguo pagina antes de filtrar). */
export function paginar<T>(filas: T[], skip: number, limit: number): T[] {
  const inicio = Math.max(0, Number.isFinite(skip) ? skip : 0);
  const tamanio = Math.max(1, Number.isFinite(limit) ? limit : 10);
  return filas.slice(inicio, inicio + tamanio);
}
