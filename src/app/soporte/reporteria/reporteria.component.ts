import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Currentuser, ResumenItem } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-reporteria',
  templateUrl: './reporteria.component.html',
  styleUrls: ['./reporteria.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReporteriaComponent implements OnInit {

  diario: ResumenItem[] = [];
  acumulado: ResumenItem[] = [];
  usuarios: Currentuser[] = [];
  cargando = true;

  // Objeto para los filtros
  filtros = {
    fechaInicio: '',
    fechaFin: '',
    usuario: ''
  };

  constructor(private api: ApiService) { }

  async ngOnInit() {
    this.cargando = true;

    // Inicializar fechas: primer día del mes y hoy
    const hoy = new Date();
    const primerDiaDelMes = new Date();
    primerDiaDelMes.setDate(1);
    primerDiaDelMes.setHours(0, 0, 0, 0);

    this.filtros.fechaInicio = this.formatDate(primerDiaDelMes);
    this.filtros.fechaFin = this.formatDate(hoy);
    this.cargarUsuarios();
    await this.cargarResumen();

    this.cargando = false;
  }

  async cargarUsuarios() {
    try {
      this.usuarios = await this.api.getUsers({});
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }

  // Método para cargar el resumen usando los filtros actuales
  private async cargarResumen() {
    try {
      const data = await this.api.getResumen(
        this.filtros.fechaInicio,
        this.filtros.fechaFin,
        this.filtros.usuario
      );

      // Mapear 'diseño' a 'diseno' en diario
      this.diario = data.diario.map(item => ({
        ...item,
        diseno: (item as any)['diseño']
      }));

      // Mapear 'diseño' a 'diseno' en acumulado
      this.acumulado = data.acumulado.map(item => ({
        ...item,
        diseno: (item as any)['diseño']
      }));

      console.log(this.diario);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  }

  // Método llamado al enviar el formulario de filtros
  async filtrar() {
    this.cargando = true;
    await this.cargarResumen();
    this.cargando = false;
  }

  // Función utilitaria para formatear fechas YYYY-MM-DD
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
