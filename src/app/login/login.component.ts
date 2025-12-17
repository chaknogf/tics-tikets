// src/app/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NotificacionesService } from '../services/notificaciones.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  // styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private notificacionesService: NotificacionesService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

 onSubmit() {
  if (this.loginForm.invalid) {
    this.errorMessage = 'Por favor complete todos los campos.';
    return;
  }

  this.loading = true;
  const { username, password } = this.loginForm.value;

  this.apiService.login(username, password)
    .then((user) => {
      console.log('✅ Usuario autenticado:', user);

      // 🔌 Conectar WebSocket UNA VEZ
      this.notificacionesService.conectar(user.id);

      this.router.navigate(['/dash']);
    })
    .catch((error) => {
      this.errorMessage = this.getErrorMessage(error);
    })
    .finally(() => {
      this.loading = false;
    });
}


  getErrorMessage(error: any): string {
    if (!error || !error.response) {
      return 'Error desconocido. Inténtalo nuevamente.';
    }

    const status = error.response.status;

    if (error.response.data?.message) {
      return error.response.data.message;
    }

    switch (status) {
      case 400:
        return 'Solicitud incorrecta. Verifica los datos ingresados.';
      case 401:
        return 'Credenciales incorrectas.';
      case 403:
        return 'No tiene permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado.';
      case 422:
        return 'Formato de datos inválido.';
      case 500:
        return 'Error del servidor. Inténtalo más tarde.';
      default:
        return `Error inesperado (código ${status}).`;
    }
  }

  verLoader() {
    this.loading = true
  }





}
