const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('playwright');

const md = fs.readFileSync(process.argv[2], 'utf8').replace(/^<\/?div[^>]*>[ \t]*\n/gm, '').replace(/^\n+/, '');
const out = process.argv[3];
const F = path.join(__dirname, 'fonts');
const font = (fam, dir, w) => ['hebrew', 'latin'].map(s =>
  `@font-face{font-family:'${fam}';font-weight:${w};src:url('file://${F}/${dir}/files/${dir.split('-')[1]}-${s}-${w}-normal.woff2') format('woff2');}`).join('\n');
const fonts = [400, 500, 700, 800, 900].map(w => font('Heebo', 'fontsource-heebo-5.3.0', w)).join('\n') +
  [500, 700, 800].map(w => font('Rubik', 'fontsource-rubik-5.3.0', w)).join('\n');

// strip title/subtitle/lead (used on cover)
let bodyMd = md.replace(/^# .*\n+\*\*.*\*\*\n+> .*\n+/, '');
let html = marked.parse(bodyMd);
// wrap each h2 into a section with a numbered badge
const parts = html.split(/(?=<h2)/);
html = parts.map(p => {
  if (!p.startsWith('<h2')) return p;
  const m = p.match(/<h2[^>]*>(.*?)<\/h2>/);
  let title = m[1]; let num = '';
  const nm = title.match(/^(\d+)\.\s*(.*)$/);
  if (nm) { num = nm[1]; title = nm[2]; }
  else { const am = title.match(/^נספח\s+(\S+)\s+—\s+(.*)$/); if (am) { num = am[1].replace(/['׳]/g, ''); title = 'נספח: ' + am[2]; } }
  return `<section><h2><span class="badge">${num}</span><span>${title}</span></h2>${p.replace(m[0], '')}</section>`;
}).join('');
html = html.replace(/<input [^>]*disabled="" type="checkbox">/g, '<span class="box"></span>');
html = html.replace(/⭐/g, '<span class="star">★</span>');

const tl = (segs) => `<div class="timeline">${segs.map(([t, l, c, w]) => `<div class="seg ${c}" style="flex:${w}"><i>${t}</i><b>${l}</b></div>`).join('')}</div>`;
const cover = `
<div class="cover">
  <div class="grid"></div>
  <div class="tag">AI HACKATHON · 2026</div>
  <h1>יום<br>האקטון</h1>
  <div class="sub">מצא את הכאב — בנה את התרופה — הראה שהיא עובדת</div>
  <div class="domains">תוכנה · סימולציה · אלגוריתמיקה · מחקר · חומרה · עם Claude</div>
  <div class="stats">
    <div><b>150</b><span>עובדים</span></div>
    <div><b>24</b><span>צוותים</span></div>
    <div><b>1–2</b><span>ימים</span></div>
    <div><b>6</b><span>מסלולים</span></div>
  </div>
  <div class="foot">מסמך תכנון מלא · מטרות · פורמטים · Claude · צוותים · לו"ז · במה · שיפוט · לוגיסטיקה</div>
</div>`;

const glance = `
<section class="glance">
  <h2><span class="badge">★</span><span>ההאקטון במבט אחד</span></h2>
  <h3>גרסת יום אחד</h3>
  ${tl([['08:45','קפה','b',1],['09:00','פתיחה + Claude','s',1.8],['09:40','התארגנות','p',1.2],['10:10','ספרינט 1','h',4.6],['12:30','בדיקה + צהריים','b',2],['13:30','ספרינט 2','h',4],['15:45','ספרינט 3','h',2],['16:45','יריד','s',1.6],['17:40','גמר ופרסים','s',1.9]])}
  <h3>גרסת יומיים (מומלץ)</h3>
  <p class="tlabel">יום א'</p>
  ${tl([['09:00','פתיחה + Claude','s',1.6],['09:40','התארגנות','p',1.2],['10:10','ספרינט 1','h',4.6],['12:30','צהריים','b',2],['13:30','ספרינט 2','h',8],['17:30','סטנדאפ','p',1]])}
  <p class="tlabel">יום ב'</p>
  ${tl([['09:00','סטנדאפ','p',1],['09:15','ספרינט 3','h',7.5],['13:00','צהריים','b',1.5],['13:45','ליטוש','h',1.5],['14:30','יריד','s',2],['15:45','גמר','s',1.5],['16:30','פרסים','s',1]])}
  <div class="legend"><span class="h">פיתוח</span><span class="s">במה</span><span class="p">התארגנות</span><span class="b">הפסקות</span></div>
  <div class="cards">
    <div class="card"><h4>הפורמט המומלץ</h4><p>היברידי מבוסס מסלולים, ביומיים אם אפשר: בנק כאבים שנאסף מראש + Wild Card פתוח.</p></div>
    <div class="card"><h4>Claude כמכפיל כוח</h4><p>כל משתתף עובד עם Claude, אלוף Claude בכל צוות, ו"Claude ב-60 דקות" לפני היום.</p></div>
    <div class="card"><h4>לוגיסטיקה פשוטה</h4><p>המשרד, הציוד ו-Claude שכבר קיימים בחברה. הפרסים: זמן להמשיך, הכרה ובמה מול ההנהלה.</p></div>
    <div class="card"><h4>אחרי היום</h4><p>Hack to Prod: שבועיים של זמן מוקדש ל-3 הזוכים, ודו"ח השפעה אחרי 90 יום.</p></div>
  </div>
</section>`;

const css = `
${fonts}
:root{--pri:#2E2280;--pri2:#4B3BC4;--acc:#F06418;--ink:#1D2030;--mut:#5E6375;--line:#E2E0EF;--soft:#F5F4FC;--warm:#FFF3EA}
@page{size:A4;margin:16mm 15mm 18mm 15mm}
@page:first{margin:0}
*{box-sizing:border-box}
body{font-family:Heebo,sans-serif;direction:rtl;color:var(--ink);font-size:10.2pt;line-height:1.6;margin:0}
.cover{margin:0;padding:28mm 22mm;background:linear-gradient(150deg,#1B1450 0%,#2E2280 55%,#4B3BC4 100%);color:#fff;position:relative;overflow:hidden;page-break-after:always;height:297mm}
.cover .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:14mm 14mm}
.cover::after{content:"";position:absolute;width:150mm;height:150mm;border-radius:50%;left:-45mm;bottom:-40mm;background:radial-gradient(circle,rgba(240,100,24,.55),rgba(240,100,24,0) 65%)}
.cover>*{position:relative;z-index:1}
.cover .tag{font-family:Rubik,Heebo,sans-serif;font-weight:700;letter-spacing:.35em;color:var(--acc);font-size:12pt;direction:ltr;text-align:right}
.cover h1{font-family:Rubik,Heebo,sans-serif;font-weight:800;font-size:76pt;line-height:.98;margin:16mm 0 8mm}
.cover .sub{font-size:17pt;font-weight:500;max-width:150mm;border-right:4px solid var(--acc);padding-right:5mm}
.cover .domains{margin-top:8mm;font-size:12pt;opacity:.8}
.cover .stats{display:flex;gap:6mm;margin-top:30mm}
.cover .stats div{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:4mm;padding:5mm}
.cover .stats b{display:block;direction:ltr;text-align:right;unicode-bidi:isolate;font-family:Rubik,Heebo,sans-serif;font-size:30pt;font-weight:800;color:#fff;line-height:1}
.cover .stats span{font-size:10pt;opacity:.8}
.cover .foot{position:absolute;bottom:20mm;right:22mm;font-size:9.5pt;opacity:.7}
section{page-break-before:always}
h2{display:flex;align-items:center;gap:4mm;font-family:Rubik,Heebo,sans-serif;font-weight:800;font-size:20pt;color:var(--pri);margin:0 0 6mm;padding-bottom:3mm;border-bottom:2px solid var(--line)}
h2 .badge{display:inline-flex;align-items:center;justify-content:center;min-width:12mm;height:12mm;border-radius:3mm;background:var(--acc);color:#fff;font-size:15pt}
h3{font-family:Rubik,Heebo,sans-serif;font-weight:700;font-size:13pt;color:var(--pri2);margin:7mm 0 2.5mm;page-break-after:avoid}
p{margin:0 0 3mm}
strong{color:var(--pri);font-weight:700}
ul,ol{margin:0 0 4mm;padding-right:6mm}
li{margin-bottom:1.5mm}
li::marker{color:var(--acc);font-weight:700}
blockquote{margin:0 0 5mm;padding:3.5mm 5mm;background:var(--warm);border-right:4px solid var(--acc);border-radius:2mm 0 0 2mm}
blockquote p:last-child{margin:0}
table{width:100%;border-collapse:separate;border-spacing:0;margin:0 0 6mm;font-size:9pt;line-height:1.42;border:1px solid var(--line);border-radius:2.5mm;overflow:hidden;page-break-inside:auto}
tr{page-break-inside:avoid}
thead{display:table-header-group}
th{background:var(--pri);color:#fff;font-weight:700;text-align:right;padding:2.4mm 3mm}
td{padding:2.2mm 3mm;border-top:1px solid var(--line);vertical-align:top}
tbody tr:nth-child(even) td{background:var(--soft)}
td strong{color:var(--ink)}
.star{color:var(--acc)}
.box{display:inline-block;width:3.6mm;height:3.6mm;border:1.5px solid var(--pri2);border-radius:1mm;margin-left:2mm;vertical-align:-0.5mm}
li:has(.box){list-style:none;margin-right:-5mm}
.timeline{display:flex;flex-direction:row;height:22mm;border-radius:3mm;overflow:hidden;margin:2mm 0 3mm}
.tlabel{font-weight:700;color:var(--mut);margin:2mm 0 0;font-size:9.5pt}
.glance h3{margin-top:4mm}
.seg{padding:2.5mm 2mm;color:#fff;display:flex;flex-direction:column;justify-content:space-between;border-left:1.5px solid #fff}
.seg i{font-style:normal;font-size:8pt;opacity:.85;direction:ltr;text-align:right}
.seg b{font-size:8.6pt;line-height:1.2}
.seg.h,.legend .h::before{background:var(--pri2)} .seg.s,.legend .s::before{background:var(--acc)}
.seg.p,.legend .p::before{background:#8A7FE0} .seg.b,.legend .b::before{background:#A9AEC0}
.legend{display:flex;gap:6mm;font-size:9pt;color:var(--mut);margin-bottom:7mm}
.legend span::before{content:"";display:inline-block;width:3mm;height:3mm;border-radius:1mm;margin-left:1.5mm;vertical-align:-0.3mm}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.card{border:1px solid var(--line);border-top:4px solid var(--acc);border-radius:3mm;padding:5mm;background:#fff}
.card h4{margin:0 0 2mm;font-family:Rubik,Heebo,sans-serif;color:var(--pri);font-size:12pt}
.card p{margin:0;color:var(--mut)}
`;

const full = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body>${cover}${glance}${html}</body></html>`;
fs.writeFileSync(out.replace(/\.pdf$/, '.html'), full);

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  await pg.goto('file://' + path.resolve(out.replace(/\.pdf$/, '.html')), { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({
    path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%;font-family:Heebo,sans-serif;font-size:8px;color:#8a8fa0;padding:0 15mm;display:flex;justify-content:space-between;direction:rtl"><span>תוכנית יום האקטון</span><span class="pageNumber"></span></div>`,
    preferCSSPageSize: true
  });
  await b.close();
  console.log('ok', out);
})();
