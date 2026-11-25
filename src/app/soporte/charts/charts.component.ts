import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import {
  DashboardResumen, DashboardPeriodo, EstadoClave, EstadisticasResponse, ConteoItem
} from '../../interface/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChartsComponent implements OnInit {
  datosDashboard: DashboardResumen | null = null;
  hoy: DashboardPeriodo | null = null;
  mesActual: DashboardPeriodo | null = null;
  anioActual: DashboardPeriodo | null = null;

  porcentajeHoy = 0;
  porcentajeMesActual = 0;
  porcentajeAnioActual = 0;

  // Reporte interactivo con rango de fechas.
  estadisticas: EstadisticasResponse | null = null;
  fechaDesde = '';
  fechaHasta = '';
  mes = '';
  periodos: ConteoItem[] = [];
  cargandoReporte = false;

  cargando = true;
  error = '';

  readonly estados: EstadoClave[] = ['abierto', 'en_proceso', 'cerrado'];
  readonly etiquetasEstados: Record<EstadoClave, string> = {
    abierto: 'Abierto',
    en_proceso: 'En Proceso',
    cerrado: 'Cerrado'
  };

  constructor(private service: ApiService) {}

  async ngOnInit() {
    await this.cargarDatos();
    await this.cargarReporte();
  }

  async cargarDatos() {
    try {
      this.cargando = true;
      const datos = await this.service.getDashboardSolicitudes() as DashboardResumen;
      this.datosDashboard = datos;

      this.hoy = datos.hoy ?? null;
      this.mesActual = datos.mes_actual ?? null;
      this.anioActual = datos.año_actual ?? null;

      this.porcentajeHoy = this.calcularPorcentajeCerrados(this.hoy);
      this.porcentajeMesActual = this.calcularPorcentajeCerrados(this.mesActual);
      this.porcentajeAnioActual = this.calcularPorcentajeCerrados(this.anioActual);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      this.error = 'No se pudieron cargar los datos del dashboard.';
    } finally {
      this.cargando = false;
    }
  }

  async cargarReporte() {
    try {
      this.cargandoReporte = true;
      this.estadisticas = await this.service.getEstadisticas({
        fecha_desde: this.fechaDesde,
        fecha_hasta: this.fechaHasta,
        mes: this.mes
      });
      this.periodos = this.estadisticas.por_mes;
    } catch (err) {
      console.error('Error al cargar reporte:', err);
    } finally {
      this.cargandoReporte = false;
    }
  }

  private calcularPorcentajeCerrados(periodo: DashboardPeriodo | null): number {
    if (!periodo || !periodo.total) return 0;
    return Math.round((this.getCount('cerrado', periodo) * 100) / periodo.total);
  }

  getCount(key: EstadoClave, periodo: DashboardPeriodo | null): number {
    if (!periodo?.estados) return 0;
    return periodo.estados[key] || 0;
  }

  getPercent(key: EstadoClave, periodo: DashboardPeriodo | null): number {
    if (!periodo || !periodo.total) return 0;
    return Math.round((this.getCount(key, periodo) * 1000) / periodo.total) / 10;
  }

  getDegFor(key: EstadoClave, periodo: DashboardPeriodo | null): string {
    if (!periodo || !periodo.total) return '0deg';
    return `${(this.getCount(key, periodo) * 360) / periodo.total}deg`;
  }

  getColorFor(key: EstadoClave): string {
    switch (key) {
      case 'abierto': return '#dc3545';
      case 'en_proceso': return '#0dcaf0';
      case 'cerrado': return '#343a40';
    }
  }

  get maxPeriodo(): number {
    return Math.max(1, ...this.periodos.map(p => p.total));
  }
}
