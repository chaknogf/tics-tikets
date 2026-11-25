import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Equipo, Seguimiento, Ticket } from '../../interface/interfaces';

@Component({
  selector: 'app-detalle',
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DetalleComponent implements OnInit {

  public ticket: Ticket = {
    id: 0,
    ticket: '',
    fecha_solicitud: '',
    nombre_solicitante: '',
    servicio: '',
    detalle: '',
    prioridad: '',
    atencion_en: '',
    numero_bien: '',
    descripcion_equipo: '',
    insumos_utilizados: '',
    fecha_atencion: '',
    hora_atencion: '',
    nota: '',
    estado: '',
    usuario: '',
    metadatos: {}
  };

  constructor(
    private api: ApiService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.obtenerTicket();
  }

  private obtenerTicket(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.api.getTicket(id).then(async (data: Ticket) => {
          this.ticket = data;
          await this.obtenerComplementos();
        }).catch(error => {
          console.error('❌ Error al obtener ticket:', error);
        });
      } else {
        console.error('❌ ID inválido:', idParam);
      }
    }
  }

  getHoraComoFecha(): Date | null {
    if (!this.ticket?.hora_atencion) return null;
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return new Date(`${hoy}T${this.ticket.hora_atencion}`);
  }

  imprimir(): void {
    window.print();
  }

  seguimientos: Seguimiento[] = [];
  equipo: Equipo | null = null;
  cargandoDetalle = true;

  private async obtenerComplementos(): Promise<void> {
    const id = this.ticket?.id;
    if (!id) return;
    try {
      const [notas, equipo] = await Promise.all([
        this.api.getNotas(id),
        this.ticket.numero_bien ? this.api.getEquipo(this.ticket.numero_bien) : Promise.resolve(null)
      ]);
      this.seguimientos = Array.isArray(notas) ? notas : [];
      this.equipo = Array.isArray(equipo) ? equipo[0] ?? null : equipo ?? null;
    } catch (error) {
      console.error('❌ Error al obtener complementos del ticket:', error);
    } finally {
      this.cargandoDetalle = false;
    }
  }

  get tipoEquipo(): string {
    return this.equipo?.datos_tecnicos?.tipo_equipo || 'N/A';
  }

  cerrar(): void {
    this.router.navigate(['/dash']);
  }
}
