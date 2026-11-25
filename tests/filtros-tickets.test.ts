import assert from 'node:assert/strict';
import test from 'node:test';

import { Ticket } from '../src/app/interface/interfaces';
import {
  fechaSolicitudComoISO,
  paginar,
  ticketEnRango,
} from '../src/app/services/filtros-tickets';

function ticket(fecha?: string): Ticket {
  return { id: 1, ticket: 'TKT-PRUEBA', fecha_solicitud: fecha } as Ticket;
}

test('fecha_solicitud ISO con hora se normaliza a YYYY-MM-DD', () => {
  assert.equal(fechaSolicitudComoISO('2026-11-15T00:00:00'), '2026-11-15');
  assert.equal(fechaSolicitudComoISO('2026-11-15'), '2026-11-15');
  assert.equal(fechaSolicitudComoISO(undefined), null);
});

test('rango por fecha_solicitud incluye ambos extremos', () => {
  const filtros = { fecha_desde: '2026-11-01', fecha_hasta: '2026-11-30' };
  assert.equal(ticketEnRango(ticket('2026-11-01'), filtros), true);
  assert.equal(ticketEnRango(ticket('2026-11-30T08:30:00'), filtros), true);
  assert.equal(ticketEnRango(ticket('2026-10-31'), filtros), false);
  assert.equal(ticketEnRango(ticket('2026-12-01'), filtros), false);
});

test('mes YYYY-MM filtra por fecha_solicitud', () => {
  assert.equal(ticketEnRango(ticket('2026-11-02'), { mes: '2026-11' }), true);
  assert.equal(ticketEnRango(ticket('2026-10-31T23:00:00'), { mes: '2026-11' }), false);
  assert.equal(ticketEnRango(ticket('2026-12-01'), { mes: '2026-11' }), false);
});

test('mes y rango parcial se combinan como en el backend', () => {
  const filtros = { mes: '2026-11', fecha_desde: '2026-11-10' };
  assert.equal(ticketEnRango(ticket('2026-11-05'), filtros), false);
  assert.equal(ticketEnRango(ticket('2026-11-15'), filtros), true);
});

test('sin criterios de fecha no se descarta ningún ticket', () => {
  assert.equal(ticketEnRango(ticket('2026-11-15'), {}), true);
  assert.equal(ticketEnRango(ticket(undefined), {}), true);
  assert.equal(ticketEnRango(ticket(undefined), { mes: '2026-11' }), false);
});

test('paginar aplica skip y limit sobre el conjunto filtrado', () => {
  const filas = Array.from({ length: 12 }, (_, i) => i);
  assert.deepEqual(paginar(filas, 10, 5), [10, 11]);
  assert.deepEqual(paginar(filas, 0, 5), [0, 1, 2, 3, 4]);
});
