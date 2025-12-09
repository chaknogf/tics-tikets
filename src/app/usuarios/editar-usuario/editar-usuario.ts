import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuarios } from '../../interface/interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';


@Component({
  selector: 'app-editar-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-usuario.html',
  styleUrl: './editar-usuario.css',
  standalone: true
})
export class EditarUsuario implements OnInit {

  mostrarPassword: boolean = false;
  public enEdicion: Boolean = false;
  usuario: Usuarios = {
    id: 0,
    nombre: '',
    username: '',
    password: '',
    email: '',
    role: '',
    estado: ''
  }
  passwordConfirm: string = '';
  passwordsMatch: boolean = true;
  passwordChanged: boolean = false;
  passwordActual: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) { }


  async ngOnInit(): Promise<void> {
    this.usuarioActual();
  }

  async guardar(): Promise<void> {
    try {

      await this.api.updateUser(this.usuario.id, this.usuario);
      console.log('✅ Usuario actualizado con éxito');

      this.router.navigate(['/dash']);
    } catch (error) {
      console.error('❌ Error al guardar usuario:', error);
    }
  }

  async usuarioActual(): Promise<void> {
    try {
      const data = await this.api.meUser();
      this.usuario = data;
    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
    }
  }

  cancelar(): void {
    this.router.navigate(['/dash']);
  }



}
