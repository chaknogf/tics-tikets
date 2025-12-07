import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { DashboardSolicitudes, DashboardPeriodo, DashboardResumen, PeriodoResumen } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ChartsComponent implements OnInit {

  datosDashboard: DashboardResumen = {
    hoy: {
      total: 0,
      estados: [],
      prioridades: [],
      variacion: []
    },
    mes_actual: {
      total: 0,
      estados: [],
      prioridades: [],
      variacion: []
    },
    año_actual: {
      total: 0,
      estados: [],
      prioridades: [],
      variacion: []
    }
  };
  hoy!: DashboardPeriodo;
  mesActual!: DashboardPeriodo;
  anioActual!: DashboardPeriodo;

  totalHoy!: number;
  totalMesActual!: number;
  totalAnioActual!: number;

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
      console.log('Datos del dashboard cargados:', this.datosDashboard);

    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      this.error = 'No se pudieron cargar los datos del dashboard.';
    } finally {
      this.cargando = false;
    }
  }

  calcularPorcentaje(valor: number | undefined): number {
    if (!this.mesActual || !this.mesActual.estados) return 0;
    const total = this.mesActual.estados.abierto + this.mesActual.estados.en_proceso + this.mesActual.estados.cerrado;
    if (total === 0) return 0;
    return Math.round((valor || 0) * 100 / total) || 0;
  }


  // dentro de tu ChartsComponent

  // Mapea nombre a color (puedes cambiar colores)
  getColorFor(key: 'abierto' | 'en_proceso' | 'cerrado'): string {
    switch (key) {
      case 'abierto': return '#dc3545';    // rojo
      case 'en_proceso': return '#0dcaf0'; // celeste
      case 'cerrado': return '#343a40';   // gris oscuro
      default: return '#6b7280';
    }
  }

  // Devuelve conteo seguro
  getCount(key: 'abierto' | 'en_proceso' | 'cerrado'): number {
    return this.mesActual?.estados?.[key] ?? 0;
  }

  // Calcula porcentaje (redondeado a 1 dec) para mostrar texto
  getPercent(key: 'abierto' | 'en_proceso' | 'cerrado'): number {
    const total = (this.mesActual?.estados?.abierto ?? 0)
      + (this.mesActual?.estados?.en_proceso ?? 0)
      + (this.mesActual?.estados?.cerrado ?? 0);
    if (!total) return 0;
    const pct = (this.getCount(key) * 100) / total;
    return Math.round(pct * 10) / 10; // 1 decimal
  }

  // Devuelve el valor para la variable CSS --deg en grados (ej: "120deg")
  getDegFor(key: 'abierto' | 'en_proceso' | 'cerrado'): string {
    const pct = this.getPercent(key);
    const deg = (pct * 360) / 100; // 100% => 360deg
    return `${deg}deg`;
  }
}
