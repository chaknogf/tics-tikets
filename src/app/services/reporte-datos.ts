import type {
  BajaItem,
  ConteoItem,
  EstadisticasResponse,
  MantenimientoRealizadoItem,
  ResumenItem,
} from '../interface/interfaces';
import type { CeldaHoja, HojaExcel } from './reporte-exportar';

export interface FiltrosReporte {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  mes?: string | null;
  usuario?: string | null;
  servicio?: string | null;
  prioridad?: string | null;
  estado?: string | null;
  atencionEn?: string | null;
}

const paresFiltro: Array<[keyof FiltrosReporte, string]> = [
  ['fechaInicio', 'fecha_inicio'],
  ['fechaFin', 'fecha_fin'],
  ['mes', 'mes'],
  ['usuario', 'usuario'],
  ['servicio', 'servicio'],
  ['prioridad', 'prioridad'],
  ['estado', 'estado'],
  ['atencionEn', 'atencion_en'],
];

/** Traduce los nombres del formulario a los parámetros que espera FastAPI. */
export function parametrosReporte(filtros: FiltrosReporte): Record<string, string> {
  const parametros: Record<string, string> = {};
  for (const [claveLocal, claveApi] of paresFiltro) {
    const valor = filtros[claveLocal];
    if (valor !== null && valor !== undefined && valor !== '') {
      parametros[claveApi] = String(valor);
    }
  }
  return parametros;
}

/**
 * Marca de corte del informe. Recibe la fecha explícitamente para que el
 * componente la calcule una sola vez al cargar y no en cada detección de
 * cambios (un getter con `new Date()` provoca NG0100 al cambiar de minuto).
 */
export function formatearCorte(fecha: Date): string {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'long', timeStyle: 'short'
  }).format(fecha);
}

/** Compatibilidad con el formulario antiguo que enviaba `fecha_desde`/`fecha_hasta`. */
export function parametrosEstadisticas(filtros: Record<string, unknown>): Record<string, unknown> {
  const parametros = { ...filtros };
  if (!parametros['fecha_inicio'] && parametros['fecha_desde']) {
    parametros['fecha_inicio'] = parametros['fecha_desde'];
  }
  if (!parametros['fecha_fin'] && parametros['fecha_hasta']) {
    parametros['fecha_fin'] = parametros['fecha_hasta'];
  }
  delete parametros['fecha_desde'];
  delete parametros['fecha_hasta'];
  return parametros;
}

/**
 * Deja un único criterio de fecha para todo el informe.
 *
 * El backend da precedencia a `mes` sobre `fecha_inicio`/`fecha_fin`; si el
 * formulario envía ambos, el rango escrito se ignora y el encabezado del
 * informe no coincide con los datos. Por eso el rango explícito gana y el mes
 * residual se descarta. Cuando solo hay mes, se deriva su rango inclusive para
 * que bajas y mantenimientos (filtrados en el cliente) usen el mismo periodo.
 */
export function normalizarFiltrosReporte<T extends FiltrosReporte>(filtros: T): T {
  const fechaInicio = (filtros.fechaInicio ?? '').trim();
  const fechaFin = (filtros.fechaFin ?? '').trim();
  const mes = (filtros.mes ?? '').trim();
  const normalizados: T = {
    ...filtros,
    fechaInicio,
    fechaFin,
    mes: '',
  };

  if (mes && !fechaInicio && !fechaFin) {
    const rango = rangoDelMes(mes);
    if (rango) {
      normalizados.fechaInicio = rango.desde;
      normalizados.fechaFin = rango.hasta;
      normalizados.mes = mes;
    }
  }

  return normalizados;
}

function rangoDelMes(mes: string): { desde: string; hasta: string } | null {
  const coincidencia = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!coincidencia) {
    return null;
  }
  const anio = Number(coincidencia[1]);
  const numero = Number(coincidencia[2]);
  if (numero < 1 || numero > 12) {
    return null;
  }
  const diasPorMes = [31, esBisiesto(anio) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const prefijo = `${coincidencia[1]}-${coincidencia[2]}-`;
  return {
    desde: `${prefijo}01`,
    hasta: `${prefijo}${String(diasPorMes[numero - 1]).padStart(2, '0')}`,
  };
}

function esBisiesto(anio: number): boolean {
  return anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
}

/** Comparación léxica de ISO: evita desplazamientos de zona horaria. */
export function fechaEnRango(
  fecha: string | null | undefined,
  desde: string,
  hasta: string,
): boolean {
  if (!fecha) {
    return false;
  }
  const dia = fecha.slice(0, 10);
  if (desde && dia < desde) {
    return false;
  }
  if (hasta && dia > hasta) {
    return false;
  }
  return true;
}

