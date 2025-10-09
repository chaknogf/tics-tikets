import { Component, OnInit } from '@angular/core';
import { ApiService } from './../services/api.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Ticket } from './../interface/interfaces';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-pdfTicket',
  templateUrl: './pdfTicket.component.html',
  styleUrls: ['./pdfTicket.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PdfTicketComponent implements OnInit {
  public ticket: Ticket = {
    id: 0,
    ticket: '',
    fecha_solicitud: '',
    nombre_solicitante: '',
    servicio: '',
    detalle: '',
    prioridad: '',
    atencion_en: '',
    numero_bien: '',
    descripcion_equipo: '',
    insumos_utilizados: '',
    fecha_atencion: '',
    hora_atencion: '',
    nota: '',
    estado: '',
    usuario: '',
    metadatos: {}
  };

  constructor(
    private api: ApiService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  async ngOnInit() {
    await this.obtenerTicket();
    setTimeout(() => this.generarPDF(), 800); // esperar a que se renderice
  }

  private async obtenerTicket(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    const id = Number(idParam);
    if (isNaN(id)) return;

    try {
      const data = await this.api.getTicket(id);
      this.ticket = data;
    } catch (error) {
      console.error('❌ Error al obtener ticket:', error);
    }
  }

  getHoraComoFecha(): Date | null {
    if (!this.ticket?.hora_atencion) return null;
    const hoy = new Date().toISOString().split('T')[0];
    return new Date(`${hoy}T${this.ticket.hora_atencion}`);
  }

  async generarPDF() {
    const elemento = document.getElementById('pdf-ticket');
    if (!elemento) return;

    const canvas = await html2canvas(elemento, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
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

    pdf.save(`${this.ticket.ticket || 'ticket'}.pdf`);

    // Regresar automáticamente al dashboard
    setTimeout(() => this.router.navigate(['/dash']), 1500);
  }
}
