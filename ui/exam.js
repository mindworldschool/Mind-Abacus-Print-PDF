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
  examHeader.innerHTML = `
    <h1>Abacus Certification Exam Questions</h1>
    <div class="exam-info">
      <p><strong>Addition and subtraction (±)</strong></p>
      <div class="exam-meta">
        <span>Level: ${settings.level || 7}</span>
        <span>Time: ${settings.timeLimit || 10} min</span>
        <span class="score-box">Score</span>
      </div>
    </div>
  `;
  content.appendChild(examHeader);

  // Section 1: Straight Calculation
  const section1Title = document.createElement("div");
  section1Title.className = "exam-section-title";
  section1Title.textContent = "Straight Calculation 100% (Each Q : 10 marks)";
  content.appendChild(section1Title);

  const table1 = generateExamTable(settings, 10, 10, 1);
  content.appendChild(table1);

  // Section 2: Multi-row calculation
  const section2Title = document.createElement("div");
  section2Title.className = "exam-section-title";
  section2Title.textContent = "Multi-row calculation 50% (Each Q : 5 marks)";
  content.appendChild(section2Title);

  const table2 = generateExamTable(settings, 4, 5, 11);
  content.appendChild(table2);

  return content;
}

/**
 * Generate exam table with examples
 * @param {Object} settings - Generator settings
 * @param {number} rows - Number of rows per column
 * @param {number} cols - Number of columns
 * @param {number} startNo - Starting question number
 * @returns {HTMLElement}
 */
function generateExamTable(settings, rows, cols, startNo) {
  const table = document.createElement("table");
  table.className = "exam-table";

  // Generate examples
  const generatorSettings = buildGeneratorSettingsFromSettings(settings);
  const examples = [];
  for (let i = 0; i < rows * cols; i++) {
    const ex = generateExample(generatorSettings);
    examples.push(ex);
  }

  // Header row with column numbers
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const noCell = document.createElement("th");
  noCell.textContent = "NO.";
  noCell.className = "exam-table__no";
  headerRow.appendChild(noCell);

  for (let col = 0; col < cols; col++) {
    const th = document.createElement("th");
    th.textContent = String(col + startNo);
    th.className = "exam-table__col-header";
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body with examples
  const tbody = document.createElement("tbody");

  for (let row = 0; row < rows; row++) {
    const tr = document.createElement("tr");

    // Row number
    const noCell = document.createElement("td");
    noCell.textContent = String(row + 1);
    noCell.className = "exam-table__row-no";
    tr.appendChild(noCell);

    // Example cells
    for (let col = 0; col < cols; col++) {
      const exampleIndex = col * rows + row;
      const example = examples[exampleIndex];

      const td = document.createElement("td");
      td.className = "exam-table__cell";

      if (example && example.steps) {
        // Display steps vertically (one per line for multi-row)
        const stepsText = example.steps.map(step => {
          if (typeof step === 'object' && step.step) return step.step;
          return String(step);
        }).join('\n');

        td.textContent = stepsText;
        td.style.whiteSpace = "pre-line";
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  // Answer rows
  const tfoot = document.createElement("tfoot");
  for (let i = 0; i < 2; i++) {
    const tr = document.createElement("tr");

    const ansCell = document.createElement("td");
    ansCell.textContent = "Ans";
    ansCell.className = "exam-table__ans";
    tr.appendChild(ansCell);

    for (let col = 0; col < cols; col++) {
      const td = document.createElement("td");
      td.className = "exam-table__answer-cell";
      tr.appendChild(td);
    }

    tfoot.appendChild(tr);
  }

  table.appendChild(tfoot);

  return table;
}
