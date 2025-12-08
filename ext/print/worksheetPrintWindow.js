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

import { t, getCurrentLanguage } from "../../core/i18n.js";
import { getCurrentWorksheet } from "./worksheetGenerator.js";

const EXAMPLES_PER_PAGE = 10;

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
   alert(t("printSheet.emptyWorksheet"));
    return;
  }

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
   alert(t("printSheet.popupBlocked"));
    return;
  }

  const { examples, showAnswers, createdAt } = worksheet;
  const language = getCurrentLanguage();
  const texts = getPrintTexts();
  const totalExamples = examples.length;
  const worksheetPages = chunkExamples(examples, EXAMPLES_PER_PAGE);
  const worksheetDate = createdAt ? formatDate(createdAt, language) : "-";

  const doc = printWindow.document;

  // --- Базовый HTML-каркас
  doc.write(`<!DOCTYPE html>
<html lang="en">
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(texts.title)}</title>
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
      page-break-inside: avoid;
      break-inside: avoid;
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
      break-inside: avoid;
      page-break-inside: avoid;
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

 worksheetPages.forEach((pageExamples, pageIndex) => {
    const isFirstPage = pageIndex === 0;

    doc.write(`
      <div class="page${isFirstPage ? "" : " page-break"}">
        <div class="page-header">
          <div class="page-header__left">
            <div class="page-header__logo">MindWorld School</div>
            <div class="page-header__title">
              <span class="page-title-main">${escapeHtml(texts.title)}</span>
              <span class="page-title-sub">${escapeHtml(texts.subtitle)}</span>
            </div>
            <div class="page-header__meta">
              <div class="meta-row">
                <span class="meta-label">${escapeHtml(texts.metaExamples)}&nbsp;</span>
                <span class="meta-value">${totalExamples}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">${escapeHtml(texts.metaGenerated)}&nbsp;</span>
                <span class="meta-value">${worksheetDate}</span>
              </div>
            </div>
          </div>
        
       <div class="page-header__fields">
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldName)}</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldDate)}</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldGroup)}</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldLevel)}</span>
              <span class="field-line"></span>
            </div>
          </div>
        </div>
     
    <div class="worksheet-grid">
    `);

    pageExamples.forEach((ex) => {
      const stepsFormatted = (ex.steps || []).map((s) => String(s));
      
        doc.write(`
        <div class="example-card">
          <div class="example-card__header">
            <div class="example-card__number">№ ${ex.index}</div>
            <div class="example-card__start">${escapeHtml(texts.startLabel)} ${safeNumber(ex.start)}</div>
          </div>
       
         <div class="example-card__steps">
            <div class="example-card__steps-label">${escapeHtml(texts.stepsLabel)}</div>
            <div class="example-card__steps-list">
              ${stepsFormatted
                .map(
                  (s) =>
                    `<span class="example-card__step">${escapeHtml(s)}</span>`
                )
                .join("")}
            </div>
          </div>
          <div class="example-card__answer-block">
            <div class="answer-line">
              <span class="answer-line__label">${escapeHtml(texts.answer1Label)}</span>
              <span class="answer-line__field"></span>
            </div>
            <div class="answer-line">
              <span class="answer-line__label">${escapeHtml(texts.answer2Label)}</span>
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
  });

    if (showAnswers) {
    doc.write(`
      <div class="page page-break">
        <div class="page-header">
          <div class="page-header__left">
            <div class="page-header__logo">MindWorld School</div>
            <div class="page-header__title">
               <span class="page-title-main">${escapeHtml(texts.answersTitle)}</span>
              <span class="page-title-sub">${escapeHtml(texts.answersSubtitle)}</span>
            </div>
            <div class="page-header__meta">
              <div class="meta-row">
               <span class="meta-label">${escapeHtml(texts.metaExamples)}&nbsp;</span>
                <span class="meta-value">${totalExamples}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">${escapeHtml(texts.metaGenerated)}&nbsp;</span>
                <span class="meta-value">${worksheetDate}</span>
              </div>
            </div>
          </div>

          <div class="page-header__fields">
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldName)}</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldDate)}</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldGroup)}</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldLevel)}</span>
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
function getPrintTexts() {
  return {
    title: t("printSheet.title"),
    subtitle: t("printSheet.subtitle"),
    answersTitle: t("printSheet.answersTitle"),
    answersSubtitle: t("printSheet.answersSubtitle"),
    metaExamples: t("printSheet.metaExamples"),
    metaGenerated: t("printSheet.metaGenerated"),
    fieldName: t("printSheet.fieldName"),
    fieldDate: t("printSheet.fieldDate"),
    fieldGroup: t("printSheet.fieldGroup"),
    fieldLevel: t("printSheet.fieldLevel"),
    startLabel: t("printSheet.startLabel"),
    stepsLabel: t("printSheet.stepsLabel"),
    answer1Label: t("printSheet.answer1Label"),
    answer2Label: t("printSheet.answer2Label")
  };
}

function chunkExamples(list, size) {
  const pages = [];

  for (let i = 0; i < list.length; i += size) {
    pages.push(list.slice(i, i + size));
  }

  return pages;
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
 * Формат: локализованное отображение
 */
function formatDate(isoString, lang = "en") {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";

    const formatter = new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

     return formatter.format(d).replace(",", "").trim();
  } catch (e) {
    return "-";
  }
}
