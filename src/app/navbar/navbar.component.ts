import { IconService } from './../services/icon.service';
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../services/modal.service';
import { ApiService } from '../services/api.service';
import { NotificacionesService } from '../services/notificaciones.service';
import { ticketIcon } from '../shared/icons/icons';
import { tienePermiso } from '../services/permisos';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class NavbarComponent {
  @Input() usuario: string = 'usuario';
  @Input() rol: string = 'rol';
  @Output() cerrarSesion = new EventEmitter<void>();

  // Controla si el menú hamburguesa está abierto
  menuAbierto = false;

  options: { nombre: string; descripcion: string; ruta: string; icon: string }[] = [];

  // iconos
  icons: { [key: string]: any } = {};


  constructor(
    private router: Router,
    private modalService: ModalService,
    private api: ApiService,
    private notificaciones: NotificacionesService,
    private sanitizer: DomSanitizer,
    private iconService: IconService
  ) {
    this.icons = {
      ticket: this.iconService.getIcon("ticketIcon"),
      tickets: this.iconService.getIcon("ticketsIcon"),
      equipos: this.iconService.getIcon("equiposIcon"),
      reportes: this.iconService.getIcon("reportIcon"),


    };


  }

  onclick() {

  }
  open() {
    this.modalService.solicitarAperturaDeLogin();
  }

  logout() {
    this.notificaciones.desconectar();
    this.cerrarSesion.emit();
    this.api.logOut();
  }

  menu() {
    this.menuAbierto = false;
    this.router.navigate(['/dash']);
  }
  get estaAutenticado(): boolean {
    return this.usuario !== null;
  }

  get puedeEscribir(): boolean {
    return tienePermiso(this.rol, 'escribir');
  }

  get esAdmin(): boolean {
    return tienePermiso(this.rol, 'admin');
  }

  equipos() {
    this.menuAbierto = false;
    this.router.navigate(['/equipos']);
  }

  tickets() {
    this.menuAbierto = false;
    this.router.navigate(['/dash']);
  }

  ticket() {
    this.menuAbierto = false;
    this.router.navigate(['/tiket', 'dash']);
  }

  reportes() {
    this.menuAbierto = false;
    this.router.navigate(['/reporteria']);
  }

  mantenimientos() {
    this.menuAbierto = false;
    this.router.navigate(['/mantenimientos']);
  }

  bajas() {
    this.menuAbierto = false;
    this.router.navigate(['/bajas']);
  }

  /** Alterna la visibilidad del menú hamburguesa */
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  /** Marca la ruta activa en la navegación (y cierra el menú móvil). */
  estaEn(ruta: string): boolean {
    return this.router.url.startsWith(ruta);
  }

  editarUsuario() {
    this.router.navigate(['/editarUsuario']);
  }

}
