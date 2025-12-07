// ext/print/worksheetGenerator.js
//
// Генератор листа примеров для печати.
// Использует тот же generateExample, что и тренажёр,
// но вызывает его много раз и сохраняет результат в state.worksheet.

import { getState, setWorksheet } from "../../core/state.js";
import { generateExample } from "../core/generator.js";

/**
 * @typedef {Object} WorksheetExample
 * @property {number} index      Порядковый номер примера (1, 2, 3, ...)
 * @property {number} start      Стартовое число на абакусе
 * @property {string[]} steps    Шаги вида ["+3", "-1", "+4", ...]
 * @property {number} answer     Ответ (итоговое число)
 */

/**
 * @typedef {Object} GenerateWorksheetOptions
 * @property {number} examplesCount  Сколько примеров сгенерировать
 * @property {boolean} showAnswers   Нужен ли лист с ответами (для учителя)
 */

/**
 * Генерация полного листа примеров для печати.
 *
 * @param {GenerateWorksheetOptions} [options]
 * @returns {{
 *   examples: WorksheetExample[],
 *   settings: any,
 *   createdAt: string,
 *   showAnswers: boolean
 * }}
 */
export function generateWorksheet(options = {}) {
  const { examplesCount = 20, showAnswers = false } = options;

  const fullState = getState();
  const trainerSettings = fullState.settings;

  if (!trainerSettings) {
    console.warn("[worksheet] Нет настроек тренажёра, генерация листа невозможна");
    return null;
  }

  /** @type {WorksheetExample[]} */
  const examples = [];

  for (let i = 0; i < examplesCount; i++) {
    // ⚠️ Очень важно: используем тот же генератор, что и тренажёр
    const ex = generateExample(trainerSettings);

    if (!ex) {
      console.warn("[worksheet] generateExample вернул пустой результат, пропускаем пример", i);
      continue;
    }

    examples.push({
      index: i + 1,
      start: ex.start,
      steps: Array.isArray(ex.steps) ? ex.steps : [],
      answer: ex.answer
    });
  }

  const worksheet = {
    examples,
    settings: trainerSettings,
    createdAt: new Date().toISOString(),
    showAnswers: Boolean(showAnswers)
  };

  // Сохраняем в глобальное состояние — позже экран печати прочитает state.worksheet
  setWorksheet(worksheet);

  console.log("[worksheet] Лист примеров сгенерирован:", worksheet);

  return worksheet;
}

/**
 * Утилита для чтения текущего листа из state.
 * (Можно использовать в ui/worksheet.js)
 */
export function getCurrentWorksheet() {
  const fullState = getState();
  return fullState.worksheet || {
    examples: [],
    settings: null,
    createdAt: null,
    showAnswers: false
  };
}
