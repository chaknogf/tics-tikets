/**
 * Exportación Excel sin dependencias nuevas: SpreadsheetML 2003, que Excel abre
 * directamente y permite varias hojas con un simple Blob.
 */
export type CeldaHoja = string | number | null | undefined;

export interface HojaExcel {
  nombre: string;
  filas: CeldaHoja[][];
}

export function escapeXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Evita que Excel interprete contenido del usuario como fórmula. */
export function valorSeguro(valor: CeldaHoja): string | number {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : '';
  }
  return /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
}

export function nombreHojaSeguro(nombre: string): string {
  const limpio = nombre.replace(/[\\/?*[\]:]/g, '_').trim() || 'Hoja';
  return limpio.slice(0, 31);
}

export function aSpreadsheetXml(hojas: HojaExcel[]): string {
  const worksheets = hojas.map((hoja) => {
    const filas = hoja.filas.map((fila) => {
      const celdas = fila.map((valor) => {
        const seguro = valorSeguro(valor);
        const tipo = typeof seguro === 'number' ? 'Number' : 'String';
        const contenido = escapeXml(String(seguro));
        return `<Cell><Data ss:Type="${tipo}">${contenido}</Data></Cell>`;
      });
      return `<Row>${celdas.join('')}</Row>`;
    }).join('');
    return `<Worksheet ss:Name="${escapeXml(nombreHojaSeguro(hoja.nombre))}"><Table>${filas}</Table></Worksheet>`;
  }).join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    worksheets,
    '</Workbook>',
  ].join('');
}

export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function descargarExcel(hojas: HojaExcel[], nombreArchivo: string): void {
  const blob = new Blob(['\uFEFF', aSpreadsheetXml(hojas)], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  descargarBlob(blob, nombreArchivo.endsWith('.xls')
    ? nombreArchivo
    : `${nombreArchivo}.xls`);
}
