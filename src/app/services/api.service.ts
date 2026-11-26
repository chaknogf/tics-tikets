// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Router } from '@angular/router';
import {
  BajaCrear, BajaItem, CorrelativoPreview, DashboardResumen, Equipo, EstadisticasResponse,
  FrecuenciaItem, ListaConTotal, MantenimientoCrear, MantenimientoItem,
  MantenimientoRealizadoItem, MantenimientoResumen, ResumenResponse, Ticket, Usuarios
} from '../interface/interfaces';
import { NotificacionesService } from './notificaciones.service';
import { paginar, RangoTickets, ticketEnRango } from './filtros-tickets';
import { parametrosEstadisticas } from './reporte-datos';
import { Deduplicador } from './deduplicador';
import { perfilParaActualizar, solicitudCambiarPassword } from './usuario-datos';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api: AxiosInstance;
  public readonly baseUrl = 'https://www.htecpan.com/tik';
  // public readonly baseUrl = 'http://localhost:8000';
  public token: string | null = null;
  public username: string | null = null;
  public role: string | null = null;

  // Solo se usa con el backend antiguo; se invalida al crear/editar/borrar tickets.
  private cacheTickets = new Map<string, { datos: Ticket[]; fecha: number }>();
  private readonly ttlCacheTickets = 60_000;
  private readonly deduplicador = new Deduplicador();

  /** Las mutaciones descartan tanto la caché antigua como las lecturas en vuelo. */
  private invalidarLecturas(): void {
    this.cacheTickets.clear();
    this.deduplicador.invalidarTodo();
  }

  constructor(
    private router: Router,
    // private notificationsService: NotificacionesService
  ) {



    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 20_000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.api.interceptors.request.use(
      config => {
        const token = localStorage.getItem('access_token');

        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        //console.log('🛰️ Interceptor ejecutado:', config);
        return config;
      },
      error => Promise.reject(error)
    );

    // Un 401 significa sesión vencida o token inválido: se limpia y vuelve al inicio.
    // El login fallido se excluye para no borrar una sesión activa ni redirigir.
    this.api.interceptors.response.use(
      response => response,
      error => {
        const url = error.config?.url ?? '';
        if (error.response?.status === 401 && !url.includes('/auth/login')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          localStorage.removeItem('user_id');
          this.token = null;
          this.username = null;
          this.role = null;
          this.invalidarLecturas();
          void this.router.navigate(['/']);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Inicia sesión con las credenciales del usuario.
   * @param username Usuario
   * @param password Contraseña
   */
  async login(username: string, password: string): Promise<any> {
    const response = await this.api.post(
      '/auth/login',
      new URLSearchParams({ username, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = response.data.access_token;
    if (!token) {
      throw new Error('No se recibió el token');
    }

    localStorage.setItem('access_token', token);

    // 🔑 Obtener y RETORNAR el usuario real
    return await this.getCurrentUser();
  }


  /**
   * Obtiene la información del usuario autenticado.
   */
  async getCurrentUser(): Promise<any> {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');


    if (!token) {
      throw new Error('🔒 No estás autenticado.');
    }

    try {
      const response = await this.getUnico<{ username: string; role: string }>('/auth/me', {
        headers: {
          usuario: username || '',
          rol: role || ''
        }
      });

      const { username: nombreUsuario, role: rolUsuario } = response.data;

      localStorage.setItem('username', nombreUsuario);
      localStorage.setItem('role', rolUsuario);
      //window.location.reload();

      // console.log('✅ Usuario autenticado:', response.data);
      //console.log(username, role);
      return response.data;

    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      throw error;
    }
  }

  async meUser(): Promise<any> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('🔒 No estás autenticado.');
    }

    try {
      const response = await this.getUnico<Usuarios>('/auth/allme');
      //console.log('👤 Usuario actual obtenido correctamente', response);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      throw error;
    }
  }

  logOut() {
    this.invalidarLecturas();
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    // window.location.reload();
    this.router.navigate(['/inicio']);



  }

  limpiarParametros(filtros: any): any {
    const filtrosLimpiados: any = {};
    for (const key in filtros) {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        filtrosLimpiados[key] = filtros[key];
      }
    }
    return filtrosLimpiados;
  }

  /**
   * GET deduplicado mientras está en vuelo; nunca cachea la respuesta.
   * Si el llamador aporta un AbortSignal se respeta y no se comparte.
   */
  private getUnico<T>(
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    if (config.signal) {
      return this.api.get<T>(url, config);
    }

    const clave = JSON.stringify([
      url,
      config.params ?? null,
      config.headers ?? null,
      localStorage.getItem('access_token') ?? null
    ]);
    return this.deduplicador.obtener(clave, () => this.api.get<T>(url, config));
  }

  private async listarConTotal<T>(
    ruta: string,
    filtros: any,
    etiqueta: string,
  ): Promise<ListaConTotal<T>> {
    try {
      const response = await this.getUnico<T[]>(ruta, {
        params: this.limpiarParametros(filtros)
      });
      const cabecera = response.headers?.['x-total-count'];
      const total = Number(cabecera ?? response.data.length);
      return {
        items: response.data,
        total: Number.isFinite(total) ? total : response.data.length
      };
    } catch (error) {
      console.error(etiqueta, error);
      throw error;
    }
  }

  // ======= USERS =======

  async usuarioActual(): Promise<any> {
    try {
      const response = await this.getUnico<Usuarios>('/auth/me');
      //console.log('👤 Usuario actual obtenido correctamente', response);
      return response.data;

    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      throw error;
    }
  }


  async getUsers(filtros: any): Promise<any> {
    try {
      const response = await this.getUnico<Usuarios[]>('/user/', {
        params: filtros
      });
      console.log('👤 Usuarios obtenidos correctamente', response);
      return response.data;

    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      throw error;
    }
  }

  async getUser(id: number): Promise<any> {
    try {
      const response = await this.getUnico<Usuarios[]>('/user/', {
        params: { id, skip: 0, limit: 1 }
      });
      console.log('👤 Usuarios obtenidos correctamente', response);
      return response.data;

    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error)
      throw error;
    }
  }

  async createUser(user: any): Promise<any> {
    try {
      const response = await this.api.post('/user/crear', user);
      console.log('👤 Usuario creado correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      throw error;
    }
  }

  async updateUser(userId: number, user: any): Promise<any> {
    try {
      const response = await this.api.put(`/user/actualizar/${userId}`, perfilParaActualizar(user),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }

      );
      //console.log('👤 Usuario actualizado correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      throw error;
    }
  }

  async cambiarPassword(
    userId: number,
    passwordActual: string,
    passwordNueva: string,
    confirmPassword: string = passwordNueva
  ): Promise<any> {
    try {
      const body = solicitudCambiarPassword(
        passwordActual, passwordNueva, confirmPassword
      );

      const response = await this.api.patch(
        `/user/${userId}/password`,
        body,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // ✔️ Retornamos la respuesta del backend
      return response.data;

    } catch (error) {
      console.error('❌ Error al cambiar la contraseña:', error);
      throw error;
    }
  }

  async deleteUser(userId: number | string): Promise<any> {
    try {
      const response = await this.api.delete(`/user/eliminar/${userId}`);
      console.log('👤 Usuario eliminado correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      throw error;
    }
  }

  // ======= TICKETS =======

  private hayFiltroFecha(filtros: any): boolean {
    return Boolean(filtros.fecha_desde || filtros.fecha_hasta || filtros.mes);
  }

  /** El backend antiguo pagina antes de filtrar: hay que traer todas las páginas. */
  private async todosLosTickets(filtros: any): Promise<Ticket[]> {
    const filtrosServidor = this.limpiarParametros({
      id: filtros.id,
      ticket: filtros.ticket,
      servicio: filtros.servicio,
      numero_bien: filtros.numero_bien,
      atencion_en: filtros.atencion_en,
      prioridad: filtros.prioridad,
      estado: filtros.estado,
    });
    const clave = JSON.stringify(filtrosServidor);
    const guardado = this.cacheTickets.get(clave);
    if (guardado && Date.now() - guardado.fecha < this.ttlCacheTickets) {
      return guardado.datos;
    }

    const tamanio = 200;
    const resultados: Ticket[] = [];
    for (let pagina = 0; pagina < 50; pagina++) {
      const respuesta = await this.getUnico<Ticket[]>('/tickets/', {
        params: { ...filtrosServidor, skip: pagina * tamanio, limit: tamanio }
      });
      const filas = Array.isArray(respuesta.data) ? respuesta.data : [];
      resultados.push(...filas);
      if (filas.length < tamanio) {
        break;
      }
    }
    this.cacheTickets.set(clave, { datos: resultados, fecha: Date.now() });
    return resultados;
  }

  // ✅ Obtener tickets con filtros; el total viaja en X-Total-Count.
  // Si el backend es antiguo (sin esa cabecera), filtramos por fecha_solicitud aquí.
  async getTickets(filtros: any): Promise<any> {
    try {
      const filtrosLimpiados = this.limpiarParametros(filtros);
      const response = await this.getUnico<Ticket[]>('/tickets/', {
        params: filtrosLimpiados
      });
      const cabecera = Number(response.headers['x-total-count']);
      const totalServidor = Number.isFinite(cabecera) ? cabecera : null;
      let filas = Array.isArray(response.data) ? response.data : [];
      let total = totalServidor ?? filas.length;

      if (totalServidor === null && this.hayFiltroFecha(filtrosLimpiados)) {
        const todas = await this.todosLosTickets(filtrosLimpiados);
        const filtradas = todas.filter(ticket =>
          ticketEnRango(ticket, filtrosLimpiados as RangoTickets)
        );
        total = filtradas.length;
        filas = paginar(
          filtradas,
          Number(filtrosLimpiados.skip) || 0,
          Number(filtrosLimpiados.limit) || 10
        );
      }

      return Object.assign(filas, { total });
    } catch (error) {
      console.error('❌ Error al obtener tickets:', error);
      throw error;
    }
  }



  async getTicket(id: number): Promise<any> {
    try {
      const response = await this.getUnico<Ticket[]>('/tickets/', {
        params: { id, skip: 0, limit: 1 }
      });

      console.log('📝 Ticket obtenido correctamente');
      // Si la respuesta es un array, devolver el primer elemento
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
      console.error('❌ Error al obtener ticket:', error);
      throw error;
    }
  }

  // ✅ Obtener notas de un ticket específico
  async getNotas(id: number): Promise<any> {
    try {
      const response = await this.getUnico(`/ticketdata/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener notas:', error);
      throw error;
    }
  }

  // ✅ Crear un nuevo ticket
  async createTicket(ticket: any): Promise<any> {
    try {
      const response = await this.api.post(
        '/ticket/crear/', ticket,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('📝 Ticket creado correctamente');
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear ticket:', error);
      throw error;
    }
  }

  // ✅ Crear una nota de seguimiento
  async createNota(nota: any): Promise<any> {
    try {
      const response = await this.api.post('/nota/crear/', nota, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('📝 Nota creada correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear nota:', error);
      throw error;
    }
  }

  // ✅ Actualizar un ticket existente
  async updateTicket(ticketId: number, ticket: any): Promise<any> {
    try {
      const response = await this.api.put(`/ticket/actualizar/${ticketId}`, ticket,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      // console.log('📝 Ticket actualizado correctamente');
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar ticket:', error);
      throw error;
    }
  }

  // ✅ Eliminar un ticket por ID
  async deleteTicket(ticketId: number | string): Promise<any> {
    try {
      const response = await this.api.delete(`/ticket/eliminar/${ticketId}`);
      console.log('📝 Ticket eliminado correctamente');
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar ticket:', error);
      throw error;
    }
  }

  // ✅ Eliminar una nota de seguimiento por ID
  async deleteNota(notaId: number | string): Promise<any> {
    try {
      const response = await this.api.delete(`/nota/eliminar/${notaId}`);
      console.log('📝 Nota eliminada correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar nota:', error);
      throw error;
    }
  }
  // ======== Equipos ========


  async getEquipos(filtros: any): Promise<any> {
    try {
      const filtrosLimpiados = this.limpiarParametros(filtros);
      const response = await this.getUnico<Equipo[]>('/equipos/', {
        params: filtrosLimpiados
      });
      const total = Number(response.headers['x-total-count']);
      return Array.isArray(response.data)
        ? Object.assign(response.data, { total: Number.isFinite(total) ? total : response.data.length })
        : response.data;

    } catch (error) {
      console.error('❌ Error al obtener equipos:', error);
      throw error;
    }
  }

  async equipo(id: number): Promise<any> {
    try {
      const response = await this.getUnico<Equipo[]>('/equipos/', {
        params: { id, skip: 0, limit: 1 }
      });

      // console.log('📝 Equipo obtenido correctamente');
      // Si la respuesta es un array, devolver el primer elemento
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
      console.error('❌ Error al obtener equipo:', error);
      throw error;
    }
  }

  async getEquipo(nobien: string): Promise<any> {
    try {

      const response = await this.getUnico<Equipo[]>('/equipoBien/' + nobien);
      // console.log('👤 Equipos obtenidos correctamente', response);
      return response.data;

    } catch (error) {
      console.error('❌ Error al obtener equipos:', error);
      throw error;
    }
  }

  async createEquipo(equipo: any): Promise<any> {
    try {
      const response = await this.api.post('/equipo/crear/', equipo,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }

      );
      console.log('👤 Equipo creado correctamente');
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear equipo:', error);
      throw error;
    }
  }

  async updateEquipo(equipoId: number, equipo: any): Promise<any> {
    try {
      const response = await this.api.put(`/equipo/actualizar/${equipoId}`, equipo,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }

      );
      console.log('👤 Equipo actualizado correctamente');
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar equipo:', error);
      throw error;
    }
  }

  async deleteEquipo(equipoId: number | string): Promise<any> {
    try {
      const response = await this.api.delete(`/equipo/eliminar/${equipoId}`);
      console.log('👤 Equipo eliminado correctamente');
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar equipo:', error);
      throw error;
    }
  }

  async getDashboardSolicitudes(): Promise<any> {
    try {
      const response = await this.getUnico<DashboardResumen>('/dashboard/solicitudes');
      // console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener solicitudes:', error);
      throw error;
    }
  }

  async getResumen(
    fechaInicio: string,
    fechaFin: string,
    usuario: string,
    mes?: string
  ): Promise<ResumenResponse> {
    try {
      const response = await this.getUnico<ResumenResponse>(
        '/resumen/',
        {
          params: this.limpiarParametros({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            usuario: usuario,
            mes: mes
          })
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener resumen:', error);
      throw error;
    }
  }

  async getEstadisticas(filtros: any = {}): Promise<EstadisticasResponse> {
    try {
      const parametros = parametrosEstadisticas(filtros);
      const response = await this.getUnico<EstadisticasResponse>(
        '/reportes/estadisticas',
        { params: this.limpiarParametros(parametros) }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  async getMantenimientos(filtros: any = {}): Promise<MantenimientoItem[]> {
    const respuesta = await this.getMantenimientosConTotal(filtros);
    return respuesta.items;
  }

  async getMantenimientosConTotal(
    filtros: any = {}
  ): Promise<ListaConTotal<MantenimientoItem>> {
    return this.listarConTotal<MantenimientoItem>(
      '/mantenimientos/',
      filtros,
      '❌ Error al obtener mantenimientos:'
    );
  }

  async getMantenimientosRealizados(
    filtros: any = {}
  ): Promise<ListaConTotal<MantenimientoRealizadoItem>> {
    return this.listarConTotal<MantenimientoRealizadoItem>(
      '/mantenimientos/realizados',
      filtros,
      '❌ Error al obtener el historial de mantenimientos:'
    );
  }

  async getResumenMantenimientos(): Promise<MantenimientoResumen> {
    try {
      const response = await this.getUnico<MantenimientoResumen>('/mantenimientos/resumen');
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener resumen de mantenimientos:', error);
      throw error;
    }
  }

  async getFrecuenciasMantenimiento(): Promise<FrecuenciaItem[]> {
    try {
      const response = await this.getUnico<FrecuenciaItem[]>('/mantenimientos/frecuencias');
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener frecuencias:', error);
      throw error;
    }
  }

  async crearMantenimiento(datos: MantenimientoCrear): Promise<any> {
    try {
      const response = await this.api.post('/mantenimientos/', datos, {
        headers: { 'Content-Type': 'application/json' }
      });
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear mantenimiento:', error);
      throw error;
    }
  }

  // ======== Bajas de equipos ========

  async getBajas(filtros: any = {}): Promise<BajaItem[]> {
    const respuesta = await this.getBajasConTotal(filtros);
    return respuesta.items;
  }

  async getBajasConTotal(filtros: any = {}): Promise<ListaConTotal<BajaItem>> {
    return this.listarConTotal<BajaItem>(
      '/bajas/',
      filtros,
      '❌ Error al obtener bajas:'
    );
  }

  async getBaja(id: number): Promise<BajaItem> {
    try {
      const response = await this.getUnico<BajaItem>(`/bajas/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener el acta de baja:', error);
      throw error;
    }
  }

  async getSiguienteCorrelativo(anio: number): Promise<CorrelativoPreview> {
    try {
      const response = await this.getUnico<CorrelativoPreview>('/bajas/siguiente', {
        params: { anio }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener correlativo:', error);
      throw error;
    }
  }

  async crearBaja(datos: BajaCrear): Promise<BajaItem> {
    try {
      const response = await this.api.post<BajaItem>('/bajas/', datos, {
        headers: { 'Content-Type': 'application/json' }
      });
      this.invalidarLecturas();
      return response.data;
    } catch (error) {
      console.error('❌ Error al registrar la baja:', error);
      throw error;
    }
  }

}




