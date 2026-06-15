'use strict';

/**
 * Convierte Manual_de_Usuario.md → Manual_de_Usuario.docx
 * Uso: node scripts/generarManual.js
 */

const fs   = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, WidthType, AlignmentType, BorderStyle, ShadingType,
  convertInchesToTwip,
} = require('docx');

const MD_PATH  = path.join(__dirname, '..', '..', 'Manual_de_Usuario.md');
const OUT_PATH = path.join(__dirname, '..', '..', 'Manual_de_Usuario.docx');

// ── Colores corporativos ─────────────────────────────────────────────────────
const C = {
  greenDark:  '1B5E20',
  green:      '2E7D32',
  greenLight: 'E8F5E9',
  blueDark:   '0D47A1',
  blue:       '1565C0',
  blueLight:  'E3F2FD',
  orange:     'E65100',
  orangeLight:'FFF3E0',
  gray:       '616161',
  grayLight:  'F5F5F5',
  border:     'BDBDBD',
  white:      'FFFFFF',
  black:      '212121',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** ¿Es fila separadora de tabla Markdown? (|---|---|) */
const isSepRow = line => {
  const inner = line.split('|').slice(1, -1);
  return inner.length > 0 && inner.every(c => /^[\s\-:]+$/.test(c));
};

/** Parsea texto Markdown inline → array de TextRun */
function parseInline(text, opts = {}) {
  const { headerCell = false } = opts;
  if (!text) return [new TextRun({ text: '' })];

  const runs = [];
  // Soporta **bold** y `code`
  const RE = /\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
  let last = 0;
  let m;

  const baseColor = headerCell ? C.white : undefined;
  const baseBold  = headerCell ? true   : undefined;

  const makeRun = (t, extra = {}) => {
    if (!t) return null;
    return new TextRun({
      text:  t,
      color: baseColor,
      bold:  baseBold,
      ...extra,
    });
  };

  while ((m = RE.exec(text)) !== null) {
    const before = text.slice(last, m.index);
    if (before) runs.push(makeRun(before));

    if (m[1] !== undefined) {          // **bold**
      runs.push(makeRun(m[1], { bold: true }));
    } else if (m[2] !== undefined) {   // `code`
      runs.push(makeRun(m[2], {
        font: 'Courier New',
        color: headerCell ? C.white : C.blue,
        size: 19,
      }));
    } else if (m[3] !== undefined) {   // *italic*
      runs.push(makeRun(m[3], { italics: true }));
    }
    last = RE.lastIndex;
  }

  const tail = text.slice(last);
  if (tail) runs.push(makeRun(tail));

  return runs.filter(Boolean).length ? runs.filter(Boolean)
    : [new TextRun({ text, color: baseColor, bold: baseBold })];
}

/** Crea una fila de tabla */
function makeTableRow(cells, isHeader, rowIndex) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map(cellText =>
      new TableCell({
        shading: isHeader
          ? { type: ShadingType.CLEAR, fill: C.greenDark }
          : (rowIndex % 2 === 1
              ? { type: ShadingType.CLEAR, fill: C.greenLight }
              : undefined),
        children: [new Paragraph({
          children: parseInline(cellText, { headerCell: isHeader }),
          alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 40, after: 40 },
        })],
        margins: {
          top:    convertInchesToTwip(0.06),
          bottom: convertInchesToTwip(0.06),
          left:   convertInchesToTwip(0.10),
          right:  convertInchesToTwip(0.10),
        },
      })
    ),
  });
}

