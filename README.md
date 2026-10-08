# תוכנית יום האקטון

תוכנית מלאה ליום האקטון לכ-150 עובדים (תוכנה, סימולציה, אלגוריתמיקה, מחקר וחומרה): יום עד יומיים, אפס תקציב, ו-Claude ככלי עבודה מרכזי.

## קבצים

| קובץ | מה זה |
|---|---|
| `hackathon-plan.pdf` | המסמך המעוצב — לקריאה ולהדפסה |
| `hackathon-plan.docx` | אותו תוכן ב-Word — לעריכה |
| `hackathon-plan.md` | מקור התוכן (Markdown) — ממנו נבנים ה-Word וה-PDF |
| `slides/` | קובצי המקור של המצגת (20 שקפים) |
| `tools/` | סקריפטים לבניית ה-Word וה-PDF מה-Markdown |

## בנייה מחדש

```bash
node tools/build_docx.js hackathon-plan.md hackathon-plan.docx
node tools/build_pdf.js hackathon-plan.md hackathon-plan.pdf
```

דרישות: Node.js עם החבילות `docx`, `marked` ו-`playwright`. סקריפט ה-PDF מצפה לתיקיית `fonts/` ליד הסקריפט, עם הגופנים Heebo ו-Rubik מ-`@fontsource`.
