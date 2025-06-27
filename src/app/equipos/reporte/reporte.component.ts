import { Component, OnInit } from '@angular/core';
import { editorIcon, detalleIcon } from './../../shared/icons';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { Equipo } from '../../interface/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReporteComponent implements OnInit {
  public equipos: Equipo[] = [];
  public buscarEquipo: string = '';
  public buscarIp: string = '';
  public buscarDescripcion: string = '';
  cargando: boolean = false;
  public hoy = new Date();

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
  ngOnInit() {
    this.obtenerEquipos();
  }

  async obtenerEquipos() {
    const filtros = {
      no_bien: this.buscarEquipo,
      // ip: this.buscaIp,
      // descripcion: this.buscarDescripcion,
      estado: 'A',
      skip: 0,
      limit: 200
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

  imprimir(): void {
    // Imprime la pantalla tal como se ve actualmente
    window.print();
  }


}

