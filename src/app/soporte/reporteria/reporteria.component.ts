import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { ApiService } from '../../services/api.service';
import { datosGrafico, fechaEnRango, hojasReporte, parametrosReporte } from '../../services/reporte-datos';
import { descargarExcel as guardarExcel } from '../../services/reporte-exportar';
import {
  BajaItem, Currentuser, EstadisticasResponse, MantenimientoRealizadoItem, ResumenItem
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

  get generadoEn(): string {
    return new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'long', timeStyle: 'short'
    }).format(new Date());
  }

  get totalSolicitudes(): number {
    return this.estadisticas?.total
      ?? this.diario.reduce((suma, fila) => suma + Number(fila.total || 0), 0);
  }

  get efectividad(): string {
    return Number(this.estadisticas?.efectividad ?? 0).toFixed(2);
  }

  async cargarUsuarios(): Promise<void> {
    try {
      this.usuarios = await this.api.getUsers({});
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }

  /** Carga todas las secciones; un endpoint ausente no invalida el resto. */
  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.aviso = '';
    const parametros = parametrosReporte(this.filtros);
    const anio = this.filtros.mes ? this.filtros.mes.slice(0, 4) : undefined;

    const [resumen, estadisticas, bajas, mantenimientos] = await Promise.all([
      this.api.getResumen(
        this.filtros.fechaInicio, this.filtros.fechaFin, this.filtros.usuario
      ),
      this.api.getEstadisticas(parametros).catch((error) => {
        console.error('Error al cargar estadísticas:', error);
        this.aviso = 'Las gráficas no están disponibles con el backend desplegado actual.';
        return null;
      }),
      this.api.getBajasConTotal({ skip: 0, limit: 200, anio }).catch((error) => {
        console.error('Error al cargar bajas:', error);
        this.aviso = 'El listado de bajas no está disponible con el backend desplegado actual.';
        return { items: [], total: 0 };
      }),
      this.api.getMantenimientosRealizados({
        skip: 0,
        limit: 200,
        fecha_desde: this.filtros.fechaInicio,
        fecha_hasta: this.filtros.fechaFin
      }).catch((error) => {
        console.error('Error al cargar mantenimientos:', error);
        this.aviso = 'El historial de mantenimientos no está disponible con el backend desplegado actual.';
        return { items: [], total: 0 };
      })
    ]);

    this.diario = this.normalizar(resumen.diario);
    this.acumulado = this.normalizar(resumen.acumulado);
    this.estadisticas = estadisticas;
    this.bajas = bajas.items.filter((baja) => fechaEnRango(
      baja.fecha_solicitud, this.filtros.fechaInicio, this.filtros.fechaFin
    ));
    this.mantenimientos = mantenimientos.items;
    this.cargando = false;

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
    try {
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#ffffff',
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

    const opciones: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (contexto: any) => `${contexto.label}: ${contexto.parsed}` } }
      }
    };

    const estado = datosGrafico(this.estadisticas.por_estado ?? []);
    if (this.graficoEstado?.nativeElement) {
      this.graficas.push(new ChartCtor(this.graficoEstado.nativeElement, {
        type: 'doughnut',
        data: {
          labels: estado.etiquetas,
          datasets: [{ data: estado.valores, backgroundColor: ['#0d6efd', '#ffc107', '#198754', '#6c757d'] }]
        },
        options: opciones
      }));
    }

    const prioridad = datosGrafico(this.estadisticas.por_prioridad ?? []);
    if (this.graficoPrioridad?.nativeElement) {
      this.graficas.push(new ChartCtor(this.graficoPrioridad.nativeElement, {
        type: 'bar',
        data: {
          labels: prioridad.etiquetas,
          datasets: [{ label: 'Solicitudes', data: prioridad.valores, backgroundColor: '#0d6efd' }]
        },
        options: { ...opciones, plugins: { ...opciones.plugins, legend: { display: false } } }
      }));
    }

    const atencion = datosGrafico(this.estadisticas.por_atencion ?? []);
    if (this.graficoAtencion?.nativeElement) {
      this.graficas.push(new ChartCtor(this.graficoAtencion.nativeElement, {
        type: 'bar',
        data: {
          labels: atencion.etiquetas,
          datasets: [{ label: 'Solicitudes', data: atencion.valores, backgroundColor: '#0dcaf0' }]
        },
        options: {
          ...opciones,
          indexAxis: 'y',
          plugins: { ...opciones.plugins, legend: { display: false } }
        }
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
