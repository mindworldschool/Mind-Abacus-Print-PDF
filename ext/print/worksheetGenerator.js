// ext/print/worksheetGenerator.js
//
// Генератор листа примеров для печати.
// Использует тот же generateExample, что и тренажёр,
// но вызывает его много раз и возвращает массив примеров.

import { getState, setWorksheet } from "../../core/state.js";
import { generateExample } from "../core/generator.js";

/**
 * @typedef {Object} WorksheetExample
 * @property {number} index      Порядковый номер примера
 * @property {number} start      Стартовое число на абакусе
 * @property {string[]} steps    Шаги вида ["+3", "-1", "+4"]
 * @property {number} answer     Итоговое число
 */

/**
 * @typedef {Object} GenerateWorksheetOptions
 * @property {number} examplesCount  Сколько примеров сгенерировать
 * @property {boolean} showAnswers   Включать ли лист ответов
 */

/**
 * Генерация листа примеров для печати.
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
    console.warn("[worksheet] Нет настроек тренажёра — генерация невозможна");
    return null;
  }

  /** @type {WorksheetExample[]} */
  const examples = [];

  for (let i = 0; i < examplesCount; i++) {
    const ex = generateExample(trainerSettings);

    if (!ex) {
      console.warn("[worksheet] generateExample вернул пустой результат, пропуск:", i);
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

  return worksheet;
}

/**
 * (На будущее)
 * Получает текущий worksheet, если ты решишь сохранить его в state
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
