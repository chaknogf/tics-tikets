// src/app/services/notificaciones.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private ws?: WebSocket;
  // Relativa al <base href>: con /tics/ NO debe apuntar a /assets absoluto.
  private audio = new Audio('assets/sounds/lisa.mp3');
  private reintento?: number;
  private cerradoManualmente = false;

  private notificacionesSubject = new BehaviorSubject<any[]>([]);
  notificaciones$ = this.notificacionesSubject.asObservable();

  constructor(private api: ApiService) {
    this.audio.load();
    this.conectarDesdeSesion();
  }

  /** Tras recargar la página no se pasa por login: retomamos la sesión guardada. */
  conectarDesdeSesion(): void {
    const id = Number(localStorage.getItem('user_id'));
    if (localStorage.getItem('access_token') && Number.isInteger(id) && id > 0) {
      this.conectar(id);
    }
  }

  conectar(userId: number): void {
    this.cerradoManualmente = false;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }

    const url = new URL(
      `${this.api.baseUrl.replace('http', 'ws')}/ws/notificaciones/${userId}`
    );
    url.searchParams.set('token', token);
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const nueva = JSON.parse(event.data);
        const actuales = this.notificacionesSubject.value;
        this.notificacionesSubject.next([...actuales, nueva]);
        void this.reproducirSonidoDoble();
      } catch {
        // Un mensaje malformado no debe tumbar el canal ni la app.
      }
    };

    this.ws.onclose = () => {
      if (!this.cerradoManualmente && localStorage.getItem('access_token')) {
        this.programarReintento(userId);
      }
    };
  }

  descartar(indice: number): void {
    this.notificacionesSubject.next(
      this.notificacionesSubject.value.filter((_, i) => i !== indice)
    );
  }

  desconectar(): void {
    this.cerradoManualmente = true;
    if (this.reintento !== undefined) {
      window.clearTimeout(this.reintento);
      this.reintento = undefined;
    }
    this.ws?.close();
    this.ws = undefined;
  }

  private programarReintento(userId: number): void {
    if (this.reintento !== undefined) {
      return;
    }
    this.reintento = window.setTimeout(() => {
      this.reintento = undefined;
      this.conectar(userId);
    }, 5_000);
  }

  private async reproducirSonidoDoble(): Promise<void> {
    try {
      this.audio.currentTime = 0;
      await this.audio.play();

      await new Promise((resolve) => setTimeout(resolve, 150));

      this.audio.currentTime = 0;
      await this.audio.play();
    } catch {
      // El navegador puede bloquear audio si no hubo interacción previa.
    }
  }
}
