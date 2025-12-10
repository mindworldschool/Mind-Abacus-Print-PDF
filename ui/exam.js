// ui/exam.js — Exam sheet generator for printing
import { generateExample } from "../ext/core/generator.js";
import { buildGeneratorSettingsFromSettings } from "../ext/core/buildGeneratorSettings.js";
import { logger } from "../core/utils/logger.js";

const CONTEXT = "ExamSheet";

/**
 * Generate exam sheet with table of examples
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Options
 * @param {Function} options.t - Translation function
 * @param {Object} options.state - Application state
 * @param {Function} options.navigate - Navigation function
 */
export function renderExamSheet(container, { t, state, navigate }) {
  logger.info(CONTEXT, "Rendering exam sheet...");

  container.innerHTML = "";

  const section = document.createElement("section");
  section.className = "screen exam-screen";

  // Header
  const header = document.createElement("div");
  header.className = "exam-header no-print";

  const title = document.createElement("h2");
  title.textContent = t?.("exam.title") || "Экзаменационный лист";
  title.className = "exam-header__title";

  const controls = document.createElement("div");
  controls.className = "exam-header__controls";

  const printBtn = document.createElement("button");
  printBtn.className = "btn btn--primary";
  printBtn.textContent = t?.("exam.print") || "🖨️ Печать";
  printBtn.onclick = () => window.print();

  const backBtn = document.createElement("button");
  backBtn.className = "btn btn--secondary";
  backBtn.textContent = t?.("exam.back") || "← Назад";
  backBtn.onclick = () => navigate("settings");

  controls.append(printBtn, backBtn);
  header.append(title, controls);
  section.appendChild(header);

  // Generate exam content
  const examContent = generateExamContent(state.settings, t);
  section.appendChild(examContent);

  container.appendChild(section);

  logger.info(CONTEXT, "Exam sheet rendered successfully");
}

/**
 * Generate exam content (tables with examples)
 * @param {Object} settings - Generator settings
 * @param {Function} t - Translation function
 * @returns {HTMLElement}
 */
function generateExamContent(settings, t) {
  const content = document.createElement("div");
  content.className = "exam-content printable";

  // Exam header (for print)
  const examHeader = document.createElement("div");
  examHeader.className = "exam-print-header";

  const level = settings.level || 7;
  const timeLimit = settings.timeLimit || 10;

  examHeader.innerHTML = `
    <h1>Abacus Certification Exam Questions</h1>
    <div class="exam-info">
      <p><strong>Addition and subtraction (±)</strong></p>
      <div class="exam-meta">
        <span>Level: ${level}</span>
        <span>Time: ${timeLimit} min</span>
        <span class="score-box">Score</span>
      </div>
    </div>
  `;
  content.appendChild(examHeader);

  // Get number of actions from settings
  const actionsCount = getActionsCount(settings);
  const totalExamples = 30; // Total examples to generate
  const examplesPerTable = 6; // 6 columns

  // Generate all examples
  const generatorSettings = buildGeneratorSettingsFromSettings(settings);
  const examples = [];
  for (let i = 0; i < totalExamples; i++) {
    const ex = generateExample(generatorSettings);
    examples.push(ex);
  }

  // Section 1: Example tables
  const section1Title = document.createElement("div");
  section1Title.className = "exam-section-title";
  section1Title.textContent = "Straight Calculation 100% (Each Q : 10 marks)";
  content.appendChild(section1Title);

  // Generate example tables (6 examples per table)
  const numTables = Math.ceil(totalExamples / examplesPerTable);
  for (let tableIndex = 0; tableIndex < numTables; tableIndex++) {
    const startExample = tableIndex * examplesPerTable;
    const endExample = Math.min(startExample + examplesPerTable, totalExamples);
    const tableExamples = examples.slice(startExample, endExample);

    const table = generateExampleTable(tableExamples, actionsCount, startExample + 1);
    content.appendChild(table);
  }

  // Section 2: Answer tables
  const section2Title = document.createElement("div");
  section2Title.className = "exam-section-title";
  section2Title.textContent = "Answers";
  content.appendChild(section2Title);

  // Generate answer tables
  for (let tableIndex = 0; tableIndex < numTables; tableIndex++) {
    const startExample = tableIndex * examplesPerTable;
    const endExample = Math.min(startExample + examplesPerTable, totalExamples);
    const numCols = endExample - startExample;

    const table = generateAnswerTable(numCols, startExample + 1);
    content.appendChild(table);
  }

  return content;
}

