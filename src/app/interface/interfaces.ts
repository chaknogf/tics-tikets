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
  capacidad_carga_va?: number;
  numero_tomas?: number;
  potencia_watt?: number;
  tiempo_respaldo_min?: number;
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

export interface Redes {
  ip_wifi: string;
  ip_ethernet: string;
  mac_wifi: string;
  mac_ethernet: string;
}

export interface Actualizacion {
  fecha: string;
  usuario: string;
  nota?: string;
}
export interface Equipo {
  id: number;
  no_bien: string;
  especificaciones: string;
  datos_tecnicos?: DatosTecnicos;
  redes?: Redes;
  software_instalado?: { [key: string]: SoftwareInstalado };
  estado: string;
  actualizacion?: Actualizacion;
}

export interface EquipoCrear {

  no_bien: string;
  especificaciones: string;
  datos_tecnicos?: DatosTecnicos;
  redes?: Redes;
  software_instalado?: { [key: string]: SoftwareInstalado };
  estado: string;
  actualizacion?: Actualizacion;
}

export interface Estados {
  find(arg0: (e: any) => boolean): unknown;
  estado: string;
  total: number;
  abierto: number;
  en_proceso: number;
  cerrado: number;
}

export interface Prioridades {
  alta: number;
  media: number;
  baja: number;
}

export interface Variacion {
  total: number;
  abiertos: number;
  en_proceso: number;
  cerrados: number;
}

export interface DashboardPeriodo {
  total: number;
  estados: Estados;
  prioridades: Prioridades;
  variacion: Variacion;
}

export interface DashboardSolicitudes {
  hoy: DashboardPeriodo;
  mes_actual: DashboardPeriodo;
  año_actual: DashboardPeriodo;
}

// Tipos básicos
export type Estado = 'abiertos' | 'en_proceso' | 'cerrados';
export type Prioridad = 'alta' | 'media' | 'baja';

// Items para arrays
export interface EstadoItem {
  estado: Estado;
  total: number;
}

export interface PrioridadItem {
  prioridad: Prioridad;
  total: number;
}

// Variación
export interface VariacionResumen {
  total: number;
  abiertos: number;
  en_proceso: number;
  cerrados: number;
}

// Periodo del dashboard
export interface DashboardPeriodo {
  total: number;
  estados: Estados;       // Array de estados
  prioridades: Prioridades; // Array de prioridades
  variacion: VariacionResumen;  // Solo 1 objeto
}

// Dashboard completo
export interface DashboardResumen {
  hoy: DashboardPeriodo;
  mes_actual: DashboardPeriodo;
  año_actual: DashboardPeriodo;
}

// Resumen para tablas
export interface ResumenItem {
  usuario: string;
  fecha_solicitud?: string; // solo en diario
  total: number;
  cerrados: number;
  abiertos: number;
  en_proceso: number;
  alta: number;
  media: number;
  baja: number;
  red: number;
  computo: number;
  diseno: number;
  software: number;
  menores: number;
  efectividad: number;
}

export interface ResumenResponse {
  diario: ResumenItem[];
  acumulado: ResumenItem[];
}
