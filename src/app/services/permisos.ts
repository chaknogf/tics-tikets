export type Rol = 'admin' | 'standar' | 'lector';

/** Rol vigente en la sesión; se lee de localStorage para sobrevivir recargas. */
export function rolActual(): string | null {
  return localStorage.getItem('role');
}

/** Permisos derivados del rol guardado en localStorage. */
export function tienePermiso(rol: string | null, permiso: 'admin' | 'escribir' | 'leer'): boolean {
  if (rol === 'admin') return true;
  if (permiso === 'leer') return rol === 'standar' || rol === 'lector';
  if (permiso === 'escribir') return rol === 'standar';
  return false;
}

/** Roles admitidos en una ruta protegida; null significa cualquier autenticado. */
export function rolPermitido(rol: string | null, permitidos: Rol[] | null): boolean {
  if (!rol) return false;
  return permitidos === null || permitidos.includes(rol as Rol);
}

/** Condición completa que evalúan los guards: token vigente en la sesión y rol. */
export function accesoPermitido(
  token: string | null,
  rol: string | null,
  permitidos: Rol[] | null
): boolean {
  return Boolean(token) && rolPermitido(rol, permitidos);
}