/**
 * Get number of actions from settings
 * @param {Object} settings - Settings object
 * @returns {number}
 */
function getActionsCount(settings) {
  if (settings.actions && typeof settings.actions.count === 'number') {
    return settings.actions.count;
  }
  return 5; // Default to 5 actions
}

/**
 * Generate example table with 6 columns
 * @param {Array} examples - Array of examples
 * @param {number} actionsCount - Number of actions (rows) per example
 * @param {number} startNo - Starting question number
 * @returns {HTMLElement}
 */
function generateExampleTable(examples, actionsCount, startNo) {
  const table = document.createElement("table");
  table.className = "exam-table";

  const numCols = examples.length;

  // Header row with column numbers
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // Empty cell for row numbers column
  const emptyCell = document.createElement("th");
  emptyCell.className = "exam-table__row-header";
  headerRow.appendChild(emptyCell);

  // Column headers with example numbers
  for (let col = 0; col < numCols; col++) {
    const th = document.createElement("th");
    th.textContent = String(startNo + col);
    th.className = "exam-table__col-header";
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body with examples
  const tbody = document.createElement("tbody");

  // Rows for each action
  for (let row = 0; row < actionsCount; row++) {
    const tr = document.createElement("tr");

    // Row number cell
    const rowNoCell = document.createElement("td");
    rowNoCell.textContent = String(row + 1);
    rowNoCell.className = "exam-table__row-no";
    tr.appendChild(rowNoCell);

    // Example cells
    for (let col = 0; col < numCols; col++) {
      const example = examples[col];
      const td = document.createElement("td");
      td.className = "exam-table__cell";

      if (example && example.steps && example.steps[row]) {
        const step = example.steps[row];
        const stepText = typeof step === 'object' && step.step ? step.step : String(step);
        td.textContent = stepText;
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  // Two empty rows for answers
  for (let i = 0; i < 2; i++) {
    const tr = document.createElement("tr");

    // Empty cell for row number
    const emptyRowCell = document.createElement("td");
    emptyRowCell.className = "exam-table__row-no exam-table__row-no--empty";
    tr.appendChild(emptyRowCell);

    // Empty answer cells
    for (let col = 0; col < numCols; col++) {
      const td = document.createElement("td");
      td.className = "exam-table__answer-cell";
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  return table;
}

/**
 * Generate answer table
 * @param {number} numCols - Number of columns
 * @param {number} startNo - Starting question number
 * @returns {HTMLElement}
 */
function generateAnswerTable(numCols, startNo) {
  const table = document.createElement("table");
  table.className = "exam-table exam-table--answers";

  // Header row
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // Empty cell for first column
  const emptyCell = document.createElement("th");
  emptyCell.className = "exam-table__row-header exam-table__row-header--empty";
  headerRow.appendChild(emptyCell);

  // Column headers with example numbers
  for (let col = 0; col < numCols; col++) {
    const th = document.createElement("th");
    th.textContent = String(startNo + col);
    th.className = "exam-table__col-header";
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body with one answer row
  const tbody = document.createElement("tbody");
  const tr = document.createElement("tr");

  // Empty cell for first column (no row numbering)
  const emptyRowCell = document.createElement("td");
  emptyRowCell.className = "exam-table__row-header exam-table__row-header--empty";
  tr.appendChild(emptyRowCell);

  // Answer cells
  for (let col = 0; col < numCols; col++) {
    const td = document.createElement("td");
    td.className = "exam-table__answer-cell";
    tr.appendChild(td);
  }

  tbody.appendChild(tr);
  table.appendChild(tbody);

  return table;
}
