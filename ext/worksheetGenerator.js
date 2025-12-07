// ext/worksheetGenerator.js
//
// Генератор «листа примеров для печати».
// Использует тот же движок генерации примеров, что и тренажёр,
// но готовит сразу партию примеров и складывает их в структуру,
// удобную для отрисовки и печати.
//
// ВАЖНО:
//  - Никакой собственной «физики» абакуса здесь нет.
//  - Все правила и ограничения берутся из generateExample(...) и настроек.
//  - Мы просто много раз вызываем генератор с текущими настройками.
//
// Публичный API модуля:
//   generateWorksheet(printConfig?) → worksheet
//   getLastWorksheet()              → worksheet | null
//
//   worksheet = {
//     examples: [
//       { id: 1, start: number, steps: string[], answer: number },
//       ...
//     ],
//     settingsSnapshot: { ... },   // копия state.settings на момент генерации
//     createdAt: string,           // ISO-строка
//     showAnswers: boolean         // флаг «нужен лист ответов»
//   }
//

import { generateExample } from "./core/generator.js";
import { state } from "../core/state.js";
import { DEFAULTS } from "../core/utils/constants.js";
import { logger } from "../core/utils/logger.js";

const CONTEXT = "WorksheetGenerator";

/**
 * Последний сгенерированный лист.
 * Хранится в модуле, чтобы им мог воспользоваться экран печати.
 * (Осознанно НЕ кладём в глобальный state, чтобы не усложнять событиями.)
 * @type {null | {
 *   examples: Array<{ id:number, start:number, steps:string[], answer:number }>,
 *   settingsSnapshot: any,
 *   createdAt: string,
 *   showAnswers: boolean
 * }}
 */
let lastWorksheet = null;

/**
 * Получить количество примеров для печати.
 * Берём из:
 *   1) printConfig.examplesCount (если передано),
 *   2) настроек тренажёра settings.examples.count,
 *   3) DEFAULTS.EXAMPLES_COUNT как запасной вариант.
 */
function resolveExamplesCount(printConfig, settings) {
  if (Number.isFinite(printConfig?.examplesCount) && printConfig.examplesCount > 0) {
    return printConfig.examplesCount;
  }

  const fromSettings = Number(settings?.examples?.count);
  if (Number.isFinite(fromSettings) && fromSettings > 0) {
    return fromSettings;
  }

  return DEFAULTS.EXAMPLES_COUNT || 10;
}

/**
 * Сгенерировать лист примеров на основе текущих настроек тренажёра.
 *
 * @param {Object} [printConfig]
 * @param {number} [printConfig.examplesCount] - сколько примеров сделать в листе
 * @param {boolean} [printConfig.showAnswers]  - нужен ли отдельный лист ответов
 * @returns {{
 *   examples: Array<{ id:number, start:number, steps:string[], answer:number }>,
 *   settingsSnapshot: any,
 *   createdAt: string,
 *   showAnswers: boolean
 * }}
 */
export function generateWorksheet(printConfig = {}) {
  const settings = state.settings || {};
  const examplesCount = resolveExamplesCount(printConfig, settings);
  const showAnswers = Boolean(printConfig.showAnswers);

  logger.info(
    CONTEXT,
    `Генерация листа примеров: ${examplesCount} шт., showAnswers=${showAnswers}`
  );

  const examples = [];

  for (let i = 0; i < examplesCount; i += 1) {
    const rawExample = generateExample(settings);

    // Подстрахуемся: генерируем только простые объекты без лишних ссылок
    examples.push({
      id: i + 1,
      start: rawExample.start,
      steps: Array.isArray(rawExample.steps)
        ? rawExample.steps.map((s) => String(s))
        : [],
      answer: Number(rawExample.answer)
    });
  }

  const worksheet = {
    examples,
    settingsSnapshot: { ...settings },
    createdAt: new Date().toISOString(),
    showAnswers
  };

  lastWorksheet = worksheet;

  logger.debug(CONTEXT, "Готовый worksheet:", worksheet);

  return worksheet;
}

/**
 * Вернуть последний сгенерированный лист примеров.
 * Используется экраном печати.
 * @returns {ReturnType<typeof generateWorksheet> | null}
 */
export function getLastWorksheet() {
  return lastWorksheet;
}
