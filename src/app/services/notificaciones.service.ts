// src/app/services/notificaciones.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private ws?: WebSocket;
  private audio = new Audio('/assets/sounds/lisa.mp3');

  private notificacionesSubject = new BehaviorSubject<any[]>([]);
  notificaciones$ = this.notificacionesSubject.asObservable();

  constructor(private api: ApiService) {
    this.audio.load();
  }

  conectar(userId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const wsUrl = this.api.baseUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws/notificaciones/${userId}`);

    this.ws.onopen = () => {
      console.log('🟢 WebSocket conectado');
    };

    this.ws.onmessage = (event) => {
      const nueva = JSON.parse(event.data);

      const actuales = this.notificacionesSubject.value;
      this.notificacionesSubject.next([...actuales, nueva]);

      this.reproducirSonidoDoble();
    };

    this.ws.onclose = () => {
      console.log('🔴 WebSocket desconectado');
    };
  }

  private async reproducirSonidoDoble() {
    try {
      // Primer sonido
      this.audio.currentTime = 0;
      await this.audio.play();

      // Pequeña pausa (150 ms es elegante)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Segundo sonido
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch {
      // El navegador puede bloquear audio si no hubo interacción previa
    }
  }
}