export function datosGrafico(items: ConteoItem[]): {
  etiquetas: string[];
  valores: number[];
} {
  return {
    etiquetas: items.map((item) => item.etiqueta),
    valores: items.map((item) => Number(item.total) || 0),
  };
}

export function conteoARows(
  items: ConteoItem[],
  etiquetaColumna = 'Estado',
): CeldaHoja[][] {
  const total = items.reduce((suma, item) => suma + (Number(item.total) || 0), 0);
  return [
    [etiquetaColumna, 'Total', 'Porcentaje'],
    ...items.map((item) => {
      const valor = Number(item.total) || 0;
      return [
        item.etiqueta,
        valor,
        total > 0 ? `${((valor / total) * 100).toFixed(2)}%` : '0.00%',
      ];
    }),
  ];
}

function filasResumen(items: ResumenItem[]): CeldaHoja[][] {
  return items.map((item) => [
    item.fecha_solicitud ?? '',
    item.usuario,
    item.total,
    item.cerrados,
    item.abiertos,
    item.en_proceso,
    item.alta,
    item.media,
    item.baja,
    item.red,
    item.computo,
    item.diseno,
    item.software,
    item.menores,
    Number(item.efectividad || 0).toFixed(2),
  ]);
}

const cabeceraResumen: CeldaHoja[] = [
  'Fecha', 'Usuario', 'Total', 'Cerrados', 'Abiertos', 'En proceso',
  'Alta', 'Media', 'Baja', 'Red', 'Cómputo', 'Diseño', 'Software',
  'Menores', 'Efectividad %',
];

export function resumenARows(
  diario: ResumenItem[],
  acumulado: ResumenItem[],
): CeldaHoja[][] {
  return [
    ['Resumen diario'],
    cabeceraResumen,
    ...filasResumen(diario),
    [],
    ['Resumen acumulado'],
    ['Usuario', ...cabeceraResumen.slice(1)],
    ...filasResumen(acumulado),
  ];
}

export function bajasARows(bajas: BajaItem[]): CeldaHoja[][] {
  return [
    ['Correlativo', 'Fecha', 'Responsable', 'Bien', 'Dictamen', 'Destino'],
    ...bajas.map((baja) => [
      baja.correlativo,
      baja.fecha_solicitud,
      baja.responsable_nombre,
      baja.no_bien,
      baja.dictamen,
      baja.destino_final,
    ]),
  ];
}

export function mantenimientosARows(
  mantenimientos: MantenimientoRealizadoItem[],
): CeldaHoja[][] {
  return [
    ['ID', 'Fecha', 'Bien', 'Tipo', 'Técnico', 'Descripción'],
    ...mantenimientos.map((item) => [
      item.id,
      item.fecha_mantenimiento,
      item.no_bien,
      item.tipo,
      item.tecnico ?? '',
      item.descripcion ?? '',
    ]),
  ];
}

export interface DatosReporte {
  periodo: string;
  resumen: ResumenItem[];
  acumulado: ResumenItem[];
  estadisticas: EstadisticasResponse | null;
  bajas: BajaItem[];
  mantenimientos: MantenimientoRealizadoItem[];
}

export function hojasReporte(datos: DatosReporte): HojaExcel[] {
  const estadisticas = datos.estadisticas;
  const hojas: HojaExcel[] = [
    {
      nombre: 'Portada',
      filas: [
        ['Informe de soporte técnico'],
        ['Periodo', datos.periodo],
        ['Generado', new Date().toLocaleString('es-GT')],
        [],
        ['Indicador', 'Valor'],
        ['Solicitudes', estadisticas?.total ?? 0],
        ['Efectividad %', Number(estadisticas?.efectividad ?? 0).toFixed(2)],
        ['Bajas registradas', datos.bajas.length],
        ['Mantenimientos ejecutados', datos.mantenimientos.length],
      ],
    },
    { nombre: 'Resumen', filas: resumenARows(datos.resumen, datos.acumulado) },
  ];

  if (estadisticas) {
    hojas.push(
      { nombre: 'Por estado', filas: conteoARows(estadisticas.por_estado, 'Estado') },
      { nombre: 'Por prioridad', filas: conteoARows(estadisticas.por_prioridad, 'Prioridad') },
      { nombre: 'Por atención', filas: conteoARows(estadisticas.por_atencion, 'Atención') },
      { nombre: 'Por mes', filas: conteoARows(estadisticas.por_mes, 'Mes') },
    );
  }

  hojas.push(
    { nombre: 'Bajas registradas', filas: bajasARows(datos.bajas) },
    { nombre: 'Mantenimientos', filas: mantenimientosARows(datos.mantenimientos) },
  );
  return hojas;
}
