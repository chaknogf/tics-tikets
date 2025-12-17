// src/app/services/notificaciones.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';


@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private ws?: WebSocket;
  private notificacionesSubject = new BehaviorSubject<any[]>([]);
  notificaciones$ = this.notificacionesSubject.asObservable();

  constructor(private api: ApiService) {}

 conectar(userId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const wsUrl = this.api.baseUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws/notificaciones/${userId}`);

    this.ws.onmessage = (event) => {
      const nueva = JSON.parse(event.data);

      const actuales = this.notificacionesSubject.value;
      this.notificacionesSubject.next([...actuales, nueva]);
    };
  }
}