import { Component, OnInit, NgModule } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Ticket } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tikets',
  templateUrl: './tikets.component.html',
  // styleUrls: ['./tikets.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class TiketsComponent implements OnInit {

  public tikets: Ticket[] = [];
  public buscarTicket: string = '';
  public buscarServicio: string = '';
  public buscarAtencionEn: string = '';
  public buscarEstado: string = '';
  public buscarPrioridad: string = '';
  public buscarId: string = '';
  cargando: boolean = false;
  constructor(
    private api: ApiService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.obtenerTikets();
  }

  async obtenerTikets() {
    const filtros = {
      ticket: this.buscarTicket,
      servicio: this.buscarServicio,
      atencion_en: this.buscarAtencionEn,
      estado: this.buscarEstado,
      prioridad: this.buscarPrioridad,
      id: this.buscarId,
      skip: 0,
      limit: 10
    };
    this.cargando = true;
    try {
      const response = await this.api.getTickets(filtros);
      this.tikets = response;
    } catch (error) {
      console.error('❌ Error al obtener tickets:', error);
    } finally {
      this.cargando = false;
    }
  }


  editar(id: number) {
    //console.log('📝 Editando ticket con ID:', id);
    this.router.navigate(['/ticket', id]);
  }


}
