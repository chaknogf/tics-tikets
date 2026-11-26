import type { Usuarios } from '../interface/interfaces';

export interface CambiarPasswordSolicitud {
  password_actual: string;
  password_nueva: string;
  confirm_password: string;
}

/** Contrato exacto de PATCH /user/{id}/password. */
export function solicitudCambiarPassword(
  passwordActual: string,
  passwordNueva: string,
  confirmPassword: string,
): CambiarPasswordSolicitud {
  return {
    password_actual: passwordActual,
    password_nueva: passwordNueva,
    confirm_password: confirmPassword,
  };
}

/** El perfil nunca debe reenviar el hash ni inventar credenciales. */
export function perfilParaActualizar<T extends Partial<Usuarios>>(usuario: T): Omit<T, 'password'> {
  const { password: _password, ...perfil } = usuario;
  return perfil;
}
