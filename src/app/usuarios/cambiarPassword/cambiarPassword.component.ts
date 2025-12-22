import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cambiarPassword.component.html',
  styleUrls: ['./cambiarPassword.component.css']
})
export class CambiarPasswordComponent {

  @Input() idUsuario!: number;

  passwordActual = '';
  passwordNueva = '';
  passwordConfirmacion = '';

  cargando = false;
  error = '';
  exito = '';

  constructor(private apiService: ApiService) {}

  async cambiarPassword() {
    this.error = '';
    this.exito = '';

    if (!this.idUsuario) {
      this.error = 'Usuario no identificado.';
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmacion) {
      this.error = 'La nueva contraseña no coincide.';
      return;
    }

    try {
      this.cargando = true;

      await this.apiService.cambiarPassword(
        this.idUsuario,
        this.passwordActual,
        this.passwordNueva
      );

      this.exito = 'Contraseña actualizada correctamente.';
      this.passwordActual = '';
      this.passwordNueva = '';
      this.passwordConfirmacion = '';

    } catch (err: any) {
      this.error =
        err?.response?.data?.detail ||
        'Error al cambiar la contraseña.';
    } finally {
      this.cargando = false;
    }
  }
}
