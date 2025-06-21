import { Routes } from '@angular/router';
import { SolicitudUsuarioComponent } from './solicitudUsuario/solicitudUsuario.component';
import { FormularioComponent } from './soporte/formulario/formulario.component';
import { LoginComponent } from './login/login.component';
import { TiketsComponent } from './soporte/tikets/tikets.component';
import { DetalleComponent } from './soporte/detalle/detalle.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: SolicitudUsuarioComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dash', component: TiketsComponent, canActivate: [AuthGuard] },
  { path: 'ticket', component: FormularioComponent, canActivate: [AuthGuard] }, // Formulario para crear un nuevo ticket
  { path: 'ticket/:id', component: FormularioComponent, canActivate: [AuthGuard] }, // Formulario para editar un ticket existente
  { path: 'detail/:id', component: DetalleComponent }, // Detalle del ticket
  { path: '**', redirectTo: '', pathMatch: 'full' }, // 🔚 Siempre debe ir al final
];
