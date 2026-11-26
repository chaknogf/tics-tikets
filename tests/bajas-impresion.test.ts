import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const leer = (ruta: string) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

const COMPONENTE = 'src/app/soporte/bajas/bajas.component.ts';
const PLANTILLA = 'src/app/soporte/bajas/bajas.component.html';
const ESTILOS = 'src/app/soporte/bajas/bajas.component.css';

test('el listado ofrece imprimir cada acta registrada', () => {
  const plantilla = leer(PLANTILLA);
  const fuente = leer(COMPONENTE);

  assert.match(plantilla, /\(click\)="imprimirActa\(baja\)"/);
  assert.match(plantilla, /\[attr\.aria-label\]="'Imprimir acta ' \+ baja\.correlativo"/);
  assert.match(fuente, /async imprimirActa\(baja: BajaItem\): Promise<void>/);
  assert.match(fuente, /this\.acta = await this\.api\.getBaja\(baja\.id\)/);
  assert.match(fuente, /this\.cdr\.detectChanges\(\);[\s\S]*this\.imprimir\(\);/);
});

test('la impresión aísla el acta para no arrastrar páginas en blanco', () => {
  const fuente = leer(COMPONENTE);

  assert.match(fuente, /@page \{ size: letter; margin: 25mm 30mm; \}/);
  assert.match(fuente, /body\.imprimiendo-baja > \*:not\(#impresion-baja\) \{ display: none !important; \}/);
  assert.doesNotMatch(fuente, /visibility: hidden !important/);
  assert.match(fuente, /contenedor\.id = 'impresion-baja'/);
  assert.match(fuente, /cloneNode\(true\)/);
  assert.match(fuente, /copia\.id = 'acta-baja-impresion'/);
  assert.match(fuente, /window\.addEventListener\('afterprint', limpiar\)/);
  assert.match(fuente, /ngOnDestroy\(\): void \{[\s\S]*this\.limpiarImpresion\?\.\(\)/);
});

test('la impresión usa la hoja y los márgenes de formato baja.docx', () => {
  const fuente = leer(COMPONENTE);

  assert.match(fuente, /@page \{ size: letter; margin: 25mm 30mm; \}/);
  assert.match(fuente, /format: 'letter'/);
  assert.match(fuente, /const margenX = 30;/);
  assert.match(fuente, /const margenY = 25;/);
});

test('el acta sigue la estructura del documento de Word', () => {
  const plantilla = leer(PLANTILLA);
  const estilos = leer(ESTILOS);

  assert.match(plantilla, /class="acta-tabla acta-tabla-datos" role="presentation"/);
  assert.match(plantilla, /class="acta-tabla acta-tabla-firma" role="presentation"/);
  assert.match(plantilla, /Fecha de Solicitud:<\/strong> \{\{ fechaLegible \}\}/);
  assert.match(plantilla, /Responsable del Equipo:<\/strong> \{\{ acta\.responsable_nombre \}\}/);
  assert.match(plantilla, /<strong>Código SICOIN&nbsp;&nbsp;:<\/strong>/);
  assert.match(plantilla, /acta-justificado/);
  assert.match(plantilla, /\[\{\{ acta\.destino_final === 'reasignacion' \? ' X ' : '   ' \}\}\]/);
  assert.doesNotMatch(plantilla, /\[innerHTML\]/);
  assert.match(estilos, /\.acta\s*\{[^}]*font-family:\s*Arial, Helvetica, sans-serif/s);
  assert.match(estilos, /\.acta\s*\{[^}]*font-size:\s*12pt/s);
  assert.match(estilos, /\.acta\s*\{[^}]*color:\s*#000000/s);
  assert.match(estilos, /\.acta-logo\s*\{[^}]*inset-inline-end:\s*0/s);
  assert.match(estilos, /\.acta-justificado\s*\{[^}]*text-align:\s*justify/s);
});
