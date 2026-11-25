import { Component, OnInit } from '@angular/core';
import { editorIcon, detalleIcon } from '../../shared/icons/icons';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { Equipo } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { rolActual, tienePermiso } from '../../services/permisos';


@Component({
  selector: 'app-equipos',
  templateUrl: './equipos.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./equipos.component.css']
})
export class EquiposComponent implements OnInit {

  public equipos: Equipo[] = [];
  public buscarEquipo: string = '';
  public buscarIp: string = '';
  public buscarDescripcion: string = '';
  cargando: boolean = false;


  private sanitizarSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  editorIcon: SafeHtml = editorIcon;
  detalleIcon: SafeHtml = detalleIcon;
  constructor(
    private api: ApiService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.editorIcon = this.sanitizarSvg(editorIcon);
    this.detalleIcon = this.sanitizarSvg(detalleIcon);

  }
  get esAdmin(): boolean {
    return tienePermiso(rolActual(), 'admin');
  }

  ngOnInit() {
    this.obtenerEquipos();
  }

  async obtenerEquipos() {
    const filtros = {
      no_bien: this.buscarEquipo,
      // ip: this.buscaIp,
      // descripcion: this.buscarDescripcion,

      skip: 0,
      limit: 10
    };
    this.cargando = true;
    try {
      const response = await this.api.getEquipos(filtros);
      this.equipos = response;
      // console.table(this.equipos);
    } catch (error) {
      console.error('❌ Error al obtener equipo:', error);
    } finally {
      this.cargando = false;
    }
  }

  editar(id: number) {
    if (!this.esAdmin) return;
    this.router.navigate(['/equipo', id]);
  }

  detalle(id: number) {
    //console.log('🔍 Detalle del ticket con ID:', id);
    this.router.navigate(['/ver-equipo', id]);
  }

  nuevo() {
    if (!this.esAdmin) return;
    this.router.navigate(['/equipo']);
  }

  reporte() {
    this.router.navigate(['/reporteEquipos']);
  }
}
