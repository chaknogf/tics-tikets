import { Component, OnInit } from '@angular/core';
import { ApiService } from './../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Ticket } from './../interface/interfaces';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-pdfTicket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdfTicket.component.html',
  styleUrls: ['./pdfTicket.component.css']
})
export class PdfTicketComponent implements OnInit {
  ticket!: Ticket;
  cargando = true;
  hora: string = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit() {
    this.hora = new Date().toLocaleTimeString();
    await this.obtenerTicket();
  }

  /** Obtiene el ticket por ID */
  private async obtenerTicket(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) return;

    try {
      this.ticket = await this.api.getTicket(id);
      this.cargando = false;

      // Esperar un poco para que Angular pinte el HTML
      setTimeout(() => this.generarPDF(), 500);
    } catch (error) {
      console.error('❌ Error al obtener ticket:', error);
      this.cargando = false;
    }
  }

  /** Genera y descarga el PDF */
  private async generarPDF() {
    const elemento = document.getElementById('pdf-ticket');
    if (!elemento) {
      console.warn('⚠️ No se encontró el elemento del ticket para generar PDF.');
      return;
    }

    try {
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
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

      // Redirigir luego de guardar el PDF
      setTimeout(() => this.router.navigate(['/dash']), 2000);
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
    }
  }
}
