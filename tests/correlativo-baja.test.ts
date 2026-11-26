import assert from 'node:assert/strict';
import test from 'node:test';

import { anioDeFecha, formatearCorrelativo } from '../src/app/services/correlativo-baja';

test('el correlativo usa cinco dígitos y el año de la solicitud', () => {
  assert.equal(formatearCorrelativo(2026, 1), 'TI-BAJA-2026-00001');
  assert.equal(formatearCorrelativo(2026, 42), 'TI-BAJA-2026-00042');
  assert.equal(formatearCorrelativo(2027, 12345), 'TI-BAJA-2027-12345');
});

test('el año se lee del texto ISO sin convertirlo a Date', () => {
  assert.equal(anioDeFecha('2026-11-25'), 2026);
  assert.equal(anioDeFecha('2027-01-05T08:30:00'), 2027);
  assert.equal(anioDeFecha(''), null);
  assert.equal(anioDeFecha('no-fecha'), null);
});

test('la secuencia se reinicia al cambiar de año', () => {
  const anterior = formatearCorrelativo(anioDeFecha('2026-12-31')!, 9);
  const siguiente = formatearCorrelativo(anioDeFecha('2027-01-01')!, 1);
  assert.equal(anterior, 'TI-BAJA-2026-00009');
  assert.equal(siguiente, 'TI-BAJA-2027-00001');
});
