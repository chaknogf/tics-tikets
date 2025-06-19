export interface Usuarios {
  id: number;
  nombre: string;
  username: string;
  password: string;
  email: string;
  role: string;
  estado: string;
}

export interface Currentuser {
  id: number;
  username: string;
  role: string;
  nombre?: string;
  email?: string;
}


// Tickets

export interface Metadata {
  usuario?: string;
  registro?: string;
}

export interface Ticket {
  id: number;
  ticket: string;
  fecha_solicitud?: string; // ISO date string
  nombre_solicitante?: string;
  servicio?: string;
  detalle?: string;
  prioridad?: string;
  atencion_en?: string;
  numero_bien?: string;
  descripcion_equipo?: string;
  insumos_utilizados?: string;
  fecha_atencion?: string; // ISO date string
  hora_atencion?: string;
  nota?: string;
  estado?: string;
  usuario?: string;
  metadatos?: { [key: string]: Metadata };
}

export interface Seguimiento {
  id: number;
  ticket_id: number;
  usuario: string;
  nota: string;
  datos?: any;
}

export interface DatosTecnicos {
  // 🔷 Identificación general
  tipo_equipo?: string;
  numero_equipo?: string;
  marca?: string;
  modelo?: string;
  series?: string;

  // 💻 Especificaciones de computadora
  procesador?: string;
  ram?: string;
  disco_duro?: string;
  cpu_serie?: string;
  monitor_serie?: string;

  // 🖨️ Especificaciones de impresora
  capacidad_bandeja?: string;
  ciclo_mensual?: string;
  funciones?: string;
  doble_cara?: boolean;
  resolucion_escaneo_ppp?: string;
  resolucion_impresion_ppp?: string;
  tecnologia?: string;
  velocidad_ppm?: number;

  // 📱 Especificaciones de tableta
  camara_frontal_mp?: number;
  camara_trasera_mp?: number;
  memoria_interna_gb?: number;
  memoria_ram_gb?: number;

  // 🔌 Especificaciones de UPS
  alarma?: string;
  capacidad_carga_va?: number;
  supresion_picos_joules?: number;
  frecuencia_entrada_hz?: string;
  frecuencia_salida_hz?: string;
  numero_tomas?: number;
  potencia_watt?: number;
  proteccion_linea_datos?: string;
  proteccion_coaxial?: string;
  tiempo_respaldo_min?: number;
  topologia?: string;
  voltaje_entrada?: string;
  voltaje_salida?: string;

  // 🌐 Conectividad (común)
  conectividad?: string;
}

export interface SoftwareInstalado {
  software?: string;
  version?: string;
  licencia?: string;
  tipo?: string;
}

export interface Equipo {
  id: number;
  no_bien: string;
  datos_tecnicos?: DatosTecnicos;
  software_instalado?: { [key: string]: SoftwareInstalado };
  estado: string;
}
