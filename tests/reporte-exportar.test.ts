import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
  formatearCorte,
  mantenimientosARows,
  normalizarFiltrosReporte,
  opcionesGrafica,
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

test('la marca de corte depende solo de la fecha que se le pasa', () => {
  const fecha = new Date('2026-11-26T15:22:00');

  assert.equal(formatearCorte(fecha), formatearCorte(fecha));
  assert.match(formatearCorte(fecha), /2026/);
});

test('la marca de corte no se recalcula en cada detección de cambios', () => {
  const fuente = readFileSync(
    resolve(process.cwd(), 'src/app/soporte/reporteria/reporteria.component.ts'),
    'utf8'
  );

  assert.doesNotMatch(fuente, /get\s+generadoEn\s*\(/);
  assert.match(fuente, /this\.generadoEn\s*=\s*formatearCorte\(/);
});

test('las gráficas no usan el ResizeObserver de Chart.js', () => {
  const opciones = opcionesGrafica(false);
  assert.equal(opciones['responsive'], false);
  assert.equal(opciones['maintainAspectRatio'], false);
  assert.deepEqual(opciones['animation'], { duration: 450 });
  assert.equal(opcionesGrafica(true)['animation'], false);

  const fuente = readFileSync(
    resolve(process.cwd(), 'src/app/soporte/reporteria/reporteria.component.ts'),
    'utf8'
  );
  assert.match(fuente, /window\.addEventListener\('resize', this\.alRedimensionar\)/);
  assert.match(fuente, /window\.removeEventListener\('resize', this\.alRedimensionar\)/);
  assert.match(fuente, /grafica\.resize\(ancho, alto\)/);

  const estilos = readFileSync(
    resolve(process.cwd(), 'src/app/soporte/reporteria/reporteria.component.css'),
    'utf8'
  );
  assert.match(estilos, /\.grafica-canvas\s*\{[^}]*block-size:\s*13rem/s);
});
