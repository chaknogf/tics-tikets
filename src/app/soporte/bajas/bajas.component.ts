import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { ApiService } from '../../services/api.service';
import { anioDeFecha, formatearCorrelativo } from '../../services/correlativo-baja';
import { BajaCrear, BajaItem, DiagnosticoItem, Equipo } from '../../interface/interfaces';

const ESTILO_IMPRESION = `
@page { size: A4; margin: 15mm; }
body.imprimiendo-baja * { visibility: hidden !important; }
body.imprimiendo-baja #acta-baja,
body.imprimiendo-baja #acta-baja * { visibility: visible !important; }
body.imprimiendo-baja #acta-baja {
  position: absolute; inset: 0 auto auto 0; width: 100%; margin: 0;
}
`;

@Component({
  selector: 'app-bajas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bajas.component.html',
  styleUrls: ['./bajas.component.css']
})
export class BajasComponent implements OnInit {
  formulario: BajaCrear = this.nuevoFormulario();
  equipos: Equipo[] = [];
  bajas: BajaItem[] = [];
  acta: BajaItem | null = null;

  correlativoPreview = '';
  private correlativoAnio = 0;

  cargando = false;
  guardando = false;
  generandoPdf = false;
  mensaje = '';
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
    void this.alCambiarFecha();
  }

  private nuevoFormulario(): BajaCrear {
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return {
      fecha_solicitud: fecha,
      responsable_nombre: '',
      responsable_ubicacion: '',
      responsable_firma: '',
      responsable_sello: '',
      no_bien: '',
      tipo_dispositivo: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      codigo_sicoin: '',
      diagnosticos: [{ titulo: '', descripcion: '' }],
      dictamen: '',
      destino_final: 'inventarios',
      revision_nombre: '',
      revision_firma: ''
    };
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      const [equipos, bajas] = await Promise.all([
        this.api.getEquipos({ skip: 0, limit: 200 }),
        this.api.getBajas({ skip: 0, limit: 200 })
      ]);
      this.equipos = Array.isArray(equipos) ? equipos : [];
      this.bajas = Array.isArray(bajas) ? bajas : [];
    } catch (err) {
      this.error = 'No se pudieron cargar equipos o bajas. ¿Está aplicada la migración 002?';
      console.error(err);
    } finally {
      this.cargando = false;
    }
  }

  alSeleccionarBien(): void {
    const equipo = this.equipos.find(e => e.no_bien === this.formulario.no_bien);
    const datos = equipo?.datos_tecnicos;
    this.formulario.tipo_dispositivo = datos?.tipo_equipo ?? '';
    this.formulario.marca = datos?.marca ?? '';
    this.formulario.modelo = datos?.modelo ?? '';
    this.formulario.numero_serie = datos?.series ?? '';
  }

  async alCambiarFecha(): Promise<void> {
    const anio = anioDeFecha(this.formulario.fecha_solicitud) ?? new Date().getFullYear();
    this.correlativoAnio = anio;
    this.correlativoPreview = formatearCorrelativo(anio, 1);
    try {
      const respuesta = await this.api.getSiguienteCorrelativo(anio);
      if (this.correlativoAnio === anio) {
        this.correlativoPreview = respuesta.correlativo;
      }
    } catch (err) {
      console.error('No se pudo consultar el correlativo:', err);
    }
  }

  agregarDiagnostico(): void {
    this.formulario.diagnosticos.push({ titulo: '', descripcion: '' });
  }

  quitarDiagnostico(indice: number): void {
    if (this.formulario.diagnosticos.length > 1) {
      this.formulario.diagnosticos.splice(indice, 1);
    }
  }

  async guardar(): Promise<void> {
    this.mensaje = '';
    this.error = '';
    if (!this.formulario.responsable_nombre.trim() ||
        !this.formulario.no_bien ||
        !this.formulario.dictamen.trim() ||
        !this.formulario.diagnosticos.some(d => d.titulo.trim())) {
      this.error = 'Completa responsable, bien, al menos un diagnóstico y el dictamen.';
      return;
    }

    this.guardando = true;
    try {
      const creada = await this.api.crearBaja(this.formulario);
      this.acta = creada;
      this.mensaje = `Acta ${creada.correlativo} registrada correctamente.`;
      await this.cargar();
      await this.alCambiarFecha();
    } catch (err) {
      this.error = 'No se pudo registrar el acta de baja.';
      console.error(err);
    } finally {
      this.guardando = false;
    }
  }

  nueva(): void {
    this.formulario = this.nuevoFormulario();
    this.acta = null;
    this.mensaje = '';
    this.error = '';
    void this.alCambiarFecha();
  }

  async verActa(baja: BajaItem): Promise<void> {
    try {
      this.acta = await this.api.getBaja(baja.id);
      this.mensaje = '';
      this.error = '';
    } catch (err) {
      this.error = 'No se pudo abrir el acta seleccionada.';
      console.error(err);
    }
  }

  get fechaLegible(): string {
    if (!this.acta) {
      return '';
    }
    const [anio, mes, dia] = this.acta.fecha_solicitud.slice(0, 10).split('-').map(Number);
    if (!anio || !mes || !dia) {
      return this.acta.fecha_solicitud;
    }
    return new Intl.DateTimeFormat('es-GT', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(anio, mes - 1, dia));
  }

  get destinoLegible(): string {
    return this.acta?.destino_final === 'reasignacion'
      ? 'Reasignación del bien.'
      : 'Devolución a la sección Inventarios para proceso de baja.';
  }

  imprimir(): void {
    if (!this.acta) {
      return;
    }
    let estilo = document.getElementById('estilo-print-baja');
    if (!estilo) {
      estilo = document.createElement('style');
      estilo.id = 'estilo-print-baja';
      estilo.textContent = ESTILO_IMPRESION;
      document.head.appendChild(estilo);
    }
    document.body.classList.add('imprimiendo-baja');

    let limpio = false;
    const limpiar = () => {
      if (limpio) {
        return;
      }
      limpio = true;
      document.body.classList.remove('imprimiendo-baja');
      estilo?.remove();
      window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);
    window.print();
    window.setTimeout(limpiar, 5000);
  }

  async descargarPdf(): Promise<void> {
    const elemento = document.getElementById('acta-baja');
    if (!this.acta || !elemento) {
      return;
    }
    this.generandoPdf = true;
    try {
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false
      });
      const imagen = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const ancho = pdf.internal.pageSize.getWidth() - 20;
      const alto = canvas.height * ancho / canvas.width;
      const altoPagina = pdf.internal.pageSize.getHeight() - 20;

      pdf.addImage(imagen, 'PNG', 10, 10, ancho, alto);
      let consumido = altoPagina;
      while (consumido < alto) {
        pdf.addPage();
        pdf.addImage(imagen, 'PNG', 10, 10 - consumido, ancho, alto);
        consumido += altoPagina;
      }
      pdf.save(`${this.acta.correlativo}.pdf`);
    } catch (err) {
      this.error = 'No se pudo generar el PDF del acta.';
      console.error(err);
    } finally {
      this.generandoPdf = false;
    }
  }
}
