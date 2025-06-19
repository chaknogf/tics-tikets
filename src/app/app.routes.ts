import { Routes } from '@angular/router';
import { SolicitudUsuarioComponent } from './solicitudUsuario/solicitudUsuario.component';
import { FormularioComponent } from './soporte/formulario/formulario.component';
import { LoginComponent } from './login/login.component';
import { TiketsComponent } from './soporte/tikets/tikets.component';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: SolicitudUsuarioComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dash', component: TiketsComponent },
  { path: 'ticket', component: FormularioComponent },
  { path: 'ticket/:id', component: FormularioComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }, // 🔚 Siempre debe ir al final
];
