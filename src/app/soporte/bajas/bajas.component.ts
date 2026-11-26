import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { ApiService } from '../../services/api.service';
import { anioDeFecha, formatearCorrelativo } from '../../services/correlativo-baja';
import { moverFocoPestana } from '../../services/tabs';
import { rolActual, tienePermiso } from '../../services/permisos';
import { BajaCrear, BajaItem, DiagnosticoItem, Equipo } from '../../interface/interfaces';

type PestanaBajas = 'formulario' | 'listado';

// Márgenes y tamaño del documento `formato baja.docx` (carta, 25 mm arriba/abajo
// y 30 mm a los lados). Se imprime una copia del acta para no arrastrar el
// formulario, la tabla ni los estilos de la interfaz a páginas en blanco.
const ESTILO_IMPRESION = `
@page { size: letter; margin: 25mm 30mm; }
body.imprimiendo-baja > *:not(#impresion-baja) { display: none !important; }
#impresion-baja .acta {
  inline-size: 100%; max-inline-size: none; padding: 0; border: 0; margin: 0;
}
`;

@Component({
  selector: 'app-bajas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bajas.component.html',
  styleUrls: ['./bajas.component.css', '../tabs.css']
})
export class BajasComponent implements OnInit, OnDestroy {
  pestana: PestanaBajas = 'formulario';
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

  private limpiarImpresion: (() => void) | null = null;

  get puedeEscribir(): boolean {
    return tienePermiso(rolActual(), 'escribir');
  }

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.puedeEscribir) {
      this.pestana = 'listado';
    }
    this.cargar();
    if (this.puedeEscribir) {
      void this.alCambiarFecha();
    }
  }

  ngOnDestroy(): void {
    this.limpiarImpresion?.();
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
    if (!this.puedeEscribir) return;
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
    if (!this.puedeEscribir) {
      this.error = 'No tiene permisos para registrar bajas.';
      return;
    }
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
      this.pestana = 'listado';
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

  alTeclearPestanas(event: KeyboardEvent): void {
    if (moverFocoPestana(event.currentTarget as HTMLElement, event.key)) {
      event.preventDefault();
    }
  }

  alEnfocarPestana(event: FocusEvent, pestana: PestanaBajas): void {
    this.pestana = pestana;
    (event.target as HTMLElement).scrollIntoView({
      block: 'nearest', inline: 'nearest', container: 'nearest'
    } as ScrollIntoViewOptions);
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

  /** Abre el acta y lanza la impresión con el formato del documento de Word. */
  async imprimirActa(baja: BajaItem): Promise<void> {
    try {
      this.acta = await this.api.getBaja(baja.id);
      this.mensaje = '';
      this.error = '';
      // El botón está en el listado: el acta aún no está en el DOM hasta que
      // Angular vuelve a detectar cambios.
      this.cdr.detectChanges();
      this.imprimir();
    } catch (err) {
      this.error = 'No se pudo preparar el acta para imprimir.';
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
    const original = document.getElementById('acta-baja');
    if (!this.acta || !original) {
      return;
    }
    this.limpiarImpresion?.();

    let estilo = document.getElementById('estilo-print-baja');
    if (!estilo) {
      estilo = document.createElement('style');
      estilo.id = 'estilo-print-baja';
      estilo.textContent = ESTILO_IMPRESION;
      document.head.appendChild(estilo);
    }

    const contenedor = document.createElement('div');
    contenedor.id = 'impresion-baja';
    const copia = original.cloneNode(true) as HTMLElement;
    copia.id = 'acta-baja-impresion';
    contenedor.appendChild(copia);
    document.body.appendChild(contenedor);
    document.body.classList.add('imprimiendo-baja');

    let limpio = false;
    const limpiar = () => {
      if (limpio) {
        return;
      }
      limpio = true;
      this.limpiarImpresion = null;
      document.body.classList.remove('imprimiendo-baja');
      contenedor.remove();
      estilo?.remove();
      window.removeEventListener('afterprint', limpiar);
    };
    this.limpiarImpresion = limpiar;
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
      // Misma hoja y márgenes que `formato baja.docx` (carta, 30 mm a los lados
      // y 25 mm arriba/abajo).
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const margenX = 30;
      const margenY = 25;
      const ancho = pdf.internal.pageSize.getWidth() - margenX * 2;
      const alto = canvas.height * ancho / canvas.width;
      const altoPagina = pdf.internal.pageSize.getHeight() - margenY * 2;

      pdf.addImage(imagen, 'PNG', margenX, margenY, ancho, alto);
      let consumido = altoPagina;
      while (consumido < alto) {
        pdf.addPage();
        pdf.addImage(imagen, 'PNG', margenX, margenY - consumido, ancho, alto);
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
