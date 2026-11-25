import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { moverFocoPestana } from '../../services/tabs';
import {
  FrecuenciaItem, MantenimientoCrear, MantenimientoItem, MantenimientoRealizadoItem,
  MantenimientoResumen, Semaforo
} from '../../interface/interfaces';

type PestanaMantenimientos = 'listado' | 'registro';

@Component({
  selector: 'app-mantenimientos',
  templateUrl: './mantenimientos.component.html',
  styleUrls: ['./mantenimientos.component.css', '../tabs.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MantenimientosComponent implements OnInit {
  pestana: PestanaMantenimientos = 'listado';

  items: MantenimientoItem[] = [];
  historial: MantenimientoRealizadoItem[] = [];
  resumen: MantenimientoResumen | null = null;
  frecuencias: FrecuenciaItem[] = [];

  filtroNoBien = '';
  filtroTipo = '';
  filtroSemaforo: Semaforo | '' = '';
  filtroHistorialBien = '';
  filtroHistorialTipo = '';

  pagina = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  readonly limite = 20;

  paginaHistorial = 1;
  totalPaginasHistorial = 1;
  totalRegistrosHistorial = 0;
  readonly limiteHistorial = 20;

  nuevo: MantenimientoCrear = {
    no_bien: '',
    fecha_mantenimiento: new Date().toISOString().slice(0, 10),
    tipo: 'Mantenimiento',
    descripcion: '',
    tecnico: ''
  };

  cargando = false;
  cargandoHistorial = false;
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
    this.cargarHistorial();
  }

  async cargar(pagina = this.pagina): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      const [lista, resumen, frecuencias] = await Promise.all([
        this.api.getMantenimientosConTotal({
          no_bien: this.filtroNoBien,
          tipo_equipo: this.filtroTipo,
          semaforo: this.filtroSemaforo,
          skip: (pagina - 1) * this.limite,
          limit: this.limite
        }),
        this.api.getResumenMantenimientos(),
        this.api.getFrecuenciasMantenimiento()
      ]);
      this.items = lista.items;
      this.totalRegistros = lista.total;
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

  async cargarHistorial(pagina = this.paginaHistorial): Promise<void> {
    this.cargandoHistorial = true;
    try {
      const respuesta = await this.api.getMantenimientosRealizados({
        no_bien: this.filtroHistorialBien,
        tipo: this.filtroHistorialTipo,
        skip: (pagina - 1) * this.limiteHistorial,
        limit: this.limiteHistorial
      });
      this.historial = respuesta.items;
      this.totalRegistrosHistorial = respuesta.total;
      this.totalPaginasHistorial = Math.max(
        1, Math.ceil(this.totalRegistrosHistorial / this.limiteHistorial)
      );
      this.paginaHistorial = pagina;
    } catch (err) {
      console.error('No se pudo cargar el historial de mantenimientos:', err);
    } finally {
      this.cargandoHistorial = false;
    }
  }

  cambiarPagina(direccion: 'prev' | 'next'): void {
    const destino = direccion === 'prev' ? this.pagina - 1 : this.pagina + 1;
    if (destino >= 1 && destino <= this.totalPaginas) {
      this.cargar(destino);
    }
  }

  cambiarPaginaHistorial(direccion: 'prev' | 'next'): void {
    const destino = direccion === 'prev'
      ? this.paginaHistorial - 1
      : this.paginaHistorial + 1;
    if (destino >= 1 && destino <= this.totalPaginasHistorial) {
      this.cargarHistorial(destino);
    }
  }

  alTeclearPestanas(event: KeyboardEvent): void {
    if (moverFocoPestana(event.currentTarget as HTMLElement, event.key)) {
      event.preventDefault();
    }
  }

  alEnfocarPestana(event: FocusEvent, pestana: PestanaMantenimientos): void {
    this.pestana = pestana;
    (event.target as HTMLElement).scrollIntoView({
      block: 'nearest', inline: 'nearest', container: 'nearest'
    } as ScrollIntoViewOptions);
  }

  async guardar(): Promise<void> {
    this.guardando = true;
    this.mensaje = '';
    this.error = '';
    try {
      await this.api.crearMantenimiento(this.nuevo);
      this.mensaje = 'Mantenimiento registrado correctamente.';
      this.nuevo.descripcion = '';
      this.pestana = 'listado';
      await this.cargar(1);
      await this.cargarHistorial(1);
    } catch (err) {
      this.error = 'No se pudo registrar el mantenimiento.';
      console.error(err);
    } finally {
      this.guardando = false;
    }
  }
}
