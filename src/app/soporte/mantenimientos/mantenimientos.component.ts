import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import {
  FrecuenciaItem, MantenimientoCrear, MantenimientoItem, MantenimientoResumen, Semaforo
} from '../../interface/interfaces';

@Component({
  selector: 'app-mantenimientos',
  templateUrl: './mantenimientos.component.html',
  styleUrls: ['./mantenimientos.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MantenimientosComponent implements OnInit {
  items: MantenimientoItem[] = [];
  resumen: MantenimientoResumen | null = null;
  frecuencias: FrecuenciaItem[] = [];

  filtroNoBien = '';
  filtroTipo = '';
  filtroSemaforo: Semaforo | '' = '';

  pagina = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  readonly limite = 20;

  nuevo: MantenimientoCrear = {
    no_bien: '',
    fecha_mantenimiento: new Date().toISOString().slice(0, 10),
    tipo: 'Mantenimiento',
    descripcion: '',
    tecnico: ''
  };

  cargando = false;
  guardando = false;
  mensaje = '';
  error = '';

  readonly semaforos: Semaforo[] = ['verde', 'amarillo', 'rojo', 'sin_dato'];
  readonly etiquetas: Record<Semaforo, string> = {
    verde: 'Al día',
    amarillo: 'Próximo',
    rojo: 'Vencido',
    sin_dato: 'Sin dato'
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(pagina = this.pagina): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      const [items, resumen, frecuencias] = await Promise.all([
        this.api.getMantenimientos({
          no_bien: this.filtroNoBien,
          tipo_equipo: this.filtroTipo,
          semaforo: this.filtroSemaforo,
          skip: (pagina - 1) * this.limite,
          limit: this.limite
        }),
        this.api.getResumenMantenimientos(),
        this.api.getFrecuenciasMantenimiento()
      ]);
      this.items = Array.isArray(items) ? items : [];
      this.totalRegistros = (items as any)?.total ?? this.items.length;
      this.totalPaginas = Math.max(1, Math.ceil(this.totalRegistros / this.limite));
      this.pagina = pagina;
      this.resumen = resumen;
      this.frecuencias = frecuencias;
    } catch (err) {
      this.error = 'No se pudieron cargar los mantenimientos. ¿Está aplicada la migración 001?';
      console.error(err);
    } finally {
      this.cargando = false;
    }
  }

  cambiarPagina(direccion: 'prev' | 'next'): void {
    const destino = direccion === 'prev' ? this.pagina - 1 : this.pagina + 1;
    if (destino >= 1 && destino <= this.totalPaginas) {
      this.cargar(destino);
    }
  }

  async guardar(): Promise<void> {
    this.guardando = true;
    this.mensaje = '';
    this.error = '';
    try {
      await this.api.crearMantenimiento(this.nuevo);
      this.mensaje = 'Mantenimiento registrado correctamente.';
      this.nuevo.descripcion = '';
      await this.cargar(1);
    } catch (err) {
      this.error = 'No se pudo registrar el mantenimiento.';
      console.error(err);
    } finally {
      this.guardando = false;
    }
  }
}
