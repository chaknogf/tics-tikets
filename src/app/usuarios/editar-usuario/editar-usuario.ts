import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuarios } from '../../interface/interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { promises } from 'dns';

@Component({
  selector: 'app-editar-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-usuario.html',
  styleUrl: './editar-usuario.css',
  standalone: true
})
export class EditarUsuario implements OnInit {

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

  constructor(
     private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}


 async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');


    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        try {
          const data = await this.api.getUser(id);
          this.usuario = data[0];
          this.enEdicion = true;

          
        } catch (error) {
          console.error('❌ Error al cargar usuario para edición:', error);
        }
      } else {
        console.warn('⚠️ ID inválido en la URL:', idParam);
      }
    }
  }

}
