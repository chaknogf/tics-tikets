// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { Router } from '@angular/router';
import { DashboardResumen, Equipo, ResumenResponse, Ticket, Usuarios } from '../interface/interfaces';
import { NotificacionesService } from './notificaciones.service';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private api: AxiosInstance;
  public readonly baseUrl = 'https://www.htecpan.com/tik';
  // public readonly baseUrl = 'http://localhost:8000';
  public token: string | null = null;
  public username: string | null = null;
  public role: string | null = null;

  constructor(
    private router: Router,
    // private notificationsService: NotificacionesService
  ) {



    this.api = axios.create({
      baseURL: this.baseUrl,
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
      const response = await this.api.get('/auth/me', {
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
      const response = await this.api.get<Usuarios>('/auth/allme');
      //console.log('👤 Usuario actual obtenido correctamente', response);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      throw error;
    }
  }

  logOut() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
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

  // ======= USERS =======

  async usuarioActual(): Promise<any> {
    try {
      const response = await this.api.get<Usuarios>('/auth/me');
      //console.log('👤 Usuario actual obtenido correctamente', response);
      return response.data;

    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      throw error;
    }
  }


  async getUsers(filtros: any): Promise<any> {
    try {
      const response = await this.api.get<Usuarios[]>('/user/', {
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
      const response = await this.api.get<Usuarios[]>(`/user/?id=${id}&skip=0&limit=1`);
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
      const response = await this.api.put(`/user/actualizar/${userId}`, user,
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
    passwordNueva: string
  ): Promise<any> {
    try {
      const body = {
        password_actual: passwordActual,
        password_nueva: passwordNueva
      };

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

  // ✅ Obtener todos los tickets con filtros
  async getTickets(filtros: any): Promise<any> {
    try {
      const filtrosLimpiados = this.limpiarParametros(filtros);
      const response = await this.api.get<Ticket[]>('/tickets/', {
        params: filtrosLimpiados
      });
      // console.log('📝 Tickets obtenidos correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener tickets:', error);
      throw error;
    }
  }



  async getTicket(id: number): Promise<any> {
    try {
      const response = await this.api.get<Ticket[]>(`/tickets/?id=${id}&skip=0&limit=1`);

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
      const response = await this.api.get(`/ticketdata/${id}`); // ← CORREGIDO
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
      const response = await this.api.get<Equipo[]>('/equipos/', {
        params: filtrosLimpiados
      });
      // console.log('👤 Equipos obtenidos correctamente', response);
      return response.data;

    } catch (error) {
      console.error('❌ Error al obtener equipos:', error);
      throw error;
    }
  }

  async equipo(id: number): Promise<any> {
    try {
      const response = await this.api.get<Equipo[]>(`/equipos/?id=${id}&skip=0&limit=1`);

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

      const response = await this.api.get<Equipo[]>('/equipoBien/' + nobien);
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
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar equipo:', error);
      throw error;
    }
  }

  async getDashboardSolicitudes(): Promise<any> {
    try {
      const response = await this.api.get<DashboardResumen[]>('/dashboard/solicitudes');
      // console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener solicitudes:', error);
      throw error;
    }
  }

  async getResumen(fechaInicio: string, fechaFin: string, usuario: string): Promise<ResumenResponse> {
    try {
      const response = await this.api.get<ResumenResponse>(
        '/tik/resumen/',
        {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            usuario: usuario
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener resumen:', error);
      throw error;
    }
  }



}




