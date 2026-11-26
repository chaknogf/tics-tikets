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
  fechaEnRango,
  mantenimientosARows,
  normalizarFiltrosReporte,
  parametrosEstadisticas,
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

test('el rango de fechas compara fechas ISO sin convertirlas', () => {
  assert.equal(fechaEnRango('2026-11-01T08:30:00', '2026-11-01', '2026-11-30'), true);
  assert.equal(fechaEnRango('2026-11-30', '2026-11-01', '2026-11-30'), true);
  assert.equal(fechaEnRango('2026-10-31', '2026-11-01', '2026-11-30'), false);
  assert.equal(fechaEnRango('2026-12-01', '2026-11-01', '2026-11-30'), false);
  assert.equal(fechaEnRango(null, '2026-11-01', '2026-11-30'), false);
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

test('los alias de fechas del formulario antiguo se traducen al backend', () => {
  assert.deepEqual(
    parametrosEstadisticas({ fecha_desde: '2026-11-01', fecha_hasta: '2026-11-25', mes: '' }),
    { fecha_inicio: '2026-11-01', fecha_fin: '2026-11-25', mes: '' },
  );
});

test('el rango de fechas prevalece sobre un mes residual', () => {
  const filtros = normalizarFiltrosReporte({
    fechaInicio: '2026-11-01',
    fechaFin: '2026-11-30',
    mes: '2026-10',
    usuario: 'admin',
  });

  assert.deepEqual(filtros, {
    fechaInicio: '2026-11-01',
    fechaFin: '2026-11-30',
    mes: '',
    usuario: 'admin',
  });
  assert.deepEqual(parametrosReporte(filtros), {
    fecha_inicio: '2026-11-01',
    fecha_fin: '2026-11-30',
    usuario: 'admin',
  });
});

test('un mes suelto se convierte en rango inclusive para todas las secciones', () => {
  const filtros = normalizarFiltrosReporte({ mes: '2026-02' });

  assert.equal(filtros.fechaInicio, '2026-02-01');
  assert.equal(filtros.fechaFin, '2026-02-28');
  assert.equal(filtros.mes, '2026-02');
  assert.equal(fechaEnRango('2026-02-28T23:59:00', filtros.fechaInicio!, filtros.fechaFin!), true);
  assert.equal(fechaEnRango('2026-03-01', filtros.fechaInicio!, filtros.fechaFin!), false);
});

test('el rango de un mes bisiesto termina el día 29', () => {
  assert.equal(normalizarFiltrosReporte({ mes: '2024-02' }).fechaFin, '2024-02-29');
});

test('un mes inválido no contamina el rango escrito por el usuario', () => {
  assert.deepEqual(normalizarFiltrosReporte({ mes: '2026-13' }), {
    mes: '',
    fechaInicio: '',
    fechaFin: '',
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