/** Construye los elementos docx a partir del Markdown */
function buildElements(md) {
  const lines    = md.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line    = lines[i];
    const trimmed = line.trim();

    // Vacío
    if (!trimmed) { i++; continue; }

    // Regla horizontal → ignorar
    if (/^-{3,}$/.test(trimmed)) { i++; continue; }

    // ── H1 ──────────────────────────────────────────────────────────────────
    if (/^# [^#]/.test(line)) {
      const title = line.slice(2).trim();
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, color: C.greenDark, size: 60 })],
          spacing:  { before: 0, after: 200 },
          border:   { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.green } },
        }),
        new Paragraph({ text: '', spacing: { after: 200 } }),
      );
      i++; continue;
    }

    // ── H2 ──────────────────────────────────────────────────────────────────
    if (/^## /.test(line)) {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: line.slice(3).trim(), bold: true, color: C.blueDark, size: 42 })],
        spacing: { before: 520, after: 120 },
        border:  { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.blue } },
      }));
      i++; continue;
    }

    // ── H3 ──────────────────────────────────────────────────────────────────
    if (/^### /.test(line)) {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: line.slice(4).trim(), bold: true, color: C.green, size: 32 })],
        spacing: { before: 360, after: 80 },
      }));
      i++; continue;
    }

    // ── H4 ──────────────────────────────────────────────────────────────────
    if (/^#### /.test(line)) {
      elements.push(new Paragraph({
        children: [new TextRun({ text: line.slice(5).trim(), bold: true, size: 26, color: C.black })],
        spacing: { before: 260, after: 60 },
      }));
      i++; continue;
    }

    // ── Bloque de código ```...``` ───────────────────────────────────────────
    if (line.startsWith('```')) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // cerrar ```
      if (codeLines.length === 0) codeLines.push('');
      for (const cl of codeLines) {
        elements.push(new Paragraph({
          children: [new TextRun({ text: cl || ' ', font: 'Courier New', size: 18, color: C.black })],
          shading:  { type: ShadingType.CLEAR, fill: C.grayLight },
          spacing:  { before: 0, after: 0 },
          indent:   { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
        }));
      }
      elements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      continue;
    }

    // ── Blockquote > ────────────────────────────────────────────────────────
    if (line.startsWith('> ')) {
      elements.push(new Paragraph({
        children: parseInline(line.slice(2).trim()),
        shading:  { type: ShadingType.CLEAR, fill: C.orangeLight },
        indent:   { left: convertInchesToTwip(0.35) },
        spacing:  { before: 120, after: 120 },
        border:   { left: { style: BorderStyle.THICK, size: 14, color: C.orange } },
      }));
      i++; continue;
    }

    // ── Tabla |col|col| ─────────────────────────────────────────────────────
    if (line.startsWith('|')) {
      const rawRows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rawRows.push(lines[i]);
        i++;
      }

      const headerRaw = rawRows[0];
      const dataRaw   = rawRows.slice(1).filter(l => !isSepRow(l));

      const splitCells = l => l.split('|').slice(1, -1).map(c => c.trim());
      const headerCells = splitCells(headerRaw);
      const colCount    = headerCells.length;

      const tableRows = [makeTableRow(headerCells, true, 0)];
      dataRaw.forEach((dr, ri) => {
        const cells = splitCells(dr);
        while (cells.length < colCount) cells.push('');
        tableRows.push(makeTableRow(cells.slice(0, colCount), false, ri + 1));
      });

      elements.push(
        new Table({
          width:   { size: 100, type: WidthType.PERCENTAGE },
          rows:    tableRows,
          borders: {
            top:     { style: BorderStyle.SINGLE, size: 2, color: C.border },
            bottom:  { style: BorderStyle.SINGLE, size: 2, color: C.border },
            left:    { style: BorderStyle.SINGLE, size: 2, color: C.border },
            right:   { style: BorderStyle.SINGLE, size: 2, color: C.border },
            insideH: { style: BorderStyle.SINGLE, size: 2, color: C.border },
            insideV: { style: BorderStyle.SINGLE, size: 2, color: C.border },
          },
        }),
        new Paragraph({ text: '', spacing: { after: 180 } }),
      );
      continue;
    }

    // ── Lista con viñetas (-, *, cualquier indentación) ──────────────────────
    if (/^(\s*)[-*] /.test(line)) {
      const indent = line.search(/\S/);
      const level  = Math.min(Math.floor(indent / 2), 2);
      const text   = line.replace(/^\s*[-*] /, '').trim();
      elements.push(new Paragraph({
        children: parseInline(text),
        bullet:   { level },
        spacing:  { before: 40, after: 40 },
      }));
      i++; continue;
    }

    // ── Lista numerada ───────────────────────────────────────────────────────
    if (/^\d+\. /.test(trimmed)) {
      const num  = trimmed.match(/^(\d+)\. /)[1];
      const text = trimmed.replace(/^\d+\. /, '').trim();
      elements.push(new Paragraph({
        children: [
          new TextRun({ text: `${num}. `, bold: true, color: C.green }),
          ...parseInline(text),
        ],
        indent:  { left: convertInchesToTwip(0.35) },
        spacing: { before: 60, after: 60 },
      }));
      i++; continue;
    }

    // ── Párrafo normal ───────────────────────────────────────────────────────
    elements.push(new Paragraph({
      children: parseInline(trimmed),
      spacing:  { before: 60, after: 80 },
    }));
    i++;
  }

  return elements;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(MD_PATH)) {
    console.error(`❌ No se encontró: ${MD_PATH}`);
    process.exit(1);
  }

  console.log('📄 Leyendo Manual_de_Usuario.md...');
  const md       = fs.readFileSync(MD_PATH, 'utf8');
  const children = buildElements(md);

  console.log('⚙️  Generando documento Word...');
  const doc = new Document({
    creator:     'GreenTrace ID',
    title:       'Manual de Usuario — GreenTrace ID',
    description: 'Manual de usuario completo de GreenTrace ID para ESCOM IPN',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: C.black },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1.1),
            right:  convertInchesToTwip(1.2),
            bottom: convertInchesToTwip(1.1),
            left:   convertInchesToTwip(1.2),
          },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT_PATH, buffer);

  const kb = (buffer.length / 1024).toFixed(1);
  console.log(`✅ Documento generado: Manual_de_Usuario.docx (${kb} KB)`);
  console.log(`   Ruta: ${OUT_PATH}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
