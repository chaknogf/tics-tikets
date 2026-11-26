import assert from 'node:assert/strict';
import test from 'node:test';

import { Deduplicador } from '../src/app/services/deduplicador';

test('dos lecturas simultáneas con la misma clave ejecutan una sola petición', async () => {
  const deduplicador = new Deduplicador();
  let llamadas = 0;
  const ejecutar = async () => {
    llamadas++;
    return { total: 7 };
  };

  const [a, b] = await Promise.all([
    deduplicador.obtener('/tickets/', ejecutar),
    deduplicador.obtener('/tickets/', ejecutar)
  ]);

  assert.equal(llamadas, 1);
  assert.deepEqual(a, { total: 7 });
  assert.deepEqual(b, { total: 7 });
});

test('claves distintas no se comparten', async () => {
  const deduplicador = new Deduplicador();
  const vistas: string[] = [];

  await Promise.all([
    deduplicador.obtener('/tickets/?skip=0', async () => { vistas.push('pagina-1'); return 1; }),
    deduplicador.obtener('/tickets/?skip=10', async () => { vistas.push('pagina-2'); return 2; })
  ]);

  assert.deepEqual(vistas.sort(), ['pagina-1', 'pagina-2']);
});

test('la clave se libera al terminar y permite una nueva petición', async () => {
  const deduplicador = new Deduplicador();
  let llamadas = 0;
  const ejecutar = async () => ++llamadas;

  assert.equal(await deduplicador.obtener('/dash', ejecutar), 1);
  assert.equal(await deduplicador.obtener('/dash', ejecutar), 2);
  assert.equal(llamadas, 2);
});

test('un fallo no deja la clave bloqueada', async () => {
  const deduplicador = new Deduplicador();
  let llamadas = 0;
  const ejecutar = async () => {
    llamadas++;
    if (llamadas === 1) throw new Error('servidor caído');
    return 'ok';
  };

  await assert.rejects(deduplicador.obtener('/dash', ejecutar), /servidor caído/);
  assert.equal(await deduplicador.obtener('/dash', ejecutar), 'ok');
});

test('invalidarTodo descarta lecturas en vuelo', async () => {
  const deduplicador = new Deduplicador();
  let resolver!: (valor: string) => void;
  const lenta = new Promise<string>(res => { resolver = res; });
  let llamadas = 0;
  const ejecutar = () => { llamadas++; return lenta; };

  const primera = deduplicador.obtener('/equipos/', ejecutar);
  deduplicador.invalidarTodo();
  const segunda = deduplicador.obtener('/equipos/', async () => 'fresca');

  assert.equal(await segunda, 'fresca');
  resolver('vieja');
  assert.equal(await primera, 'vieja');
  assert.equal(llamadas, 1);
});
