import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ApiService } from './../services/api.service';
import { DomSanitizer } from '@angular/platform-browser';
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
export class PdfTicketComponent implements OnInit, AfterViewInit {
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

  async ngAfterViewInit() {
    // Espera unos milisegundos para asegurar el render
    const intento = async (reintentos = 10) => {
      const elemento = document.getElementById('pdf-ticket');
      if (elemento) {
        await this.generarPDF(elemento);
      } else if (reintentos > 0) {
        setTimeout(() => intento(reintentos - 1), 300);
      } else {
        console.warn('⚠️ No se encontró el elemento para generar PDF.');
      }
    };
    intento();
  }

  private async obtenerTicket(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) return;

    try {
      this.ticket = await this.api.getTicket(id);
      this.cargando = false;
    } catch (error) {
      console.error('❌ Error al obtener ticket:', error);
      this.cargando = false;
    }
  }

  private async generarPDF(elemento: HTMLElement) {
    try {
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

      // Redirigir después de guardar el PDF
      setTimeout(() => this.router.navigate(['/dash']), 2000);

    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
    }
  }
}
