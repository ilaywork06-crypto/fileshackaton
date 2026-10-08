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
| `versions/v1/` | הגרסה הראשונה (אותם 4 תוצרים): יום אחד, עם תקציב (52–113 אלף ₪), בלי דגש על Claude |

## גרסאות

- **גרסה נוכחית (בשורש):** יום עד יומיים, אפס תקציב, Claude ככלי עבודה מרכזי.
- **`versions/v1`:** הגרסה הראשונה — האקטון של יום אחד עם אוכל, מיתוג ובמה בתקציב, וציר הכנה של 8 שבועות.

## בנייה מחדש

```bash
node tools/build_docx.js hackathon-plan.md hackathon-plan.docx
node tools/build_pdf.js hackathon-plan.md hackathon-plan.pdf
```

דרישות: Node.js עם החבילות `docx`, `marked` ו-`playwright`. סקריפט ה-PDF מצפה לתיקיית `fonts/` ליד הסקריפט, עם הגופנים Heebo ו-Rubik מ-`@fontsource`.
