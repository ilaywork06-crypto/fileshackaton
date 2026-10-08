const fs = require('fs');
const { marked } = require('marked');
const d = require('docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, HeadingLevel, AlignmentType, LevelFormat, Footer, Header,
  PageNumber, PageBreak, TableOfContents
} = d;

const md = fs.readFileSync(process.argv[2], 'utf8');
const out = process.argv[3];
const tokens = marked.lexer(md);

const FONT = 'Arial';
const C = { primary: '3B2A8F', accent: 'E8590C', ink: '1F2330', muted: '5B6170', head: 'EDEBFA', zebra: 'F7F7FB', line: 'D5D3E6' };
const CONTENT_W = 11906 - 2 * 1134;

// inline tokens -> TextRuns
function runs(inl, base = {}) {
  const r = [];
  for (const t of inl || []) {
    if (t.type === 'strong') r.push(...runs(t.tokens, { ...base, bold: true }));
    else if (t.type === 'em') r.push(...runs(t.tokens, { ...base, italics: true }));
    else if (t.type === 'codespan') r.push(new TextRun({ text: t.text, font: 'Consolas', rightToLeft: true, ...base }));
    else if (t.type === 'link') r.push(...runs(t.tokens, { ...base, color: C.primary }));
    else if (t.type === 'br') r.push(new TextRun({ break: 1 }));
    else {
      const text = (t.text ?? t.raw ?? '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (text) r.push(new TextRun({ text, font: FONT, rightToLeft: true, ...base }));
    }
  }
  return r;
}
const P = (children, opts = {}) => new Paragraph({ bidirectional: true, children, spacing: { after: 120, line: 300 }, ...opts });

function cellText(c) { return (c.text || '').replace(/\*\*/g, ''); }

function table(t) {
  const n = t.header.length;
  const lens = t.header.map((h, i) => Math.max(cellText(h).length, ...t.rows.map(r => cellText(r[i]).length)));
  const weights = lens.map(l => Math.min(Math.max(l, 7), 60));
  const sum = weights.reduce((a, b) => a + b, 0);
  let widths = weights.map(w => Math.floor(CONTENT_W * w / sum));
  widths[widths.length - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const border = { style: BorderStyle.SINGLE, size: 4, color: C.line };
  const borders = { top: border, bottom: border, left: border, right: border };
  const mk = (cell, i, isHead, ri) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    borders,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: isHead ? C.primary : (ri % 2 ? C.zebra : 'FFFFFF') },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [P(runs(cell.tokens, isHead ? { bold: true, color: 'FFFFFF', size: 19 } : { size: 19, color: C.ink }), { spacing: { after: 0, line: 260 } })]
  });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    visuallyRightToLeft: true,
    rows: [
      new TableRow({ tableHeader: true, children: t.header.map((h, i) => mk(h, i, true, 0)) }),
      ...t.rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false, ri)) }))
    ]
  });
}

const body = [];
let first = true;
let subtitle = '', lead = '';
let listNo = 0;
for (const t of tokens) {
  if (t.type === 'heading' && t.depth === 1) continue; // used on cover
  if (first && t.type === 'paragraph') { subtitle = t.text.replace(/\*\*/g, ''); first = false; continue; }
  if (t.type === 'blockquote' && !lead) { lead = t.text; continue; }
  if (t.type === 'heading') {
    if (t.depth === 2) body.push(P([], { children: [new PageBreak()], spacing: { after: 0 } }));
    body.push(new Paragraph({
      bidirectional: true,
      heading: t.depth === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      children: runs(t.tokens),
      ...(t.depth === 2 ? { border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.accent, space: 4 } } } : {})
    }));
  } else if (t.type === 'paragraph') {
    body.push(P(runs(t.tokens, { size: 22, color: C.ink })));
  } else if (t.type === 'list') {
    listNo++;
    t.items.forEach((it, idx) => {
      const inl = it.tokens.flatMap(x => x.tokens || [x]);
      const prefix = it.task ? [new TextRun({ text: '☐  ', font: 'Segoe UI Symbol', rightToLeft: true })] : [];
      body.push(P([...prefix, ...runs(inl, { size: 22, color: C.ink })], {
        numbering: it.task ? undefined : { reference: t.ordered ? 'num' : 'bul', level: 0, instance: t.ordered ? listNo : 0 },
        spacing: { after: 60, line: 290 },
        indent: it.task ? { start: 360 } : undefined
      }));
    });
  } else if (t.type === 'table') {
    body.push(table(t));
    body.push(P([], { spacing: { after: 160 } }));
  } else if (t.type === 'blockquote') {
    t.tokens.filter(x => x.type === 'paragraph').forEach(p => body.push(P(runs(p.tokens, { size: 22, color: C.ink }), {
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF4E6' },
      border: { right: { style: BorderStyle.SINGLE, size: 24, color: C.accent, space: 8 } },
      indent: { start: 200, end: 200 },
      spacing: { after: 80, line: 300 }
    })));
  } else if (t.type === 'hr') {
    body.push(P([], { border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 1 } } }));
  }
}

const leadText = lead.replace(/^>\s*/gm, '');
const cover = [
  P([], { spacing: { before: 2400, after: 0 } }),
  P([new TextRun({ text: 'HACKATHON 2026', font: FONT, bold: true, size: 26, color: C.accent, characterSpacing: 60 })], { alignment: AlignmentType.CENTER }),
  P([new TextRun({ text: 'תוכנית יום האקטון חברתי', font: FONT, bold: true, size: 64, color: C.primary, rightToLeft: true })], { alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
  P([new TextRun({ text: subtitle, font: FONT, size: 28, color: C.muted, rightToLeft: true })], { alignment: AlignmentType.CENTER, spacing: { after: 600 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: C.accent, space: 20 } } }),
  P([new TextRun({ text: leadText, font: FONT, size: 22, color: C.ink, rightToLeft: true })], { alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
  P([new TextRun({ text: 'מטרות · פורמטים · מסלולים · צוותים · לו"ז · במה · שיפוט · לוגיסטיקה', font: FONT, size: 20, color: C.muted, rightToLeft: true })], { alignment: AlignmentType.CENTER }),
  P([new PageBreak()]),
  new Paragraph({ bidirectional: true, children: [new TextRun({ text: 'תוכן עניינים', font: FONT, bold: true, size: 36, color: C.primary, rightToLeft: true })], spacing: { after: 200 } }),
  new TableOfContents('תוכן עניינים', { hyperlink: true, headingStyleRange: '1-2' }),
];

const doc = new Document({
  creator: 'Ilay',
  title: 'תוכנית יום האקטון',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 22, rightToLeft: true }, paragraph: { bidirectional: true } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 36, bold: true, color: C.primary, rightToLeft: true }, paragraph: { spacing: { before: 120, after: 240 }, outlineLevel: 0, bidirectional: true } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 27, bold: true, color: C.accent, rightToLeft: true }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1, bidirectional: true, keepNext: true } },
    ]
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.START, style: { paragraph: { indent: { start: 520, hanging: 300 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { start: 520, hanging: 340 } } } }] },
  ] },
  sections: [{
    properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [P([new TextRun({ text: 'תוכנית יום האקטון', font: FONT, size: 16, color: C.muted, rightToLeft: true })], { alignment: AlignmentType.LEFT })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.muted })] })] }) },
    children: [...cover, ...body]
  }]
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('ok', out); });
