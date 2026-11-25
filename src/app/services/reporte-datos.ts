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
