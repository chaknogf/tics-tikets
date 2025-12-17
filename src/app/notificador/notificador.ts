// src/app/components/notificador/notificador.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificacionesService } from './../services/notificaciones.service';
import { IconService } from './../services/icon.service';
import { campanaIcons } from '../shared/icons/icons';

@Component({
  selector: 'app-notificador',
  imports: [CommonModule],
  templateUrl: './notificador.html',
  styleUrl: './notificador.css',
  standalone: true
})

export class NotificadorComponent {
  options: { nombre: string; descripcion: string; ruta: string; icon: string }[] = [];
  // iconos
  icons: { [key: string]: any } = {};

  notificaciones: any[] = [];

  constructor(
    private notiSrv: NotificacionesService,
    private iconService: IconService
  ) {
    this.notiSrv.notificaciones$
      .subscribe(n => this.notificaciones = n);

    this.icons = {
      notificador: this.iconService.getIcon("campanaIcons"),
    };
  }

  cerrar(index: number) {
    this.notificaciones.splice(index, 1);
  }
}

