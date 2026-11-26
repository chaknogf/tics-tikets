import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { ApiService } from '../../services/api.service';
import {
  datosGrafico, fechaEnRango, formatearCorte, hojasReporte,
  normalizarFiltrosReporte, parametrosReporte
} from '../../services/reporte-datos';
import { descargarExcel as guardarExcel } from '../../services/reporte-exportar';
import {
  BajaItem, Currentuser, EstadisticasResponse, ListaConTotal,
  MantenimientoRealizadoItem, ResumenItem
} from '../../interface/interfaces';

@Component({
  selector: 'app-reporteria',
  templateUrl: './reporteria.component.html',
  styleUrls: ['./reporteria.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReporteriaComponent implements OnInit, OnDestroy {
  @ViewChild('informe') informe?: ElementRef<HTMLElement>;
  @ViewChild('graficoEstado') graficoEstado?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoPrioridad') graficoPrioridad?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoAtencion') graficoAtencion?: ElementRef<HTMLCanvasElement>;

  diario: ResumenItem[] = [];
  acumulado: ResumenItem[] = [];
  usuarios: Currentuser[] = [];
  estadisticas: EstadisticasResponse | null = null;
  bajas: BajaItem[] = [];
  mantenimientos: MantenimientoRealizadoItem[] = [];
  cargando = true;
  generandoPdf = false;
  generadoEn = '';
  aviso = '';

  filtros = {
    fechaInicio: '',
    fechaFin: '',
    mes: '',
    usuario: '',
    servicio: '',
    prioridad: '',
    estado: '',
    atencionEn: ''
  };

  private graficas: Chart[] = [];
  private destruido = false;

  constructor(private api: ApiService) {}

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.filtros.fechaInicio = this.formatDate(primerDia);
    this.filtros.fechaFin = this.formatDate(hoy);

    await this.cargarUsuarios();
    await this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.destruirGraficas();
  }

  get periodo(): string {
    const inicio = this.filtros.fechaInicio || 'inicio del periodo';
    const fin = this.filtros.fechaFin || 'fin del periodo';
    return `${inicio} al ${fin}`;
  }

  get periodoArchivo(): string {
    return `${this.filtros.fechaInicio || 'inicio'}-${this.filtros.fechaFin || 'fin'}`;
  }

  get totalSolicitudes(): number {
    return this.estadisticas?.total
      ?? this.diario.reduce((suma, fila) => suma + Number(fila.total || 0), 0);
  }

  get efectividad(): string {
    return Number(this.estadisticas?.efectividad ?? 0).toFixed(2);
  }

  get totalCerrados(): number {
    const porEstado = this.estadisticas?.por_estado ?? [];
    if (porEstado.length) {
      return porEstado
        .filter((item) => /cerr/i.test(item.etiqueta))
        .reduce((suma, item) => suma + Number(item.total || 0), 0);
    }
    return this.diario.reduce((suma, fila) => suma + Number(fila.cerrados || 0), 0);
  }

  get pendientes(): number {
    const enDiario = this.diario.reduce(
      (suma, fila) => suma + Number(fila.abiertos || 0) + Number(fila.en_proceso || 0), 0
    );
    if (enDiario) {
      return enDiario;
    }
    return (this.estadisticas?.por_estado ?? [])
      .filter((item) => !/cerr/i.test(item.etiqueta))
      .reduce((suma, item) => suma + Number(item.total || 0), 0);
  }

  get promedioDiario(): string {
    const dias = new Set(
      this.diario
        .map((fila) => fila.fecha_solicitud?.slice(0, 10))
        .filter((fecha): fecha is string => Boolean(fecha))
    ).size;
    if (!dias) {
      return '0';
    }
    return (this.totalSolicitudes / dias).toFixed(1);
  }

  /** Últimos 14 días con movimiento, para la barra de tendencia del dashboard. */
  get tendencia(): ResumenItem[] {
    const porFecha = new Map<string, ResumenItem>();
    for (const fila of this.diario) {
      const fecha = fila.fecha_solicitud?.slice(0, 10) || 'sin-fecha';
      const actual = porFecha.get(fecha);
      porFecha.set(fecha, actual ? {
        ...actual,
        total: Number(actual.total || 0) + Number(fila.total || 0),
        cerrados: Number(actual.cerrados || 0) + Number(fila.cerrados || 0)
      } : { ...fila, fecha_solicitud: fecha });
    }
    return [...porFecha.values()]
      .sort((a, b) => String(a.fecha_solicitud).localeCompare(String(b.fecha_solicitud)))
      .slice(-14);
  }

  get maxTendencia(): number {
    return Math.max(1, ...this.tendencia.map((fila) => Number(fila.total || 0)));
  }

  async cargarUsuarios(): Promise<void> {
    try {
      this.usuarios = await this.api.getUsers({ limit: 200 });
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }

  /** Recorre todas las páginas: el informe no debe truncarse a 200 filas. */
  private async cargarTodo<T>(
    consultar: (skip: number) => Promise<ListaConTotal<T>>
  ): Promise<T[]> {
    const primera = await consultar(0);
    const items = [...primera.items];
    while (primera.items.length > 0 && items.length < primera.total) {
      const pagina = await consultar(items.length);
      if (!pagina.items.length) {
        break;
      }
      items.push(...pagina.items);
    }
    return items;
  }

  /** Carga todas las secciones; un endpoint ausente no invalida el resto. */
  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.aviso = '';
    // Un mes residual hacía que el backend ignorara Desde/Hasta y que el
    // encabezado del informe mostrara un periodo distinto al de los datos.
    this.filtros = normalizarFiltrosReporte(this.filtros);
    const parametros = parametrosReporte(this.filtros);
    const anio = this.filtros.mes ? this.filtros.mes.slice(0, 4) : undefined;

    const [resumen, estadisticas, bajas, mantenimientos] = await Promise.all([
      this.api.getResumen(
        this.filtros.fechaInicio,
        this.filtros.fechaFin,
        this.filtros.usuario,
        this.filtros.mes
      ),
      this.api.getEstadisticas(parametros).catch((error) => {
        console.error('Error al cargar estadísticas:', error);
        this.aviso = 'Las gráficas no están disponibles con el backend desplegado actual.';
        return null;
      }),
      this.cargarTodo((skip) => this.api.getBajasConTotal({ skip, limit: 200, anio }))
        .catch((error) => {
          console.error('Error al cargar bajas:', error);
          this.aviso = 'El listado de bajas no está disponible con el backend desplegado actual.';
          return [];
        }),
      this.cargarTodo((skip) => this.api.getMantenimientosRealizados({
        skip,
        limit: 200,
        fecha_desde: this.filtros.fechaInicio,
        fecha_hasta: this.filtros.fechaFin
      })).catch((error) => {
        console.error('Error al cargar mantenimientos:', error);
        this.aviso = 'El historial de mantenimientos no está disponible con el backend desplegado actual.';
        return [];
      })
    ]);

    this.diario = this.normalizar(resumen.diario);
    this.acumulado = this.normalizar(resumen.acumulado);
    this.estadisticas = estadisticas;
    this.bajas = bajas.filter((baja) => fechaEnRango(
      baja.fecha_solicitud, this.filtros.fechaInicio, this.filtros.fechaFin
    ));
    this.mantenimientos = mantenimientos;
    this.cargando = false;
    this.generadoEn = formatearCorte(new Date());

    // El canvas existe después de la primera detección de cambios.
    window.setTimeout(() => {
      void this.renderizarGraficas().catch((error) => {
        console.error('No se pudieron dibujar las gráficas:', error);
      });
    }, 0);
  }

  async filtrar(): Promise<void> {
    await this.cargarDatos();
  }

  async limpiar(): Promise<void> {
    const hoy = new Date();
    this.filtros = {
      fechaInicio: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      fechaFin: this.formatDate(hoy),
      mes: '',
      usuario: '',
      servicio: '',
      prioridad: '',
      estado: '',
      atencionEn: ''
    };
    await this.cargarDatos();
  }

  descargarExcel(): void {
    guardarExcel(hojasReporte({
      periodo: this.periodo,
      resumen: this.diario,
      acumulado: this.acumulado,
      estadisticas: this.estadisticas,
      bajas: this.bajas,
      mantenimientos: this.mantenimientos
    }), `informe-soporte-${this.periodoArchivo}.xls`);
  }

  async descargarPdf(): Promise<void> {
    const elemento = this.informe?.nativeElement;
    if (!elemento) {
      return;
    }
    this.generandoPdf = true;
    // content-visibility difiere el pintado; html2canvas necesita el árbol completo.
    elemento.classList.add('exportando-pdf');
    try {
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#05070d',
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (nodo) => nodo.classList.contains('no-pdf')
      });
      const imagen = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const ancho = pdf.internal.pageSize.getWidth() - 20;
      const alto = canvas.height * ancho / canvas.width;
      const altoPagina = pdf.internal.pageSize.getHeight() - 20;

      pdf.addImage(imagen, 'PNG', 10, 10, ancho, alto);
      let consumido = altoPagina;
      while (consumido < alto) {
        pdf.addPage();
        pdf.addImage(imagen, 'PNG', 10, 10 - consumido, ancho, alto);
        consumido += altoPagina;
      }
      pdf.save(`informe-soporte-${this.periodoArchivo}.pdf`);
    } catch (error) {
      this.aviso = 'No se pudo generar el PDF del informe.';
      console.error(error);
    } finally {
      elemento.classList.remove('exportando-pdf');
      this.generandoPdf = false;
    }
  }

  private normalizar(filas: ResumenItem[]): ResumenItem[] {
    return (filas ?? []).map((item) => ({
      ...item,
      diseno: (item as unknown as Record<string, number>)['diseño'] ?? item.diseno
    }));
  }

  private destruirGraficas(): void {
    for (const grafica of this.graficas) {
      grafica.destroy();
    }
    this.graficas = [];
  }

  private async renderizarGraficas(): Promise<void> {
    this.destruirGraficas();
    if (!this.estadisticas || this.destruido) {
      return;
    }

    // Chart.js se carga solo en /reporteria para no inflar el bundle inicial.
    const { default: ChartCtor } = await import('chart.js/auto');
    if (this.destruido) {
      return;
    }

    const familia = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace';
    const reduceMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    ChartCtor.defaults.color = '#a0b2cd';
    ChartCtor.defaults.font.family = familia;
    ChartCtor.defaults.font.size = 11;

    const opciones: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMovimiento ? false : { duration: 450 },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#a0b2cd', maxRotation: 0 }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(26, 41, 64, 0.75)' },
          border: { display: false },
          ticks: { color: '#a0b2cd', precision: 0 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#090e18',
          borderColor: '#34507a',
          borderWidth: 1,
          titleColor: '#e6f0ff',
          bodyColor: '#a0b2cd',
          padding: 10,
          displayColors: false,
          callbacks: { label: (contexto: any) => `${contexto.label}: ${contexto.parsed}` }
        }
      }
    };

    const senales = ['#2de2f5', '#ff5ec9', '#5ef2a4', '#ffc857', '#ff6b81', '#78a8ff'];
    const estado = datosGrafico(this.estadisticas.por_estado ?? []);
    if (this.graficoEstado?.nativeElement) {
      this.graficas.push(new ChartCtor(this.graficoEstado.nativeElement, {
        type: 'doughnut',
        data: {
          labels: estado.etiquetas,
          datasets: [{
            data: estado.valores,
            backgroundColor: estado.etiquetas.map((_, i) => senales[i % senales.length]),
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          ...opciones,
          cutout: '72%',
          scales: undefined,
          plugins: {
            ...opciones.plugins,
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: '#a0b2cd',
                boxWidth: 8,
                boxHeight: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 12,
                font: { family: familia, size: 10 }
              }
            }
          }
        }
      }));
    }

    const coloresPrioridad: Record<string, string> = {
      Alta: '#ff6b81', Media: '#ffc857', Baja: '#5ef2a4'
    };
    const prioridad = datosGrafico(this.estadisticas.por_prioridad ?? []);
    if (this.graficoPrioridad?.nativeElement) {
      this.graficas.push(new ChartCtor(this.graficoPrioridad.nativeElement, {
        type: 'bar',
        data: {
          labels: prioridad.etiquetas,
          datasets: [{
            label: 'Solicitudes',
            data: prioridad.valores,
            backgroundColor: prioridad.etiquetas.map((e) => coloresPrioridad[e] ?? '#2de2f5'),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 34
          }]
        },
        options: opciones
      }));
    }

    const atencion = datosGrafico(this.estadisticas.por_atencion ?? []);
    if (this.graficoAtencion?.nativeElement) {
      this.graficas.push(new ChartCtor(this.graficoAtencion.nativeElement, {
        type: 'bar',
        data: {
          labels: atencion.etiquetas,
          datasets: [{
            label: 'Solicitudes',
            data: atencion.valores,
            backgroundColor: atencion.etiquetas.map((_, i) =>
              i % 2 === 0 ? '#2de2f5' : '#ff5ec9'),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 18
          }]
        },
        options: { ...opciones, indexAxis: 'y' }
      }));
    }
  }

  private formatDate(date: Date): string {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
