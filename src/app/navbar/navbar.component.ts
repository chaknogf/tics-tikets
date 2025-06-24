import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../services/modal.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  // styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class NavbarComponent {
  @Input() usuario: string = 'usuario';
  @Input() rol: string = 'rol';
  @Output() cerrarSesion = new EventEmitter<void>();



  constructor(
    private router: Router,
    private modalService: ModalService,
    private api: ApiService
  ) {


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

}
