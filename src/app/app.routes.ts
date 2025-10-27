import { Routes } from '@angular/router';
import { SolicitudUsuarioComponent } from './solicitudUsuario/solicitudUsuario.component';
import { FormularioComponent } from './soporte/formulario/formulario.component';
import { LoginComponent } from './login/login.component';
import { TiketsComponent } from './soporte/tikets/tikets.component';
import { DetalleComponent } from './soporte/detalle/detalle.component';
import { AuthGuard } from './guards/auth.guard';
import { FormEquipoComponent } from './equipos/formEquipo/formEquipo.component';
import { VerEquipoComponent } from './equipos/verEquipo/verEquipo.component';
import { EquiposComponent } from './equipos/equipos/equipos.component';
import { ReporteComponent } from './equipos/reporte/reporte.component';
import { PdfTicketComponent } from './pdfTicket/pdfTicket.component';

export const routes: Routes = [
  { path: '', component: SolicitudUsuarioComponent, pathMatch: 'full' },
  { path: 'inicio', component: SolicitudUsuarioComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dash', component: TiketsComponent, canActivate: [AuthGuard] },
  { path: 'ticket', component: FormularioComponent, canActivate: [AuthGuard] }, // Formulario para crear un nuevo ticket
  { path: 'tiket/:origen', component: FormularioComponent, canActivate: [AuthGuard] },
  { path: 'ticket/:id', component: FormularioComponent, canActivate: [AuthGuard] }, // Formulario para editar un ticket existente
  { path: 'detail/:id', component: DetalleComponent }, // Detalle del ticket
  { path: 'ticketPdf/:id', component: PdfTicketComponent },
  { path: 'equipo/:id', component: FormEquipoComponent, canActivate: [AuthGuard] },
  { path: 'equipo', component: FormEquipoComponent, canActivate: [AuthGuard] },
  { path: 'ver-equipo/:id', component: VerEquipoComponent, canActivate: [AuthGuard] },
  { path: 'equipos', component: EquiposComponent, canActivate: [AuthGuard] },
  { path: 'reporteEquipos', component: ReporteComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' }, // 🔚 Siempre debe ir al final
];
