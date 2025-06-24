import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ModalService } from '../../services/modal.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Equipo, DatosTecnicos, Redes, SoftwareInstalado } from '../../interface/interfaces';

@Component({
  selector: 'app-formEquipo',
  templateUrl: './formEquipo.component.html',
  styleUrls: ['./formEquipo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class FormEquipoComponent implements OnInit {

  form: FormGroup;
  user: string = '';
  mensaje = '';
  visible = signal(false);
  enEdicion = false;
  usuarioActual = '';
  fechaActual = (() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fecha = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return `${fecha} ${hora}`;
  })();

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private modalService: ModalService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
  ) {

    this.form = this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.usuarioActual = localStorage.getItem('username') || '';
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.enEdicion = true;
        this.cargarEquipo(id);
      } else {
        console.error('❌ ID inválido:', idParam);
        this.mensaje = '❌ ID inválido';
      }
    } else {

    }
  }

  private sanitizarSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  private inicializarFormulario(): FormGroup {
    return this.fb.group({
      id: [null],
      no_bien: ['', Validators.required],
      especificaciones: ['', Validators.required],
      datos_tecnicos: this.fb.group({
        tipo_equipo: [''],
        numero_equipo: [''],
        marca: [''],
        modelo: [''],
        series: [''],
        procesador: [''],
        ram: [''],
        disco_duro: [''],
        cpu_serie: [''],
        monitor_serie: [''],
        capacidad_bandeja: [''],
        ciclo_mensual: [''],
        funciones: [''],
        doble_cara: [false],
        resolucion_escaneo_ppp: [''],
        resolucion_impresion_ppp: [''],
        tecnologia: [''],
        velocidad_ppm: [0],
        camara_frontal_mp: [0],
        camara_trasera_mp: [0],
        memoria_interna_gb: [0],
        memoria_ram_gb: [0],
        capacidad_carga_va: [0],
        numero_tomas: [0],
        potencia_watt: [0],
        tiempo_respaldo_min: [0],
        voltaje_entrada: [''],
        voltaje_salida: [''],
        conectividad: ['']

      }),
      redes: this.fb.group({
        ip_wifi: [''],
        ip_ethernet: [''],
        mac_wifi: [''],
        mac_ethernet: ['']
      }),
      software_instalado: this.fb.group({
        r0: this.fb.group({
          software: [''],
          version: [''],
          licencia: [''],
          tipo: ['']
        })
      }),
      estado: ['A'],
      actualizacion: this.fb.group({
        fecha: [this.fechaActual],
        usuario: ['Ronald Chacon'],
        nota: ['']
      })


    });




  }

  private async cargarEquipo(id: number): Promise<void> {
    try {
      const data = await this.api.equipo(id);
      console.log('📝 Equipo obtenido correctamente');
      // console.table(data);
      // Reconstruir metadatos

      this.form.patchValue(data);

    } catch (error) {
      console.error('❌ Error al obtener equipo:', error);
    }
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

    const raw = this.form.getRawValue();

    if (this.enEdicion && raw.id) {
      await this.update(raw);
    } else {
      await this.create();
    }

    this.router.navigate(['/equipos']);
  }

  private async create(): Promise<void> {
    try {
      const limpio = this.limpiarPayload(this.form.getRawValue());
      console.table(limpio);
      await this.api.createEquipo(limpio);
      this.mensaje = '✅ Equipo creado correctamente';
    } catch (error) {
      this.mensaje = '❌ Error al crear el equipo';
      console.error(error);
    }
  }

  private async update(equipo: Equipo): Promise<void> {
    try {
      const limpio = this.limpiarPayload(this.form.getRawValue());
      await this.api.updateEquipo(equipo.id, limpio);
      console.log('👤 Equipo actualizado', limpio);
      this.mensaje = '✅ Equipo actualizado correctamente';
    } catch (error) {
      this.mensaje = '❌ Error al actualizar el equipo';
      console.error(error);
    }
  }

  close() {
    this.router.navigate(['/equipos']);
  }



}

