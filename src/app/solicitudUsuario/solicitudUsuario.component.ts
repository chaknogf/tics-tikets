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
import { alienIcon, clockMove, critical, diseño, ok, pirateIcon, software } from '../shared/icons/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Router } from '@angular/router';
import { IconService } from './../services/icon.service';



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
  buscarTicket: string = '';
  loading = false;

  options: { nombre: string; descripcion: string; ruta: string; icon: string }[] = [];

  // iconos
  icons: { [key: string]: any } = {};

  private sanitizarSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  alienIcon: SafeHtml = alienIcon;
  pirateIcon: SafeHtml = pirateIcon

  constructor(
    private api: ApiService,
    private readonly fb: FormBuilder,
    private modalService: ModalService,
    private sanitizer: DomSanitizer,
    private iconService: IconService,
    private router: Router
  ) {
    this.icons = {

      alien: this.iconService.getIcon("alienIcon"),
      pirata: this.iconService.getIcon("pirateIcon"),
      work: this.iconService.getIcon("work"),
      computer: this.iconService.getIcon("computer"),
      net: this.iconService.getIcon("redes"),
      software: this.iconService.getIcon("software"),
      diseño: this.iconService.getIcon("diseño"),
      critic: this.iconService.getIcon("critical"),
      ok: this.iconService.getIcon("ok"),
      clockMove: this.iconService.getIcon("clockMove"),
      clock: this.iconService.getIcon("clock"),


    }


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
      estado: ['Abierto'],
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
      // console.table(rawData); // útil para verificar qué se está enviando
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



  async onSubmit() {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.mensaje = '';

    const ticket = this.form.getRawValue();

    try {
      let response;

      if (ticket.id) {
        await this.update(ticket);
        response = { id: ticket.id };
      } else {
        response = await this.api.createTicket(ticket);
      }

      const idTicket = response.id;
      this.mensaje = '✅ Ticket guardado correctamente';

      // Redirigir al componente PDF
      this.router.navigate(['/ticketPdf', idTicket]);

    } catch (error) {
      console.error('❌ Error al guardar el ticket:', error);
      this.mensaje = '❌ Error al guardar el ticket';
    } finally {
      // 🔥 Esto SIEMPRE se ejecuta, éxito o error
      this.loading = false;
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

  async generarPDF() {
    const original = document.getElementById('formulario-ticket');
    if (!original) return;

    // Clonar el formulario
    const copia = original.cloneNode(true) as HTMLElement;

    // Aplicar estilos "claros" a la copia
    copia.style.backgroundColor = 'white';
    copia.style.color = 'black';
    copia.classList.remove('bg-dark', 'text-light'); // por si hay clases Bootstrap
    copia.setAttribute('data-bs-theme', 'light');

    // Puedes eliminar elementos no deseados del PDF
    copia.querySelectorAll('.no-pdf')?.forEach(el => el.remove());

    // Insertar copia oculta en el DOM
    copia.style.position = 'fixed';
    copia.style.left = '-9999px';
    document.body.appendChild(copia);

    const canvas = await html2canvas(copia, {
      backgroundColor: '#ffffff',
      scale: 2
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);

    const nombre = this.form.get('ticket')?.value || 'ticket';

    try {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${nombre}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error al generar el PDF:', error);
    }

    // Eliminar la copia del DOM
    document.body.removeChild(copia);
  }

  async obtenerTicket(): Promise<void> {
    const ticketQuery = this.buscarTicket?.trim();

    if (!ticketQuery) {
      console.warn('⚠️ Debes ingresar un número de ticket.');
      return;
    }

    const filtros = {
      ticket: ticketQuery,
      skip: 0,
      limit: 1
    };

    try {
      const response = await this.api.getTickets(filtros);
      console.log(response);
      if (Array.isArray(response) && response.length > 0) {
        const idTicket = response[0].id;
        console.log('Ticket encontrado:', response[0]);
        this.router.navigate(['/detail', idTicket]);
      } else {
        console.warn('⚠️ No se encontró el ticket especificado.');
      }

    } catch (error) {
      console.error('❌ Error al obtener el ticket:', error);
    }
  }

  ngAfterViewInit(): void {
    const canvas = document.querySelector('.matrix-bg') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Letras/íconos estáticos
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    ctx.fillStyle = 'rgba(0,255,0,0.3)';
    ctx.font = '18px monospace';

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const text = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillText(text, x, y);
    }

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }


}
