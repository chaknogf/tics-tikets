// modal.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private abrirLoginSubject = new Subject<void>();
  abrirLogin$ = this.abrirLoginSubject.asObservable();

  solicitarAperturaDeLogin() {
    this.abrirLoginSubject.next();
  }
}
