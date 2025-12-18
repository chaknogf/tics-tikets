import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { DashboardResumen, DashboardPeriodo, DashboardSolicitudes } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ChartsComponent implements OnInit {

  datosDashboard!: DashboardResumen;

  hoy!: DashboardPeriodo;
  mesActual!: DashboardPeriodo;
  anioActual!: DashboardPeriodo;

  porcentajeHoy!: number;
  porcentajeMesActual!: number;
  porcentajeAnioActual!: number;

  cargando = true;
  error = '';

  constructor(private service: ApiService) { }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.cargando = true;
      this.datosDashboard = await this.service.getDashboardSolicitudes();

      // Mapear periodos
      this.hoy = this.datosDashboard.hoy as DashboardPeriodo;
      this.mesActual = this.datosDashboard.mes_actual as DashboardPeriodo;
      this.anioActual = this.datosDashboard.año_actual as DashboardPeriodo;

      // Calcular porcentajes totales para donuts
      this.porcentajeHoy = this.calcularPorcentajeTotal(this.hoy);
      this.porcentajeMesActual = this.calcularPorcentajeTotalMes(this.mesActual);
      this.porcentajeAnioActual = this.calcularPorcentajeTotal(this.anioActual);

      console.log('Dashboard cargado:', this.datosDashboard);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      this.error = 'No se pudieron cargar los datos del dashboard.';
    } finally {
      this.cargando = false;
    }
  }

  // Porcentaje total de cerrados
  calcularPorcentajeTotal(periodo: DashboardPeriodo): number {
    const total = this.anioActual.total || 0;
    const cerrados = this.anioActual.estados.cerrado;
    return total ? Math.round((cerrados * 100) / total) : 0;
  }

  calcularPorcentajeTotalMes(periodo: DashboardPeriodo): number {
    const total = this.mesActual.total || 0;
    const cerrados = this.mesActual.estados.cerrado;
    return total ? Math.round((cerrados * 100) / total) : 0;
  }

  // Devuelve conteo seguro por estado
  getCount(key: 'abiertos' | 'en_proceso' | 'cerrados', periodo: DashboardPeriodo): number {
    if (Array.isArray(periodo.estados)) {
      return (periodo.estados.find(e => e.estado === key) as any)?.total || 0;
    }
    return periodo.estados?.estado === key ? periodo.estados.total : 0;
  }

  // Porcentaje seguro por estado
  getPercent(key: 'abiertos' | 'en_proceso' | 'cerrados', periodo: DashboardPeriodo): number {
    const total = periodo.total || 0;
    if (!total) return 0;
    return Math.round((this.getCount(key, periodo) * 1000) / total) / 10; // 1 decimal
  }

  // Devuelve el valor para CSS --deg
  getDegFor(key: 'abiertos' | 'en_proceso' | 'cerrados', periodo: DashboardPeriodo): string {
    const total = periodo.total || 0;
    if (!total) return '0deg';
    const pct = (this.getCount(key, periodo) * 360) / total;
    return `${pct}deg`;
  }

  // Colores de cada estado
  getColorFor(key: 'abiertos' | 'en_proceso' | 'cerrados'): string {
    switch (key) {
      case 'abiertos': return '#dc3545';
      case 'en_proceso': return '#0dcaf0';
      case 'cerrados': return '#343a40';
      default: return '#6b7280';
    }
  }


}
