import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { accesoPermitido, Rol } from '../services/permisos';

function verificarAcceso(
  router: Router,
  permitidos: Rol[] | null,
  destino: string
): boolean | UrlTree {
  const token = localStorage.getItem('access_token');
  const rol = localStorage.getItem('role');
  if (!accesoPermitido(token, rol, permitidos)) {
    return router.createUrlTree([destino]);
  }
  return true;
}

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    return verificarAcceso(this.router, null, '/');
  }
}

/** Guard para rutas de escritura (formularios de tickets, mantenimientos, bajas). */
@Injectable({ providedIn: 'root' })
export class EscritorGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    return verificarAcceso(this.router, ['admin', 'standar'], '/dash');
  }
}

/** Guard para rutas exclusivas de administradores. */
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    return verificarAcceso(this.router, ['admin'], '/dash');
  }
}
