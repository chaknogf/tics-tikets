// Ejecuta los tests puros de TypeScript sin depender de la resolución de
// extensiones de Node: esbuild los empaqueta y node:test los corre.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const raiz = resolve(import.meta.dirname, '..');
const directorioPruebas = join(raiz, 'tests');
const entradas = readdirSync(directorioPruebas)
  .filter((archivo) => archivo.endsWith('.test.ts'))
  .map((archivo) => join(directorioPruebas, archivo));

if (!entradas.length) {
  console.error('No hay archivos tests/*.test.ts');
  process.exit(1);
}

const salida = mkdtempSync(join(tmpdir(), 'tics-tests-'));
try {
  await build({
    entryPoints: entradas,
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: salida,
    outExtension: { '.js': '.mjs' },
    logLevel: 'warning'
  });

  const archivos = readdirSync(salida)
    .filter((archivo) => archivo.endsWith('.test.mjs'))
    .map((archivo) => join(salida, archivo));
  const resultado = spawnSync(process.execPath, ['--test', ...archivos], {
    stdio: 'inherit'
  });
  process.exit(resultado.status ?? 1);
} finally {
  rmSync(salida, { recursive: true, force: true });
}
