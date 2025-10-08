import { editorIcon, detalleIcon } from '../../shared/icons/icons';
import { Component, OnInit, NgModule } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Ticket } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-tikets',
  templateUrl: './tikets.component.html',
  styleUrls: ['./tikets.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
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
  origen: string = '';

  private sanitizarSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  editorIcon: SafeHtml = editorIcon;
  detalleIcon: SafeHtml = detalleIcon;
  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {
    this.editorIcon = this.sanitizarSvg(editorIcon);
    this.detalleIcon = this.sanitizarSvg(detalleIcon);

  }
  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.origen = params.get('origen') || '';

      this.obtenerTikets();
    });




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

  detalle(id: number) {
    //console.log('🔍 Detalle del ticket con ID:', id);
    this.router.navigate(['/detail', id]);
  }


}
