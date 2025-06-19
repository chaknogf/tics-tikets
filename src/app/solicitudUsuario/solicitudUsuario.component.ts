import { Component, OnInit, signal, effect, OnDestroy } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Ticket } from '../interface/interfaces';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from '../login/login.component';
import { ModalService } from '../services/modal.service';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { alienIcon } from '../shared/icons';

@Component({
  selector: 'app-solicitudUsuario',
  templateUrl: './solicitudUsuario.component.html',
  styleUrls: ['./solicitudUsuario.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoginComponent]
})
export class SolicitudUsuarioComponent implements OnInit, OnDestroy {

  form: FormGroup;
  mensaje = '';
  visible = signal(false);
  private sub: Subscription;

  private sanitizarSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  alienIcon: SafeHtml = alienIcon;

  constructor(
    private api: ApiService,
    private readonly fb: FormBuilder,
    private modalService: ModalService,
    private sanitizer: DomSanitizer
  ) {
    this.alienIcon = this.sanitizarSvg(alienIcon);

    this.sub = this.modalService.abrirLogin$.subscribe(() => this.open());
    this.form = this.fb.group({
      ticket: [''],
      fecha_solicitud: ['', Validators.required],
      nombre_solicitante: ['', Validators.required],
      servicio: ['', Validators.required],
      detalle: ['', Validators.required],
      prioridad: ['Baja'],
      atencion_en: ['', Validators.required],
      numero_bien: [''],
      descripcion_equipo: [''],
      insumos_utilizados: [''],
      fecha_atencion: [null],
      hora_atencion: [null],
      nota: [''],
      estado: [''],
      usuario: [''],
      metadatos: this.fb.group({
        r0: this.fb.group({
          usuario: [''],
          registro: [''],
        })
      })
    });
  }

  ngOnInit() {
    const ticketValue = this.generateTicket();
    this.form.get('ticket')?.setValue(ticketValue);
    this.form.get('fecha_solicitud')?.setValue(new Date().toISOString().slice(0, 10));
  }


  generateTicket(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const unique = crypto.randomUUID().slice(0, 4).toUpperCase();
    return `TKT${year}${month}${unique}`;
  }

  private limpiarPayload(payload: any): any {
    const limpio: any = {};
    for (const key in payload) {
      const valor = payload[key];
      if (valor === '' || valor == null) continue;

      limpio[key] = (typeof valor === 'object' && !Array.isArray(valor))
        ? this.limpiarPayload(valor)
        : valor;
    }
    return limpio;
  }

  async create() {
    try {
      const rawData = this.form.getRawValue(); // incluye todo, incluso objetos como metadatos
      console.table(rawData); // útil para verificar qué se está enviando
      await this.api.createTicket(rawData);
      this.mensaje = 'Ticket creado correctamente';
    } catch (error) {
      this.mensaje = 'Error al crear el ticket';
      console.error(error);
    }
  }

  async update(ticket: Ticket) {
    try {
      const rawData = this.form.getRawValue();
      const limpio = this.limpiarPayload(rawData);
      await this.api.updateTicket(ticket.id, limpio);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  }

  guardar() {
    const ticket = this.form.getRawValue();
    if (ticket.id) {
      this.update(ticket);
    } else {
      this.create();
    }
  }

  open() {
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
  }

  visibleFn() {
    return this.visible();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }


}
