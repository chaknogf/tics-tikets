import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ModalService } from '../../services/modal.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Metadata, Ticket } from '../../interface/interfaces';
import { alienIcon } from '../../shared/icons';

@Component({
  selector: 'app-formulario',
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class FormularioComponent implements OnInit {

  form: FormGroup;
  user: string = '';
  mensaje = '';
  visible = signal(false);
  enEdicion = false;
  usuarioActual = '';
  alienIcon: SafeHtml;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private modalService: ModalService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.alienIcon = this.sanitizarSvg(alienIcon);
    this.form = this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.usuarioActual = localStorage.getItem('username') || '';
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.enEdicion = true;
        this.cargarTicket(id);
      } else {
        console.error('❌ ID inválido:', idParam);
        this.mensaje = '❌ ID inválido';
      }
    } else {
      // Solo si es nuevo
      this.form.patchValue({
        ticket: this.generateTicket(),
        fecha_solicitud: new Date().toISOString().slice(0, 10)
      });
    }
  }

  private sanitizarSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  private inicializarFormulario(): FormGroup {
    return this.fb.group({
      id: [null],
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
      fecha_atencion: [''],  // Si es string o ISODate
      hora_atencion: [''],   // Asegúrate que sea string si espera eso
      nota: [''],
      estado: [''],
      usuario: [''],
      metadatos: this.fb.group({
        r0: this.fb.group({
          usuario: [''],
          registro: ['']
        })
      })
    });
  }

  private async cargarTicket(id: number): Promise<void> {
    try {
      const data = await this.api.getTicket(id);
      console.log('📝 Ticket obtenido correctamente');
      // console.table(data);
      // Reconstruir metadatos
      if (data.metadatos) {
        const metadatosGroup = this.fb.group({});
        Object.entries(data.metadatos).forEach(([key, meta]: [string, any]) => {
          metadatosGroup.addControl(key, this.fb.group({
            usuario: [meta.usuario || ''],
            registro: [meta.registro || '']
          }));
        });
        this.form.setControl('metadatos', metadatosGroup);
      }

      this.form.patchValue(data);

    } catch (error) {
      console.error('❌ Error al obtener ticket:', error);
    }
  }

  private generateTicket(): string {
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

      if (valor === undefined) continue;

      if (valor === null) {
        // Si el valor es null, lo convertimos a string vacío para campos de texto
        limpio[key] = '';
      } else if (typeof valor === 'object' && !Array.isArray(valor)) {
        limpio[key] = this.limpiarPayload(valor);
      } else {
        limpio[key] = valor;
      }
    }
    return limpio;
  }

  async guardar(): Promise<void> {
    const timestamp = new Date().toISOString();
    const metadata: Metadata = { usuario: this.usuarioActual, registro: timestamp };

    // Asignar metadatos nuevos
    const metadatosControl = this.form.get('metadatos') as FormGroup;
    const nuevaClave = `r${Object.keys(metadatosControl.controls).length}`;
    metadatosControl.addControl(
      nuevaClave,
      this.fb.group({
        usuario: metadata.usuario,
        registro: metadata.registro
      })
    );

    // Establecer fecha y hora actuales si están vacíos
    const now = new Date();
    const fechaISO = now.toISOString().slice(0, 10); // yyyy-MM-dd
    const hora = now.toTimeString().slice(0, 5);     // HH:mm

    if (!this.form.get('fecha_atencion')?.value) {
      this.form.get('fecha_atencion')?.setValue(fechaISO);
    }

    if (!this.form.get('hora_atencion')?.value) {
      this.form.get('hora_atencion')?.setValue(hora);
    }

    const raw = this.form.getRawValue();

    if (this.enEdicion && raw.id) {
      await this.update(raw);
    } else {
      await this.create();
    }

    this.router.navigate(['/dash']);
  }

  private async create(): Promise<void> {
    try {
      const data = this.form.getRawValue();
      console.table(data);
      await this.api.createTicket(data);
      this.mensaje = '✅ Ticket creado correctamente';
    } catch (error) {
      this.mensaje = '❌ Error al crear el ticket';
      console.error(error);
    }
  }

  private async update(ticket: Ticket): Promise<void> {
    try {
      const limpio = this.limpiarPayload(this.form.getRawValue());
      await this.api.updateTicket(ticket.id, limpio);
      this.mensaje = '✅ Ticket actualizado correctamente';
    } catch (error) {
      this.mensaje = '❌ Error al actualizar el ticket';
      console.error(error);
    }
  }

  close() {
    this.router.navigate(['/dash']);
  }


  get sortedMetadatos(): Metadata[] {
    const metadatos = this.form.get('metadatos')?.value || {};
    return (Object.values(metadatos) as Metadata[]).sort((a, b) =>
      new Date(b.registro ?? '').getTime() - new Date(a.registro ?? '').getTime()
    );
  }
}
