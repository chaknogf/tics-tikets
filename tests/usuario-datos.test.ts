import assert from 'node:assert/strict';
import test from 'node:test';

import {
  perfilParaActualizar,
  solicitudCambiarPassword,
} from '../src/app/services/usuario-datos';

test('la solicitud de contraseña usa los nombres del backend y la confirmación', () => {
  const solicitud = solicitudCambiarPassword('Actual1', 'Nueva123', 'Nueva123');
  assert.deepEqual(solicitud, {
    password_actual: 'Actual1',
    password_nueva: 'Nueva123',
    confirm_password: 'Nueva123',
  });
});

test('el perfil enviado al PUT no incluye el hash de contraseña', () => {
  const perfil = perfilParaActualizar({
    id: 1,
    nombre: 'Ana',
    username: 'ana',
    password: '$argon2id$v=19$hash',
    email: 'ana@example.com',
    role: 'admin',
    estado: 'A',
  });
  assert.equal('password' in perfil, false);
  assert.equal(perfil.username, 'ana');
  assert.equal(perfil.role, 'admin');
});
