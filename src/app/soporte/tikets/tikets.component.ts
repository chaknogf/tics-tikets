import { editorIcon, detalleIcon, filterIcons } from '../../shared/icons/icons';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Ticket } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChartsComponent } from "../charts/charts.component";
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-tikets',
  templateUrl: './tikets.component.html',
  styleUrls: ['./tikets.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ChartsComponent]
})
export class TiketsComponent implements OnInit {
  tikets: Ticket[] = [];
  buscarTicket = '';
  buscarServicio = '';
  buscarAtencionEn = '';
  buscarEstado: string | null = null; // null = no filtrar
  buscarPrioridad = '';
  buscarId = '';
  mes = '';
  cargando = false;
  origen = '';

  options: { nombre: string; descripcion: string; ruta: string; icon: string }[] = [];

  // iconos
  icons: { [key: string]: any } = {};

  // 🔹 Control de paginación
  paginaActual = 1;
  totalPaginas = 1;
  limite = 10;
  totalRegistros = 0;



  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private iconService: IconService
  ) {
    this.icons = {
      editor: this.iconService.getIcon("editorIcon"),
      detalle: this.iconService.getIcon("detalleIcon"),
      filter: this.iconService.getIcon("filterIcons"),
    }

  }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.origen = params.get('origen') || '';
      this.obtenerTikets();
    });
  }

  async obtenerTikets(pagina: number = this.paginaActual) {
    this.cargando = true;
    const skip = (pagina - 1) * this.limite;

    const filtros = {
      ticket: this.buscarTicket,
      servicio: this.buscarServicio,
      atencion_en: this.buscarAtencionEn,
      estado: this.buscarEstado,
      prioridad: this.buscarPrioridad,
      id: this.buscarId,
      mes: this.mes,
      skip,
      limit: this.limite,
    };

    try {
      const response = await this.api.getTickets(filtros);

      this.tikets = Array.isArray(response) ? response : [];
      const total = (response as Ticket[] & { total?: number })?.total;
      this.totalRegistros = typeof total === 'number' ? total : this.tikets.length;
      this.totalPaginas = Math.max(1, Math.ceil(this.totalRegistros / this.limite));
      this.paginaActual = pagina;
    } catch (error) {
      console.error('❌ Error al obtener tickets:', error);
    } finally {
      this.cargando = false;
    }
  }

  cambiarPagina(direccion: 'prev' | 'next') {
    if (direccion === 'prev' && this.paginaActual > 1) {
      this.obtenerTikets(this.paginaActual - 1);
    } else if (direccion === 'next' && this.paginaActual < this.totalPaginas) {
      this.obtenerTikets(this.paginaActual + 1);
    }
  }

  editar(id: number) {
    this.router.navigate(['/ticket', id]);
  }

  detalle(id: number) {
    this.router.navigate(['/detail', id]);
  }

  mostrarFiltros = false;

  toggleFiltros() {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  limpiarFiltros() {
    this.buscarTicket = '';
    this.buscarServicio = '';
    this.buscarAtencionEn = '';
    this.buscarEstado = '';
    this.buscarPrioridad = '';
    this.buscarId = '';
    this.mes = '';
    this.obtenerTikets();
  }
}
