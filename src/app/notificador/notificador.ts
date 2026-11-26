// src/app/components/notificador/notificador.component.ts
import { Component, OnDestroy } from '@angular/core';
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
export class NotificadorComponent implements OnDestroy {
  options: { nombre: string; descripcion: string; ruta: string; icon: string }[] = [];
  icons: { [key: string]: any } = {};
  notificaciones: any[] = [];

  private suscripcion: Subscription;

  constructor(
    private notiSrv: NotificacionesService,
    private iconService: IconService
  ) {
    this.suscripcion = this.notiSrv.notificaciones$
      .subscribe((n) => (this.notificaciones = n));

    this.icons = {
      notificador: this.iconService.getIcon('campanaIcons'),
    };
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }

  cerrar(index: number): void {
    this.notiSrv.descartar(index);
  }
}
