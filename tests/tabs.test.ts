import assert from 'node:assert/strict';
import test from 'node:test';

import { indiceTabSiguiente } from '../src/app/services/tabs';

test('las flechas recorren las pestañas sin envolver', () => {
  assert.equal(indiceTabSiguiente(0, 3, 'ArrowRight'), 1);
  assert.equal(indiceTabSiguiente(2, 3, 'ArrowRight'), 2);
  assert.equal(indiceTabSiguiente(2, 3, 'ArrowLeft'), 1);
  assert.equal(indiceTabSiguiente(0, 3, 'ArrowLeft'), 0);
});

test('Home y End llevan a los extremos', () => {
  assert.equal(indiceTabSiguiente(1, 3, 'Home'), 0);
  assert.equal(indiceTabSiguiente(1, 3, 'End'), 2);
});

test('otras teclas no cambian la pestaña con foco', () => {
  assert.equal(indiceTabSiguiente(1, 3, 'Enter'), null);
  assert.equal(indiceTabSiguiente(1, 3, ' '), null);
  assert.equal(indiceTabSiguiente(1, 3, 'Tab'), null);
});
