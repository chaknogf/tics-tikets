import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Equipo } from '../../interface/interfaces';

@Component({
  selector: 'app-verEquipo',
  templateUrl: './verEquipo.component.html',
  styleUrls: ['./verEquipo.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class VerEquipoComponent implements OnInit {

  public equipo: Equipo = {
    id: 0,
    no_bien: '',
    especificaciones: '',
    datos_tecnicos: {
      tipo_equipo: '',
      marca: '',
      modelo: '',
      series: '',
      procesador: '',
      ram: '',
      disco_duro: '',
      cpu_serie: '',
      monitor_serie: '',
      capacidad_bandeja: '',
      ciclo_mensual: '',
      funciones: '',
      doble_cara: false,
      resolucion_escaneo_ppp: '',
      resolucion_impresion_ppp: '',
      tecnologia: '',
      velocidad_ppm: 0,
      camara_frontal_mp: 0,
      camara_trasera_mp: 0,
      memoria_interna_gb: 0,
      memoria_ram_gb: 0,
      capacidad_carga_va: 0,
      numero_tomas: 0,
      potencia_watt: 0,
      tiempo_respaldo_min: 0,
      voltaje_entrada: '',
      voltaje_salida: '',
      conectividad: ''
    },
    redes: {
      ip_wifi: '',
      ip_ethernet: '',
      mac_wifi: '',
      mac_ethernet: '',

    },
    software_instalado: {},
    estado: '',
    actualizacion: {
      fecha: '',
      usuario: '',
      nota: ''
    }
  }
  constructor(
    private api: ApiService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.obtenerEquipo();
  }

  private obtenerEquipo(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.api.equipo(id).then((data: Equipo) => {
          this.equipo = data;
          // console.log('✅ Ticket obtenido:', this.ticket);
        }).catch(error => {
          console.error('❌ Error al obtener equipo:', error);
        });
      } else {
        console.error('❌ ID inválido:', idParam);
      }
    }
  }

  imprimir(): void {
    window.print();
  }

  cerrar(): void {
    this.router.navigate(['/equipos']);
  }

}
