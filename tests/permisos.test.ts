import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accesoPermitido,
  rolPermitido,
  tienePermiso,
  type Rol
} from '../src/app/services/permisos';

const ADMIN: Rol[] = ['admin'];
const ESCRITORES: Rol[] = ['admin', 'standar'];

test('admin puede administrar, escribir y leer', () => {
  assert.equal(tienePermiso('admin', 'admin'), true);
  assert.equal(tienePermiso('admin', 'escribir'), true);
  assert.equal(tienePermiso('admin', 'leer'), true);
});

test('standar escribe y lee, pero no administra', () => {
  assert.equal(tienePermiso('standar', 'admin'), false);
  assert.equal(tienePermiso('standar', 'escribir'), true);
  assert.equal(tienePermiso('standar', 'leer'), true);
});

test('lector solo consulta', () => {
  assert.equal(tienePermiso('lector', 'admin'), false);
  assert.equal(tienePermiso('lector', 'escribir'), false);
  assert.equal(tienePermiso('lector', 'leer'), true);
});

test('rol desconocido o ausente no recibe permisos', () => {
  assert.equal(tienePermiso(null, 'leer'), false);
  assert.equal(tienePermiso('invitado', 'leer'), false);
});

test('las listas de roles de las rutas coinciden con la política', () => {
  assert.equal(rolPermitido('admin', ADMIN), true);
  assert.equal(rolPermitido('standar', ADMIN), false);
  assert.equal(rolPermitido('admin', ESCRITORES), true);
  assert.equal(rolPermitido('standar', ESCRITORES), true);
  assert.equal(rolPermitido('lector', ESCRITORES), false);
  assert.equal(rolPermitido('lector', null), true);
});

test('sin token ningún guard abre la ruta', () => {
  assert.equal(accesoPermitido(null, 'admin', null), false);
  assert.equal(accesoPermitido('', 'admin', ADMIN), false);
});

test('con token se aplica el rol exigido por la ruta', () => {
  assert.equal(accesoPermitido('jwt', 'lector', null), true);
  assert.equal(accesoPermitido('jwt', 'lector', ESCRITORES), false);
  assert.equal(accesoPermitido('jwt', 'standar', ESCRITORES), true);
  assert.equal(accesoPermitido('jwt', 'standar', ADMIN), false);
});
