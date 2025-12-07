// ext/print/worksheetPrintWindow.js
//
// Открывает новое окно с разметкой листа примеров для печати.
// Использует данные из ext/print/worksheetGenerator.js → getCurrentWorksheet().
//
// Структура на листе:
//   - сетка из "карточек-примеров" (автоматически по ширине листа);
//   - в каждой карточке:
//       1) номер примера,
//       2) стартовое число (по желанию – можно убрать),
//       3) операции столбиком,
//       4) пустая ячейка для ответа,
//       5) ещё одна пустая ячейка для ответа.
//   - при showAnswers = true добавляем вторую страницу с ответами.
//

import { getCurrentWorksheet } from "./worksheetGenerator.js";

/**
 * Открыть окно с листом примеров для печати.
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoPrint=true]  - сразу вызвать print() после загрузки
 */
export function openWorksheetPrintWindow(options = {}) {
  const { autoPrint = true } = options;

  const worksheet = getCurrentWorksheet();

  if (!worksheet || !Array.isArray(worksheet.examples) || worksheet.examples.length === 0) {
    alert("Лист примеров пустой. Сначала сгенерируйте примеры.");
    return;
  }

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Не удалось открыть окно для печати. Разрешите всплывающие окна в браузере.");
    return;
  }

  const { examples, showAnswers, createdAt } = worksheet;

  const doc = printWindow.document;

  // --- Базовый HTML-каркас
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Abacus Worksheet</title>
  <style>
    /* Параметры страницы для PDF-печати */
    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11pt;
      color: #222;
      margin: 0;
      padding: 0;
    }

    .page {
      width: 100%;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8mm;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4mm;
    }

    .page-header__title {
      font-size: 14pt;
      font-weight: 600;
    }

    .page-header__meta {
      font-size: 9pt;
      color: #666;
      text-align: right;
    }

    .worksheet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 6mm 6mm;
      width: 100%;
    }

    .example-card {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4mm 3mm;
      min-height: 40mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      font-size: 10pt;
    }

    .example-card__header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2mm;
      border-bottom: 1px solid #eee;
      padding-bottom: 1mm;
    }

    .example-card__number {
      font-weight: 600;
    }

    .example-card__start {
      font-size: 9pt;
      color: #555;
    }

    .example-card__steps {
      margin: 2mm 0 2mm;
      min-height: 18mm;
      border-bottom: 1px dashed #ddd;
      padding-bottom: 2mm;
    }

    .example-card__steps-row {
      display: flex;
      justify-content: flex-start;
      align-items: baseline;
      gap: 2mm;
      line-height: 1.2;
    }

    .example-card__steps-label {
      font-size: 8pt;
      color: #777;
      margin-right: 2mm;
    }

    .example-card__step {
      font-family: "Fira Code", "Consolas", monospace;
      font-size: 10pt;
    }

    .example-card__answer-block {
      margin-top: 2mm;
      display: flex;
      flex-direction: column;
      gap: 1.5mm;
    }

    .answer-line {
      border: 1px solid #bbb;
      border-radius: 3px;
      height: 8mm;
      display: flex;
      align-items: center;
      padding: 0 2mm;
    }

    .answer-line__label {
      font-size: 8pt;
      color: #777;
      margin-right: 2mm;
      white-space: nowrap;
    }

    .answer-line__field {
      border-bottom: 1px dashed #999;
      flex: 1;
      height: 5mm;
    }

    .page-title-main {
      display: block;
      margin-bottom: 2mm;
    }

    .page-title-sub {
      display: block;
      font-size: 9pt;
      color: #666;
    }

    .meta-row {
      margin-top: 1mm;
    }

    .meta-label {
      font-weight: 600;
      font-size: 8pt;
    }

    .meta-value {
      font-size: 8pt;
    }

    .page-break {
      page-break-before: always;
    }

    /* Лист с ответами */
    .answers-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 3mm 8mm;
      font-size: 10pt;
    }

    .answers-item {
      display: flex;
      align-items: baseline;
      gap: 2mm;
    }

    .answers-item__index {
      font-weight: 600;
    }

    .answers-item__value {
      font-family: "Fira Code", "Consolas", monospace;
      font-size: 10pt;
    }

    @media print {
      body {
        margin: 0;
      }
    }
  </style>
