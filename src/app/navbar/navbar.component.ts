import { IconService } from './../services/icon.service';
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../services/modal.service';
import { ApiService } from '../services/api.service';
import { ticketIcon } from '../shared/icons/icons';
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
    this.cerrarSesion.emit();
    this.api.logOut();
  }

  menu() {
    this.router.navigate(['/dash']);
  }
  get estaAutenticado(): boolean {
    return this.usuario !== null;
  }

  equipos() {
    this.router.navigate(['/equipos']);
  }

  tickets() {
    this.router.navigate(['/dash']);
  }

  ticket() {
    this.router.navigate(['/tiket', 'dash']);
  }

  reportes() {
    this.router.navigate(['/reporteria']);
  }

  /** Alterna la visibilidad del menú hamburguesa */
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  editarUsuario() {
    this.router.navigate(['/editarUsuario']);
  }

}
