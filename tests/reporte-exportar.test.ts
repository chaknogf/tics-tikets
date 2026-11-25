import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aSpreadsheetXml,
  nombreHojaSeguro,
  valorSeguro,
} from '../src/app/services/reporte-exportar';
import {
  bajasARows,
  conteoARows,
  datosGrafico,
  mantenimientosARows,
  parametrosReporte,
} from '../src/app/services/reporte-datos';

test('el nombre de hoja respeta el límite y los caracteres de Excel', () => {
  assert.equal(nombreHojaSeguro('Resumen diario/2026'), 'Resumen diario_2026');
  assert.equal(nombreHojaSeguro('Mantenimientos realizados 2026').length, 30);
});

test('el XML escapa etiquetas y neutraliza fórmulas', () => {
  const xml = aSpreadsheetXml([
    {
      nombre: 'Prueba',
      filas: [['<script>&', '=SUM(A1:A2)'], ['Normal', 7]],
    },
  ]);

  assert.match(xml, /&lt;script&gt;&amp;/);
  assert.doesNotMatch(xml, /<script>/);
  assert.match(xml, /&#39;=SUM\(A1:A2\)/);
  assert.match(xml, /ss:Name="Prueba"/);
  assert.match(xml, /ss:Type="Number"/);
});

test('los valores peligrosos se marcan como texto', () => {
  assert.equal(valorSeguro('=1+1'), "'=1+1");
  assert.equal(valorSeguro('+cmd'), "'+cmd");
  assert.equal(valorSeguro('-1'), "'-1");
  assert.equal(valorSeguro('@SUM'), "'@SUM");
  assert.equal(valorSeguro('2026-11-25'), '2026-11-25');
  assert.equal(valorSeguro(12), 12);
});

test('los conteos se convierten en filas con porcentaje', () => {
  const filas = conteoARows([
    { etiqueta: 'Abierto', total: 3 },
    { etiqueta: 'Cerrado', total: 1 },
  ]);

  assert.deepEqual(filas, [
    ['Estado', 'Total', 'Porcentaje'],
    ['Abierto', 3, '75.00%'],
    ['Cerrado', 1, '25.00%'],
  ]);
});

test('los datos de gráfica conservan etiquetas y totales', () => {
  assert.deepEqual(
    datosGrafico([
      { etiqueta: 'Alta', total: 2 },
      { etiqueta: 'Media', total: 5 },
    ]),
    { etiquetas: ['Alta', 'Media'], valores: [2, 5] },
  );
});

test('los parámetros de reporte usan los nombres del backend', () => {
  const parametros = parametrosReporte({
    fechaInicio: '2026-11-01',
    fechaFin: '2026-11-25',
    mes: '2026-11',
    usuario: 'admin',
  });

  assert.deepEqual(parametros, {
    fecha_inicio: '2026-11-01',
    fecha_fin: '2026-11-25',
    mes: '2026-11',
    usuario: 'admin',
  });
});

test('las tablas de bajas y mantenimientos llevan encabezado', () => {
  assert.deepEqual(bajasARows([])[0], [
    'Correlativo', 'Fecha', 'Responsable', 'Bien', 'Dictamen', 'Destino',
  ]);
  assert.deepEqual(mantenimientosARows([])[0], [
    'ID', 'Fecha', 'Bien', 'Tipo', 'Técnico', 'Descripción',
  ]);
});