</head>
<body>
`);

  // --- Первая страница: примеры
  doc.write(`<div class="page">
    <div class="page-header">
      <div class="page-header__title">
        <span class="page-title-main">Abacus Worksheet</span>
        <span class="page-title-sub">Practice examples</span>
      </div>
      <div class="page-header__meta">
        <div class="meta-row">
          <span class="meta-label">Examples:&nbsp;</span>
          <span class="meta-value">${examples.length}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Generated:&nbsp;</span>
          <span class="meta-value">${createdAt ? formatDate(createdAt) : "-"}</span>
        </div>
      </div>
    </div>

    <div class="worksheet-grid">
  `);

  examples.forEach((ex) => {
    const stepsFormatted = (ex.steps || []).map((s) => String(s));

    doc.write(`
      <div class="example-card">
        <div class="example-card__header">
          <div class="example-card__number">№ ${ex.index}</div>
          <div class="example-card__start">Start: ${safeNumber(ex.start)}</div>
        </div>

        <div class="example-card__steps">
          <div class="example-card__steps-row">
            <div class="example-card__steps-label">Steps:</div>
            <div>
              ${stepsFormatted
                .map(
                  (s) =>
                    `<span class="example-card__step">${escapeHtml(
                      s
                    )}</span>`
                )
                .join(" ")}
            </div>
          </div>
        </div>

        <div class="example-card__answer-block">
          <div class="answer-line">
            <span class="answer-line__label">Answer 1:</span>
            <span class="answer-line__field"></span>
          </div>
          <div class="answer-line">
            <span class="answer-line__label">Answer 2:</span>
            <span class="answer-line__field"></span>
          </div>
        </div>
      </div>
    `);
  });

  doc.write(`
    </div> <!-- /worksheet-grid -->
  </div> <!-- /page (worksheet) -->
  `);

  // --- Вторая страница: ответы (если включено)
  if (showAnswers) {
    doc.write(`
      <div class="page page-break">
        <div class="page-header">
          <div class="page-header__title">
            <span class="page-title-main">Abacus Worksheet — Answers</span>
            <span class="page-title-sub">For teacher</span>
          </div>
          <div class="page-header__meta">
            <div class="meta-row">
              <span class="meta-label">Examples:&nbsp;</span>
              <span class="meta-value">${examples.length}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Generated:&nbsp;</span>
              <span class="meta-value">${createdAt ? formatDate(createdAt) : "-"}</span>
            </div>
          </div>
        </div>

        <div class="answers-list">
    `);

    examples.forEach((ex) => {
      doc.write(`
        <div class="answers-item">
          <span class="answers-item__index">№ ${ex.index}:</span>
          <span class="answers-item__value">${safeNumber(ex.answer)}</span>
        </div>
      `);
    });

    doc.write(`
        </div> <!-- /answers-list -->
      </div> <!-- /page (answers) -->
    `);
  }

  doc.write(`
</body>
</html>
`);
  doc.close();

  // Небольшая задержка, чтобы браузер успел отрисовать, затем auto-print
  if (autoPrint) {
    printWindow.focus();
    // Используем setTimeout, чтобы избежать бага с пустой страницей в некоторых браузерах
    printWindow.setTimeout(() => {
      printWindow.print();
    }, 100);
  }
}

/**
 * Защита от XSS — экранируем спецсимволы в строках.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Корректно отображаем числа, даже если прилетела строка/NaN.
 */
function safeNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return String(num);
}

/**
 * Форматируем дату для подписи на листе.
 * Формат: YYYY-MM-DD HH:MM
 */
function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";

    const pad = (n) => (n < 10 ? "0" + n : String(n));

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (e) {
    return "-";
  }
}
