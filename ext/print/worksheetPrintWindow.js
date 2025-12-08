// ext/print/worksheetPrintWindow.js
//
// Открывает новое окно с разметкой листа примеров для печати.
// Использует данные из ext/print/worksheetGenerator.js → getCurrentWorksheet().
//
// Структура на листе:
//   - шапка с логотипом и полями Name / Date / Group / Level;
//   - рамка по периметру страницы;
//   - сетка из 5 колонок с "карточками-примерами";
//   - в каждой карточке:
//       1) номер примера,
//       2) стартовое число,
//       3) операции столбиком,
//       4) две строки для ответа;
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
      margin: 10mm;
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
      min-height: calc(100vh - 20mm);
      page-break-after: always;

      /* Рамка по периметру листа */
      border: 2px solid #B68E6B;
      border-radius: 8px;
      padding: 10mm 8mm;
    }

    .page:last-child {
      page-break-after: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid #d8c4aa;
    }

    .page-header__left {
      display: flex;
      flex-direction: column;
      gap: 3mm;
      max-width: 60%;
    }

    .page-header__logo {
      font-weight: 700;
      font-size: 13pt;
      color: #B68E6B; /* тёплое золото под бренд */
      letter-spacing: 0.03em;
    }

    .page-header__title {
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }

    .page-title-main {
      font-size: 14pt;
      font-weight: 600;
    }

    .page-title-sub {
      font-size: 9pt;
      color: #666;
    }

    .page-header__fields {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2mm;
      font-size: 9pt;
      min-width: 90mm;
      margin-left: 6mm;
    }

    .field-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2mm;
      align-items: center;
    }

    .field-label {
      white-space: nowrap;
      font-weight: 500;
    }

    .field-line {
      border-bottom: 1px solid #999;
      height: 5mm;
    }

    .page-header__meta {
      margin-top: 3mm;
      font-size: 8pt;
      color: #777;
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

    /* Сетка примеров: фиксированно 5 колонок */
    .worksheet-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5mm 4mm;
      width: 100%;
    }

    .example-card {
      border: 1px solid #d5c2a3;
      border-radius: 4px;
      padding: 3mm 2.5mm;
      min-height: 36mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      font-size: 9.5pt;
    }

    .example-card__header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5mm;
      border-bottom: 1px solid #eee0cf;
      padding-bottom: 1mm;
    }

    .example-card__number {
      font-weight: 600;
    }

    .example-card__start {
      font-size: 8.5pt;
      color: #555;
    }

    .example-card__steps {
      margin: 1.5mm 0 1.5mm;
      min-height: 15mm;
      border-bottom: 1px dashed #ddcbb2;
      padding-bottom: 1.5mm;
    display: grid;
      grid-template-columns: auto 1fr;
      column-gap: 2mm;
      row-gap: 1.2mm;
      align-items: start;
    }

    .example-card__steps-label {
      font-size: 8pt;
      color: #777;
      white-space: nowrap;
      align-self: start;
      padding-top: 0.5mm;
    }

    .example-card__steps-list {
      display: flex;
      flex-direction: column;
      gap: 0.6mm;
    }

    .example-card__step {
      font-family: "Fira Code", "Consolas", monospace;
      font-size: 9.5pt;
      line-height: 1.25;
    }

    .example-card__answer-block {
      margin-top: 1.5mm;
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
    }

    .answer-line {
      border: 1px solid #c0b29c;
      border-radius: 3px;
      height: 7mm;
      display: flex;
      align-items: center;
      padding: 0 1.5mm;
    }

    .answer-line__label {
      font-size: 7.5pt;
      color: #777;
      margin-right: 2mm;
      white-space: nowrap;
    }

    .answer-line__field {
      border-bottom: 1px dashed #999;
      flex: 1;
      height: 4mm;
    }

    .page-break {
      page-break-before: always;
    }

    /* Лист с ответами */
    .answers-list {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 3mm 4mm;
      font-size: 10pt;
      margin-top: 4mm;
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
      <div class="page-header__left">
        <div class="page-header__logo">MindWorld School</div>
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

      <div class="page-header__fields">
        <div class="field-row">
          <span class="field-label">Name:</span>
          <span class="field-line"></span>
        </div>
        <div class="field-row">
          <span class="field-label">Date:</span>
          <span class="field-line"></span>
        </div>
        <div class="field-row">
          <span class="field-label">Group:</span>
          <span class="field-line"></span>
        </div>
        <div class="field-row">
          <span class="field-label">Level:</span>
          <span class="field-line"></span>
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
         <div class="example-card__steps-label">Steps:</div>
          <div class="example-card__steps-list">
            ${stepsFormatted
              .map(
                (s) =>
                  `<span class="example-card__step">${escapeHtml(
                    s
                  )}</span>`
              )
              .join("")}
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
          <div class="page-header__left">
            <div class="page-header__logo">MindWorld School</div>
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

          <div class="page-header__fields">
            <div class="field-row">
              <span class="field-label">Name:</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">Date:</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">Group:</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">Level:</span>
              <span class="field-line"></span>
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
