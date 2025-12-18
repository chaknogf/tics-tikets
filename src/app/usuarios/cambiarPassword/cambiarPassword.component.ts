import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiarPassword.component.html',
  styleUrls: ['./cambiarPassword.component.css'],
  standalone: true
})
export class CambiarPasswordComponent {

  passwordActual = '';
  passwordNueva = '';
  passwordConfirmacion = '';

  cargando = false;
  error = '';
  exito = '';

  constructor(private apiService: ApiService) { }

  async cambiarPassword() {
    this.error = '';
    this.exito = '';

    if (this.passwordNueva !== this.passwordConfirmacion) {
      this.error = 'La nueva contraseña no coincide.';
      return;
    }

    try {
      this.cargando = true;

      const user = await this.apiService.usuarioActual();

      await this.apiService.cambiarPassword(
        user.id,
        this.passwordActual,
        this.passwordNueva
      );

      this.exito = 'Contraseña actualizada correctamente.';
      this.passwordActual = '';
      this.passwordNueva = '';
      this.passwordConfirmacion = '';

    } catch (err: any) {
      this.error = err?.response?.data?.detail || 'Error al cambiar la contraseña.';
    } finally {
      this.cargando = false;
    }
  }
}
